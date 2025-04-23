import React, { useEffect, useState } from "react";
import { InfinityIcon } from "lucide-react";
import { calculateDistance, R } from "../../../utils/common";
import { fetchCurrentTargetAPI } from "../../../Api/apiConfig";
const PayloadInfo = ({ currentTarget, vehicleInfo, targetCompleted }) => {
  const [payloadStatus, setPayloadStatus] = useState("Not Set"); // "Not Set", "Pending", "Released"
  const [currentTargetInfo, setCurrentTargetInfo] = useState({ name: "", latitude: 0, longitude: 0 });
  const [payloadETA, setPayloadETA] = useState({ distance : "∞", ETA : "∞" });
  const [error, setError] = useState(null);

  const statusColors = {
    "Not Set": "bg-gray-400",
    "Pending": "bg-blue-400",
    "Released": "bg-green-500"
  };

  const handleError = (error) => {
    setError(error);
    setTimeout(() => setError(null), 3800);
    setPayloadStatus("Not Set");
    setCurrentTargetInfo({ name: "", latitude: 0, longitude: 0 });
  };

  function formatTime(seconds) {
    if (seconds < 60) return `${seconds} s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} s`;
  }

  function formatDistance(distance) {
    return distance.toLocaleString("en-US").replace(/,/g, " ");
  }  

  useEffect(() => {
    const fetchTargetInfo = async () => {
      try {
        const data = await fetchCurrentTargetAPI();
        if (data.success) {
          setCurrentTargetInfo({ name: currentTarget, latitude: data.coords[0], longitude: data.coords[1] });
          setPayloadStatus(currentTarget ? "Pending" : "Not Set");
        }
      } catch (error) { handleError("Error fetching target"); }
    };

    fetchTargetInfo();
  }, [currentTarget]);

  useEffect(() => {
    if (targetCompleted && currentTarget) {
      setPayloadStatus("Released");

      const timer = setTimeout(() => {
        setPayloadStatus(currentTarget ? "Pending" : "Not Set");
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [targetCompleted]);


// Get a new lat/lon point offset by `distance` (in meters) along `heading` (in degrees)
function getReleasePoint(lat, lon, headingDeg, distanceBackwards) {
  const headingRad = (headingDeg + 180) * Math.PI / 180; // Reverse the heading
  const dByR = distanceBackwards / R;

  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dByR) + Math.cos(lat1) * Math.sin(dByR) * Math.cos(headingRad));
  const lon2 = lon1 + Math.atan2(Math.sin(headingRad) * Math.sin(dByR) * Math.cos(lat1), Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2));

  return {
    latitude: lat2 * 180 / Math.PI,
    longitude: lon2 * 180 / Math.PI
  };
}

useEffect(() => {
  const estimatedReleaseDist = 8; // Estimated release distance for the payload from the target in meters

  const calculateETA = () => {
    if (!currentTargetInfo || !vehicleInfo.latitude || !vehicleInfo.longitude || !vehicleInfo.speed 
        || vehicleInfo.speed <= 0 || vehicleInfo.heading === undefined) return;
  
    // Get release point based on estimatedReleaseDist (m) backwards from the target along heading
    const releasePoint = getReleasePoint(currentTargetInfo.latitude, currentTargetInfo.longitude, vehicleInfo.heading, estimatedReleaseDist);
  
    // Distance from UAV to release point
    const distanceToRelease = calculateDistance(vehicleInfo.latitude, vehicleInfo.longitude, releasePoint.latitude, releasePoint.longitude);
    const ETA = distanceToRelease / vehicleInfo.speed;
  
    setPayloadETA({
      distance: formatDistance(Math.round(distanceToRelease)),
      ETA: ETA === Infinity ? "∞" : formatTime(Math.round(ETA))
    });
  };
  
  calculateETA();
}, [vehicleInfo, currentTargetInfo]);

  return (
    <div className="flex flex-col gap-3 p-5 w-full h-full bg-white rounded-2xl shadow-md text-sm">
      <h1 className="font-semibold text-xl text-center text-gray-800">Payload Status</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-center text-sm">
          {error}
        </div>
      )}
      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-3">
        <div className={`w-4 h-4 rounded-full ${statusColors[payloadStatus]}`} />
        <span className="font-medium text-gray-700">{payloadStatus}</span>
      </div>

      {/* Data Display */}
      <div className="flex flex-col gap-1 border-t border-b pb-1 pt-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Distance:</span>
          <span>
            {payloadETA.distance && currentTarget ? `${payloadETA.distance} m` : <InfinityIcon className="w-4 h-4 text-gray-500 inline" />}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Release:</span>
          <span>
            {payloadETA.ETA && currentTarget ? `${payloadETA.ETA}` : <InfinityIcon className="w-4 h-4 text-gray-500 inline" />}
          </span>
        </div>
      </div>

      {/* Target Info */}
      <div className="text-center">
        <h2 className="font-semibold text-lg text-gray-800 mb-1">{currentTargetInfo.name || "Not Set"}</h2>
        <div className="space-y-1 text-gray-600">
          <div><span className="font-semibold">Lat</span>: {currentTargetInfo.latitude.toFixed(6)}</div>
          <div><span className="font-semibold">Lon</span>: {currentTargetInfo.longitude.toFixed(6)}</div>
        </div>
      </div>
    </div>
  );
};

export default PayloadInfo;