import React, { useState, useEffect, useMemo } from 'react';
import { ENDPOINT_IP } from "../../../config";

const ImageData = () => {
  const [imageData, setImageData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchQuery, setSearchQuery] = useState("");

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
          setSortedData(data.imageData);
        } else {
          console.error("Failed to fetch image data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchImageData();
  }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = null;
    }

    setSortConfig({ key, direction });

    if (!direction) {
      setSortedData([...imageData]);
    } else {
      const sorted = [...sortedData].sort((a, b) => {
        if (typeof a[key] === 'number' && typeof b[key] === 'number') {
          return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
        } else {
          return direction === 'asc'
            ? a[key]?.localeCompare(b[key])
            : b[key]?.localeCompare(a[key]);
        }
      });
      setSortedData(sorted);
    }
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '';
    }
    return '';
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = imageData.filter((data) =>
      Object.values(data).some((value) =>
        value?.toString().toLowerCase().includes(query.toLowerCase())
      )
    );
    setSortedData(filtered);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search by image name or value..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>
      <div className="flex-grow overflow-auto rounded border shadow-inner">
      {sortedData.length === 0 ? (
        <div className="flex justify-center items-center h-full text-gray-500">
          <p className="text-lg font-semibold">No image data available.</p>
        </div>
      ) : (
        <table className="min-w-full bg-white text-sm">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="py-2 px-4 border-b cursor-pointer select-none hover:bg-gray-200"
                  onClick={() => handleSort(col.key)}
                >
                  {col.title}
                  {getSortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((data, index) => (
              <tr className="hover:bg-gray-50" key={index}>
                {columns.map((col) => (
                  <td key={col.key} className="py-2 px-4 border-b">
                    {typeof data[col.key] === 'number'
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
