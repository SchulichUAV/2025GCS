// src/App.js
import React, { useState, useEffect } from 'react';
import NavBar from './Components/NavBar/NavBar';
import PhotoPanel from './Components/PhotoSelection/PhotoPanel';
import PayloadPanel from './Components/Payload/PayloadPanel';
import AIPanel from './Components/AI/AIPanel';
import FlightModePanel from './Components/FlightMode/FlightModePanel';
import AltitudePanel from './Components/AltitudePanel/AltitudePanel';
import data from "./data/TargetInformation.json";

function App() {

   // State for background color
   const [bgColor, setBgColor] = useState("#FF7F7F");

   useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/getHeartbeat");
        const data = await response.json();
        setBgColor(data.success ? "#90EE90" : "#FF7F7F");
      } catch (error) {
        setBgColor("#FF7F7F");
      }
    };

    // Check heartbeat every 5 seconds
    const interval = setInterval(checkHeartbeat, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen" style={{ backgroundColor: bgColor }}>
      <NavBar />
      <div className="flex flex-grow p-4 mt-20 gap-4">
        
        {/* Left Column */}
        <div className="flex flex-col w-[45%] gap-1">
          <div className="flex justify-center items-center p-4 flex-grow">
            <PhotoPanel />
          </div>
          <div className="flex justify-center items-center p-4 flex-grow">
            <FlightModePanel />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col w-[55%] h-[40%] gap-6">
          {/* Top Right Panels */}
          <div className="flex flex-col gap-4 flex-grow">
            <div className="flex justify-center items-center p-4 flex-grow">
              <PayloadPanel />
            </div>
            <div className="flex justify-center items-center p-4 flex-grow">
              <AIPanel data={data} />
            </div>
          </div>

          {/* Bottom Right Panel */}
          <div className="flex justify-center items-center p-4 flex-grow">
            <AltitudePanel />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
