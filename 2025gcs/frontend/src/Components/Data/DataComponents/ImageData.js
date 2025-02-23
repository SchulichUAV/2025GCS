import React, { useState, useEffect } from 'react';
import { ENDPOINT_IP } from "../../../config";

const ImageData = () => {
  const [imageData, setImageData] = useState([]);

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const response = await fetch(`http://${ENDPOINT_IP}/getImageData`);
        const data = await response.json();
        if (data.success) {
          setImageData(data.imageData);
        } else {
          console.error("Failed to fetch image data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchImageData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Image Data</h2>
      <div className="overflow-auto max-h-96">
        {imageData.length === 0 ? (
          <p>No image data available.</p>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Image</th>
                <th className="py-2 px-4 border-b">Latitude</th>
                <th className="py-2 px-4 border-b">Longitude</th>
                <th className="py-2 px-4 border-b">Rel Alt</th>
                <th className="py-2 px-4 border-b">Altitude</th>
                <th className="py-2 px-4 border-b">Roll</th>
                <th className="py-2 px-4 border-b">Pitch</th>
                <th className="py-2 px-4 border-b">Yaw</th>
                <th className="py-2 px-4 border-b">Heading</th>
              </tr>
            </thead>
            <tbody>
              {imageData.map((data, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b">{data.image}</td>
                  <td className="py-2 px-4 border-b">{data.lat.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.lon.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.rel_alt.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.alt.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.roll.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.pitch.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.yaw.toFixed(4)}</td>
                  <td className="py-2 px-4 border-b">{data.heading.toFixed(4)}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ImageData;