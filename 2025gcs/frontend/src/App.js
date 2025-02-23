// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './Components/NavBar/NavBar';
import Home from './Components/Home';
import DataPage from './Components/DataPage';
import { ENDPOINT_IP } from "./config";

function App() {
  // State for background color
  const [bgColor, setBgColor] = useState("#FF7F7F");

  useEffect(() => {
    const checkHeartbeat = async () => {
      console.log("Checking heartbeat");
      try {
        const response = await fetch(`http://${ENDPOINT_IP}/get_heartbeat`);
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
    <Router>
      <div className="flex flex-col min-h-screen w-screen" style={{ backgroundColor: bgColor }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;