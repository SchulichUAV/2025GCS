import os
import json
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import locate
import sys

sys.path.append(r'') # add the path here 

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

# Target Management
@app.route('/addTarget', methods=['POST'])
def add_target():
    data = request.json
    new_target = {
        "shape": data.get('shape'),
        "shapeColor": data.get('shapeColor'),
        "x": data.get('x'),
        "y": data.get('y'),
        "letter": data.get('letter'),
        "letterColor": data.get('letterColor')
    }
    targets_list.append(new_target)
    
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    target_data = load_json(target_info_path)
    target_data.setdefault('targetsList', []).append(new_target)
    save_json(target_info_path, target_data)

    return jsonify({'success': True, 'target_id': len(targets_list) - 1})

@app.route('/completeTarget', methods=['POST'])
def complete_target():
    global current_target

    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)

    if not data.get('targetsList'):
        return jsonify({'success': False, 'error': 'No targets available'})

    completed = data['targetsList'].pop(0)
    data.setdefault('completedTargets', []).append(completed)
    current_target = data['targetsList'][0] if data['targetsList'] else None
    save_json(target_info_path, data)

    return jsonify({'success': True, 'completedTarget': completed, 'currentTarget': current_target})

@app.route('/getCurrentTarget', methods=['GET'])
def get_current_target():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    targets_list = data.get('targetsList', [])

    if not targets_list:
        return jsonify({'success': False, 'error': 'No targets available'})

    return jsonify({'success': True, 'currentTarget': targets_list[0]})

@app.route('/getTargets', methods=['GET'])
def get_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    return jsonify({'success': True, 'targets': data.get('targetsList', [])})

@app.route('/getCompletedTargets', methods=['GET'])
def get_completed_targets():
    target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
    data = load_json(target_info_path)
    return jsonify({'success': True, 'completed_targets': data.get('completedTargets', [])})

# Coordinate Management
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

@app.route('/deleteCoords', methods=['POST'])
def delete_coords():
    coord_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
    save_json(coord_data_path, {'coordinates': []})
    return jsonify({'status': 'success'})

# Target Coordinates
@app.route('/addTargetCoordInfo', methods=['POST'])
def add_target_coord_info():
    data = request.get_json()
    target_data_path = os.path.join(DATA_DIR, 'SavedTargets.json')
    targets_data = load_json(target_data_path)
    targets_data.setdefault(data['activeTarget'], []).append({
        'longitude': data['longitude'],
        'latitude': data['latitude']
    })
    save_json(target_data_path, targets_data)
    return jsonify({'status': 'success'})

# File Management
@app.route('/retrieveData', methods=['GET'])
def retrieve_data():
    file_path = os.path.join(DATA_DIR, 'SavedCoord.json')
    try:
        return send_file(file_path, mimetype='application/json')
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/retrieveImageJson/<image_number>', methods=['GET'])
def retrieve_image_json(image_number):
    file_path = os.path.join(IMAGES_DIR, f'{image_number}.json')
    try:
        return send_file(file_path, mimetype='application/json')
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

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

if __name__ == '__main__':
    app.run(debug=True)
