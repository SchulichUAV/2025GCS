export const ENDPOINT_IP = process.env.REACT_APP_FLASK_IP || "FAILED LOAD";
export const DRONE_IP = process.env.REACT_APP_DRONE_IP || "FAILED LOAD";

// -------------------- General APIs --------------------

// Fetch target information
export const fetchTargetInformationAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/fetch-TargetInformation`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching target information:", error);
    throw error;
  }
};


// -------------------- Data Page APIs--------------------

// Fetch image data
export const fetchImageDataAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/getImageData`);
    const data = await response.json();
    if (data.success) {
      return data.imageData;
    } else {
      throw new Error("Failed to fetch image data");
    }
  } catch (error) {
    console.error("Error fetching image data:", error);
    throw error;
  }
};


// Delete prediction
export const deletePredictionAPI = async (className, index) => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/delete-prediction`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_name: className, index }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting prediction:", error);
    throw error;
  }
};


// Fetch saved coordinates
export const fetchSavedCoordsAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/get_saved_coords`);
    const data = await response.json();
    if (data.success) {
      return data.coordinates;
    } else {
      throw new Error("Failed to fetch saved coordinates");
    }
  } catch (error) {
    console.error("Error fetching saved coordinates:", error);
    throw error;
  }
};

// Delete a specific coordinate
export const deleteSavedCoordAPI = async (image, index) => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/delete_coord`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, index }),
    });
    const data = await response.json();
    if (data.success) {
      return true;
    } else {
      throw new Error("Failed to delete coordinate");
    }
  } catch (error) {
    console.error("Error deleting coordinate:", error);
    throw error;
  }
};

// ----- AI Panel Api's ----------

// Set the current target
export const setCurrentTargetAPI = async (target) => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/current-target`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error setting current target:", error);
    throw error;
  }
};

// Toggle AI detection model
export const toggleDetectionModelAPI= async (isAIActive) => {
  try {
    const endpoint = isAIActive ? "/AI-Shutdown" : "/AI";
    const response = await fetch(`http://${ENDPOINT_IP}${endpoint}`, {
      method: "POST",
    });
    return response.ok;
  } catch (error) {
    console.error("Error toggling detection model:", error);
    throw error;
  }
};

// Clear detections cache
export const clearDetectionsCacheAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/Clear-Detections`, {
      method: "POST",
    });
    return response.ok;
  } catch (error) {
    console.error("Error clearing detections cache:", error);
    throw error;
  }
};