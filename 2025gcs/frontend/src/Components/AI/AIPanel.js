import React, { useState } from "react";

const AIPanel = ({ data }) => {
  const [openClasses, setOpenClasses] = useState({}); // Track open state for each class
  const [isAIActive, setIsAIActive] = useState(false);

  // Group predictions by class
  const groupedPredictions = data?.predictions?.reduce((acc, prediction) => {
    const { class: className } = prediction;
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(prediction);
    return acc;
  }, {});

  const toggleClassDropdown = (className) => {
    setOpenClasses((prevState) => ({
      ...prevState,
      [className]: !prevState[className], 
    }));
  };

  const ENDPOINT_IP = '10.0.0.120';
  const AI = async () => {
    let response;
    if(isAIActive){
      response = await fetch(`http://${ENDPOINT_IP}:80/AI-Shutdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    else{
      response = await fetch(`http://${ENDPOINT_IP}:80/AI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    setIsAIActive(!isAIActive);
    
    const data = await response.json();
    console.log(data.message);
  };

  return (
    <div
      className="ai-panel py-6 px-10 max-w-3xl w-full mx-auto space-y-4 bg-white rounded-xl shadow-lg relative"
      style={{ transition: "all 0.3s ease-in-out" }} // Smooth transition for the panel
    >
    <div className="top-0 z-10 flex">
      <button
        onClick={() => AI()}
        className={`px-4 py-2 font-semibold text-sm rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isAIActive
            ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
            : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
        }`}
      >
        {isAIActive ? "STOP" : "START"}
      </button>
    </div>
      <div className="overflow-auto h-56">
      {groupedPredictions &&
        Object.entries(groupedPredictions).map(([className, predictions]) => (
          <div
            key={className}
            className="prediction-panel bg-gray-100 p-4 mb-4 rounded-lg shadow-md border border-gray-300"
          >
            {/* Class Header */}
            <div
              className="flex justify-between cursor-pointer"
              onClick={() => toggleClassDropdown(className)}
            >
              <h3 className="font-bold">{className}</h3>
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
                    className="bg-white mt-2 p-2 mb-2 mr-2 rounded-lg shadow-md border border-gray-200 flex-shrink-0"
                  >
                    <p className="text-sm">
                      <strong>lat:</strong> {prediction.lat}
                    </p>
                    <p className="text-sm">
                      <strong>long:</strong> {prediction.long}
                    </p>
                    <p className="text-sm">
                      <strong>Conf:</strong>{" "}
                      {Math.round(prediction.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIPanel;
