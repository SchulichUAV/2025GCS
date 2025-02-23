import React, { useState, useEffect } from 'react';
import { ENDPOINT_IP } from "../../../config";

function SavedCoords() {
  const [coords, setCoords] = useState({});
  const [expandedImages, setExpandedImages] = useState({});

  const fetchCoords = async () => {
    try {
      const response = await fetch(`http://${ENDPOINT_IP}/get_saved_coords`);
      const data = await response.json();
      if (data.success) {
        setCoords(data.coordinates);
      } else {
        console.error("Failed to fetch coordinates");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCoord = async (image, index) => {
    try {
      const response = await fetch(`http://${ENDPOINT_IP}/delete_coord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image, index }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCoords();
      } else {
        console.error("Failed to delete coordinate");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (image) => {
    setExpandedImages((prev) => ({
      ...prev,
      [image]: !prev[image],
    }));
  };

  useEffect(() => {
    fetchCoords();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto rounded border shadow-inner">
        {Object.keys(coords).length === 0 ? (
          <p className="text-center py-4">No coordinates saved.</p>
        ) : (
          <table className="min-w-full bg-white text-sm">
            <thead className="sticky top-0 bg-gray-100 shadow-sm">
              <tr>
                <th className="w-1/3 py-2 px-4 border-b text-left">Image</th>
                <th className="w-1/3 py-2 px-4 border-b text-left">Coordinates</th>
                <th className="w-1/3 py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(coords).map(([image, coordinates], index) => (
                <React.Fragment key={index}>
                  <tr className="bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => toggleExpand(image)}>
                    <td className="py-2 px-4 border-b font-medium flex items-center gap-2">
                      <span className="text-lg">{expandedImages[image] ? '▼' : '▶'}</span>
                      {image}
                    </td>
                    <td className="py-2 px-4 border-b"></td>
                    <td className="py-2 px-4 border-b"></td>
                  </tr>
                  {expandedImages[image] &&
                    coordinates.map((coord, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b">
                          <span className="font-semibold">x:</span> {coord.x}, <span className="font-semibold">y:</span> {coord.y}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow-sm transition"
                            onClick={() => deleteCoord(image, i)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SavedCoords;
