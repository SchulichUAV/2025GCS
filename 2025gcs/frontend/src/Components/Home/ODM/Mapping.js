import React, { useState } from 'react';
import axios from 'axios';
import { ENDPOINT_IP } from "../../../config";

function Mapping() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProcessMapping = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://${ENDPOINT_IP}/process-mapping`);
      if (response.status === 200) {
        setImageUrl(response.data.imageUrl);
      } else {
        console.error("Failed to process mapping.");
      }
    } catch (error) {
      console.error("Error processing mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-20 flex justify-center items-center text-2xl"
        onClick={handleProcessMapping}
        disabled={loading}
      >
        <span className="transform rotate-[-90deg] whitespace-nowrap">
          {loading ? "Processing..." : "Process"}
        </span>
      </button>
      <div className="flex-grow flex justify-center items-center">
        {imageUrl ? (
          <img src={imageUrl} alt="Mapping Result" className="max-w-full h-auto rounded shadow-lg" />
        ) : (
          <p>No Processed Image...</p>
        )}
      </div>
    </div>
  );
}

export default Mapping;
