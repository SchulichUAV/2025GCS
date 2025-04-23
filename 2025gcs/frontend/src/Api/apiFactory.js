import axios from "axios";
export const ENDPOINT_IP = process.env.REACT_APP_FLASK_IP || "FAILED LOAD";
export const DRONE_IP = process.env.REACT_APP_DRONE_IP || "FAILED LOAD";


// -------------------- General APIs -------------------

// Fetch target information
export const fetchTargetInformationAPI = async () => {
  try {
    const response = await axios.get(`http://${ENDPOINT_IP}/fetch-TargetInformation`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching target information:", error);
    throw error;
  }
};

// Delete prediction
export const deletePredictionAPI = async (className, index) => {
  try {
    const response = await axios.delete(`http://${ENDPOINT_IP}/delete-prediction`, {
      data: { class_name: className, index },
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    console.error("Error deleting prediction:", error);
    throw error;
  }
};

//   -------------------- App APIs----------------------------
export const checkHeartbeatAPI = async () => {
  try {
    const response = await axios.get(`http://${ENDPOINT_IP}/get_heartbeat`);
    return response.data;
  } catch (error) {
    console.error("Error checking heartbeat:", error);
    throw error;
  }
};
// -------------------- Data Component APIs--------------------

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



// -----------------------  AI Panel Api's ---------------------------- 

// Set current target
export const setCurrentTargetAPI = async (targetToSet) => {
  try {
    const response = await axios.post(
      `http://${ENDPOINT_IP}/current-target`,
      { target: targetToSet },
      { headers: { "Content-Type": "application/json" } }
    );
    return response;
  } catch (error) {
    console.error("Error setting current target:", error);
    throw error;
  }
};

// Toggle AI detection model
export const toggleDetectionModelAPI = async (isAIActive) => {
  try {
    const endpoint = isAIActive ? "/AI-Shutdown" : "/AI";
    const response = await axios.post(`http://${ENDPOINT_IP}${endpoint}`);
    return response;
  } catch (error) {
    console.error("Error toggling detection model:", error);
    throw error;
  }
};

// Clear detections cache
export const clearDetectionsCacheAPI = async () => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/Clear-Detections`);
    return response;
  } catch (error) {
    console.error("Error clearing detections cache:", error);
    throw error;
  }
};


// ----------------------------  Altitude Component Apis -------------------------- 

export const setAltitudeAPI = async (type, altitude) => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/set-altitude-${type}`, { altitude });
    return response;
  } catch (error) {
    console.error("Error setting altitude:", error);
    throw error;
  }
};

// -- Flight Mode Component
export const setFlightModeAPI = async (mode_id) => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/set_flight_mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode_id }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error setting flight mode:", error);
    throw error;
  }
};

// Takeoff
export const takeoffAPI = async (altitude) => {
  try {
    const response = await fetch(`http://${DRONE_IP}:5000/takeoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altitude }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error during takeoff:", error);
    throw error;
  }
};

// ----------------------------- ODM APIs --------------------------------------- 

// Process mapping
export const processMappingAPI = async () => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/process-mapping`);
    return response;
  } catch (error) {
    console.error("Error processing mapping:", error);
    throw error;
  }
};

// Fetch mapping image
export const fetchMappingImageAPI = async () => {
  try {
    return `http://${ENDPOINT_IP}/data/ODM/ODMMap.jpg`;
  } catch (error) {
    console.error("Error fetching mapping image:", error);
    throw error;
  }
};

// - Payload Component 

// Fetch current target
export const fetchCurrentTargetAPI = async () => {
  try {
    const response = await axios.get(`http://${ENDPOINT_IP}/current-target`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current target information:", error);
    throw error;
  }
};

// Payload Release API
export const releasePayloadAPI = async (bay) => {
  try {
    const response = await axios.post(
      `http://${ENDPOINT_IP}/payload-release`,
      { bay },
      { headers: { "Content-Type": "application/json" } }
    );
    return response;
  } catch (error) {
    console.error("Error releasing payload:", error);
    throw error;
  }
};

// -----------------------------------------  Photo Selection Apis --------------------------------------- 

// Fetch images
export const fetchImagesAPI = async () => {
  try {
    const response = await axios.get(`http://${ENDPOINT_IP}/getImages`);
    return response.data;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
};

// Manual selection send
export const manualSelectionSendAPI = async () => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/manualSelection-geo-calc`);
    return response;
  } catch (error) {
    console.error("Error sending manual selection:", error);
    throw error;
  }
};

// Manual coordinate save
export const manualCoordSaveAPI = async (normalizedX, normalizedY, mainPhoto) => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/manualSelection-save`, {
      selected_x: normalizedX,
      selected_y: normalizedY,
      file_name: mainPhoto,
    });
    return response;
  } catch (error) {
    console.error("Error saving manual coordinates:", error);
    throw error;
  }
};


// Delete photo
export const deletePhotoAPI = async (photoToDelete) => {
  try {
    const response = await axios.post(`http://${ENDPOINT_IP}/deleteImage`, {
      imageName: photoToDelete,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};

// Toggle camera state
export const toggleCameraStateAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/toggle_camera_state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Error toggling camera state");
    }
    return data;
  } catch (error) {
    console.error("Error toggling camera state:", error);
    throw error;
  }
};

// Clear all images
export const clearAllImagesAPI = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/clearAllImages`, {
      method: "POST",
    });
    return response.json();
  } catch (error) {
    console.error("Error clearing all images:", error);
    throw error;
  }
};