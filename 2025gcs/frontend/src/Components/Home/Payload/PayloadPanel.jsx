import React, { useEffect, useState } from 'react';
import { releasePayloadAPI } from "../../../Api/apiFactory";

const PayloadPanel = () => {
  const [droneType, setDroneType] = useState(() => {
    const storedDroneType = localStorage.getItem("droneType");
    return storedDroneType !== "null" && storedDroneType ? storedDroneType : null;
  });
  
  const [borderColors, setBorderColors] = useState({
    stepper1Up: "border-gray-300",
    stepper1Down: "border-gray-300",
    stepper2Up: "border-gray-300",
    stepper2Down: "border-gray-300",
  });
  const [inputValues, setInputValues] = useState({
    stepper1UpDistance: "",
    stepper1UpSpeed: "",
    stepper1DownDistance: "",
    stepper1DownSpeed: "",
    stepper2UpDistance: "",
    stepper2UpSpeed: "",
    stepper2DownDistance: "",
    stepper2DownSpeed: "",
  });
  const [disabledRelease, setDisabledRelease] = useState(Array(4).fill(false)); // Track disabled state for Release buttons
  const [disabledClose, setDisabledClose] = useState(Array(4).fill(false));     // Track disabled state for Close buttons

  useEffect(() => {
    if (droneType === '') {
      localStorage.removeItem('droneType'); // Ensure null values don’t get stored as "null" (string)
    } else {
      localStorage.setItem('droneType', droneType);
    }
  }, [droneType]);
  

  const handleStepper = async (stepper) => {
    const handleError = () => {
      setBorderColors((prev) => ({ ...prev, [stepper]: "border-red-500" }));
      setTimeout(() => setBorderColors((prev) => ({ ...prev, [stepper]: "border-gray-300" })), 2000);
    }

    const distanceKey = `${stepper}Distance`;
    const speedKey = `${stepper}Speed`;
    if (!inputValues[distanceKey] || inputValues[distanceKey] < 0 || !inputValues[speedKey] || inputValues[speedKey] < 0) {
      handleError();
      return;
    }

    try {
      // API HERE
      setBorderColors((prev) => ({ ...prev, [stepper]: "border-green-500" }));
      setTimeout(() => setBorderColors((prev) => ({ ...prev, [stepper]: "border-gray-300" })), 2000);
      setInputValues((prev) => ({
        ...prev,
        [`${stepper}Distance`]: "",
        [`${stepper}Speed`]: "",
      }));
    } catch (error) {
      handleError();
    }
  };

  const handleDisableButton = (index, type) => {
    if (type === 'release') {
      setDisabledRelease((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });
    } else if (type === 'close') {
      setDisabledClose((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });
    }
  };

  const HandleRelease = async (index) => {
    try {
      const response = await releasePayloadAPI(index + 1);
      if (response.status === 200) {
        // handleDisableButton(index, 'release'); // Disable only the Release button
      }
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="flex flex-col justify-center items-center py-4 px-6 h-full w-full mx-auto space-y-2 bg-white rounded-xl shadow-lg relative">
      {droneType !== null && (
        <div>
        <button
          className="absolute top-4 left-4 text-gray-700 hover:text-gray-900 font-bold flex items-center"
          onClick={() => setDroneType(null)}
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className='font-bold text-gray-800'>{droneType}</h2>
        </div>
      )}
      <div className="pb-2 pt-2">
        <div className="flex items-center flex-col">
          {droneType === null && (
            <div>
              <h2 className="text-xl font-bold mb-2">Select Drone Type:</h2>
              <div className="flex w-full">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
                  onClick={() => setDroneType('Quadcopter')}>Quadcopter</button>
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => setDroneType('Fixed Wing')}>Fixed Wing</button>
              </div>
            </div>
          )}
          <div className="w-full flex">
          {droneType === 'Quadcopter' && (
              <div>
                <div className="grid grid-cols-4 gap-4 w-full">
                  <div className="col-span-2 text-center">
                    <h3 className="text-lg font-bold">Stepper 1</h3>
                  </div>
                  <div className="col-span-2 text-center">
                    <h3 className="text-lg font-bold">Stepper 2</h3>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="stepper1UpDistance"
                      placeholder="Distance ↑"
                      value={inputValues.stepper1UpDistance}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 ${borderColors.stepper1Up} rounded-md p-2`}
                    />
                    <input
                      type="number"
                      id="stepper1UpSpeed"
                      placeholder="Speed ↑"
                      value={inputValues.stepper1UpSpeed}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 mt-1 ${borderColors.stepper1Up} rounded-md p-2`}
                    />
                    <button
                      className="mt-1 w-full text-sm bg-blue-400 hover:bg-blue-500 transition-all duration-200 text-white px-4 py-2 rounded-md"
                      onClick={() => handleStepper('stepper1Up')}
                    >
                      Submit
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="stepper1DownDistance"
                      placeholder="Distance ↓"
                      value={inputValues.stepper1DownDistance}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 ${borderColors.stepper1Down} rounded-md p-2`}
                    />
                    <input
                      type="number"
                      id="stepper1DownSpeed"
                      placeholder="Speed ↓"
                      value={inputValues.stepper1DownSpeed}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 mt-1 ${borderColors.stepper1Down} rounded-md p-2`}
                    />
                    <button
                      className="mt-1 w-full text-sm bg-blue-400 hover:bg-blue-500 transition-all duration-200 text-white px-4 py-2 rounded-md"
                      onClick={() => handleStepper('stepper1Down')}
                    >
                      Submit
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="stepper2UpDistance"
                      placeholder="Distance ↑"
                      value={inputValues.stepper2UpDistance}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 ${borderColors.stepper2Up} rounded-md p-2`}
                    />
                    <input
                      type="number"
                      id="stepper2UpSpeed"
                      placeholder="Speed ↑"
                      value={inputValues.stepper2UpSpeed}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 mt-1 ${borderColors.stepper2Up} rounded-md p-2`}
                    />
                    <button
                      className="mt-1 w-full text-sm bg-orange-400 hover:bg-orange-500 transition-all duration-200 text-white px-4 py-2 rounded-md"
                      onClick={() => handleStepper('stepper2Up')}
                    >
                      Submit
                    </button>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="stepper2DownDistance"
                      placeholder="Distance ↓"
                      value={inputValues.stepper2DownDistance}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 ${borderColors.stepper2Down} rounded-md p-2`}
                    />
                    <input
                      type="number"
                      id="stepper2DownSpeed"
                      placeholder="Speed ↓"
                      value={inputValues.stepper2DownSpeed}
                      min={0}
                      onChange={handleInputChange}
                      className={`w-full text-sm border-2 mt-1 ${borderColors.stepper2Down} rounded-md p-2`}
                    />
                    <button
                      className="mt-1 w-full text-sm bg-orange-400 hover:bg-orange-500 transition-all duration-200 text-white px-4 py-2 rounded-md"
                      onClick={() => handleStepper('stepper2Down')}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
            {droneType === 'Fixed Wing' && (
              <div className="grid grid-cols-2 gap-3 w-full">
                {['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'].map((bay, index) => (
                  <div key={index} className="p-2 border border-gray-300 rounded-md flex flex-col items-center w-full">
                    <h3 className="text-lg font-bold mb-2">{bay}</h3>
                    <div className="flex space-x-3">
                      <button
                        disabled={disabledRelease[index]}
                        className={`bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded-md ${disabledRelease[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => HandleRelease(index)}
                      >
                        Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayloadPanel;