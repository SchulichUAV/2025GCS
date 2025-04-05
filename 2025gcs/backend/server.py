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
            '/getImages', '/images/', '/get_heartbeat'
        ])

log = logging.getLogger('werkzeug')
log.addFilter(FilterSpecificLogs())

# Data storage
targets_list = []  # List of pending targets
completed_targets = ["bus"]  # List of completed targets
current_target = "boat"

ENDPOINT_IP = "192.168.1.66"
VEHICLE_API_URL = f"http://{ENDPOINT_IP}:5000/"
CAMERA_STATE = False

# Utilities
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')

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
    "num_satellites": 0,
    "position_uncertainty": 0,
    "alt_uncertainty": 0,
    "speed_uncertainty": 0,
    "heading_uncertainty": 0
}

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

def get_existing_image_count():
    '''
    This function will return the number images under backend\images
    '''
    current_dir = os.path.dirname(os.path.abspath(__file__))
    IMAGES_DIR = os.path.join(current_dir, "data/images")
    if not os.path.exists(IMAGES_DIR):
        print(f"Warning: Directory '{IMAGES_DIR}' does not exist. Exiting function.")
    else:
        image_count = len([image for image in os.listdir(IMAGES_DIR) if image.endswith('.jpg')])
        return image_count

@app.get('/get_heartbeat')
def get_heartbeat():
    '''
    This function is continuously called by the frontend to check if there's a connection to the drone
    '''
    try:
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        response = requests.get(VEHICLE_API_URL + 'heartbeat-validate', headers=headers, timeout=5)
        heartbeat_data = response.json()
        vehicle_data.update(heartbeat_data)
        return jsonify({'success': True, 'vehicle_data': vehicle_data}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': str(e)}), 200

# vvv CURRENTLY NOT USED vvv

# indiated target completion - not sure if we will keep this for SUAS 2025
@app.post('/completeTarget')
def complete_target():
    global current_target
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    items = data.get('ITEM', [])
    if not items:
        return jsonify({'success': False, 'error': 'No targets available'})

    # Pop the first item (target) from the list and append to completed targets
    completed = items.pop(0)
    data['ITEM'] = items
    data.setdefault('completedTargets', []).append(completed)
    current_target = items[0] if items else None
    save_json(target_info_path, data)
    return jsonify({'success': True, 'completedTarget': completed, 'currentTarget': current_target})

# return current target
@app.get('/getCurrentTarget')
def get_current_target():
    # Get the index from the query parameters
    index = request.args.get('index', type=int)
    if index is None:
        return jsonify({'success': False, 'error': 'Index parameter is required'}), 400

    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    items = data.get('ITEM', [])
    if not items:
        return jsonify({'success': False, 'error': 'No targets available'})

    # Check if the index is within the valid range
    if index < 0 or index >= len(items):
        return jsonify({'success': False, 'error': 'Index out of range'}), 400

    # Return the target at the specified index
    return jsonify({'success': True, 'currentTarget': items[index]})

@app.get('/getTargets')
def get_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    items = data.get('ITEM', [])
    return jsonify({'success': True, 'targets': items})

@app.get('/getCompletedTargets')
def get_completed_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    completed_targets = data.get('completedTargets', [])
    return jsonify({'success': True, 'completed_targets': completed_targets})

# ^^^ CURRENTLY NOT USED ^^^

@app.post('/addCoords')
def add_coords():
    data = request.get_json()
    coord_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
    coords_data = load_json(coord_data_path)
    coords_data.setdefault('coordinates', []).append({
        'longitude': data['longitude'],
        'latitude': data['latitude']
    })
    save_json(coord_data_path, coords_data)
    return jsonify({'status': 'success'})

@app.get('/get_saved_coords')
def get_saved_coords():
    saved_coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords_path)
    return jsonify({'success': True, 'coordinates': coords_data})

@app.post('/delete_coord')
def delete_coord():
    data = request.get_json()
    image = data.get('image')
    index = data.get('index')

    if image is None or index is None:
        return jsonify({'success': False, 'error': 'Invalid parameters'}), 400

    saved_coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords_path)
    if image in coords_data and 0 <= index < len(coords_data[image]):
        del coords_data[image][index]
        if not coords_data[image]:  # If the list is empty, remove the key
            del coords_data[image]
        save_json(saved_coords_path, coords_data)
        return jsonify({'success': True, 'message': 'Coordinate deleted successfully'})
    else:
        return jsonify({'success': False, 'error': 'Coordinate not found'}), 404

