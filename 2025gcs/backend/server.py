import os
import json
import re
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sys
from queue import Queue
# from inference_sdk import InferenceHTTPClient
from threading import Thread, Event, enumerate
from detection import image_watcher, inference_worker, geomatics_worker
sys.path.append(r'') # add the path here 

import requests
import sys
import requests
import json

sys.path.append(r'')  # add the path here

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Data storage
targets_list = []  # List of pending targets
completed_targets = []  # List of completed targets
current_target = None


# Inference client
# client = InferenceHTTPClient(
#     api_url="https://detect.roboflow.com", # Inference API URL
#     api_key="7dEiP3o3XQGNET8f4jlC"  # API key
# )

image_queue = Queue()
detection_queue = Queue()
stop_event = Event()  # Used to signal threads to stop on program exit

ENDPOINT_IP = "192.168.1.67"
VEHICLE_API_URL = f"http://{ENDPOINT_IP}:5000/"
CAMERA_STATE = False


# Utilities
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), '.', 'images')

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

@app.route('/get_heartbeat', methods=['GET'])
def get_heartbeat():
    try:
        headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}
        response = requests.get(VEHICLE_API_URL + 'heartbeat', headers=headers, timeout=5)
        heartbeat_data = response.json()
        vehicle_data.update(heartbeat_data)

        '''
            so this is gonna return something like:
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
                "num_statellites": 0,
                "position_uncertainty": 0,
                "alt_uncertainty": 0,
                "speed_uncertainty": 0,
                "heading_uncertainty": 0
            }
        '''

        return jsonify({'success': True, 'vehicle_data': vehicle_data}), 200

    except requests.exceptions.RequestException as e:
        print("Heartbeat failure - RocketM5 disconnect")
        return jsonify({'success': False, 'error': str(e)}), 500

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


# Location Computation
# @app.route('/computeLocation', methods=['POST'])
# def compute_location():
#     data = request.get_json()
#     lat, lon = locate.locate(
#         uav_latitude=float(data['lat']),
#         uav_longitude=float(data['lon']),
#         uav_altitude=float(data['rel_alt']),
#         bearing=float(data['yaw']),
#         obj_x_px=float(data['x']),
#         obj_y_px=float(data['y'])
#     )
#     return jsonify({'latitude': lat, 'longitude': lon})

# change all absolute paths to local paths and test
@app.route('/getImageCount', methods=['GET'])
def get_image_count():
    """Endpoint to count the number of images in the images folder."""
    # IMAGES_DIR = "C://Users//nehap//Desktop//2025GCS//2025gcs//frontend//public//images"
    IMAGES_DIR = "../frontend//public//images"
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist'}), 404

    image_files = [f for f in os.listdir(IMAGES_DIR) if os.path.isfile(os.path.join(IMAGES_DIR, f))]
    return jsonify({'success': True, 'imageCount': len(image_files)})

@app.route('/deleteImage', methods=['POST'])
def delete_image():
    """Delete an image from the server if it matches 'captureX.jpg' format."""
    # IMAGES_DIR = "C://Users//nehap//Desktop//2025GCS//2025gcs//frontend//public//images"
    IMAGES_DIR = "../frontend//public//images"
    data = request.get_json()
    image_name = data.get("imageName")

    # Validate image name format: "captureX.jpg"
    if not image_name or not re.match(r"^capture\d+\.jpg$", image_name):
        return jsonify({'success': False, 'error': 'Invalid file name format'}), 400

    image_path = os.path.join(IMAGES_DIR, image_name)

    if os.path.exists(image_path):
        os.remove(image_path)
        return jsonify({'success': True, 'message': f'{image_name} deleted successfully'})
    else:
        return jsonify({'success': False, 'error': 'File not found'}), 404
   
@app.route('/clearAllImages', methods=['POST'])
def clear_all_images():
    """Delete all images from the images directory in both frontend and backend."""
    # IMAGE_DIRS = [
    #     "C://Users//nehap//Desktop//2025GCS//2025gcs//frontend//public//images",
    #     "C://Users//nehap//Desktop//2025GCS//2025gcs//backend//images"
    # ]

    IMAGE_DIRS = [
        "../frontend//public//images",
        "./images"
    ]

    deleted_files = []
    errors = []

    for img_dir in IMAGE_DIRS:
        if os.path.exists(img_dir):
            for filename in os.listdir(img_dir):
                file_path = os.path.join(img_dir, filename)
                if os.path.isfile(file_path) and re.match(r"^capture\d+\.jpg$", filename):
                    try:
                        os.remove(file_path)
                        deleted_files.append(filename)
                    except Exception as e:
                        errors.append(str(e))

    if errors:
        return jsonify({'success': False, 'error': 'Some files could not be deleted', 'details': errors}), 500

    return jsonify({'success': True, 'message': 'All images deleted successfully', 'deletedFiles': deleted_files})
    
@app.route('/toggle_camera_state', methods=['POST'])
def toggle_camera_state():
    global CAMERA_STATE
    CAMERA_STATE = not CAMERA_STATE
    
    data = json.dumps({"is_camera_on": CAMERA_STATE})
    headers = {"Content-Type": "application/json", "Host": "localhost", "Connection": "close"}

    try:
        print("Sending API request with `is_camera_on`: " + str(CAMERA_STATE))
        response = requests.post(VEHICLE_API_URL + 'toggle_camera', data=data, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        print(f"Camera on: {CAMERA_STATE}")
        return jsonify({'success': True, 'cameraState': CAMERA_STATE}), 200
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Request timed out'}), 408
    except requests.exceptions.HTTPError as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# AI Processing.
# Workflow starts when the AI endpoint is called through the frontend.
# The AI endpoint starts the worker threads, which run infinitely until the program is stopped.
@app.route('/AI', methods=['POST'])
def start_AI_workers():
    threads = [
        Thread(target=image_watcher, args=(image_queue, stop_event,), daemon=True, name="ImageWatcher"),
        Thread(target=inference_worker, args=(image_queue, detection_queue, stop_event, client), daemon=True, name="InferenceWorker"),
        Thread(target=geomatics_worker, args=(detection_queue, stop_event,), daemon=True, name="GeomaticsWorker"),
    ]

    # Start worker threads
    for thread in threads:
        thread.start()
    
    return jsonify({"message": "AI processing started"}), 200


@app.route('/AI-Shutdown', methods=['POST'])
def shutdown_workers():
    """Stops all running AI worker threads."""
    # Signal threads to stop
    stop_event.set()
    # Clean up queues
    image_queue.put(None)
    detection_queue.put(None)

    # Wait for all threads to finish
    for thread in enumerate():
        if thread.name in ["ImageWatcher", "InferenceWorker", "GeomaticsWorker"]:
            thread.join()

    # Reset stop event for future use
    stop_event.clear()
    return jsonify({"message": "AI processing stopped"}), 200


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
    file.save('./images/' + file.filename) 
    print('Saved file', file.filename)
    return 'ok'

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)

