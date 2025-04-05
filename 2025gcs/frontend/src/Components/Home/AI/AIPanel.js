import React, { useState, useEffect } from "react";
import { ENDPOINT_IP } from "../../../config";
import axios from "axios";

const AIPanel = ({ currentTarget, setCurrentTarget }) => {
  const [openClasses, setOpenClasses] = useState({});
  const [isAIActive, setIsAIActive] = useState(false);
  const [newDetections, setNewDetections] = useState({});
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [prevData, setPrevData] = useState(() => {
    const storedData = localStorage.getItem("prevData");
    return storedData ? JSON.parse(storedData) : {};
  });
  const [completedTargets, setCompletedTargets] = useState({});

  useEffect(() => {
    const fetchDetectionData = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/fetch-TargetInformation`);
        if (response.data) {
          setData(response.data.targets); // targets data
          setCompletedTargets(response.data.completed_targets); // completed targets
          setCurrentTarget(response.data.current_target); // current target
        }
      } catch (error) {
        setError("Failed to fetch detection data");
        setTimeout(() => setError(null), 2000);
      }
    };

    fetchDetectionData();
    const intervalId = setInterval(fetchDetectionData, 2000); 
    return () => clearInterval(intervalId);
  }, []);

  const handleCurrentTarget = async (className) => {
    const targetToSet = currentTarget === className ? null : className;

    const response = await axios.post(`http://${ENDPOINT_IP}/current-target`, 
      { target: targetToSet },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200) {
      setCurrentTarget(targetToSet);
    }
    else {
      setError("Failed to set current target");
      setTimeout(() => setError(null), 2000);
    }
  };

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;
  
    setNewDetections((prevDetections) => {
      const updatedDetections = { ...prevDetections };
  
      Object.keys(data).forEach((className) => {
        const prevCount = prevData[className]?.length || 0;
        const newCount = data[className]?.length || 0;
  
        if (newCount > prevCount) {
          updatedDetections[className] = true;
          setTimeout(() => {
            setNewDetections((prev) => ({ ...prev, [className]: false }));
          }, 3500);
        }
      });
  
      return updatedDetections;
    });
  
    setPrevData(data);
    localStorage.setItem("prevData", JSON.stringify(data));
  }, [data]);
  
  const toggleClassDropdown = (className) => {
    setOpenClasses((prevState) => ({
      ...prevState,
      [className]: !prevState[className],
    }));
  };

  const toggleDetectionModel = async () => {
    try {
      const endpoint = isAIActive ? "/AI-Shutdown" : "/AI";
      await axios.post(`http://${ENDPOINT_IP}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setIsAIActive(!isAIActive);
    } catch (error) {
      setError("Request failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearDetectionsCache = async () => {
    try {
      await axios.post(`http://${ENDPOINT_IP}/Clear-Detections-Cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      setError("Request failed");
      setTimeout(() => setError(null), 3000); 
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-4 px-5 w-full h-full mx-auto space-y-4 bg-white rounded-xl shadow-lg relative">
      <div className="top-0 z-10 flex items-center justify-between">
        <div className="flex">
          <button
            onClick={toggleDetectionModel}
            className={`px-4 py-2 mr-4 font-semibold text-sm rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isAIActive
                ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
            }`}
          >
            {isAIActive ? "STOP DETECTING" : "START DETECTING"}
          </button>
          <button
            onClick={clearDetectionsCache}
            className="px-4 py-2 font-semibold text-sm rounded-lg shadow-md bg-red-300 hover:bg-red-400"
          >
            CLEAR CACHE
          </button>
        </div>
        {error && (
          <div
            className="text-sm text-white bg-red-600 rounded-lg px-4 py-2 ml-4 flex items-center"
            style={{ minWidth: "200px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          >
            <span className="mr-2">
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="overflow-auto h-52 w-full">
        {data && Object.keys(data).length > 0 ? (
          Object.entries(data).map(([className, predictions]) => (
            <div
              key={className}
              className={`p-4 mb-4 rounded-lg shadow-md border ${
                completedTargets.includes(className) 
                  ? "bg-green-100 border-green-300" // cempleted target background is green
                  : "bg-gray-100 border-gray-300" // Default gray background
              }`}>
              {/* Class Header */}
              <div
                className="flex justify-between cursor-pointer"
                onClick={() => toggleClassDropdown(className)}
              >
                <h3 className="font-bold text-gray-900">
                  {className} ({predictions.length}) {newDetections[className] && <span className="text-blue-500">●</span>}
                </h3>
                {!completedTargets.includes(className) && (
                  <button
                  className={`px-3 py-1 text-sm rounded-full transition-colors duration-150 border ${
                    className === currentTarget
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCurrentTarget(className);
                  }}
                >
                  {className === currentTarget ? 'Current Target' : 'Set Current'}
                </button>
                )}
                <button className="font-bold">
                  {openClasses[className] ? "▲" : "▼"}
                </button>
              </div>

              {/* Expandable Section */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  openClasses[className] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex overflow-auto flex-wrap max-h-44">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="bg-white mt-1 p-2 mr-2 rounded-lg shadow-md border border-gray-200 flex-shrink-0"
                    >
                      <p className="text-xs">
                        <strong>Lat:</strong> {prediction.lat.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <strong>Lon:</strong> {prediction.lon.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <strong>Conf:</strong> {Math.round(prediction.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No predictions available</div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;