@app.get('/getImageData')
def get_image_data():
    image_data_dir = os.path.join(DATA_DIR, 'imageData')
    image_data = []

    for filename in sorted(os.listdir(image_data_dir)):
        if filename.endswith('.json'):
            with open(os.path.join(image_data_dir, filename), 'r') as file:
                data = json.load(file)
                data['image'] = filename.replace('.json', '.jpg')
                image_data.append(data)

    return jsonify({'success': True, 'imageData': image_data})

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

@app.post('/deleteImage')
def delete_image():
    """Delete an image from the server"""
    data = request.get_json()
    image_name = data.get("imageName")
    if not image_name.endswith('.jpg'):
        return jsonify({'success': False, 'error': 'Invalid file name format'}), 400

    image_path = os.path.join(IMAGES_DIR, image_name)
    if os.path.exists(image_path):
        os.remove(image_path)
        return jsonify({'success': True, 'message': f'{image_name} deleted successfully'})
    else:
        return jsonify({'success': False, 'error': 'File not found'}), 404
    
@app.route('/payload-release', methods=['POST'])
def payload_release():
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


   
@app.post('/clearAllImages')
def clear_all_images():
    """Delete all images from the images directory."""
    errors = []
    if os.path.exists(IMAGES_DIR):
        for filename in os.listdir(IMAGES_DIR):
            file_path = os.path.join(IMAGES_DIR, filename)
            if os.path.isfile(file_path) and filename.endswith('.jpg'):
                try:
                    os.remove(file_path)
                except Exception as e:
                    errors.append(str(e))
    if errors:
        return jsonify({'success': False, 'error': 'Some files could not be deleted', 'details': errors}), 500

    return jsonify({'success': True, 'message': 'All images deleted successfully'}), 200
    
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

@app.post('/manualSelection-save')
def manual_selection_save():
    data = request.get_json()
    saved_coords = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(saved_coords)
    file_name = data['file_name']
    if file_name not in coords_data:
        coords_data[file_name] = []

    coords_data[file_name].append({
        'x': data['selected_x'],
        'y': data['selected_y']
    })
    save_json(saved_coords, coords_data)
    return jsonify({'success': True, 'message': 'Coordinates saved successfully'})

@app.post('/manualSelection-geo-calc')
def manual_selection_geo_calc():
    """Perform geomatics calculations for a manually selected target."""
    try:
        saved_coords = os.path.join(DATA_DIR, 'savedCoords.json')
        with open(saved_coords, "r") as file:
            data = json.load(file)

        txt_lines = []
        # Iterate over each image entry
        for image_name, coordinates in data.items():
            for coord in coordinates:
                x, y = coord["x"], coord["y"]
                txt_lines.append(f"{image_name},{x},{y}")
        print(txt_lines)
        latitude, longitude = locate_target()

        # send to the vehicle ...

        save_json(saved_coords, {}) # Clear the saved coordinates
        return jsonify({'success': True, 'message': 'Geomatics calculation complete'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
    
@app.get('/fetch-TargetInformation')
def fetch_TargetInformation():
    """Get the list of detections from the cache file."""
    global completed_targets
    global current_target
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    return jsonify({'targets': data, 'completed_targets': completed_targets, 'current_target': current_target}), 200

@app.post('/Clear-Detections-Cache')
def ClearCache():
    """Clears the TargetInformation.json cache file."""
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    save_json(target_info_path, {})
    return jsonify({"message": "TargetInformation cache cleared"}), 200

# POST request to accept an image or json upload - no arguments are taken, image is presumed to contain all data
@app.post('/submit/')
def submit_data():
    file = request.files["file"]
    if file.mimetype == "application/json":
        file.save('./data/imageData/' + file.filename)
    else:
        file.save('./data/images/' + file.filename) 
    print('Saved file', file.filename)
    return 'ok'

@app.post('/set-altitude-takeoff')
def set_altitude_takeoff():
    return jsonify({'success': True, 'message': 'Altitude set for takeoff'}), 200

@app.post('/set-altitude-goto')
def set_altitude_goto():
    return jsonify({'success': True, 'message': 'Altitude set for waypoint'}), 200

@app.route('/process-mapping', methods=['GET'])
def process_mapping():
    try:
        # Simulate processing and replacing the image
        odm_dir = os.path.join(DATA_DIR, 'ODM')
        odm_image_path = os.path.join(odm_dir, 'ODMMap.jpg')
        print(f"Processing mapping image: {odm_image_path}")
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/data/ODM/<filename>')
def serve_odm_image(filename):
    odm_dir = os.path.join(DATA_DIR, 'ODM')
    return send_from_directory(odm_dir, filename)

@app.post('/set-current-target')
def set_current_target():
    global current_target
    data = request.get_json()
    current_target = data.get('target')
    return jsonify({'success': True, 'message': f'Current target set to {current_target}'}), 200

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)