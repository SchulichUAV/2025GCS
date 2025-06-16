import PhotoPanel from './PhotoSelection/PhotoPanel';
import PayloadPanel from './Payload/PayloadPanel';
import PayloadInfo from './Payload/PayloadInfo';
import AIPanel from './AI/AIPanel';
import FlightModePanel from './FlightMode/FlightModePanel';
import AltitudePanel from './AltitudePanel/AltitudePanel';
import FlightData from "./FlightData/FlightData";
import React, { useState } from "react";

function Home({ vehicleData }) {
  const [currentTarget, setCurrentTarget] = useState(null);
  
  return (
    <div className="flex flex-col min-h-screen w-screen p-3">
      <div className="flex flex-col lg:flex-row flex-grow gap-2 mt-20">
        {/* Left Column */}
        <div className="flex flex-col lg:w-1/2 gap-2">
          <div className="flex justify-center items-center flex-grow rounded-xl shadow-lg h-1/2">
            <PhotoPanel />
          </div>
          <div className="flex-grow rounded-xl shadow-lg">
            <FlightData vehicleData={vehicleData} />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col lg:w-1/2 gap-4">
          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex flex-row gap-2 flex-[1]">
              <div className="flex justify-center items-center flex-[1.9] rounded-xl shadow-lg">
                <PayloadPanel />
              </div>
              <div className="flex justify-center items-center flex-1 rounded-xl shadow-lg">
                <PayloadInfo 
                  currentTarget={currentTarget}
                  vehicleInfo={{ latitude: 50.976200, longitude: -114.072100, speed: 11, heading: 135 }}
                  targetCompleted={vehicleData?.is_dropped || false}
                />
              </div>
            </div>
            <div className="flex flex-row gap-2 flex-[1]">
              <div className="flex justify-center items-center flex-[1.5] rounded-xl shadow-lg">
                <AIPanel 
                  currentTarget={currentTarget} 
                  setCurrentTarget={setCurrentTarget}
                />
              </div>
              <div className="flex justify-center items-center flex-1 rounded-xl shadow-lg">
                <AltitudePanel />
              </div>
            </div>
            <div className="flex justify-center items-center flex-[1] rounded-xl shadow-lg">
              <FlightModePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
