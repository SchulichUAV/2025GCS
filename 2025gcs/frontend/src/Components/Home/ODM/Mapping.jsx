import React, { useState, useEffect } from 'react';
import { processMappingAPI, fetchMappingImageAPI } from "../../../Api/apiConfig";

function Mapping() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcessMapping = async () => {
    setLoading(true);
    try {
      const response = await processMappingAPI();
      if (response.status === 200) {
        const imageUrl = await fetchMappingImageAPI();
        setImageUrl(imageUrl);
      }
    } catch (error) {} 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialImage = async () => {
      try {
          const imageUrl = await fetchMappingImageAPI();
          setImageUrl(imageUrl);
      } catch (error) {}
    };

    fetchInitialImage();
  }, []);

  return (
    <div className="flex h-full w-full bg-white rounded-xl overflow-hidden">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-20 flex justify-center items-center text-2xl rounded-l-xl"
        onClick={handleProcessMapping}
        disabled={loading}
      >
        <span className="transform rotate-[-90deg] whitespace-nowrap">
          {loading ? "Processing..." : "Process"}
        </span>
      </button>

      <div className="flex-grow flex justify-center items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Mapping Result"
            className="object-fit w-full h-full"
            draggable="false"
          />
        ) : (
          <p className="text-gray-600">{loading ? "Processing Image..." : "No Processed Image..."}</p>
        )}
      </div>
    </div>
  );
}

export default Mapping;
