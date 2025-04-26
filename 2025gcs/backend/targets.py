from object_enum import Object
from utils import load_json, save_json, DATA_DIR
import os

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