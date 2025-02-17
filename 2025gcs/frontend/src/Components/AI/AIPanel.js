import React, { useState, useEffect } from "react";
import { ENDPOINT_IP } from "../../config";

const AIPanel = ({ data }) => {
  const [openClasses, setOpenClasses] = useState({});
  const [isAIActive, setIsAIActive] = useState(false);
  const [newDetections, setNewDetections] = useState({});
  const [prevData, setPrevData] = useState(() => {
    const storedData = localStorage.getItem("prevData");
    return storedData ? JSON.parse(storedData) : {};
  });

  useEffect(() => {
    if (!data) return;
  
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
  }, [data, prevData]);
  

  const toggleClassDropdown = (className) => {
    setOpenClasses((prevState) => ({
      ...prevState,
      [className]: !prevState[className],
    }));
  };

  const HandleAIWorkflow = async () => {
    let response;
    if (isAIActive) {
      response = await fetch(`${ENDPOINT_IP}/AI-Shutdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } else {
      response = await fetch(`${ENDPOINT_IP}/AI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    setIsAIActive(!isAIActive);
    const responseData = await response.json();
    console.log(responseData.message);
  };

  const ClearCache = async () => {
    const response = await fetch(`${ENDPOINT_IP}/Clear-Detections-Cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const responseData = await response.json();
    console.log(responseData.message);
  }

  return (
    <div className="ai-panel py-6 px-10 max-w-3xl w-full mx-auto space-y-4 bg-white rounded-xl shadow-lg relative">
      <div className="top-0 z-10 flex">
        <button
          onClick={HandleAIWorkflow}
          className={`px-4 py-2 mr-4 font-semibold text-sm rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isAIActive
              ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
              : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
          }`}
        >
          {isAIActive ? "STOP DETECTING" : "START DETECTING"}
        </button>
        <button onClick={ClearCache} className="px-4 py-2 font-semibold text-sm rounded-lg shadow-md bg-red-300 hover:bg-red-400">
          CLEAR CACHE
        </button>
      </div>
      <div className="overflow-auto h-56">
        {data && Object.keys(data).length > 0 ? (
          Object.entries(data).map(([className, predictions]) => (
            <div
              key={className}
              className="prediction-panel bg-gray-100 p-4 mb-4 rounded-lg shadow-md border border-gray-300 relative"
            >
              {/* Class Header */}
              <div
                className="flex justify-between cursor-pointer"
                onClick={() => toggleClassDropdown(className)}
              >
                <h3 className="font-bold text-gray-900">
                  {className} ({predictions.length}) {newDetections[className] && <span className="text-blue-500">●</span>}
                </h3>
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
                        <strong className="underline">Lat:</strong> {prediction.lat.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <strong className="underline">Lon:</strong> {prediction.lon.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <strong className="underline">Conf:</strong> {Math.round(prediction.confidence * 100)}%
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