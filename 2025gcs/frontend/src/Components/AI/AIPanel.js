import React, { useState } from "react";

const AIPanel = ({ data }) => {
  const [openClasses, setOpenClasses] = useState({}); // Track open state for each class

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

  return (
    <div
      className="ai-panel py-6 px-20 max-w-3xl w-full mx-auto space-y-4 bg-white rounded-xl shadow-lg relative overflow-hidden"
      style={{ transition: "all 0.3s ease-in-out" }} // Smooth transition for the panel
    >
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
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className="bg-white p-3 mb-2 rounded-lg shadow-md border border-gray-200"
                >
                  <h4 className="font-semibold text-sm">Prediction {index + 1}</h4>
                  <p className="text-sm">
                    <strong>X:</strong> {prediction.x}
                  </p>
                  <p className="text-sm">
                    <strong>Y:</strong> {prediction.y}
                  </p>
                  <p className="text-sm">
                    <strong>Confidence:</strong>{" "}
                    {Math.round(prediction.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default AIPanel;
