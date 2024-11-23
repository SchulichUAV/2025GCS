import React from 'react'
import axios from 'axios';

const AltitudePanel = () => {
  // Takeoff altitude button handler, sends request to the backend.
  const handleTakeoffAltitude = (event) => {
    event.preventDefault(); // prevents default event behavior

    const altitude = document.getElementsByName("takeoffAltitude")[0].value;
    if (altitude === "") { // only allow non-empty values
      console.log("Takeoff altitude value is empty.");
      return;
    }

    axios.post('http://localhost:5000/takeoff', { // send a POST request to the server
      altitude // ES6 shorthand for altitude: altitude
    }).then((response) => {
      if (response.status === 200) {
        console.log("Takeoff altitude set to " + altitude + " ft.");
      } else {
        console.log("Failed to set takeoff altitude.");
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  // Go-to altitude button handler, sends request to the backend.
  const handleGotoAltitude = (event) => {
    event.preventDefault(); // prevents default event behavior

    const altitude = document.getElementsByName("gotoAltitude")[0].value;
    if (altitude === "") { // only allow non-empty values
      console.log("Go-to altitude value is empty.");
      return;
    }

    axios.post('http://localhost:5000/goto', { // send a POST request to the server, placeholder endpoint
      altitude // ES6 shorthand for altitude: altitude
    }).then((response) => {
      if (response.status === 200) {
        console.log("Go-to altitude set to " + altitude + " ft.");
      } else {
        console.log("Failed to set go-to altitude.");
      }
    }).catch((error) => {
      console.log(error);
    });
  }

  return (
    <div className="altitude-panel py-6 px-20 max-w-3xl w-full mx-auto space-y-2 bg-white rounded-xl shadow-lg">
      <div className="p-2 mb-2">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input name="takeoffAltitude" type="number" placeholder="Takeoff Altitude" className="w-full border border-gray-300 rounded-md p-2 pr-8" style={{ background: "white" }} />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">ft</span>
          </div>
          <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md" onClick={handleTakeoffAltitude}>Set</button>
        </div>
      </div>
      <div className="p-2">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input name="gotoAltitude" type="number" placeholder="Go-to Altitude" className="w-full border border-gray-300 rounded-md p-2 pr-8" style={{ background: "white" }} />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">ft</span>
          </div>
          <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md" onClick={handleGotoAltitude}>Set</button>
        </div>
      </div>
    </div>
  );
}

export default AltitudePanel
