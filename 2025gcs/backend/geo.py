import time
import os
import json

TARGETS_CACHE = os.path.join(os.path.dirname(__file__), './data/TargetInformation.json')

def locate_target(detection, metadata):
    """Performs geomatics calculations."""
    try:
        print("Performing geo calc...")
        time.sleep(0.4)  # Simulating processing time
        print(f"Geo calc complete")
        append_to_cache(detection['class'], detection['confidence'], lat=metadata['lat'], lon=metadata['lon'])
    except Exception as e:
        print(f"Geomatics calculation error: {e}")


def append_to_cache(class_name, conf, lat, lon):
    """Appends detections to the cache file."""
    try:
        # Read existing data from the JSON file
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

        # Write updated data back to the JSON file
        with open(TARGETS_CACHE, 'w') as file:
            json.dump(data, file, indent=4)

        print("Detection cached.")
    except Exception as e:
        print(f"Error appending to cache: {e}")