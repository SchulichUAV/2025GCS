import React, { useState } from "react";

const PhotoPanel = () => {
  const [photos, setPhotos] = useState(Array(6).fill(null)); // Array for photo slots
  const [currentPhoto, setCurrentPhoto] = useState(null); // Currently selected photo

  const handleAddPhoto = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = `Photo ${index + 1}`; // Add a photo (placeholder name)
    setPhotos(updatedPhotos);
    setCurrentPhoto(updatedPhotos[index]); // Set the new photo as current
  };

  const handleDeletePhoto = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = null; // Clear the photo
    setPhotos(updatedPhotos);
    if (currentPhoto === photos[index]) setCurrentPhoto(null); // Reset current photo if it was deleted
  };

  const handleClearAll = () => {
    setPhotos(Array(6).fill(null)); // Clear all photos
    setCurrentPhoto(null); // Reset current photo
  };

  const handlePhotoClick = (index) => {
    if (photos[index]) {
      setCurrentPhoto(photos[index]); // Set clicked photo as current
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Top Section - Left Side Controls and Main Photo */}
      <div className="flex flex-grow w-full">
        {/* Left Side Controls */}
        <div className="flex flex-col gap-4 p-4 w-1/5 bg-gray-200 border-r border-gray-300">
          <button className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400">📸</button>
          <button id="savebutton" className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Save
          </button>
          <button id="sendbutton" className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Send
          </button>
          <button
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleClearAll}
          >
            Clear
          </button>
        </div>

        {/* Main Photo Display */}
        <div className="flex-1 border border-gray-300 flex items-center justify-center bg-gray-100">
          {currentPhoto ? (
            <p className="text-gray-700">{currentPhoto}</p>
          ) : (
            <p className="text-gray-500">No Photo</p>
          )}
        </div>
      </div>

      {/* Bottom Section - Thumbnails */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-t border-gray-300">
        {/* Navigate Previous */}
        <button className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">&lt;</button>

        {/* Thumbnails */}
        <div className="flex justify-around flex-grow mx-2 gap-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`relative w-16 h-16 border border-gray-300 rounded bg-white flex items-center justify-center cursor-pointer ${
                photo ? "hover:border-blue-500" : ""
              }`}
              onClick={() => handlePhotoClick(index)}
            >
              {photo ? (
                <>
                  <p className="text-gray-700">{photo}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the thumbnail click
                      handleDeletePhoto(index);
                    }}
                    className="absolute top-1 right-1 px-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    X
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-400">Empty</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the thumbnail click
                      handleAddPhoto(index);
                    }}
                    className="absolute bottom-1 right-1 px-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                  >
                    +
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Navigate Next */}
        <button className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">&gt;</button>
      </div>
    </div>
  );
};

export default PhotoPanel;
