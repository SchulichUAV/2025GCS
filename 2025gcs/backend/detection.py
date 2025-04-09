import os
import time
import base64
import cv2
import numpy as np
import json
from queue import Queue, Empty
from threading import Thread, Event, enumerate
from inference_sdk import InferenceHTTPClient
from PIL import Image
from dotenv import load_dotenv
from geo import locate_target
from helper import serialize, IMAGE_FOLDER, IMAGE_DATA_FOLDER

LAST_SCANNED_INDEX = 0
BATCH_SIZE = 12

image_queue = Queue()
detection_queue = Queue()
stop_event = Event()  # Used to signal threads to stop

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
    detect_batch_(base64_images, batch, client)


def detect_batch_(
        base64_images : list[str], 
        batch : list[Image.Image], 
        client : InferenceHTTPClient
    ) -> None:
    """Detects objects in a batch of images."""
    if base64_images:
        results = run_inference_batch_(base64_images, client)
        if not results:
            print("No detections found...")
            return
        for img_path, result in zip(batch, results):
            for detection in result[0]['consensus_predictions']['predictions']:
                detection_queue.put((img_path, detection))


def process_data_and_locate_target_(detection : dict, path : str) -> None:
    """Processes detection data and performs geomatics calculations."""
    json_file_name = os.path.basename(path).replace('.jpg', '.json')  # Get corresponding JSON file
    json_file_path = os.path.join(IMAGE_DATA_FOLDER, json_file_name)
    if os.path.exists(json_file_path):
        with open(json_file_path, 'r') as json_file:
            json_data = json.load(json_file)
        json_data['x'] = detection['x']
        json_data['y'] = detection['y']
        lat, lon = locate_target(json_data)
        serialize(detection['class'], detection['confidence'], lat, lon)
    else:
        print(f"JSON file not found for {path} - Skipping detection.")

# ======================================== Worker Threads ========================================
# Inference worker thread
# Run inference on images in batches until no images are queued or the stop event is set.
def inference_worker() -> None:
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
                    continue    # Skip
                batch.append(img_path)
            except Empty:
                break  # No more images to process

        pre_process_detect_batch_(batch, client)


# Geomatics worker thread
# Run and process detections from the queue until no detections queued or the stop event is set.
def geomatics_worker() -> None:
    """Worker thread to process detections and perform geomatics calculations."""
    while not stop_event.is_set():
        try:
            print("Waiting for detections...")
            item = detection_queue.get()  # Wait indefinitely for a detection (blocking call)
            if item is None:
                continue  # Skip if None is received
            img_path, detection = item
            process_data_and_locate_target_(detection, img_path)
        except Exception as e:
            print(f"Error processing detection: {e}")
        finally:
            detection_queue.task_done()


# Image watcher thread
# Infinitely run and monitor image folder for new images, add them to the queue until stop event is set.
def image_watcher() -> None:
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

#========================= Endpoint Utilities =========================
def start_threads() -> None:
    threads = [
        Thread(target=image_watcher, daemon=True, name="ImageWatcher"),
        Thread(target=inference_worker, daemon=True, name="InferenceWorker"),
        Thread(target=geomatics_worker, daemon=True, name="GeomaticsWorker"),
    ]
    # Start worker threads
    for thread in threads:
        thread.start()

def stop_threads() -> None:
    """Sets the stop event to stop all threads."""
    stop_event.set()     # Signal threads to stop
    # Clean up queues
    image_queue.put(None)
    detection_queue.put(None)
    for thread in enumerate():
        if thread.name in ["ImageWatcher", "InferenceWorker", "GeomaticsWorker"]:
            thread.join()
    stop_event.clear()