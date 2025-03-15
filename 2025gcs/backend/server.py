import os
import logging
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from enum import Enum
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


def save_json(file_path, data) -> None:
    """
    Utility to save JSON data to a file.

    Parameters:
        file_path (str): The path to the JSON file.
        data (dict): The JSON data to save.
    """

    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)


'''
This function will return the number images under backend\images
'''
def get_existing_image_count():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    IMAGES_DIR = os.path.join(current_dir, "data/images")
    if not os.path.exists(IMAGES_DIR):
        print(f"Warning: Directory '{IMAGES_DIR}' does not exist. Exiting function.")
        return 0
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

@app.route('/targets', methods=['GET', 'POST'], strict_slashes=False)
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
    
@app.route('/coordinates', methods=['GET', 'DELETE'], strict_slashes=False)
@app.route('/coordinates/<image>', methods=['GET', 'POST', 'DELETE'], strict_slashes=False)
def coordinates(image=None):
    # Split into two sections, general image coordinate management and individual image coordinate management.
    # Determined by the presence of an image parameter.
    if image:
        # Check if the image parameter is a valid image file.
        if not image.endswith('.jpg'):
            return jsonify({'success': False, 'error': 'Invalid image file name format.'}), 400
        
        # Check if the image file exists.
        image_path = os.path.join(IMAGES_DIR, image)
        if not os.path.exists(image_path):
            return jsonify({'success': False, 'error': 'Corresponding image file doesn\'t exist.'}), 404
        
        # Check if the savedCoords.json file exists.
        coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
        if not os.path.exists(coords_data_path):
            return jsonify({'success': False, 'error': 'Coordinates data file not found.'}), 404
        
        # Finally, handle the request based on the method.
        # The above checks ensure that the file exists and is a valid image file.
        
        # Get the list of coordinates for the image.
        if request.method == 'GET':
            data = load_json(coords_data_path)
            return data.get(image, [])
        
        # Save the coordinates for the image.
        elif request.method == 'POST':
            data = request.get_json()
            if data is None:
                return jsonify({'success': False, 'error': 'Request must be JSON data.'}), 415
            
            if 'x' not in data or 'y' not in data:
                return jsonify({'success': False, 'error': 'Coordinates must be provided in JSON data as x and y.'}), 400
            
            if not isinstance(data['x'], float) or not isinstance(data['y'], float):
                return jsonify({'success': False, 'error': 'Coordinates must be numerical values.'}), 400
            
            coords_data = load_json(coords_data_path)
            coords_data.setdefault(image, []).append({
                'x': float(data['x']),
                'y': float(data['y'])
            })
            save_json(coords_data_path, coords_data)
            return jsonify({'success': True})
        
        # Clear the coordinates for the image.
        elif request.method == 'DELETE':
            coords_data = load_json(coords_data_path)

            # If an index is provided in the request JSON, delete the coordinate at that index.
            if request.is_json and request.json is not None:
                if request.json.get('index') is not None:
                    index = request.json['index']
                    if index < len(coords_data[image]):
                        del coords_data[image][index]
                        save_json(coords_data_path, coords_data)
                        return jsonify({'success': True})
                    else:
                        return jsonify({'success': False, 'error': 'Index out of range.'}), 400

            # If no index is provided, clear all coordinates for the image.
            coords_data[image] = []
            save_json(coords_data_path, coords_data)
            return jsonify({'success': True})
        
        else:
            return jsonify({'success': False, 'error': 'Invalid request method.'}), 405
    
    else:
        # If no image parameter is provided, these functions are for general image coordinate management.
        
        # Get the list of all images with saved coordinates.
        # This returns a list of image file names, not the actual coordinates.
        # The coordinates for each image can be retrieved individually using the image parameter.
        if request.method == 'GET':
            coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
            coords_data = load_json(coords_data_path)
            return jsonify({'coordinates': coords_data})
        
        # Clear all saved coordinates.
        elif request.method == 'DELETE':
            coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
            save_json(coords_data_path, {})
            return jsonify({'success': True})
        
        else:
            return jsonify({'success': False, 'error': 'Invalid request method.'}), 405


