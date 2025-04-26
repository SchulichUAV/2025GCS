import os
import logging
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from utils import load_json, save_json, DATA_DIR, IMAGES_DIR
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

# Constants
from targets import Targets, Target

ENDPOINT_IP = "192.168.1.66"
VEHICLE_API_URL = f"http://{ENDPOINT_IP}:5000/"
CAMERA_STATE = False

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


# FUNCTIONS

def validate_image_number(image_number):
    """
    Utility to validate the image number and check if the corresponding image file exists.
    """

    # Check if the image parameter is a valid image file.
    if not image_number.endswith('.jpg'):
        return jsonify({'success': False, 'error': 'Invalid image file name format.'}), 400

    # Check if the image file exists.
    image_path = os.path.join(IMAGES_DIR, image_number)
    if not os.path.exists(image_path):
        return jsonify({'success': False, 'error': 'Corresponding image file doesn\'t exist.'}), 500

    # Check if the savedCoords.json file exists.
    coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
    if not os.path.exists(coords_data_path):
        return jsonify({'success': False, 'error': 'Coordinates data file not found.'}), 500
    
    return image_path, coords_data_path


'''
This function will return the number images under backend\images
'''
def get_existing_image_count():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    IMAGES_DIR = os.path.join(current_dir, "data/images")
    if not os.path.exists(IMAGES_DIR):
        print(f"Warning: Directory '{IMAGES_DIR}' does not exist. Exiting function.")
    else:
        image_count = len([image for image in os.listdir(IMAGES_DIR) if image.endswith('.jpg')])
        return image_count

@app.get('/get_heartbeat')
def get_heartbeat():
    try:
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        response = requests.get(VEHICLE_API_URL + 'heartbeat-validate', headers=headers, timeout=5)
        heartbeat_data = response.json()
        vehicle_data.update(heartbeat_data)
        return jsonify({'success': True, 'vehicle_data': vehicle_data}), 200

    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': str(e)}), 200

# ROUTES

@app.get('/targets')
def get_targets():
    # Return the list of all active targets.
    return jsonify({
        'success': True,
        'targets': [t.to_dict() for t in Targets.get_active_targets()]
    }), 200


@app.post('/targets')
def create_target():
    # Create a new target from JSON body if the ID is unique.
    body = request.get_json()
    if body is None:
        # Missing or invalid JSON payload.
        return jsonify({'success': False, 'error': 'Request must be JSON data.'}), 415

    # Gather all existing targets to check for duplicates.
    targets = Targets.get_active_targets() + Targets.get_completed_targets()
    if any(t.id == body['id'] for t in targets):
        # Duplicate ID not allowed.
        return jsonify({'success': False, 'error': 'Target with the specified ID already exists.'}), 400

    target = Target.from_dict(body)
    if target is None:
        # Payload failed validation.
        return jsonify({'success': False, 'error': 'Invalid target data.'}), 400

    Targets.add_target(target)
    # Resource created successfully.
    return jsonify({'success': True}), 201


@app.get('/targets/<id>')
def get_target_by_id(id):
    # Retrieve either special lists or a single target by its ID.
    if id == 'active':
        return jsonify({
            'success': True,
            'targets': [t.to_dict() for t in Targets.get_active_targets()]
        }), 200
    elif id == 'completed':
        return jsonify({
            'success': True,
            'targets': [t.to_dict() for t in Targets.get_completed_targets()]
        }), 200
    elif id == 'current':
        active = Targets.get_active_targets()
        # Return the first active target, or null if none exist.
        return jsonify({
            'success': True,
            'target': active[0].to_dict() if active else None
        }), 200

    # Look up a specific target by ID across active then completed.
    active = Targets.get_active_targets()
    target = [t for t in active if t.id == id]
    status = 'active'
    if not target:
        completed = Targets.get_completed_targets()
        target = [t for t in completed if t.id == id]
        status = 'completed'
        if not target:
            # No target found with that ID.
            return jsonify({'success': False, 'error': 'Target not found.'}), 404

    # Return the found target and its status.
    return jsonify({
        'success': True,
        'target': target[0].to_dict(),
        'status': status
    }), 200


@app.put('/targets/<id>')
def mark_target_complete(id):
    # Mark the specified target as completed.
    result = Targets.complete_target(id)
    if not result:
        # Cannot complete a non-existent target.
        return jsonify({'success': False, 'error': 'Target not found.'}), 404
    return jsonify({'success': True}), 200


@app.delete('/targets/<id>')
def delete_target(id):
    # Deletion not supported at this time.
    return jsonify({'success': False, 'error': 'DELETE is currently not supported.'}), 501


