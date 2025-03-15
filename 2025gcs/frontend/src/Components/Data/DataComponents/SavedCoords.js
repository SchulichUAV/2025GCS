import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINT_IP } from "../../../config";

function SavedCoords() {
  const [coords, setCoords] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [sortedCoords, setSortedCoords] = useState([]);

  const fetchCoords = async () => {
    try {
      const response = await axios.get(`${ENDPOINT_IP}/coordinates`);

      if (response.data.coordinates) {
        setCoords(response.data.coordinates);
        setSortedCoords(Object.entries(response.data.coordinates));
      } else {
        console.error("Failed to fetch coordinates: ", response.data.error ?? "Unknown error.");
      }
    } catch (error) {
      console.error("Failed to fetch coordinates: ", error.response ?? "Unknown error.");
    }
  };

  const deleteCoord = async (image, index) => {
    try {
      const response = await axios.delete(`${ENDPOINT_IP}/coordinates/${image}`, {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ index }),
      });

      if (response.data.success) {
        fetchCoords();
      } else {
        console.error("Failed to delete coordinate: ", response.data.error ?? "Unknown error.");
      }
    } catch (error) {
      console.error("Failed to delete coordinate: ", error.response ?? "Unknown error.");
    }
  };

  const clearAllCoords = async () => {
    try {
      const response = await axios.delete(`${ENDPOINT_IP}/coordinates`, {});

      if (response.data.success) {
        setCoords({});
        setSortedCoords([]);
      } else {
        console.error("Failed to clear coordinates: ", response.data.error ?? "Unknown error.");
      }
    } catch (error) {
      console.error("Failed to clear coordinates: ", error.response ?? "Unknown error.");
    }
  };  

  const toggleExpand = (image) => {
    setExpandedImages((prev) => ({
      ...prev,
      [image]: !prev[image],
    }));
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    else if (sortConfig.key === key && sortConfig.direction === 'asc') direction = null;

    setSortConfig({ key, direction });

    if (!direction) {
      setSortedCoords(Object.entries(coords));
    } else {
      const sorted = [...sortedCoords].sort(([aKey], [bKey]) => {
        return direction === 'asc' ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
      });
      setSortedCoords(sorted);
    }
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  useEffect(() => {
    fetchCoords();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto rounded border shadow-inner">
      {sortedCoords.length === 0 ? (
        <div className="flex justify-center items-center h-full text-gray-500 bg-gray-100 rounded-lg p-4">
          <span className="text-lg font-semibold mr-2">📍</span>
          <p className="text-lg font-semibold">No coordinates have been saved yet.</p>
        </div>
      ) : (
        <table className="min-w-full bg-white text-sm">
          <thead className="sticky top-0 bg-gray-100 shadow-sm">
            <tr>
              <th
                className="w-1/3 py-2 px-4 border-b text-left cursor-pointer select-none hover:bg-gray-200"
                onClick={() => handleSort('image')}
              >
                Image{getSortIndicator('image')}
              </th>
              <th className="w-1/3 py-2 px-4 border-b text-left">Coordinates</th>
              <th className="w-1/3 py-2 px-4 border-b text-left">
                <div className="flex justify-between items-center">
                  <span>Actions</span>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded shadow-sm transition ml-2"
                    onClick={clearAllCoords}
                  >
                    Clear All
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCoords.map(([image, coordinates], index) => (
              <React.Fragment key={index}>
                <tr
                  className="bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => toggleExpand(image)}
                >
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
