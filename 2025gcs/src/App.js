// src/App.js
import React from 'react';
import NavBar from './Components/NavBar/NavBar';
import PhotoPanel from './Components/PhotoSelection/PhotoPanel';
import PayloadPanel from './Components/Payload/PayloadPanel';
import AIPanel from './Components/AI/AIPanel';
import FlightModePanel from './Components/FlightMode/FlightModePanel';
import AltitudePanel from './Components/AltitudePanel/AltitudePanel';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <NavBar />
      <div className="grid grid-cols-2 gap-4 p-4 h-full w-full mt-32">
        <div className="border border-gray-300 p-4 flex justify-center items-center" style={{ gridColumn: "1 / 2", gridRow: "1 / span 2", height: '80%' }}>
          <PhotoPanel />
        </div>
        <div className="border-gray-300 p-4 flex justify-center items-center" style={{ gridColumn: "2 / 3", height: '40%' }}>
          <PayloadPanel />
        </div>
        <div className="border border-gray-300 p-4 flex justify-center items-center" style={{ gridColumn: "2 / 3", height: '40%' }}>
          <AIPanel />
        </div>
        <div className="border border-gray-300 p-4 flex justify-center items-center" style={{ gridColumn: "1 / 2", gridRow: "3 / 4", height: '20%' }}>
          <FlightModePanel />
        </div>
        <div className="p-4 flex justify-center items-center" style={{ gridColumn: "2 / 3", gridRow: "3 / 4", height: '20%' }}>
          <AltitudePanel />
        </div>
      </div>
    </div>
  );
}

export default App;
