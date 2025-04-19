export const ENDPOINT_IP = process.env.REACT_APP_FLASK_IP || "FAILED LOAD";
export const DRONE_IP = process.env.REACT_APP_DRONE_IP || "FAILED LOAD";

// Fetch image data
export const fetchImageData = async () => {
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

// Fetch target information
export const fetchTargetInformation = async () => {
  try {
    const response = await fetch(`http://${ENDPOINT_IP}/fetch-TargetInformation`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching target information:", error);
    throw error;
  }
};

// Delete prediction
export const deletePrediction = async (className, index) => {
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
export const fetchSavedCoords = async () => {
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
export const deleteSavedCoord = async (image, index) => {
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