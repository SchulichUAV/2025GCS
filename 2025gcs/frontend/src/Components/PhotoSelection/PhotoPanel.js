import React, { useState, useEffect } from "react";
import axios from "axios";

let BACKEND_IP = '127.0.0.1:80/';

const PhotoPanel = () => {
  const visibleImagesCount = 10;
  const [photos, setPhotos] = useState([]);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [mainPhoto, setMainPhoto] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);


  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:80/getImageCount");
        if (response.data.success) {
          const imageCount = response.data.imageCount;
          const loadedPhotos = Array.from(
            { length: imageCount },
            (_, i) => `capture${i}.jpg`
          );
          setPhotos(loadedPhotos);
          setVisiblePhotos(loadedPhotos.slice(0, visibleImagesCount));
          setMainPhoto(loadedPhotos[0]);
        } else {
          console.error("Error fetching image count:", response.data.error);
        }
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };

    fetchImages();
  }, []);

  const handleDeletePhoto = async (indexToDelete) => {
    const photoToDelete = visiblePhotos[indexToDelete];


    const validFormat = /^capture\d+\.jpg$/.test(photoToDelete);
    if (!validFormat) {
      console.error("Invalid file name format:", photoToDelete);
      return;
    }


    try {
      const response = await axios.post("http://localhost:5000/deleteImage", {
        imageName: photoToDelete,
      });


      if (response.data.success) {
        console.log(`Deleted ${photoToDelete} from the server`);


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
      } else {
        console.error("Error deleting image:", response.data.error);
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };


  const handleLeftArrow = () => {
    if (currentStartIndex > 0) {
      const newStartIndex = currentStartIndex - 1;
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(
        photos.slice(newStartIndex, newStartIndex + visibleImagesCount)
      );
    }
  };


  const handleRightArrow = () => {
    if (currentStartIndex + visibleImagesCount < photos.length) {
      const newStartIndex = currentStartIndex + 1;
      setCurrentStartIndex(newStartIndex);
      setVisiblePhotos(
        photos.slice(newStartIndex, newStartIndex + visibleImagesCount)
      );
    }
  };


  const handleToggleCamera = async () => {
    try {
      const response = await fetch("http://127.0.0.1:80/toggle_camera_state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      const data = await response.json();

      if (response.ok) {
        setIsCameraOn(data.cameraState);
      } else {
        console.error("Error toggling camera:", data.error);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  const clearImages = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to clear all images?"
    );


    if (userConfirmed) {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/clearAllImages",
          { method: "POST" }
        );
        const data = await response.json();


        if (data.success) {
          alert("All images have been cleared successfully.");
          setPhotos([]);
          setVisiblePhotos([]);
          setMainPhoto(null);
        } else {
          alert("Error: " + data.error);
        }
      } catch (error) {
        console.error("Error clearing images:", error);
        alert("Failed to clear images.");
      }
    }
  };


  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-grow w-full">
        <div className="flex flex-col gap-4 p-4 w-1/3 bg-white border-r border-gray-300">
          <button
            onClick={handleToggleCamera}
            className={`px-3 py-2 rounded ${
              isCameraOn
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white flex items-center justify-between`}
          >
            📸 {isCameraOn ? "Camera On" : "Camera Off"}
          </button>
          <button className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Save/Send
          </button>
          <button
            onClick={clearImages}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear
          </button>
        </div>


        <div className="flex-[2] border border-gray-00 flex items-center justify-center bg-white w-full h-[300px]">
          {mainPhoto ? (
            <img
              src={`/images/${mainPhoto}`}
              alt={mainPhoto}
              className="w-full h-full object-cover"
            />
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


          <div className="flex justify-around flex-grow mx-2 gap-1 overflow-x-auto pb-2  h-20">
            {visiblePhotos.map((photo, index) => (
              <div
                key={photo}
                onClick={() => setMainPhoto(photo)}
                className="relative w-16 h-16 border border-gray-300 rounded bg-white flex flex-col items-center justify-center cursor-pointer"
              >
                <img
                  src={`/images/${photo}`}
                  alt={photo}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="text-xs absolute bottom-1 ">
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
  );
};


export default PhotoPanel;
