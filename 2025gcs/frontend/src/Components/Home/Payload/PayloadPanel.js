import React, { useState } from 'react';
import { ENDPOINT_IP } from '../../../config';
import axios from 'axios';

const PayloadPanel = () => {
  const [droneType, setDroneType] = useState(null);
  const [disabledRelease, setDisabledRelease] = useState(Array(4).fill(false)); // Track disabled state for Release buttons
  const [disabledClose, setDisabledClose] = useState(Array(4).fill(false));     // Track disabled state for Close buttons

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

  const HandleClose = async (index) => {
    try {
      const response = await axios.post(`http://${ENDPOINT_IP}/payload-bay-close`, {
        bay: index + 1
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(response);
      if (response.status === 200) {
        handleDisableButton(index, 'close'); // Disable only the Close button
      }
    } catch (error) {
      console.error("Error closing payload bay:", error);
    }
  };

  const HandleRelease = async (index) => {
    try {
      const response = await axios.post(`http://${ENDPOINT_IP}/payload-release`, {
        bay: index + 1
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(response);
      if (response.status === 200) {
        handleDisableButton(index, 'release'); // Disable only the Release button
      }
    } catch (error) {
      console.error("Error releasing payload bay:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-4 px-10 h-full w-full mx-auto space-y-2 bg-white rounded-xl shadow-lg relative">
      {droneType !== null && (
        <button
          className="absolute top-4 left-4 text-gray-700 hover:text-gray-900 font-bold flex items-center"
          onClick={() => setDroneType(null)}
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <div className="p-2">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-bold justify-center">Stepper 1</h3>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold justify-center">Stepper 2</h3>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <input type="number" id="stepper1-up-distance" placeholder="Distance ↑" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper1-up-speed" placeholder="Speed ↑" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 text-sm bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper1-down-distance" placeholder="Distance ↓" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper1-down-speed" placeholder="Speed ↓" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 text-sm bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper2-up-distance" placeholder="Distance ↑" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper2-up-speed" placeholder="Speed ↑" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 text-sm bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper2-down-distance" placeholder="Distance ↓" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper2-down-speed" placeholder="Speed ↓" className="w-full text-sm border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 text-sm bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                </div>
              </div>
            )}
            {droneType === 'Fixed Wing' && (
              <div className="flex flex-row gap-3 w-full">
                {['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'].map((bay, index) => (
                  <div key={index} className="p-2 border border-gray-300 rounded-md flex flex-col items-center w-full">
                    <h3 className="text-lg font-bold mb-2">{bay}</h3>
                    <div className="flex space-x-2">
                      <button
                        disabled={disabledRelease[index]}
                        className={`bg-blue-400 text-sm hover:bg-blue-500 text-white px-2 py-1 rounded-md ${disabledRelease[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => HandleRelease(index)}
                      >
                        Release
                      </button>
                      <button
                        disabled={disabledClose[index]}
                        className={`bg-red-400 text-sm hover:bg-red-500 text-white px-2 py-1 rounded-md ${disabledClose[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => HandleClose(index)}
                      >
                        Close
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
