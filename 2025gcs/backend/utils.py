import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '.', 'data')
IMAGES_DIR = os.path.join(DATA_DIR, 'images')

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