@app.route('/images', methods=['GET', 'DELETE'])
@app.route('/images/<filename>', methods=['GET', 'DELETE'])
def images(filename=None):
    # Check if the images directory exists.
    if not os.path.exists(IMAGES_DIR):
        return jsonify({'success': False, 'error': 'Images directory does not exist.'}), 404

    # Split into two sections, general image management and individual image management.
    # Determined by the presence of a filename parameter.
    if filename:
        # Check if the filename is a valid image file.
        if not filename.endswith('.jpg'):
            return jsonify({'success': False, 'error': 'Invalid file name format.'}), 400
        
        # Check if the image file exists.
        image_path = os.path.join(IMAGES_DIR, filename)
        if not os.path.exists(image_path):
            return jsonify({'success': False, 'error': 'File not found.'}), 404

        # Finally, handle the request based on the method.
        # The above checks ensure that the file exists and is a valid image file.
        # Both checks are required for both methods, so they are done first to avoid redundancy.

        # Serve the image file.
        if request.method == 'GET':
            return send_from_directory(IMAGES_DIR, filename)
        
        # Delete the image file.
        elif request.method == 'DELETE':
            os.remove(image_path)

            # Clear the saved coordinates for the image.    
            coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
            if os.path.exists(coords_data_path):
                coords_data = load_json(coords_data_path)
                if filename in coords_data:
                    del coords_data[filename]
                    save_json(coords_data_path, coords_data)

            # Clear the image data for the image.
            image_data_dir = os.path.join(DATA_DIR, 'imageData')
            if os.path.exists(image_data_dir):
                for file in os.listdir(image_data_dir):
                    if file.startswith(filename.replace('.jpg', '')):
                        try:
                            os.remove(os.path.join(image_data_dir, file))
                        except Exception as e:
                            return jsonify({'success': False, 'error': str(e)}), 500

            return jsonify({'success': True, 'message': f'{filename} deleted successfully.'})

    else:
        # If no filename is provided, these functions are for general image management.

        # Get the list of image files in the images directory.
        if request.method == 'GET':
            image_files = sorted([f for f in os.listdir(IMAGES_DIR) if f.endswith('.jpg') and os.path.isfile(os.path.join(IMAGES_DIR, f))])
            return jsonify({'success': True, 'images': image_files})
        
        # Clear all images from the images directory.
        elif request.method == 'DELETE':
            files = {}
            success = True

            for filename in os.listdir(IMAGES_DIR):
                file_path = os.path.join(IMAGES_DIR, filename)
                if os.path.isfile(file_path) and filename.endswith('.jpg'):
                    try:
                        os.remove(file_path)
                        files[filename] = 'deleted'
                    except Exception as e:
                        files[filename] = str(e)
                        success = False

            # Clearing all images will also clear the saved coordinates.
            coords_data_path = os.path.join(DATA_DIR, 'savedCoords.json')
            if os.path.exists(coords_data_path):
                save_json(coords_data_path, {})

            # Clearing all images will also clear all image data.
            image_data_dir = os.path.join(DATA_DIR, 'imageData')
            if os.path.exists(image_data_dir):
                for filename in os.listdir(image_data_dir):
                    if filename.endswith('.json'):
                        try:
                            os.remove(os.path.join(image_data_dir, filename))
                        except Exception as e:
                            files[filename] = str(e)
                            success = False

            if success:
                return jsonify({'success': True, 'files': files})
            else:
                return jsonify({'success': False, 'files': files}), 500

@app.route('/images/data', methods=['GET'], strict_slashes=False)
def image_data():
    image_data_dir = os.path.join(DATA_DIR, 'imageData')
    image_data = []

    for filename in sorted(os.listdir(image_data_dir)):
        if filename.endswith('.json'):
            with open(os.path.join(image_data_dir, filename), 'r') as file:
                data = json.load(file)
                data['image'] = filename.replace('.json', '.jpg')
                image_data.append(data)

    return jsonify({'success': True, 'data': image_data})


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

@app.route('/manualSelection-calculate', methods=['POST'])
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

if __name__ == '__main__':
    '''
    May need to run this server with sudo (admin) permissions if you encounter blocked networking issues when making API requests to the flight controller.
    '''
    app.run(debug=False, host='0.0.0.0', port=80)