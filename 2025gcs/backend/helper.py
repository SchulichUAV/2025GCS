import os
import json

ODM_TAGS = os.path.join(os.path.dirname(__file__), 'data', 'ODM', 'odm_geotags.txt')
TARGETS_CACHE = os.path.join(os.path.dirname(__file__), 'data', 'TargetInformation.json')
IMAGE_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'images')
IMAGE_DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'imageData')

def convert_to_txt(x: float, y: float, json_data: dict) -> None:
    """Converts JSON data to text with ordered field values."""
    ordered_fields = [
        'lat', 'lon', 'alt', 'yaw', 'pitch', 'roll',
        'position_uncertainty', 'alt_uncertainty'
    ]
    # Extract the required fields from the JSON data
    json_values = [str(json_data[field]) for field in ordered_fields]
    detection_values = [str(x), str(y)]
    with open(ODM_TAGS, 'a') as file:
        file.write(','.join(detection_values + json_values) + '\n')


def serialize(class_name : str, conf : float, lat : float, lon : float) -> None:
    """Caches detections to JSON."""
    try:
        if os.path.exists(TARGETS_CACHE):
            with open(TARGETS_CACHE, 'r') as file:
                data = json.load(file)
        else:
            data = {}

        # Update data with new detections
        if class_name not in data:
            data[class_name] = []
        data[class_name].append({
            'lat': lat,
            'lon': lon,
            'confidence': conf
        })

        with open(TARGETS_CACHE, 'w') as file:
            json.dump(data, file, indent=4)
        print("Detection cached.")
    except Exception as e:
        print(f"Error appending to cache: {e}")