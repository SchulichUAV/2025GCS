import React, { useState, useEffect } from "react";
import {
  fetchTargetInformationAPI,
  setCurrentTargetAPI,
  deletePredictionAPI,
  toggleDetectionModelAPI,
  clearDetectionsCacheAPI,
} from "../../../utils/api/api-config.js";
import { calculateDistance, outlierSeverity, computeMedian } from '../../../utils/common.js';

const AIPanel = ({ currentTarget, setCurrentTarget, targetCompleted }) => {
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
  const [outlierInfo, setOutlierInfo] = useState({});

  const showError = (message, timeout = 2000) => {
    setError(message);
    setTimeout(() => setError(null), timeout);
  };

  useEffect(() => {
    const fetchDetectionData = async () => {
      try {
        const response = await fetchTargetInformationAPI();
        if (response) {
          setData(response.targets);
          setCurrentTarget(response.current_target);

          if (completedTargets !== response.completed_targets) {
            setCompletedTargets(response.completed_targets);
            targetCompleted = true;
          }
        }
      } catch (error) {
        showError("Failed to fetch detection data");
      }
    };

    fetchDetectionData();
    const intervalId = setInterval(fetchDetectionData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCurrentTarget = async (className) => {
    try {
      const targetToSet = currentTarget === className ? null : className;
      const success = await setCurrentTargetAPI(targetToSet);
      if (success) {
        setCurrentTarget(targetToSet);
      } else {
        showError("Failed to set current target");
      }
    } catch (error) {
      showError("Failed to set current target");
    }
  };

  const computeOutliers = (data) => {
    const outlierResults = {};

    Object.keys(data).forEach(className => {
      const items = data[className];
      if (!items || items.length < 2) return;
      
      // Identify potential outliers using IQR method
      const latitudes = items.map(item => item.lat);
      const longitudes = items.map(item => item.lon);
        
      const { medianLat, medianLon } = computeMedian(latitudes, longitudes);
      
      // Calculate outlier status for each item
      outlierResults[className] = items.map(item => {
        const distance = calculateDistance(
          item.lat, item.lon, 
          medianLat, medianLon
        );
        
        if (distance < outlierSeverity.normal) return "normal";
        else if (distance < outlierSeverity.minor) return "minor";
        else if (distance < outlierSeverity.mild) return "mild";
        else return "major";
      });
    }); 
    setOutlierInfo(outlierResults);
  };

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    setNewDetections(prevDetections => {
      const updated = { ...prevDetections };
      Object.keys(data).forEach(className => {
        const prevCount = prevData[className]?.length || 0;
        const newCount = data[className]?.length || 0;

        if (newCount > prevCount) {
          updated[className] = true;
          setTimeout(() => {
            setNewDetections(prev => ({ ...prev, [className]: false }));
          }, 3500);
        }
      });
      return updated;
    });

    computeOutliers(data);
    setPrevData(data);
    localStorage.setItem("prevData", JSON.stringify(data));
  }, [data]);

  const toggleClassDropdown = (className) => {
    setOpenClasses((prevState) => ({
      ...prevState,
      [className]: !prevState[className],
    }));
  };

  const handleDeletePrediction = async (className, index) => {
    try {
      const success = await deletePredictionAPI(className, index);
      if (success) {
        setData((prevData) => {
          const updatedData = { ...prevData };
          updatedData[className] = updatedData[className].filter((_, i) => i !== index);

          if (updatedData[className].length === 0) {
            delete updatedData[className];
          }
          return updatedData;
        });

        setNewDetections((prevDetections) => ({
          ...prevDetections,
          [className]: false,
        }));
      } else {
        showError("Failed to delete prediction");
      }
    } catch (error) {
      showError("Failed to delete prediction");
    }
  };

  const toggleDetectionModel = async () => {
    try {
      const success = await toggleDetectionModelAPI(isAIActive);
      if (success) {
        setIsAIActive(!isAIActive);
      } else {
        showError("Failed to toggle detection model");
      }
    } catch (error) {
      showError("Request failed");
    }
  };

  const clearDetectionsCache = async () => {
    try {
      const success = await clearDetectionsCacheAPI();
      if (!success) {
        showError("Failed to clear detections cache");
      }
    } catch (error) {
      showError("Request failed");
    }
  };

  const getOutlierBorder = (severity) => {
    switch (severity) {
      case "major": return "border-red-500 border-2";
      case "mild": return "border-orange-400 border-2";
      case "minor": return "border-yellow-400 border-2";
      default: return "";
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
            CLEAR ALL
          </button>
        </div>
        {error && (
          <div className="text-sm text-white bg-red-600 rounded-lg px-4 py-2 ml-4 flex items-center">
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
                  ? "bg-green-100 border-green-300"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
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

              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  openClasses[className] ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex overflow-auto flex-wrap max-h-44">
                {predictions.map((prediction, index) => {
                  const severity = outlierInfo[className]?.[index] || "normal";
                  const borderClass = getOutlierBorder(severity);  
                  return (
                    <div
                      key={index}
                      className={`relative group bg-white mt-1 p-2 pr-2 mr-2 rounded-lg shadow-md flex-shrink-0 ${borderClass}`}
                    >
                      <button
                        className="absolute top-0 right-1 text-red-600 font-bold hidden group-hover:block hover:text-red-800"
                        title="Remove prediction"
                        onClick={() => handleDeletePrediction(className, index)}
                        >
                        x
                      </button>
                      <p className="text-xs"><strong>Lat:</strong> {prediction.lat.toFixed(6)}</p>
                      <p className="text-xs"><strong>Lon:</strong> {prediction.lon.toFixed(6)}</p>
                      <p className="text-xs"><strong>Conf:</strong> {Math.round(prediction.confidence * 100)}%</p>
                    </div>
                  );
                })}
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