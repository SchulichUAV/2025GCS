// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar";
import Home from "./Components/Home/Home";
import DataPage from "./Components/Data/DataPage";
import { ENDPOINT_IP } from "./config";

function App() {
  // State for background color
  const [bgColor, setBgColor] = useState("#FF7F7F");
  const [vehicleData, setVehicleData] = useState(null); // store the heartbeat vehicle data

  useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const response = await fetch(`http://${ENDPOINT_IP}/get_heartbeat`);
        const data = await response.json();
        if (data.success === true) {
          setBgColor(data.success ? "#90EE90" : "#FF7F7F");
          setVehicleData(data.vehicle_data);
          console.log(data.vehicle_data);
        } else {
          setBgColor("#FF7F7F");
          setVehicleData(data.vehicle_data);
        }
      } catch {
        // Do nothing, prevent console spam
      }
    };
    // Check heartbeat every 5 seconds
    const intervalId = setInterval(checkHeartbeat, 1000);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <Router>
      <div
        className="flex flex-col min-h-screen w-screen"
        style={{ backgroundColor: bgColor }}
      >
        <NavBar />
        <Routes>
          <Route path="/" element={<Home vehicleData={vehicleData} />} />
          <Route
            path="/data"
            element={<DataPage vehicleData={vehicleData} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