@app.get('/coordinates')
def coordinates_get_all():
    # Get the list of all images with saved coordinates.
    coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
    coords_data = load_json(coords_data_path)
    return jsonify({'success': True, 'coordinates': coords_data}), 200


@app.delete('/coordinates')
def coordinates_delete_all():
    # Clear all saved coordinates.
    coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
    save_json(coords_data_path, {})
    return jsonify({'success': True}), 200


@app.get('/coordinates/<image_number>')
def coordinates_get(image_number):
    response = validate_image_number(image_number)
    if not isinstance(response, tuple):
        return response
    
    image_path, coords_data_path = response

    # Get the list of coordinates for the image.
    data = load_json(coords_data_path)
    return jsonify({'success': True, 'coordinates': data.get(image_number, [])}), 200
    


@app.post('/coordinates/<image_number>')
def coordinates_post(image_number):
    response = validate_image_number(image_number)
    if not isinstance(response, tuple):
        return response
    
    image_path, coords_data_path = response

    # Save the coordinates for the image.
    data = request.get_json()
    if data is None:
        return jsonify({'success': False, 'error': 'Request must be JSON data.'}), 415

    if 'x' not in data or 'y' not in data:
        return jsonify({'success': False, 'error': 'Coordinates must be provided in JSON data as x and y.'}), 400

    if not isinstance(data['x'], float) or not isinstance(data['y'], float):
        return jsonify({'success': False, 'error': 'Coordinates must be numerical values.'}), 400

    coords_data = load_json(coords_data_path)
    coords_data.setdefault(image_number, []).append({
        'x': float(data['x']),
        'y': float(data['y'])
    })
    save_json(coords_data_path, coords_data)
    return jsonify({'success': True}), 201


@app.delete('/coordinates/<image_number>')
def coordinates_delete(image_number):
    response = validate_image_number(image_number)
    if not isinstance(response, tuple):
        return response
    
    image_path, coords_data_path = response

    # Clear the coordinates for the image.
    coords_data = load_json(coords_data_path)

    # If an index is provided in the request JSON, delete the coordinate at that index.
    # The silent flag is set to True to avoid raising an error if the JSON is invalid.
    data = request.get_json(silent=True)
    if data and 'index' in data:
        index = data['index']
        coords = coords_data.get(image_number, [])
        if 0 <= index < len(coords):
            coords.pop(index)
            save_json(coords_data_path, coords_data)

            # If the coordinates list is empty after deletion, remove the image entry, as well as its respective image file and data.
            if not coords:
                # Remove the image entry from the coordinates data.
                del coords_data[image_number]
                save_json(coords_data_path, coords_data)

                # Delete the image file.
                os.remove(image_path)

                # Delete the imageData JSON file if it exists.
                data_dir = os.path.join(DATA_DIR, 'imageData')
                for f in os.listdir(data_dir):
                    if f.startswith(image_number.replace('.jpg', '')):
                        try:
                            os.remove(os.path.join(data_dir, f))
                        except Exception as e:
                            return jsonify({'success': False, 'error': str(e)}), 500

            return jsonify({'success': True}), 200
        return jsonify({'success': False, 'error': 'Index out of range.'}), 400

    # If no index is provided, clear all coordinates for the image.
    del coords_data[image_number]
    
    # Delete the image file if it exists.
    os.remove(image_path)

    save_json(coords_data_path, coords_data)
    return jsonify({'success': True}), 200


@app.get('/images')
def get_images():
    # Check if the images directory exists.
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist.'}), 404

    # Get the list of image files in the images directory.
    image_files = sorted(
        f for f in os.listdir(IMAGES_DIR)
        if f.endswith('.jpg') and os.path.isfile(os.path.join(IMAGES_DIR, f))
    )
    return jsonify({'success': True, 'images': image_files}), 200


@app.delete('/images')
def delete_images():
    # Check if the images directory exists.
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist.'}), 404

    files, success = {}, True
    for fname in os.listdir(IMAGES_DIR):
        path = os.path.join(IMAGES_DIR, fname)
        if os.path.isfile(path) and fname.endswith('.jpg'):
            try:
                os.remove(path)
                files[fname] = 'deleted'
            except Exception as e:
                files[fname] = str(e)
                success = False

    # Also clear all saved coordinates.
    coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    if os.path.exists(coords_path):
        save_json(coords_path, {})

    # Also clear all imageData JSON files.
    data_dir = os.path.join(DATA_DIR, 'imageData')
    if os.path.exists(data_dir):
        for fname in os.listdir(data_dir):
            if fname.endswith('.json'):
                try:
                    os.remove(os.path.join(data_dir, fname))
                except Exception as e:
                    files[fname] = str(e)
                    success = False

    code = 200 if success else 500
    return jsonify({'success': success, 'files': files}), code


