import os
import json
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import locate
import sys
from enum import Enum

sys.path.append(r'') # add the path here 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Data storage
targets = [] # The first target object in the list is the current/active target.
completed_targets = []


# Utilities
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), '.', 'images')


# Classes

class Object(Enum):
    """
    Enum class for object types.
    """

    PERSON = 'Person'
    CAR = 'Car'
    MOTORCYCLE = 'Motorcycle'
    AIRPLANE = 'Airplane'
    BUS = 'Bus'
    BOAT = 'Boat'
    STOP_SIGN = 'Stop Sign'
    SNOWBOARD = 'Snowboard'
    UMBRELLA = 'Umbrella'
    SPORTS_BALL = 'Sports Ball'
    BASEBALL_BAT = 'Baseball Bat'
    MATTRESS = 'Mattress'
    TENNIS_RACKET = 'Tennis Racket'
    SUITCASE = 'Suitcase'
    SKIS = 'Skis'

class Target:
    """
    Represents an instance of a target object.
    """

    def __init__(self, id: str, object_type: Object, image_data: list = [], coordinates: list = []):
        self.id = id # This ID could be the detection ID, not sure how AI team will handle this.
        self.object_type = object_type # Object type from the Object enum.
        self.image_data = image_data # Not sure how this will work, but depends on how the AI team will provide the image data. I think similar to prediction data.
        self.coordinates = coordinates # List of dictionaries containing latitude and longitude.

    def to_dict(self):
        return {
            'id': self.id,
            'object_type': self.object_type.value,
            'image_data': self.image_data,
            'coordinates': self.coordinates
        }
    
    def from_dict(data):
        try:
            return Target(
                id=data['id'],
                object_type=Object(data['object_type']),
                image_data=data['image_data'],
                coordinates=data['coordinates']
            )
        except KeyError:
            print('Error: Missing required fields in target data.')
            return None
    
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

class Targets:
    """
    This class is for utility functions related to targets.
    Its functions serve to reduce redundant file I/O operations and minimize code duplication.
    """

    def get_active_targets() -> list:
        """
        Get the list of active targets.
        """

        target_info_path = os.path.join(DATA_DIR, 'targets.json')
        data = load_json(target_info_path)
        return [Target.from_dict(target_data) for target_data in data.get('active', [])]
    
    def get_completed_targets() -> list:
        """
        Get the list of completed targets.
        """

        target_info_path = os.path.join(DATA_DIR, 'targets.json')
        data = load_json(target_info_path)
        return [Target.from_dict(target_data) for target_data in data.get('completed', [])]
    
    def save_targets(active: list | None, completed: list | None) -> None:
        """
        Save the target objects to the data file.
        """

        # If the active or completed lists are None, get the current values from the data file.
        if active is None:
            active = Targets.get_active_targets()
        if completed is None:
            completed = Targets.get_completed_targets()

        target_info_path = os.path.join(DATA_DIR, 'targets.json')
        data = {
            'active': [target.to_dict() for target in active],
            'completed': [target.to_dict() for target in completed]
        }
        save_json(target_info_path, data)

    def add_target(target: Target) -> None:
        """
        Add a target object to the active targets list.
        """

        active, _ = Targets.get_all_targets()
        active.append(target)
        Targets.save_targets(active, None)

    def complete_target(id: str) -> bool:
        """
        Mark a target as completed.
        """

        active = Targets.get_active_targets()
        completed = Targets.get_completed_targets()
        target = [t for t in active if t.id == id]
        if not target:
            return False
        completed.append(target[0])
        active.remove(target[0])
        Targets.save_targets(active, completed)
        return True


@app.route('/targets/<id>', methods=['GET', 'POST', 'PATCH', 'DELETE'])
def targets(id):
    if request.method == 'GET':
        # Check if the ID parameter is used for filtering by status.
        if id == 'active':
            return jsonify({'targets': [target.to_dict() for target in Targets.get_active_targets()]})
        elif id == 'completed':
            return jsonify({'targets': [target.to_dict() for target in Targets.get_completed_targets()]})
        elif id == 'current':
            active = Targets.get_active_targets()
            return jsonify({'target': active[0].to_dict() if active else None})
        
        # If the ID is not a status filter, it is assumed to be a target ID.
        active = Targets.get_active_targets()
        target = [t for t in active if t.id == id]
        if not target:
            completed = Targets.get_completed_targets()
            target = [t for t in completed if t.id == id]
            status = 'completed'
            if not target:
                return jsonify({'error': 'Target not found.'}), 404
        return jsonify({'target': target[0].to_dict(), 'status': status})
    
    elif request.method == 'POST':
        body = request.get_json()
        if body is None:
            return jsonify({'error': 'Request must be JSON data.'}), 415
        
        targets = Targets.get_active_targets() + Targets.get_completed_targets()
        if any(t.id == body['id'] for t in targets):
            return jsonify({'error': 'Target with the specified ID already exists.'}), 400
        
        target = Target.from_dict(body)
        if target is None:
            return jsonify({'success': False, 'error': 'Invalid target data.'}), 400
        
        Targets.add_target(target)
        return jsonify({'success': True})
    
    elif request.method == 'PATCH': # Mark target as completed.
        result = Targets.complete_target(id)
        if not result:
            return jsonify({'sucesss': False, 'error': 'Target not found.'}), 404
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        return jsonify({'error': 'DELETE is currently not supported.'}), 501

    else:
        return jsonify({'error': 'Invalid request method.'}), 405
        

    

