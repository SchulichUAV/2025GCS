# IMPORTS
import os
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sys
from enum import Enum
import requests
from detection import stop_threads, start_threads
from geo import locate_target
sys.path.append(r'') # add the path here 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Constants
DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')

ENDPOINT_IP = "192.168.1.66"
VEHICLE_API_URL = f"http://{ENDPOINT_IP}:5000/"

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

# CLASSES

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
    
    def save_targets(active, completed) -> None:
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


# FUNCTIONS

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
        print("sending api request")
        response = requests.get(VEHICLE_API_URL + 'heartbeat-validate', headers=headers, timeout=5)
        print("sent request")
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

# ROUTES

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


if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)