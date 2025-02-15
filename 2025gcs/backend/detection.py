import os
import time
import base64
import cv2
import numpy as np
import json
import queue
from inference_sdk import InferenceHTTPClient
from PIL import Image
from dotenv import load_dotenv
from geo import locate_target

IMAGE_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'images')
IMAGE_DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data', 'imageData')

LAST_SCANNED_INDEX = 0
BATCH_SIZE = 12

load_dotenv()

def run_inference_batch_(base64_images : list[str], client : InferenceHTTPClient) -> list:
    """Runs inference on a batch of images using the detection workflow."""
    try:
        print(f"Workflow started for batch of {len(base64_images)} images")
        start_time = time.time()

        results_total = []
        for img in base64_images:
            results = client.run_workflow(
                workspace_name="suavcoco",
                workflow_id="combined-models",
                images={"image": img}
            )
            results_total.append(results)

        print(f"Workflow finished. Execution time: {time.time() - start_time:.2f} seconds")
        return results_total
    except Exception as e:
        print(f"Inference error: {e}")
        return None
    

def pre_process_detect_batch_(
        batch : list[Image.Image], 
        image_queue : queue.Queue, 
        detection_queue : queue.Queue, 
        client : InferenceHTTPClient
    ) -> None:
    """Pre-processes images in a batch before running inference."""
    base64_images = []
    for img_path in batch:   # Convert images to base64
        try:
            pil_image = Image.open(img_path)
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            _, buffer = cv2.imencode('.png', cv_image)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            base64_images.append(base64_image)
        except Exception as e:
            print(f"Error processing image {img_path}: {e}")
        finally:
            image_queue.task_done()
    detect_batch_(base64_images, batch, detection_queue, client)


def detect_batch_(
        base64_images : list[str], 
        batch : list[Image.Image], 
        detection_queue : queue.Queue, 
        client : InferenceHTTPClient
    ) -> None:
    """Detects objects in a batch of images."""
    if base64_images:
        results = run_inference_batch_(base64_images, client)
        if results:
            for img_path, result in zip(batch, results):
                for detection in result[0]['consensus_predictions']['predictions']:
                    detection_queue.put((img_path, detection))


def process_data_and_locate_target_(detection : dict, path : str) -> None:
    json_file_name = os.path.basename(path).replace('.jpg', '.json')  # Get corresponding JSON file
    json_file_path = os.path.join(IMAGE_DATA_FOLDER, json_file_name)
    if os.path.exists(json_file_path):
        with open(json_file_path, 'r') as json_file:
            json_data = json.load(json_file)
        locate_target(detection, convert_to_txt_(detection['x'], detection['y'], json_data))


def convert_to_txt_(x : int, y : int, json_data : dict) -> str:
    """Converts JSON data to text with field names."""
    fields = [
        'lat', 'lon', 'alt', 'roll', 'pitch', 'yaw', 'heading',
        'position_uncertainty', 'alt_uncertainty', 'speed_uncertainty', 'heading_uncertainty'
    ]
    # Normalize center bounding box x and y coordinates between [0,1]
    # [0.5, 0.5] is the center of the image
    normalized_x = x / 640
    normalized_y = y / 640

    # Extract the required fields from the JSON data
    json_values = [f"{field}: {json_data[field]}" for field in fields]
    detection_values = [f"x: {normalized_x}", f"y: {normalized_y}"]
    return '\n'.join(detection_values + json_values)


# ======================================== Worker Threads ========================================
# Inference worker thread
# Run inference on images in batches until no images are queued or the stop event is set.
def inference_worker(image_queue : queue.Queue, detection_queue : queue.Queue, stop_event) -> None:
    """Worker thread to process images in batches and run inference."""
    # Inference client
    client = InferenceHTTPClient(
        api_url=f"{os.getenv('ML_URI')}",   # Inference API URL
        api_key=f"{os.getenv('API_KEY')}"   # API Key
    )

    while not stop_event.is_set():
        batch = []
        try:
            print("Waiting for images...")
            img_path = image_queue.get()  # Wait indefinitely for an image (blocking call)
            if img_path is None:
                continue    # Skip
            batch.append(img_path)
        except Exception as e:
            print(f"Error fetching image from queue: {e}")
            continue

        while len(batch) < BATCH_SIZE:  # Collect remaining images up to BATCH_SIZE
            try:
                img_path = image_queue.get_nowait()  # Fetch without waiting
                if img_path is None:
                    break
                batch.append(img_path)
            except queue.Empty:
                break  # No more images to process

        pre_process_detect_batch_(batch, image_queue, detection_queue, client)


# Geomatics worker thread
# Run and process detections from the queue until no detections queued or the stop event is set.
def geomatics_worker(detection_queue : queue.Queue, stop_event) -> None:
    """Worker thread to process detections and perform geomatics calculations."""
    while not stop_event.is_set():
        print("Waiting for detections...")
        try:
            img_path, detection = detection_queue.get()  # Wait indefinitely for a detection (blocking call)
            if detection is None or img_path is None:
                continue    # Skip
            process_data_and_locate_target_(detection, img_path)
        except Exception as e:
            print(f"Error processing detection: {e}")
        finally:
            detection_queue.task_done()


# Image watcher thread
# Infinitely run and monitor image folder for new images, add them to the queue until stop event is set.
def image_watcher(image_queue : queue.Queue, stop_event) -> None:
    """Continuously monitors the folder for new images and adds them to the queue."""
    if not os.path.exists(IMAGE_FOLDER):
        print(f"Error: Directory '{IMAGE_FOLDER}' does not exist.")
        return
    
    global LAST_SCANNED_INDEX
    while not stop_event.is_set():
        try:
            new_files = sorted(os.listdir(IMAGE_FOLDER))[LAST_SCANNED_INDEX:]
            if new_files:
                for file in new_files:
                    file_path = os.path.join(IMAGE_FOLDER, file)
                    image_queue.put(file_path)
                    print(f"{file} added to queue")
                    LAST_SCANNED_INDEX += 1
            
            time.sleep(2)  # wait before scanning again to reduce CPU usage
        except FileNotFoundError as e:
            print(f"Error accessing directory: {e}")
            break