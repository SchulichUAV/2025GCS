import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { ENDPOINT_IP } from "../../../config";

const ImageData = () => {
  const [imageData, setImageData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState(""); // Default to "all" (empty string)

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

  useEffect(() => {
    fetchImageData();
  }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    else if (sortConfig.key === key && sortConfig.direction === 'asc') direction = null;

    setSortConfig({ key, direction });

    if (!direction) setSortedData([...imageData]);
    else {
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

  const getSortIndicator = (key) => (sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '') : '');

  const handleSearch = (query, column) => {
    setSearchQuery(query);
    if (column) {
      const filtered = imageData.filter((data) =>
        data[column]?.toString().toLowerCase().includes(query.toLowerCase())
      );
      setSortedData(filtered);
    } else {
      // If no specific column is selected, search across all columns
      const filtered = imageData.filter((data) =>
        Object.values(data).some((value) =>
          value?.toString().toLowerCase().includes(query.toLowerCase())
        )
      );
      setSortedData(filtered);
    }
  };

  // Effect to trigger search when the column changes
  useEffect(() => {
    if (searchQuery !== "") {
      handleSearch(searchQuery, searchColumn);
    }
  }, [searchColumn]); // Re-run search when column changes

  const exportToCSV = () => {
    const headers = columns.map((col) => col.title).join(",");
    const rows = sortedData
      .map((row) => columns.map((col) => JSON.stringify(row[col.key] ?? "")).join(","))
      .join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "image_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonContent = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sortedData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", "image_data.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-2/3 max-w-lg flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search in ${searchColumn || "all"}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value, searchColumn)}
            className="w-full pl-10 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
          />
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="ml-4 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
          >
            <option value="">All</option>
            {columns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={fetchImageData} 
            className="p-2 px-4 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 duration-200">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={exportToCSV} 
            className="p-2 px-4 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 duration-200">
            Export CSV
          </button>
          <button 
            onClick={exportToJSON} 
            className="p-2 px-4 bg-yellow-600 text-white rounded-md shadow-md hover:bg-yellow-700 duration-200">
            Export JSON
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto rounded-lg border shadow-inner">
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
                      {typeof data[col.key] === 'number' ? data[col.key].toFixed(4) : data[col.key]}
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
