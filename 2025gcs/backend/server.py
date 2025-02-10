import os
import json
import re
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import locate
import requests
import sys

sys.path.append(r'')  # add the path here

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Data storage
targets_list = []  # List of pending targets
completed_targets = []  # List of completed targets
current_target = None

# Utilities
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), '.', 'images')


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

RASPBERRY_PI_URI = "http://127.0.0.1:5000/heartbeat-validate"


@app.route('/getHeartbeat', methods=['GET'])
def get_heartbeat():
    try:
        # max timeout of 10 here btw
        response = requests.get(RASPBERRY_PI_URI, timeout=10)
        response.raise_for_status()
        vehicle_data = response.json()

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
                "heading": 0
            }
        '''

        return jsonify({'success': True, 'vehicle_data': vehicle_data})

    except requests.exceptions.RequestException as e:

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
# def retrieve_data():
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


@app.route('/computeLocation', methods=['POST'])
def compute_location():
    data = request.get_json()
    lat, lon = locate.locate(
        uav_latitude=float(data['lat']),
        uav_longitude=float(data['lon']),
        uav_altitude=float(data['rel_alt']),
        bearing=float(data['yaw']),
        obj_x_px=float(data['x']),
        obj_y_px=float(data['y'])
    )
    return jsonify({'latitude': lat, 'longitude': lon})


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




if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=80)

