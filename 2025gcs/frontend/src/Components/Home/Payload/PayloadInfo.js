import React, { useEffect, useState } from "react";
import { ENDPOINT_IP } from "../../../config";
import axios from "axios";

const PayloadInfo = ({ currentTarget, targetCompleted }) => {
  const [payloadStatus, setPayloadStatus] = useState("Not Set"); // "Not Set", "Pending", "Released"
  const [currentTargetInfo, setCurrentTargetInfo] = useState({ name: "", latitude: 0, longitude: 0 });
  const [error, setError] = useState(null);

  const statusColors = {
    "Not Set": "bg-gray-400",
    Pending: "bg-blue-400",
    Released: "bg-green-500"
  };

  const handleError = (error) => {
    setError(error);
    setTimeout(() => setError(null), 3800);
    setPayloadStatus("Not Set");
    setCurrentTargetInfo({ name: "", latitude: 0, longitude: 0 });
  };

  useEffect(() => {
    const fetchTargetInfo = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/current-target`);
        const data = response.data;
        if (data.success) {
          setCurrentTargetInfo({
            name: currentTarget,
            latitude: data.coords[0],
            longitude: data.coords[1]
          });
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

  return (
    <div className="flex flex-col gap-4 p-6 w-full h-full bg-white rounded-2xl shadow-md text-sm">
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

      <div className="border-t border-gray-200" />

      {/* Target Info */}
      <div className="text-center">
        <h2 className="font-semibold text-lg text-gray-800 mb-1">Current Target</h2>
        <div className="space-y-1 text-gray-600">
          <div>{<span className="font-bold">{currentTargetInfo.name}</span> || <span className="text-gray-400 italic">No target set</span>}</div>
          <div><span className="font-semibold">Lat</span>: {currentTargetInfo.latitude.toFixed(6)}</div>
          <div><span className="font-semibold">Lon</span>: {currentTargetInfo.longitude.toFixed(6)}</div>
        </div>
      </div>
    </div>
  );
};

export default PayloadInfo;