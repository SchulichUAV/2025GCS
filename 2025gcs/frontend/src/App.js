// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './Components/NavBar/NavBar';
import Home from './Components/Home/Home';
import DataPage from './Components/Data/DataPage';
import { ENDPOINT_IP } from "./config";
import axios from 'axios';

function App() {
  // State for background color
  const [bgColor, setBgColor] = useState("#FF7F7F");
  const [vehicleData, setVehicleData] = useState(null); // store the heartbeat vehicle data

  useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/get_heartbeat`);
        const data =response.data;

        setVehicleData(data.vehicle_data);

        if (data.success === true)
        {
          setBgColor("#90EE90");
        }
        else
        {
          setBgColor("#FF7F7F");
        }
      } catch {
          // Do nothing, prevent console spam
      }
    };
    // Check heartbeat every 5 seconds
    const intervalId = setInterval(checkHeartbeat, 5000);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen w-screen" style={{ backgroundColor: bgColor }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home vehicleData={vehicleData}/>} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;