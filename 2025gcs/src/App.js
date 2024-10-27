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
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <NavBar />
      <div className="grid grid-cols-2 gap-4 mt-20 p-4 w-full max-w-5xl">
        <div className="border border-gray-300 p-4 text-center col-span-1 row-span-2">
          <PhotoPanel />
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <PayloadPanel />
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <AIPanel />
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <FlightModePanel />
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <AltitudePanel />
        </div>
      </div>
    </div>
  );
}

export default App;
