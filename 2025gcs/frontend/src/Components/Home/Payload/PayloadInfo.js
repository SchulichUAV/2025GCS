import React, { useEffect, useState } from "react";
import { ENDPOINT_IP } from "../../../config";
import axios from "axios";
import { InfinityIcon } from "lucide-react";
import { calculateDistance, R } from "../../../utils/common";

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

  const handleAutomatedDrop = async () => {
    const confirmed = window.confirm("Are you sure you want to monitor and initiate a payload drop?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://${ENDPOINT_IP}/monitor_and_drop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error initiating automated drop:", error);
      alert("Failed to communicate with the backend.");
    }
};


  const clearSavedCoords = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all saved coordinate selections?");
    if (!confirmed) return;

    try {
      const response = await axios.post(`http://${ENDPOINT_IP}/clear_saved_coords`);
      if (response.data.success) {
        setCurrentTargetInfo({ name: "", latitude: 0, longitude: 0 });
        setPayloadStatus("Not Set");
      }
    } catch (error) {
      handleError("Error clearing saved coordinates");
    }
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
        const response = await axios.get(`http://${ENDPOINT_IP}/current-target`);
        const data = response.data;
        if (data.success) {
          setCurrentTargetInfo({ name: currentTarget, latitude: data.coords[0], longitude: data.coords[1] });
          setPayloadStatus(currentTarget ? "Pending" : "Not Set");
        }
      } catch (error) {
        handleError("Error fetching target");
      }
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

      const releasePoint = getReleasePoint(currentTargetInfo.latitude, currentTargetInfo.longitude, vehicleInfo.heading, estimatedReleaseDist);
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

      {/* Clear Coordinates Button */}
      <button
        onClick={clearSavedCoords}
        className="mt-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Clear saved coordinates
      </button>
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        onClick={handleAutomatedDrop}
      >
        Monitor and Drop
      </button>

    </div>
  );
};

export default PayloadInfo;