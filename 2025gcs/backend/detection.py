import os
import time
import base64
import cv2
import numpy as np
from PIL import Image
from geo import locate_target

IMAGE_FOLDER = os.path.join(os.path.dirname(__file__), 'images')
SCANNED_INDEX = 0
BATCH_SIZE = 12

def run_inference_batch(base64_images, client):
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

def inference_worker(image_queue,stop_event, detection_queue, client):
    """Worker thread to process images in batches and run inference."""
    while not stop_event.is_set():
        batch = []

        while len(batch) < BATCH_SIZE and not image_queue.empty():
            img_path = image_queue.get()
            if img_path is None:
                return  # Stop thread

            try:
                pil_image = Image.open(img_path)
                cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                _, buffer = cv2.imencode('.png', cv_image)
                base64_image = base64.b64encode(buffer).decode('utf-8')
                batch.append(base64_image)
            except Exception as e:
                print(f"Error processing image {img_path}: {e}")

            image_queue.task_done()

        if not batch:
            time.sleep(1.5)
            continue  # No images to process

        results = run_inference_batch(batch, client)
        if results:
            for result in results:
                for detection in result[0]['consensus_predictions']['predictions']:
                    detection_queue.put(detection)

def geomatics_worker(detection_queue,stop_event):
    """Worker thread to process detections and perform geomatics calculations."""
    while not stop_event.is_set():
        detections = detection_queue.get()
        if detections is None:
            return  # Stop thread
        locate_target(detections)
        detection_queue.task_done()

def image_watcher(image_queue, stop_event):
    """Continuously monitors the folder for new images and adds them to the queue."""
    if not os.path.exists(IMAGE_FOLDER):
        print(f"Error: Directory '{IMAGE_FOLDER}' does not exist.")
        return
    
    global SCANNED_INDEX
    while not stop_event.is_set():
        try:
            new_files = sorted(os.listdir(IMAGE_FOLDER))[SCANNED_INDEX:]  # Get new files
            if new_files:
                for file in new_files:
                    print(f"New image detected: {file}")
                    file_path = os.path.join(IMAGE_FOLDER, file)
                    image_queue.put(file_path)
                    SCANNED_INDEX += 1  # Track processed files
            
            time.sleep(2)  # wait before scanning again to reduce CPU usage
        except FileNotFoundError as e:
            print(f"Error accessing directory: {e}")
            break