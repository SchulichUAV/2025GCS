import PhotoPanel from './PhotoSelection/PhotoPanel';
import PayloadPanel from './Payload/PayloadPanel';
import AIPanel from './AI/AIPanel';
import FlightModePanel from './FlightMode/FlightModePanel';
import AltitudePanel from './AltitudePanel/AltitudePanel';
import data from "../data/TargetInformation.json";

function Home() {
    return (
      <div className="flex flex-col min-h-screen w-screen">
        <div className="flex flex-grow p-4 mt-20 gap-4 h-full">
          
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

  export default Home;