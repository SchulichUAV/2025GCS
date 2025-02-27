import PhotoPanel from './PhotoSelection/PhotoPanel';
import PayloadPanel from './Payload/PayloadPanel';
import AIPanel from './AI/AIPanel';
import FlightModePanel from './FlightMode/FlightModePanel';
import AltitudePanel from './AltitudePanel/AltitudePanel';
import Mapping from './ODM/Mapping';
import data from "../../data/TargetInformation.json";

function Home() {
  return (
    <div className="flex flex-col min-h-screen w-screen p-4">
      <div className="flex flex-col lg:flex-row flex-grow gap-4 mt-20">
        
        {/* Left Column */}
        <div className="flex flex-col lg:w-1/2 gap-6">
          <div className="flex justify-center items-center flex-grow rounded-xl shadow-lg h-1/2">
            <PhotoPanel />
          </div>
          <div className="flex justify-center items-center flex-grow rounded-xl shadow-lg h-[400px] sm:h-[400px] md:h-[400px] lg:h-1/2">
            <Mapping />
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col lg:w-1/2 gap-6">
          <div className="flex flex-col gap-4 flex-grow">
            {/* PayloadPanel takes more vertical space */}
            <div className="flex justify-center items-center flex-[2] rounded-xl shadow-lg">
              <PayloadPanel />
            </div>

            {/* Shorter AI and Altitude Panels */}
            <div className="flex flex-row gap-4 flex-[1]">
              <div className="flex justify-center items-center flex-[1.5] rounded-xl shadow-lg">
                <AIPanel data={data} />
              </div>
              <div className="flex justify-center items-center flex-1 rounded-xl shadow-lg">
                <AltitudePanel />
              </div>
            </div>

            {/* FlightModePanel remains the same */}
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