# indiated target completion - not sure if we will keep this for SUAS 2025
# @app.route('/completeTarget', methods=['POST'])
# def complete_target():
#     global current_target

#     target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
#     data = load_json(target_info_path)

#     items = data.get('ITEM', [])
    
#     if not items:
#         return jsonify({'success': False, 'error': 'No targets available.'}), 400

#     # Pop the first item (target) from the list and append to completed targets
#     completed = items.pop(0)
#     data['ITEM'] = items
#     data.setdefault('completedTargets', []).append(completed)
#     current_target = items[0] if items else None
#     save_json(target_info_path, data)

#     return jsonify({'success': True, 'completedTarget': completed, 'currentTarget': current_target})

#return current target 
# @app.route('/getCurrentTarget', methods=['GET'])
# def get_current_target():
#     # Get the index from the query parameters
#     index = request.args.get('index', type=int)

#     if index is None:
#         return jsonify({'success': False, 'error': 'Index parameter is required'}), 400

#     target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
#     data = load_json(target_info_path)

#     items = data.get('ITEM', [])
    
#     if not items:
#         return jsonify({'success': False, 'error': 'No targets available'}), 400

#     # Check if the index is within the valid range
#     if index < 0 or index >= len(items):
#         return jsonify({'success': False, 'error': 'Index out of range'}), 400

#     # Return the target at the specified index
#     return jsonify({'success': True, 'currentTarget': items[index]})

# @app.route('/getTargets', methods=['GET'])
# def get_targets():
#     target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
#     data = load_json(target_info_path)
#     items = data.get('ITEM', [])
    
#     return jsonify({'success': True, 'targets': items})


# @app.route('/getCompletedTargets', methods=['GET'])
# def get_completed_targets():
#     target_info_path = os.path.join(DATA_DIR, 'TargetInformation.json')
#     data = load_json(target_info_path)
#     completed_targets = data.get('completedTargets', [])
    
#     return jsonify({'success': True, 'completed_targets': completed_targets})

@app.route('/coordinates', methods=['GET', 'POST', 'DELETE'])
def coordinates():
    if request.method == 'GET':
        coords_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
        coords_data = load_json(coords_data_path)
        return jsonify({'coordinates': coords_data.get('coordinates', [])})
    
    elif request.method == 'POST':
        data = request.get_json()
        if data is None:
            return jsonify({'success': False, 'error': 'Request must be JSON data.'}), 415

        if 'latitude' not in data or 'longitude' not in data:
            return jsonify({'success': False, 'error': 'Coordinates must be provided in JSON data.'}), 400
        
        coords_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
        coords_data = load_json(coords_data_path)
        
        latitude = data['latitude']
        longitude = data['longitude']

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except ValueError:
            return jsonify({'success': False, 'error': 'Coordinates must be floating point values.'}), 400

        if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
            return jsonify({'success': False, 'error': 'Latitude must be between -90 and 90, longitude must be between -180 and 180.'}), 400

        coords_data.setdefault('coordinates', []).append({
            'latitude': data['latitude'],
            'longitude': data['longitude']
        })
        save_json(coords_data_path, coords_data)
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        coords_data_path = os.path.join(DATA_DIR, 'SavedCoord.json')
        save_json(coords_data_path, {'coordinates': []})
        return jsonify({'success': True})
    
    else:
        return jsonify({'success': False, 'error': 'Invalid request method.'}), 405
    
# @app.route('/deleteSavedTargetData', methods=['DELETE'])
# def delete_saved_target_data():
#     data = request.get_json()
#     if data is None:
#         return jsonify({'success': False, 'error': 'Request must be JSON data.'}), 415
    
#     if 'target' not in data:
#         return jsonify({'success': False, 'error': 'Target ID must be provided in JSON data.'}), 400
    
#     if not isinstance(data['target'], str):
#         return jsonify({'success': False, 'error': 'Target ID must be a string.'}), 400

#     target_data_path = os.path.join(DATA_DIR, 'TargetInformation.json')
#     target_data = load_json(target_data_path)

#     if "predictions" not in target_data:
#         target_data["predictions"] = []

#     target = [t for t in target_data["predictions"] if t["detection_id"] == data["target"]]
#     if not target:
#         return jsonify({'success': False, 'error': 'Target not found.'}), 404
    
#     target_data["predictions"].remove(target[0])
#     save_json(target_data_path, target_data)

#     return jsonify({'success': True})   


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

if __name__ == '__main__':
    app.run(debug=True)
