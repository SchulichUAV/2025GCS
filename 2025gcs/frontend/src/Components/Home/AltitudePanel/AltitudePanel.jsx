import React, { useState } from 'react';
import { setAltitudeAPI } from "../../../Api/apiFactory";


const AltitudePanel = () => {
  const [takeoffAltitude, setTakeoffAltitude] = useState("");
  const [gotoAltitude, setGotoAltitude] = useState("");
  const [takeoffBorderColor, setTakeoffBorderColor] = useState("border-gray-300");
  const [gotoBorderColor, setGotoBorderColor] = useState("border-gray-300");

  const handleAltitudeRequest = async (type, altitude, setAltitude, setBorderColor) => {
    const handleError = () => {
      setBorderColor("border-red-500");
      setTimeout(() => setBorderColor("border-gray-300"), 3800);
    };

    const handleSuccess = () => {
      setBorderColor("border-green-500");
      setTimeout(() => setBorderColor("border-gray-300"), 3800);
      setAltitude("");
    };

    if (!altitude || altitude < 0) {
      handleError();
    } 
    else {
      try {
        const response = await setAltitudeAPI(type, altitude);
        if (response.status === 200) {
          handleSuccess();
        } else {
          handleError();
        }
      } catch (error) {
        handleError();
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-8 w-full h-full bg-white rounded-2xl shadow-2xl p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-700 text-center">Altitude Control</h2>
      <div className="w-full space-y-4">
        <div className="flex items-center space-x-4 w-full">
          <div className="relative flex-grow">
            <input
              name="takeoffAltitude"
              type="number"
              placeholder="Takeoff Altitude"
              value={takeoffAltitude}
              min={0}
              onChange={(e) => setTakeoffAltitude(e.target.value)}
              className={`w-full border-2 ${takeoffBorderColor} rounded-lg p-3 pr-6 shadow-sm focus:outline-none`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">ft</span>
          </div>
          <button
            onClick={() => handleAltitudeRequest("takeoff", takeoffAltitude, setTakeoffAltitude, setTakeoffBorderColor)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
          >
            Set
          </button>
        </div>

        <div className="flex items-center space-x-4 w-full">
          <div className="relative flex-grow">
            <input
              name="gotoAltitude"
              type="number"
              placeholder="Go-to Altitude"
              value={gotoAltitude}
              min={0}
              onChange={(e) => setGotoAltitude(e.target.value)}
              className={`w-full border-2 ${gotoBorderColor} rounded-lg p-3 pr-6 shadow-sm focus:outline-none`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">ft</span>
          </div>
          <button
            onClick={() => handleAltitudeRequest("goto", gotoAltitude, setGotoAltitude, setGotoBorderColor)}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default AltitudePanel;