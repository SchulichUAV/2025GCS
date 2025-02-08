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
      response = await fetch(`http://${ENDPOINT_IP}:8888/AI-Shutdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    else{
      response = await fetch(`http://${ENDPOINT_IP}:8888/AI`, {
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
      className="ai-panel py-6 px-20 max-w-3xl w-full mx-auto space-y-4 bg-white rounded-xl shadow-lg relative overflow-hidden"
      style={{ transition: "all 0.3s ease-in-out" }} // Smooth transition for the panel
    >
      <button onClick={() => AI()}>{isAIActive? "STOP" : "START"}</button>
      {groupedPredictions &&
        Object.entries(groupedPredictions).map(([className, predictions]) => (
          <div
            key={className}
            className="prediction-panel bg-gray-100 p-4 rounded-lg shadow-md mb-4"
          >
            {/* Class Header */}
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleClassDropdown(className)}
            >
              <h3 className="text-lg font-semibold">{className}</h3>
              <button className="text-gray-500">
                {openClasses[className] ? "▲" : "▼"}
              </button>
            </div>

            {/* Expandable Section */}
            <div
              className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${
                openClasses[className] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex overflow-auto flex-wrap max-h-44">
                {predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className="bg-white p-2 mb-2 mr-2 rounded-lg shadow-md border border-gray-200 flex-shrink-0"
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
  );
};

export default AIPanel;
