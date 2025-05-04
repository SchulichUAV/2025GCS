import React, { useState, useEffect } from 'react';
import { fetchSavedCoordsAPI, deleteSavedCoordAPI } from "../../../Api/apiFactory";

function SavedCoords() {
  const [coords, setCoords] = useState({});
  const [expandedObjects, setExpandedObjects] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [sortedCoords, setSortedCoords] = useState([]);

  const fetchCoords = async () => {
    try {
      const coordinates = await fetchSavedCoordsAPI();
      setCoords(coordinates);
      setSortedCoords(Object.entries(coordinates));
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const deleteCoord = async (image, index) => {
    try {
      const success = await deleteSavedCoordAPI(image, index);
      if (success) {
        fetchCoords();
      }
    } catch (error) {
      console.error("Error deleting coordinate:", error);
    }
  };

  const toggleExpand = (object) => {
    setExpandedObjects((prev) => ({
      ...prev,
      [object]: !prev[object],
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
                  onClick={() => handleSort('object')}
                >
                  Object{getSortIndicator('object')}
                </th>
                <th className="w-1/3 py-2 px-4 border-b text-left">Coordinates</th>
                <th className="w-1/3 py-2 px-4 border-b text-left">
                  <div className="flex justify-between items-center">
                    <span>Actions</span>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded shadow-sm transition ml-2"
                      onClick={() => deleteCoord(null, null)}
                    >
                      Clear All
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCoords.map(([object, coordinateList], index) => (
                <React.Fragment key={index}>
                  <tr
                    className="bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => toggleExpand(object)}
                  >
                    <td className="py-2 px-4 border-b font-medium flex items-center gap-2">
                      <span className="text-lg">{expandedObjects[object] ? '▼' : '▶'}</span>
                      {object}
                    </td>
                    <td className="py-2 px-4 border-b"></td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="bg-red-400 hover:bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCoord(object, null);
                        }}
                      >
                        Clear
                      </button>
                    </td>
                  </tr>
                  {expandedObjects[object] &&
                    coordinateList.map((coord, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="py-2 px-4 border-b"></td>
                        <td className="py-2 px-4 border-b">
                          <span className="font-semibold">x:</span> {coord.x}, <span className="font-semibold">y:</span> {coord.y}
                          <div className="text-xs text-gray-500 mt-1">📷 {coord.image}</div>
                        </td>
                        <td className="py-2 px-4 border-b">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow-sm transition"
                            onClick={() => deleteCoord(object, i)}
                          >
                            x
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
