import os
import json

output_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/images'))
json_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/imageData'))

def get_last_image_number():
    """
    Get the highest image number from files in the directory following the pattern 000x.jpg.
    """
    images = [f for f in os.listdir(output_directory) if f.endswith('.jpg') and f[:4].isdigit()]
    if not images:
        return -1  # No valid images found

    numbers = [int(f.split('.')[0]) for f in images]
    return max(numbers)

def rename_images(input_dir):
    """
    Rename images in input_dir to follow the 000x.jpg pattern, continuing from the last
    image number found in output_dir, and save them in output_dir. Also, create corresponding
    JSON files in json_dir if they do not exist.
    """
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    if not os.path.exists(json_directory):
        os.makedirs(json_directory)

    last_number = get_last_image_number()
    next_number = last_number + 1

    input_images = sorted([f for f in os.listdir(input_dir) if f.endswith('.jpg')])
    for image in input_images:
        new_name = f"{next_number:04d}.jpg"
        src = os.path.join(input_dir, image)
        dst = os.path.join(output_directory, new_name)
        os.rename(src, dst)
        print(f"Renamed {image} to {new_name}")

        # Check for corresponding JSON file
        json_name = f"{next_number:04d}.json"
        json_path = os.path.join(json_directory, json_name)
        if not os.path.exists(json_path):
            json_data = {
                "last_time": 1738866398.7327275,
                "lat": 1.1,
                "lon": 1.1,
                "rel_alt": 1.458,
                "alt": 1161.55,
                "roll": 0.08540130406618118,
                "pitch": -0.08548188954591751,
                "yaw": 0.14134883880615234,
                "dlat": -0.06,
                "dlon": 0.13,
                "dalt": -1.04,
                "heading": 8.09,
                "num_satellites": 28.0,
                "position_uncertainty": 463.0,
                "alt_uncertainty": 814.0,
                "speed_uncertainty": 128.0,
                "heading_uncertainty": 0.0
            }
            with open(json_path, 'w') as json_file:
                json.dump(json_data, json_file, indent=4)
            print(f"Created {json_name} with default data")

        next_number += 1

if __name__ == "__main__":
    # Specify where your images are located to be renamed and saved
    input_directory = "/Users/dominicgartner/Downloads/testImg"
    rename_images(input_directory)
    print("Image renaming and JSON file creation complete.")