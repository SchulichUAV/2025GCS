import React, { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINT_IP } from "../../../config";

const PhotoPanel = () => {
  const visibleImagesCount = 10;
  const [photos, setPhotos] = useState([]);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [mainPhoto, setMainPhoto] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${ENDPOINT_IP}/images`);
        if (response.data.success) {
          const loadedPhotos = response.data.images;
          setPhotos(loadedPhotos);
          setVisiblePhotos(loadedPhotos.slice(currentStartIndex, currentStartIndex + visibleImagesCount)); // Preserve current start index
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

  const handleManualSelectionSend = async () => {
    try{
      await axios.post(`${ENDPOINT_IP}/manualSelection-calculate`);
      setMessage(`Selections Processed`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
        setError("Request failed");
        setTimeout(() => setError(""), 3000);
      }
  };

  const handleManualCoordSave = async () => {
    if (mainPhoto && selectedPoint) {
      const imgElement = document.querySelector(`img[alt="${mainPhoto}"]`);
      if (imgElement) {
        // Normalize selected point to 640x640 image size
        //(necessary for accuracy on geo calculations as our images are considered 640x640)
        const rect = imgElement.getBoundingClientRect();
        const relativeX = selectedPoint.x / rect.width;
        const relativeY = selectedPoint.y / rect.height;
        const normalizedX = relativeX * 640;
        const normalizedY = relativeY * 640;
  
        await axios.post(`${ENDPOINT_IP}/manualSelection-save`, {
          selected_x: normalizedX,
          selected_y: normalizedY,
          file_name: mainPhoto
        });
        setSelectedPoint(null);
        setMessage("Selection saved");
        setTimeout(() => setMessage(""), 3000);
      }
    }
  };

  const handleDeletePhoto = async (indexToDelete) => {
    const photoToDelete = visiblePhotos[indexToDelete];
    if (!photoToDelete.endsWith('.jpg')) {
      return;
    }
    try {
      const response = await axios.delete(`${ENDPOINT_IP}/images/${photoToDelete}`);

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
        setMessage(`${photoToDelete} deleted`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Error deleting image");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Error deleting image");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleLeftArrow = () => {
    if (currentStartIndex > 0) {
      const newStartIndex = Math.max(0, currentStartIndex - visibleImagesCount);
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(photos.slice(newStartIndex, newStartIndex + visibleImagesCount));
    }
  };
  
  const handleRightArrow = () => {
    if (currentStartIndex + visibleImagesCount < photos.length) {
      const newStartIndex = Math.min(photos.length, currentStartIndex + visibleImagesCount);
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(photos.slice(newStartIndex, newStartIndex + visibleImagesCount));
    }
  };
  

  const handleToggleCamera = async () => {
    try {
      setIsCameraOn(!isCameraOn);
      const response = await fetch(`${ENDPOINT_IP}/toggle_camera_state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      await response.json();
      if (response.ok) {
        // console.log("data.cameraState is: " + data.cameraState);
        // setIsCameraOn(data.cameraState);
      } else {
        setError("Error toggling camera");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Request failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  const clearImages = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to clear all images?"
    );
    if (userConfirmed) {
      try {
        const response = await axios.delete(`${ENDPOINT_IP}/images`);
        const data = await response.json();
        if (data.success) {
          setPhotos([]);
          setVisiblePhotos([]);
          setMainPhoto(null);
        } else {
          setError("Error clearing images");
          setTimeout(() => setError(""), 3000);
        }
      } catch (error) {
        setError("Error clearing images");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') 
        && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        setSelectedPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
                isCameraOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              📸 <span className="ml-2">{isCameraOn ? "Camera On" : "Camera Off"}</span>
            </button>

            <div className="flex gap-2">
              <button className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400 w-1/2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!selectedPoint}
              onClick={handleManualCoordSave}
              >
                Save
              </button>
              <button
                onClick={handleManualSelectionSend}
                className={`px-3 py-2 rounded w-1/2 bg-gray-300 hover:bg-gray-400`}
              >
                Send
              </button>
            </div>
            <button
              onClick={clearImages}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-2">
                <span className="block sm:inline">{message}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          </div>
          <div className="flex-[2] border border-gray-00 flex items-center justify-center bg-white w-full h-[300px] relative">
            {mainPhoto ? (
              <>
                <img
                  src={`${ENDPOINT_IP}/images/${mainPhoto}`}
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
                    mainPhoto === photo ? "border-2 border-blue-500" : "border border-gray-300"
                  }`}
                >
                  <img
                    src={`${ENDPOINT_IP}/images/${photo}`}
                    alt={photo}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="text-xs">
                    {photo.replace(/[^\d]/g, "")}
                  </div>
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