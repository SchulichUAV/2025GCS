import React, { useState, useEffect, useMemo} from 'react';
import { ENDPOINT_IP } from "../../../config";

const ImageData = () => {
  const [imageData, setImageData] = useState([]);

  const columns = useMemo(
    () => [
      { title: "Image", key: "image" },
      { title: "Lat", key: "lat" },
      { title: "Lon", key: "lon" },
      { title: "Alt", key: "alt" },
      { title: "Rel Alt", key: "rel_alt" },
      { title: "Roll", key: "roll" },
      { title: "Pitch", key: "pitch" },
      { title: "Yaw", key: "yaw" },
      { title: "Heading", key: "heading" },
    ],
    []
  );

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
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto rounded border shadow-inner">
        {imageData.length === 0 ? (
          <p>No image data available.</p>
        ) : (
          <table className="min-w-full bg-white text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="py-2 px-4 border-b">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imageData.map((data, index) => (
                <tr className="hover:bg-gray-50" key={index}>
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 px-4 border-b">
                      {typeof data[col.key] === "number"
                        ? data[col.key].toFixed(4)
                        : data[col.key]}
                    </td>
                  ))}
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
