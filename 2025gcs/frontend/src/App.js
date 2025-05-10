import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./Components/NavBar/NavBar";
import Home from "./Components/Home/Home";
import DataPage from "./Components/Data/DataPage";
import { ENDPOINT_IP } from "./config";
import axios from "axios";

function App() {
  const [bgColor, setBgColor] = useState("#FF7F7F");
  const [vehicleData, setVehicleData] = useState(null);
  const [voltageReadings, setVoltageReadings] = useState([]);
  const [averageVoltage, setAverageVoltage] = useState("N/A");

  useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/get_heartbeat`);
        const data = response.data;

        if (data.success === true) {
          setBgColor("#90EE90");
          setVehicleData(data.vehicle_data);

          if (data.vehicle_data?.batteryVoltage) {
            console.log(
              "New voltage reading received:",
              data.vehicle_data.batteryVoltage
            );

            setVoltageReadings((prev) => {
              const newReadings = [
                ...prev,
                Number(data.vehicle_data.batteryVoltage),
              ];
              const trimmedReadings = newReadings.slice(-5);

              console.log("Current readings queue:", trimmedReadings);

              if (trimmedReadings.length === 5) {
                const sum = trimmedReadings.reduce((a, b) => a + b, 0);
                const avg = (sum / 5).toFixed(2);
                setAverageVoltage(avg);
                console.log("Calculated average voltage:", avg);
              }

              return trimmedReadings;
            });
          } else {
            console.log("Heartbeat received but no voltage data available");
          }
        } else {
          setBgColor("#FF7F7F");
          console.log("Heartbeat failed");
        }
      } catch (error) {
        console.log("Error fetching heartbeat:", error.message);
      }
    };

    const intervalId = setInterval(checkHeartbeat, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <div
        className="flex flex-col min-h-screen w-screen"
        style={{ backgroundColor: bgColor }}
      >
        <NavBar />
        <Routes>
          <Route
            path="/"
            element={
              <Home vehicleData={vehicleData } averageVoltage={averageVoltage} />
            }
          />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
