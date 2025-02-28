import PhotoPanel from './PhotoSelection/PhotoPanel';
import PayloadPanel from './Payload/PayloadPanel';
import PayloadInfo from './Payload/PayloadInfo';
import AIPanel from './AI/AIPanel';
import FlightModePanel from './FlightMode/FlightModePanel';
import AltitudePanel from './AltitudePanel/AltitudePanel';
import Mapping from './ODM/Mapping';
import data from "../../data/TargetInformation.json";

function Home() {
  return (
    <div className="flex flex-col min-h-screen w-screen p-4">
      <div className="flex flex-col lg:flex-row flex-grow gap-2 mt-20">

        {/* Left Column */}
        <div className="flex flex-col lg:w-1/2 gap-4">
          <div className="flex justify-center items-center flex-grow rounded-xl shadow-lg h-1/2">
            <PhotoPanel />
          </div>
          <div className="flex-grow flex justify-center items-center h-[400px] w-full overflow-hidden">
            <Mapping />
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
                <PayloadInfo />
              </div>
            </div>
            <div className="flex flex-row gap-2 flex-[1]">
              <div className="flex justify-center items-center flex-[1.5] rounded-xl shadow-lg">
                <AIPanel data={data} />
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