@app.get('/images/<filename>')
def get_image(filename):
    # Check directory, extension, and existence.
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist.'}), 404
    if not filename.endswith('.jpg'):
        return jsonify({'success': False, 'error': 'Invalid file name format.'}), 400
    image_path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(image_path):
        return jsonify({'success': False, 'error': 'File not found.'}), 404

    return send_from_directory(IMAGES_DIR, filename)


@app.delete('/images/<filename>')
def delete_image(filename):
    # Check directory, extension, and existence.
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist.'}), 404
    if not filename.endswith('.jpg'):
        return jsonify({'success': False, 'error': 'Invalid file name format.'}), 400
    image_path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(image_path):
        return jsonify({'success': False, 'error': 'File not found.'}), 404

    # Delete file.
    os.remove(image_path)

    # Remove its coordinates.
    coords_path = os.path.join(DATA_DIR, 'savedCoords.json')
    if os.path.exists(coords_path):
        data = load_json(coords_path)
        data.pop(filename, None)
        save_json(coords_path, data)

    # Remove its imageData entries.
    data_dir = os.path.join(DATA_DIR, 'imageData')
    if os.path.exists(data_dir):
        for f in os.listdir(data_dir):
            if f.startswith(filename.replace('.jpg', '')):
                try:
                    os.remove(os.path.join(data_dir, f))
                except Exception as e:
                    return jsonify({'success': False, 'error': str(e)}), 500

    return jsonify({'success': True}), 200



@app.get('/images/data')
def image_data():
    # Return parsed JSON data for each image.
    image_data_dir = os.path.join(DATA_DIR, 'imageData')
    image_data = []

    for filename in sorted(os.listdir(image_data_dir)):
        if filename.endswith('.json'):
            with open(os.path.join(image_data_dir, filename), 'r') as file:
                data = json.load(file)
                data['image'] = filename.replace('.json', '.jpg')
                image_data.append(data)

    return jsonify({'success': True, 'data': image_data}), 200


@app.post('/toggle_camera_state')
def toggle_camera_state():
    global CAMERA_STATE
    CAMERA_STATE = not CAMERA_STATE
    image_count = get_existing_image_count()
    data = json.dumps({"is_camera_on": CAMERA_STATE, "image_count": image_count})
    headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
    try:
        # print(f"Sending API request with `is_camera_on`: {try_catch_camera_state}")
        response = requests.post(VEHICLE_API_URL + 'toggle_camera', data=data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        print(f"Number of images: {image_count}")
        return jsonify({'success': True, 'cameraState': CAMERA_STATE}), 200
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Request timed out'}), 408
    except requests.exceptions.HTTPError as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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

@app.post('/manualSelection-calc')
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

# AI Processing.
# Workflow starts when the AI endpoint is called through the frontend.
# The AI endpoint starts the worker threads, which run infinitely until the program is stopped.
@app.post('/AI')
def start_AI_workers():
    """Starts the worker threads."""
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

@app.post('/payload-bay-close')
def payload_bay_close():
    data = request.get_json()
    # headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
    # response = requests.post(VEHICLE_API_URL + 'payload-bay-close', headers=headers)
    return jsonify({'success': True, 'message': 'Payload bay closed'}), 200

@app.post('/payload-release')
def payload_release():
    data = request.get_json()
    # headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
    # response = requests.post(VEHICLE_API_URL + 'payload-release', headers=headers)
    return jsonify({'success': True, 'message': 'Payload released'}), 200

@app.post('/set-altitude-takeoff')
def set_altitude_takeoff():
    return jsonify({'success': True, 'message': 'Altitude set for takeoff'}), 200

@app.post('/set-altitude-goto')
def set_altitude_goto():
    return jsonify({'success': True, 'message': 'Altitude set for waypoint'}), 200

@app.get('/process-mapping')
def process_mapping():
    try:
        # Simulate processing and replacing the image
        odm_dir = os.path.join(DATA_DIR, 'ODM')
        odm_image_path = os.path.join(odm_dir, 'ODMMap.jpg')
        print(f"Processing mapping image: {odm_image_path}")
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.get('/data/ODM/<filename>')
def serve_odm_image(filename):
    odm_dir = os.path.join(DATA_DIR, 'ODM')
    return send_from_directory(odm_dir, filename)

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)