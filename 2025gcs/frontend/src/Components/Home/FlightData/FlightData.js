import React from "react";

function FlightData({ vehicleData, averageVoltage }) {
  // Flight mode mapping
  const FLIGHT_MODES = {
    0: "Manual",
    1: "Circle",
    2: "Stabilize",
    5: "Fly By Wire A",
    6: "Fly By Wire B",
    7: "Cruise",
    10: "Auto",
    11: "RTL (Return to Launch)",
    12: "Loiter",
    15: "Guided",
  };

  // Helper function to round to max 5 decimal places
  const roundToFiveDecimals = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toFixed(5).replace(/\.?0+$/, "");
  };

  // Default values
  const flightModeId = vehicleData?.flight_mode;
  const flightMode =
    flightModeId !== undefined
      ? FLIGHT_MODES[flightModeId] || "Unknown"
      : "N/A";
  const batteryVoltage =
    averageVoltage !== "N/A" ? `${averageVoltage} V` : "N/A";
  const airspeedMs = vehicleData?.airspeedMs || "0";
  const airspeedKmh = (airspeedMs * 3.6).toFixed(1);
  const altitudeAglM = vehicleData?.altitudeAglM || "0";
  const altitudeAglFt = (altitudeAglM * 3.28084).toFixed(1);
  const altitudeMslM = vehicleData?.altitudeMslM || "0";
  const roll = roundToFiveDecimals(vehicleData?.roll || "0");
  const pitch = roundToFiveDecimals(vehicleData?.pitch || "0");
  const yaw = roundToFiveDecimals(vehicleData?.yaw || "0");

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-4 w-full">
      <h2 className="text-lg font-bold mb-4">VEHICLE STATUS</h2>

      {/* Main Flight Parameters - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Flight Mode */}
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            FLIGHT MODE
          </p>
          <p className="text-lg font-medium">{flightMode}</p>
        </div>

        {/* Battery */}
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">BATTERY</p>
          <p className="text-lg font-medium">{batteryVoltage}</p>
        </div>

        {/* Airspeed */}
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">AIRSPEED</p>
          <p className="text-lg font-medium">{airspeedMs} m/s</p>
          <p className="text-xs text-gray-500">{airspeedKmh} km/h</p>
        </div>

        {/* Altitude */}
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            ALTITUDE AGL
          </p>
          <p className="text-lg font-medium">{altitudeAglM} m</p>
          <p className="text-xs text-gray-500">{altitudeAglFt} ft</p>
        </div>
      </div>

      {/* Altitude MSL */}
      <div className="bg-gray-50 rounded p-3 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-1">ALTITUDE MSL</p>
        <p className="text-lg font-medium">{altitudeMslM} m</p>
      </div>

      {/* Orientation - All in one row */}
      <div className="bg-gray-50 rounded p-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">ORIENTATION</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">ROLL</p>
            <p className="text-base font-medium">{roll}°</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">PITCH</p>
            <p className="text-base font-medium">{pitch}°</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">YAW</p>
            <p className="text-base font-medium">{yaw}°</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightData;
