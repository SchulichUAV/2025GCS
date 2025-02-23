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
        fetchCoords(); // Refresh the coordinates after deletion
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
    <div>
      <h2 className="text-2xl font-bold mb-4">Saved Coordinates</h2>
      <div className="overflow-auto max-h-96">
        {Object.keys(coords).length === 0 ? (
          <p>No coordinates saved.</p>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Image</th>
                <th className="py-2 px-4 border-b">Coordinates</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(coords).map(([image, coordinates], index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="py-2 px-4 border-b" colSpan="3">
                      <button
                        className="text-left w-full"
                        onClick={() => toggleExpand(image)}
                      >
                        {expandedImages[image] ? '▼' : '▶'} {image}
                      </button>
                    </td>
                  </tr>
                  {expandedImages[image] && coordinates.map((coord, i) => (
                    <tr key={i}>
                      <td className="py-2 px-4 border-b"></td>
                      <td className="py-2 px-4 border-b">
                      <strong>x:</strong> {coord.x}, <strong>y:</strong> {coord.y}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
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