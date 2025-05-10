import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
TARGETS_CACHE = os.path.join(DATA_DIR, 'TargetInformation.json')
SAVED_COORDS = os.path.join(DATA_DIR, 'savedCoords.json')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')
IMAGEDATA_DIR = os.path.join(DATA_DIR, 'imageData')

# ========================= Common Utilities ========================
def load_json(file_path : str):
    """Utility to load JSON data from a file."""
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}

def save_json(file_path : str, data) -> None:
    """Utility to save JSON data to a file."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)
# ========================= Common Utilities ========================

def serialize(class_name : str, conf : float, lat : float, lon : float) -> None:
    """Caches detections to JSON."""
    try:
        if os.path.exists(TARGETS_CACHE):
            data = load_json(TARGETS_CACHE)
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

        save_json(TARGETS_CACHE, data)
    except Exception as e:
        print(f"Error appending to cache: {e}")