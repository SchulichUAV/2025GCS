import React, { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINT_IP } from "../../../config";
import { objectList } from "../../../utils/common";

const PhotoPanel = () => {
  const visibleImagesCount = 10;
  const [photos, setPhotos] = useState([]);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [mainPhoto, setMainPhoto] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedSaveObject, setSelectedSaveObject] = useState(""); // for Save dropdown
  const [selectedSendObject, setSelectedSendObject] = useState(""); // for Send dropdown
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageNumberInput, setImageNumberInput] = useState("");

  const showError = (error, timeout = 1500) => {
    setError(error);
    setTimeout(() => setError(null), timeout);
  };
  const showMessage = (message, timeout = 1500) => {
    setMessage(message);
    setTimeout(() => setMessage(null), timeout);
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/getImages`);
        if (response.data.success) {
          const loadedPhotos = response.data.images;
          setPhotos(loadedPhotos);
          setVisiblePhotos(
            loadedPhotos.slice(
              currentStartIndex,
              currentStartIndex + visibleImagesCount
            )
          ); // Preserve current start index
          if (!mainPhoto) {
            setMainPhoto(loadedPhotos[0]);
          }
        }
      } catch (error) {}
    };

    fetchImages();
    const intervalId = setInterval(fetchImages, 10000); // Fetch images every 10 seconds
    return () => clearInterval(intervalId);
  }, [mainPhoto, currentStartIndex]);

  useEffect(() => {
    // Reset selected point when main photo changes
    setSelectedPoint(null);
  }, [mainPhoto]);

  const handleJumpToImage = () => {
    const imageNumber = imageNumberInput.trim();
    if (!imageNumber) {
      showError("No Input");
      return;
    }

    // Convert input to integer to ignore leading zeros
    const inputNum = parseInt(imageNumber, 10);
    if (isNaN(inputNum)) {
      showError("Invalid input");
      return;
    }

    // Find the image that contains this number (ignoring leading zeros)
    const targetImage = photos.find(photo => {
      const photoNum = parseInt(photo.replace(/[^\d]/g, ""), 10);
      return photoNum === inputNum;
    });

    if (!targetImage) {
      showError(`Image ${imageNumber} not found`);
      return;
    }

    setMainPhoto(targetImage);

    const imageIndex = photos.indexOf(targetImage);
    // Calculate the start index to show this image in the thumbnail bar
    let newStartIndex;
    // Center the image in the visible range
    newStartIndex = Math.max(0, imageIndex - Math.floor(visibleImagesCount / 2));
    newStartIndex = Math.min(newStartIndex, photos.length - visibleImagesCount);

    setCurrentStartIndex(newStartIndex);
    setVisiblePhotos(photos.slice(newStartIndex, newStartIndex + visibleImagesCount));

    showMessage(`Jumped to img ${imageNumber}`);
    setImageNumberInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpToImage();
    }
  };

  const handleManualSelectionSend = async () => {
    try {
      if (!selectedSendObject) {
        showError("Select object before sending.");
        return;
      }

      await axios.post(`http://${ENDPOINT_IP}/manualSelection-calc`, {
        object: selectedSendObject,
      });

      showMessage(`Selections Processed`);
    } catch (error) {
      showError("Request Failed");
    }
  };


  const handleManualCoordSave = async () => {
    if (mainPhoto && selectedPoint) {
      if (!selectedSaveObject) {
        showError("Select object before saving.");
        return;
      }
      const imgElement = document.querySelector(`img[alt="${mainPhoto}"]`);
      if (imgElement) {
        // Normalize selected point to 640x640 image size
        //(necessary for accuracy on geo calculations as our images are considered 640x640)
        const rect = imgElement.getBoundingClientRect();
        const relativeX = selectedPoint.x / rect.width;
        const relativeY = selectedPoint.y / rect.height;
        const normalizedX = relativeX * 1456;
        const normalizedY = relativeY * 1088;

        await axios.post(`http://${ENDPOINT_IP}/manualSelection-save`, {
          selected_x: normalizedX,
          selected_y: normalizedY,
          file_name: mainPhoto,
          object: selectedSaveObject,
        });
        setSelectedPoint(null);
        showMessage("Selection saved");
      }
    }
  };

  const handleDeletePhoto = async (indexToDelete) => {
    const photoToDelete = visiblePhotos[indexToDelete];
    if (!photoToDelete.endsWith(".jpg")) {
      return;
    }

    // Add confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${photoToDelete}? This will delete both the image and its associated data.`
    );
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://${ENDPOINT_IP}/deleteSingleImage`,
        {
          data: { imageName: photoToDelete },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const updatedPhotos = photos.filter((photo) => photo !== photoToDelete);
        setPhotos(updatedPhotos);

        const newStartIndex = Math.min(
          currentStartIndex,
          updatedPhotos.length - visibleImagesCount
        );
        setCurrentStartIndex(newStartIndex);
        setVisiblePhotos(
          updatedPhotos.slice(newStartIndex, newStartIndex + visibleImagesCount)
        );

        if (photoToDelete === mainPhoto) {
          setMainPhoto(updatedPhotos[newStartIndex] || null);
        }
        showMessage(`${photoToDelete} deleted`);
      } else {
        showError("Error deleting image");
      }
    } catch (error) {
      showError("Error deleting image");
    }
  };

  const handleLeftArrow = () => {
    if (currentStartIndex > 0) {
      const newStartIndex = Math.max(0, currentStartIndex - visibleImagesCount);
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(
        photos.slice(newStartIndex, newStartIndex + visibleImagesCount)
      );
    }
  };

  const handleRightArrow = () => {
    if (currentStartIndex + visibleImagesCount < photos.length) {
      const newStartIndex = Math.min(
        photos.length,
        currentStartIndex + visibleImagesCount
      );
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(
        photos.slice(newStartIndex, newStartIndex + visibleImagesCount)
      );
    }
  };

  const handleToggleCamera = async () => {
    try {
      setIsCameraOn(!isCameraOn);
      const response = await axios.post(
        `http://${ENDPOINT_IP}/toggle_camera_state`
      );
      if (response.ok) {
        // console.log("data.cameraState is: " + data.cameraState);
        // setIsCameraOn(data.cameraState);
      } else {
        showError("Error toggling camera");
      }
    } catch (error) {
      showError("Request failed");
    }
  };

  const clearImages = async () => {
    if (window.confirm("Are you sure you want to clear all images?")) {
      try {
        const response = await axios.delete(
          `http://${ENDPOINT_IP}/deleteImage`
        );
        console.log(response);
        if (response.status == 200) {
          setPhotos([]);
          setVisiblePhotos([]);
          setMainPhoto(null);
          showMessage("Images cleared successfully");
        } else {
          showError("Error clearing images");
        }
      } catch (error) {
        showError("Error clearing images");
      }
    }
  };

  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setSelectedPoint({ x, y });
  };

  return (
    <div className="flex flex-col w-full h-full rounded-xl shadow-lg overflow-hidden bg-white">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-grow w-full">
          <div className="flex flex-col gap-4 p-4 w-1/3 bg-white border-r border-gray-300">
            <button
              onClick={handleToggleCamera}
              className={`px-3 py-2 rounded flex items-center justify-center w-full ${
                isCameraOn
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              📸{" "}
              <span className="ml-2">
                {isCameraOn ? "Camera On" : "Camera Off"}
              </span>
            </button>
            
            {/* Jump to Image Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Go to img"
                  value={imageNumberInput}
                  onChange={(e) => setImageNumberInput(e.target.value)}
                  onKeyUp={handleKeyPress}
                  className="px-2 py-1 border rounded flex-1 text-sm"
                />
                <button
                  onClick={handleJumpToImage}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Go
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 w-1/2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!selectedPoint}
                  onClick={handleManualCoordSave}
                >
                  Save
                </button>
                <select
                  className="px-2 py-1 border rounded w-1/2"
                  value={selectedSaveObject}
                  onChange={(e) => setSelectedSaveObject(e.target.value)}
                >
                  <option id="saveObject" value=""></option>
                  {objectList.map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={handleManualSelectionSend}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 w-1/3"
              >
                Send
              </button>
              <select
                className="px-2 py-1 border rounded w-1/3"
                value={selectedSendObject}
                onChange={(e) => setSelectedSendObject(e.target.value)}
              >
                <option value="">Object</option>
                {objectList.map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            </div>
            <button
              onClick={clearImages}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear all images
            </button>
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative mt-2">
                <span className="block sm:inline">{message}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mt-2">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          </div>
          <div className="flex-[2] border border-gray-00 flex items-center justify-center bg-white w-full h-[300px] relative">
            {mainPhoto ? (
              <>
                <img
                  src={`http://${ENDPOINT_IP}/images/${mainPhoto}`}
                  alt={mainPhoto}
                  className="object-fit w-full h-full"
                  onClick={handleImageClick}
                  draggable="false"
                />
                {selectedPoint && (
                  <div
                    style={{
                      position: "absolute",
                      top: selectedPoint.y,
                      left: selectedPoint.x,
                      width: "10px",
                      height: "10px",
                      backgroundColor: "red",
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </>
            ) : (
              <p className="text-gray-500">No Photo</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-between p-4 bg-white border-t border-gray-300">
          <div className="flex items-center w-full">
            <button
              onClick={handleLeftArrow}
              disabled={currentStartIndex === 0}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-white"
            >
              &lt;
            </button>
            <div className="flex justify-around flex-grow mx-2 gap-1 overflow-x-auto">
              {visiblePhotos.map((photo, index) => (
                <div
                  key={photo}
                  onClick={() => setMainPhoto(photo)}
                  className={`relative w-16 h-16 rounded bg-white flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow ${
                    mainPhoto === photo
                      ? "border-2 border-blue-500"
                      : "border border-gray-300"
                  }`}
                >
                  <img
                    src={`http://${ENDPOINT_IP}/images/${photo}`}
                    alt={photo}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="text-xs">{photo.replace(/[^\d]/g, "")}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(index);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleRightArrow}
              disabled={currentStartIndex + visibleImagesCount >= photos.length}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-white"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoPanel;
