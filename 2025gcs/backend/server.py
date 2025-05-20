import os
import logging
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from detection import stop_threads, start_threads
from geo import locate_target

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

class FilterSpecificLogs(logging.Filter):
    def filter(self, record):
        # Suppress logs for specific endpoints
        return not any(endpoint in record.getMessage() for endpoint in [
            '/getImages', '/images/', '/get_heartbeat', '/fetch-TargetInformation'
        ])

log = logging.getLogger('werkzeug')
log.addFilter(FilterSpecificLogs())

completed_targets = []
current_target = None

ENDPOINT_IP = "192.168.1.66" # make sure to configure this to whatever your IP is before you start
VEHICLE_API_URL = f"http://{ENDPOINT_IP}:5000/"
CAMERA_STATE = False

# Utilities
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')
IMAGEDATA_DIR = os.path.join(DATA_DIR, 'imageData')

# Dictionary to maintain vehicle state
vehicle_data = {
    "last_time": 0,
    "lat": 0,
    "lon": 0,
    "rel_alt": 0,
    "alt": 0,
    "roll": 0,
    "pitch": 0,
    "yaw": 0,
    "dlat": 0,
    "dlon": 0,
    "dalt": 0,
    "heading": 0,
    "airspeed": 0,
    "groundspeed": 0,
    "throttle": 0,
    "climb": 0,
    "num_satellites": 0,
    "position_uncertainty": 0,
    "alt_uncertainty": 0,
    "speed_uncertainty": 0,
    "heading_uncertainty": 0,
    "flight_mode": 0,
    "battery_voltage": 0,
    "battery_current": 0,
    "battery_remaining": 0,
    "is_dropped": False
}

# ========================= Common Utilities ========================
def load_json(file_path):
    """Utility to load JSON data from a file."""
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}

