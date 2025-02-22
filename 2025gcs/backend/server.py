import os
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sys
import requests
# from detection import stop_threads, start_threads
from geo import locate_target
sys.path.append(r'') # add the path here 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Data storage
targets_list = []  # List of pending targets
completed_targets = []  # List of completed targets
current_target = None

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

# heartbeat route
'''
so this method should be called every like
5 seconds from the frontend and update 
the display based on that data.
'''

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

@app.route('/get_heartbeat', methods=['GET'])
def get_heartbeat():
    try:
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        response = requests.get(VEHICLE_API_URL + 'heartbeat-validate', headers=headers, timeout=5)
        heartbeat_data = response.json()
        vehicle_data.update(heartbeat_data)
        
        return jsonify({'success': True, 'vehicle_data': vehicle_data}), 200

    except requests.exceptions.RequestException as e:
        print("Heartbeat failure - RocketM5 disconnect")
        return jsonify({'success': False, 'error': str(e)}), 200

# indiated target completion - not sure if we will keep this for SUAS 2025

@app.route('/completeTarget', methods=['POST'])
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
@app.route('/getCurrentTarget', methods=['GET'])
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


@app.route('/getTargets', methods=['GET'])
def get_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    items = data.get('ITEM', [])

    return jsonify({'success': True, 'targets': items})


@app.route('/getCompletedTargets', methods=['GET'])
def get_completed_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    completed_targets = data.get('completedTargets', [])

    return jsonify({'success': True, 'completed_targets': completed_targets})


@app.route('/addCoords', methods=['POST'])
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

# @app.route('/deleteCoords', methods=['POST'])
# def delete_coords():
#     coord_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
#     save_json(coord_data_path, {'coordinates': []})
#     return jsonify({'status': 'success'})

# # Target Coordinates
# @app.route('/addTargetCoordInfo', methods=['POST'])
# def add_target_coord_info():
#     data = request.get_json()
#     target_data_path = os.path.join(DATA_DIR, 'SavedTargets.json')
#     targets_data = load_json(target_data_path)
#     targets_data.setdefault(data['activeTarget'], []).append({
#         'longitude': data['longitude'],
#         'latitude': data['latitude']
#     })
#     save_json(target_data_path, targets_data)
#     return jsonify({'status': 'success'})

# # File Management
# @app.route('/retrieveData', methods=['GET'])
# def retrieve_data():i
#     file_path = os.path.join(DATA_DIR, 'SavedCoord.json')
#     try:
#         return send_file(file_path, mimetype='application/json')
#     except FileNotFoundError:
#         return jsonify({"error": "File not found"}), 404

# @app.route('/retrieveImageJson/<image_number>', methods=['GET'])
# def retrieve_image_json(image_number):
#     file_path = os.path.join(IMAGES_DIR, f'{image_number}.json')
#     try:
#         return send_file(file_path, mimetype='application/json')
#     except FileNotFoundError:
#         return jsonify({"error": "File not found"}), 404


@app.route('/getImages', methods=['GET'])
def get_images():
    """Endpoint to get the list of images in the images folder."""
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist'}), 404

    image_files = sorted([f for f in os.listdir(IMAGES_DIR) if f.endswith('.jpg') and os.path.isfile(os.path.join(IMAGES_DIR, f))])
    return jsonify({'success': True, 'images': image_files})

@app.route('/images/<filename>', methods=['GET'])
def serve_image(filename):
    """Endpoint to serve an image file."""
    return send_from_directory(IMAGES_DIR, filename)

@app.route('/deleteImage', methods=['POST'])
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
   
@app.route('/clearAllImages', methods=['POST'])
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
    
@app.route('/toggle_camera_state', methods=['POST'])
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

@app.route('/manualSelection-save', methods=['POST'])
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

@app.route('/manualSelection-geo-calc', methods=['POST'])
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
@app.route('/AI', methods=['POST'])
def start_AI_workers():
    """Starts the worker threads."""
    try:
        start_threads()
        return jsonify({"message": "AI processing started"}), 200
    except Exception as e:
        return jsonify({"message": f"Error starting AI processing: {e}"}), 500

@app.route('/AI-Shutdown', methods=['POST'])
def shutdown_workers():
    """Stops all running worker threads."""
    try:
        stop_threads()
        return jsonify({"message": "AI processing stopped"}), 200
    except Exception as e:
        return jsonify({"message": f"Error stopping AI processing: {e}"}), 500

@app.route('/Clear-Detections-Cache', methods=['POST'])
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

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)