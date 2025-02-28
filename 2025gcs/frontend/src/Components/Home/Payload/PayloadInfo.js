import React from "react";

const PayloadInfo = () => {
  // Example data (Replace with real-time values)
  const payloadStatus = "Pending"; // Options: Pending, Ready, Released
  const distanceFromWaypoint = "120m"; // Example value
  const releaseTiming = "5s"; // Example: "5s", "10s", "Now"

  // Example target data
  const target = {
    name: "Motorcycle",
    latitude: "51.0486° N",
    longitude: "114.0708° W"
  };

  // Define status colors
  const statusColors = {
    Pending: "bg-red-500",
    Ready: "bg-green-500",
    Released: "bg-blue-500"
  };

  return (
    <div className="flex flex-col justify-between p-5 w-full h-full bg-white rounded-xl shadow-lg text-sm">
      <h1 className="font-bold text-xl text-center">Payload Status</h1>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 my-2">
        <div className={`w-4 h-4 rounded-full ${statusColors[payloadStatus]}`} />
        <span className="font-medium text-md">{payloadStatus}</span>
      </div>

      {/* Data Display */}
      <div className="flex flex-col gap-1 border-t pt-1">
        <div className="flex justify-between text-md">
          <span className="text-gray-600">Distance:</span>
          <span className="font-semibold">{distanceFromWaypoint}</span>
        </div>
        <div className="flex justify-between text-md">
          <span className="text-gray-600">Release:</span>
          <span className="font-semibold">ETA: {releaseTiming}</span>
        </div>
      </div>

      {/* Target Info */}
      <div className="mt-2 border-t pt-1">
        <h2 className="font-bold text-center mb-1">Current Target</h2>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-gray-600">{target.name}</span>
          <span className="text-gray-600">Lat: {target.latitude}</span>
          <span className="text-gray-600">Long: {target.longitude}</span>
        </div>
      </div>
    </div>
  );
};

export default PayloadInfo;
