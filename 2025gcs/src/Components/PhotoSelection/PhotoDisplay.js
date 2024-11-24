import React, { useState } from "react";

const PhotoDisplay = ({
  photos,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  deletePhoto,
  navigatePhotos,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const handleDeleteConfirmation = (index) => {
    setPhotoToDelete(index);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    deletePhoto(photoToDelete);
    setShowDeleteConfirmation(false);
    setPhotoToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPhotoToDelete(null);
  };

  return (
    <div>
      {/* Main photo display */}
      <div className="h-48 border border-gray-300 flex items-center justify-center mb-4">
        {photos[currentPhotoIndex] ? (
          <img
            src={photos[currentPhotoIndex]}
            alt="Current"
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-gray-500">No Photo</p>
        )}
      </div>

      {/* Thumbnails with navigation */}
      <div className="flex items-center">
        {/* Navigate Previous */}
        <button
          onClick={() => navigatePhotos("prev")}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          &lt;
        </button>

        {/* Thumbnails */}
        <div className="flex overflow-x-auto gap-2 py-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => setCurrentPhotoIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative w-12 h-12 border border-gray-300 rounded ${
                photo ? "bg-gray-100 cursor-pointer" : "bg-white"
              } flex items-center justify-center hover:animate-wiggle`}
            >
              {photo ? (
                <>
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  {hoveredIndex === index && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent thumbnail click
                        handleDeleteConfirmation(index);
                      }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600"
                    >
                      x
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm">Empty</p>
              )}
            </div>
          ))}
        </div>

        {/* Navigate Next */}
        <button
          onClick={() => navigatePhotos("next")}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          &gt;
        </button>
      </div>

      {/* Photo Numbers */}
      <div className="flex justify-around mt-2">
        {photos.map((_, index) => (
          <span
            key={index}
            className={`text-xs text-center ${
              index === currentPhotoIndex ? "font-bold text-black" : "text-gray-500"
            }`}
          >
            {index + 1}
          </span>
        ))}
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="mb-4 text-center">
              Are you sure you want to delete this photo?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoDisplay;