def save_json(file_path, data):
    """Utility to save JSON data to a file."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
# ========================= Common Utilities ========================

@app.get('/get_heartbeat')
def get_heartbeat():
    '''This function is continuously called by the frontend to check if there's a connection to the drone'''
    try:
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        response = requests.get(VEHICLE_API_URL + 'heartbeat-validate', headers=headers, timeout=5)
        heartbeat_data = response.json()

        if heartbeat_data.get("is_dropped") == True:
            completed_targets.append(current_target)
            current_target = None

        vehicle_data.update(heartbeat_data)
        return jsonify({'success': True, 'vehicle_data': vehicle_data}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': str(e)}), 200

# ======================== Camera ========================
def get_existing_image_count():
    ''' This function will return the number images under backend\images '''
    current_dir = os.path.dirname(os.path.abspath(__file__))
    IMAGES_DIR = os.path.join(current_dir, "data/images")
    if not os.path.exists(IMAGES_DIR):
        print(f"Warning: Directory '{IMAGES_DIR}' does not exist. Exiting function.")
    else:
        image_count = len([image for image in os.listdir(IMAGES_DIR) if image.endswith('.jpg')])
        return image_count

@app.post('/toggle_camera_state')
def toggle_camera_state():
    global CAMERA_STATE
    CAMERA_STATE = not CAMERA_STATE
    image_count = get_existing_image_count()
    data = json.dumps({"is_camera_on": CAMERA_STATE, "image_count": image_count})
    headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
    try:
        response = requests.post(VEHICLE_API_URL + 'toggle_camera', data=data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return jsonify({'success': True, 'cameraState': CAMERA_STATE}), 200
    except requests.exceptions.RequestException as e:
        status_code = getattr(e.response, "status_code", 500)  # Default to 500 if no response
        print(f"Request Error ({status_code}): {str(e)}")
        return jsonify({'success': False, 'error': f"Error {status_code}: {str(e)}"}), status_code
# ======================== Camera ========================

# ======================== Image Management ========================
@app.get('/getImages')
def get_images():
    """Endpoint to get the list of images in the images folder."""
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist'}), 404

    image_files = sorted([f for f in os.listdir(IMAGES_DIR) if f.endswith('.jpg') and os.path.isfile(os.path.join(IMAGES_DIR, f))])
    return jsonify({'success': True, 'images': image_files})

@app.get('/images/<filename>')
def serve_image(filename):
    """Endpoint to serve an image file."""
    return send_from_directory(IMAGES_DIR, filename)

@app.delete('/deleteImage')
def delete_image():
    """Delete all images and their associated JSON data"""
    data = request.get_json(silent=True) or {}
    image_name = data.get("imageName")

    # If specific image provided, return error (this endpoint is for clear-all only)
    if image_name:
        return jsonify({
            'success': False,
            'error': 'Use /deleteSingleImage for single file deletion'
        }), 400

    # Verify directories exist
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist'}), 404
    if not os.path.exists(IMAGEDATA_DIR):
        return jsonify({'success': False, 'error': 'JSON data directory does not exist'}), 404

    results = {
        'images_deleted': 0,
        'jsons_deleted': 0,
        'errors': []
    }

    # Process all JPG files
    for filename in os.listdir(IMAGES_DIR):
        if not filename.endswith('.jpg'):
            continue

        # Delete image
        image_path = os.path.join(IMAGES_DIR, filename)
        try:
            os.remove(image_path)
            results['images_deleted'] += 1
        except Exception as e:
            results['errors'].append(f'Image {filename}: {str(e)}')
            continue  # Skip JSON if image deletion failed

        # Delete corresponding JSON
        json_filename = os.path.splitext(filename)[0] + '.json'
        json_path = os.path.join(IMAGEDATA_DIR, json_filename)
        if os.path.exists(json_path):
            try:
                os.remove(json_path)
                results['jsons_deleted'] += 1
            except Exception as e:
                results['errors'].append(f'JSON {json_filename}: {str(e)}')

    # Prepare response
    if results['errors']:
        return jsonify({
            'success': results['images_deleted'] > 0,
            'message': f"Deleted {results['images_deleted']} images and {results['jsons_deleted']} JSON files",
            'warnings': results['errors']
        }), 207 if results['images_deleted'] > 0 else 500

    return jsonify({
        'success': True,
        'message': f"Cleared all images ({results['images_deleted']} images and {results['jsons_deleted']} JSON files)"
    }), 200

@app.delete('/deleteSingleImage')
def delete_single_image():
    """Delete a single image and its associated JSON data"""

    data = request.get_json(silent=True) or {}
    image_name = data.get("imageName")

    # Validation (same as your clear all endpoint)
    if not image_name:
        return jsonify({'success': False, 'error': 'No image name provided'}), 400

    if not image_name.endswith('.jpg'):
        return jsonify({'success': False, 'error': 'Invalid file name format'}), 400

    # Use your existing paths
    image_path = os.path.join(IMAGES_DIR, image_name)
    json_filename = os.path.splitext(image_name)[0] + '.json'
    json_path = os.path.join(IMAGEDATA_DIR, json_filename)

    # Track deletion success
    results = {
        'image_deleted': False,
        'json_deleted': False,
        'errors': []
    }

    # Delete image (using same logic as your clear all endpoint)
    if os.path.exists(image_path):
        try:
            os.remove(image_path)
            results['image_deleted'] = True
        except Exception as e:
            results['errors'].append(f'Image deletion failed: {str(e)}')
    else:
        results['errors'].append('Image file not found')

    # Delete JSON data if exists
    if os.path.exists(json_path):
        try:
            os.remove(json_path)
            results['json_deleted'] = True
        except Exception as e:
            results['errors'].append(f'JSON deletion failed: {str(e)}')

    # Return appropriate response
    if results['image_deleted']:
        message = f"{image_name} deleted"
        if results['json_deleted']:
            message += " with associated data"
        elif os.path.exists(IMAGEDATA_DIR):  # Only mention JSON if directory exists
            message += " (no associated data found)"
        
        if results['errors']:
            return jsonify({
                'success': True,
                'message': message,
                'warnings': results['errors']
            }), 200
        return jsonify({'success': True, 'message': message}), 200
    else:
        return jsonify({
            'success': False,
            'error': '; '.join(results['errors'])
        }), 500

@app.get('/getImageData')
def get_image_data():
    """Get the image data for display in the image data table"""
    image_data_dir = os.path.join(DATA_DIR, 'imageData')
    image_data = []
    for filename in sorted(os.listdir(image_data_dir)):
        if filename.endswith('.json'):
            with open(os.path.join(image_data_dir, filename), 'r') as file:
                data = json.load(file)
                data['image'] = filename.replace('.json', '.jpg')
                image_data.append(data)

    return jsonify({'success': True, 'imageData': image_data})

@app.post('/submit/')
def submit_data():
    """POST request to accept an image or json upload - no arguments are taken, image is presumed to contain all data"""
    file = request.files["file"]
    if file.mimetype == "application/json":
        file.save('./data/imageData/' + file.filename)
    else:
        file.save('./data/images/' + file.filename) 
    print('Saved file', file.filename)
    return 'ok'
# ======================== Image Management ========================

# ======================== Payload ========================
@app.route('/payload-release', methods=['POST'])
def payload_release():
    """Release the payload for a specified bay."""
    data = request.get_json()
    send_data = json.dumps({"bay": data.get("bay")})
    headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
    try:
        response = requests.post(VEHICLE_API_URL + 'payload_release', data=send_data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return jsonify({'success': True}), 200
    except requests.exceptions.RequestException as e:
        status_code = getattr(e.response, "status_code", 500)  # Default to 500 if no response
        print(f"Request Error ({status_code}): {str(e)}")
        return jsonify({'success': False, 'error': f"Error {status_code}: {str(e)}"}), status_code
# ======================== Payload ========================

# ======================== Manual Selection ========================
@app.post('/manualSelection-save')
def manual_selection_save():
    """Save the coordinates of a manually selected target."""
    data = request.get_json()
    saved_coords = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords)

    object_name = data.get('object')
    if object_name not in coords_data:
        coords_data[object_name] = []

    coords_data[object_name].append({
        'image': data['file_name'],
        'x': data['selected_x'],
        'y': data['selected_y']
    })

    save_json(saved_coords, coords_data)
    return jsonify({'success': True, 'message': 'Coordinates saved successfully'})

@app.post('/manualSelection-calc')
def manual_selection_geo_calc():
    """Perform geomatics calculations for all manually selected targets."""
    try:
        saved_coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
        with open(saved_coords_path, "r") as file:
            saved_coords = json.load(file)

        data = request.get_json()
        requested_object = data.get('object')
        if requested_object is None or requested_object not in saved_coords:
            return jsonify({'success': False, 'error': 'Object has no saved entries'}), 500

        position_data = [0, 0]  # latitude, longitude
        count = len(saved_coords[requested_object])  # count of number of saved coords processed for averaging
        if count > 0:
            for coord_entry in saved_coords[requested_object]:
                image_name = coord_entry["image"]
                image_json_path = os.path.join(IMAGEDATA_DIR, f"{image_name.replace('.jpg', '')}.json")
                if not os.path.exists(image_json_path):
                    continue

                with open(image_json_path, "r") as json_file:
                    image_data = json.load(json_file)

                # Process each coordinate
                image_data["x"] = coord_entry["x"]
                image_data["y"] = coord_entry["y"]
                latitude, longitude = locate_target(image_data)
                position_data[0] += latitude
                position_data[1] += longitude

            position_data[0] /= count  # Average latitude
            position_data[1] /= count  # Average longitude

            headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
            data = json.dumps({"latitude": position_data[0], "longitude": position_data[1]})
            response = requests.post(VEHICLE_API_URL, '/payload_drop_mission', data=data, headers=headers)

            if response.status_code == 200:
                saved_coords.pop(requested_object, None)
                save_json(saved_coords_path, saved_coords)
                return jsonify({'success': True, 'message': 'Data sent successfully to vehicle'}), 200
            else:
                return jsonify({'success': False, 'error': 'Failed to send data'}), 500
        else:
            return jsonify({'success': False, 'error': 'No valid coordinates to process'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.get('/get_saved_coords')
def get_saved_coords():
    """Get the saved coordinates for display in the saved coordinates data table"""
    saved_coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords_path)
    return jsonify({'success': True, 'coordinates': coords_data})

@app.delete('/delete_coord')
def delete_coord():
    """Delete a specific coordinate from the saved coordinates."""
    data = request.get_json(silent=True) or {}
    req_object = data.get('object')
    index = data.get('index')

    saved_coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords_path) or {}

    if req_object is None:
        save_json(saved_coords_path, {})
        return jsonify({'success': True, 'message': 'All coordinates deleted successfully'})

    if req_object and index is None:
        if req_object in coords_data:
            del coords_data[req_object]
            save_json(saved_coords_path, coords_data)
            return jsonify({'success': True, 'message': 'All coordinates for object deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Object not found'}), 404

    if req_object in coords_data and isinstance(index, int) and 0 <= index < len(coords_data[req_object]):
        del coords_data[req_object][index]
        if not coords_data[req_object]:
            del coords_data[req_object]
        save_json(saved_coords_path, coords_data)
        return jsonify({'success': True, 'message': 'Coordinate deleted successfully'})
    else:
        return jsonify({'success': False, 'error': 'Coordinate not found'}), 404
# ======================== Manual Selection ========================

# ======================== AI ========================
@app.post('/AI')
def start_AI_workers():
    """Starts the worker threads, which run infinitely until shutdown."""
    try:
        start_threads()
        return jsonify({"message": "AI processing started"}), 200
    except Exception as e:
        return jsonify({"message": f"Error starting AI processing: {e}"}), 500

@app.post('/AI-Shutdown')
def shutdown_workers():
    """Stops all running worker threads."""
    try:
        stop_threads()
        return jsonify({"message": "AI processing stopped"}), 200
    except Exception as e:
        return jsonify({"message": f"Error stopping AI processing: {e}"}), 500
# ======================== AI ========================

# ======================== Detections ========================
@app.get('/fetch-TargetInformation')
def fetch_TargetInformation():
    """Get the list of detections from the cache file."""
    global completed_targets
    global current_target
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    return jsonify({'targets': data, 'completed_targets': completed_targets, 'current_target': current_target}), 200

@app.delete('/delete-prediction')
def delete_prediction():
    """Delete predictions from the cache based on index."""
    data = request.get_json(silent=True) or {}
    class_name = data.get('class_name')
    index = data.get('index')
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')

    # No class or index provided, clear the cache
    if class_name is None or index is None:
        save_json(target_info_path, {})
        return jsonify({"message": "TargetInformation cache cleared"}), 200

    coords_data = load_json(target_info_path)
    if class_name in coords_data:
        if 0 <= index < len(coords_data[class_name]):
            del coords_data[class_name][index]
            if not coords_data[class_name]:
                del coords_data[class_name]

            save_json(target_info_path, coords_data)
            return jsonify({'success': True}), 200

        return jsonify({'success': False, 'message': 'Invalid index'}), 400
    return jsonify({'success': False, 'message': 'Class not found'}), 404

@app.route('/current-target', methods=['GET', 'POST'])
def current_target_handler():
    """Get or set the current target."""
    data = load_json(os.path.join(DATA_DIR, 'TargetInformation.json'))
    global current_target
    if request.method == 'POST':
        current_target = request.get_json().get('target')

        # Get the location data for the current target
        target_data = data.get(current_target, [])
        if not target_data:
            return jsonify({'success': False, 'error': 'No data available for the current target'}), 404

        # Calculate the average latitude and longitude
        total_lat = sum(item['lat'] for item in target_data)
        total_lon = sum(item['lon'] for item in target_data)
        count = len(target_data)

        avg_lat = total_lat / count
        avg_lon = total_lon / count

        # Set the mission to this target location
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        data = json.dumps({"latitude": avg_lat, "longitude": avg_lon})
        response = requests.post(VEHICLE_API_URL, '/payload_drop_mission', data=data, headers=headers)

        if response.status_code == 200:
            return jsonify({'success': True, 'message': f'Current target set to {current_target}'}), 200
        else:
            return jsonify({'success': False, 'message': f'Vehicle failed to set the mission for the target: {current_target}'}), 500
    elif request.method == 'GET':
        avg_lat, avg_lon = 0, 0
        if current_target in data:
            target_data = data[current_target]
            total_lat = sum(item['lat'] for item in target_data)
            total_lon = sum(item['lon'] for item in target_data)
            count = len(target_data)
            
            avg_lat = total_lat / count if count > 0 else 0
            avg_lon = total_lon / count if count > 0 else 0

        return jsonify({'success': True, 'coords': [avg_lat, avg_lon]}), 200
# ======================== Detections ========================

@app.route('/set_flight_mode', methods=['POST'])
def set_flight_mode():
    data = request.get_json()
    send_data = json.dumps({"mode_id" : data.get("mode_id")})
    headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}

    try:
        response = requests.post(VEHICLE_API_URL + 'set_flight_mode', data=send_data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return jsonify({'success': True}), 200
    except requests.exceptions.RequestException as e:
        status_code = getattr(e.response, "status_code", 500)  # Default to 500 if no response
        print(f"Request Error ({status_code}): {str(e)}")
        return jsonify({'success': False, 'error': f"Error {status_code}: {str(e)}"}), status_code

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)