import React, { useEffect, useState } from "react";
import { ENDPOINT_IP } from "../../../config";
import axios from "axios";

const PayloadInfo = ({ currentTarget }) => {
  const [payloadStatus, setPayloadStatus] = useState("Not Set"); // Options: Not Set, Pending, Released
  const [currentTargetInfo, setCurrentTargetInfo] = useState({
    name: "",
    latitude: "",
    longitude: ""
  });

  const statusColors = {
    'Not Set': "bg-gray-300",
    'Pending': "bg-blue-500",
    'Released': "bg-green-500"
  };

  useEffect(() => {
    const fetchTargetInfo = async () => {
      try {
        const response = await axios.get(`http://${ENDPOINT_IP}/current-target`);
        const data = response.data;
        if (data.success) {
          setCurrentTargetInfo((prevTarget) => ({
            ...prevTarget,
            name: currentTarget,
            latitude: data.coords[0],
            longitude: data.coords[1]
          }));
  
          if (data.current_target) {
            setPayloadStatus("Pending");
          }
        }
      } catch (error) {
        console.error("Error fetching target info:", error);
      }
    };

    fetchTargetInfo();
  }, [currentTarget]);

  return (
    <div className="flex flex-col justify-between p-5 w-full h-full bg-white rounded-xl shadow-lg text-sm">
      <h1 className="font-bold text-xl text-center">Payload Status</h1>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 my-2">
        <div className={`w-4 h-4 rounded-full ${statusColors[payloadStatus]}`} />
        <span className="font-semibold text-md">{payloadStatus}</span>
      </div>

      {/* Target Info */}
      <div className="mt-2 border-t pt-1">
        <h2 className="font-bold text-center mb-1">Current Target</h2>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-gray-600">{currentTargetInfo.name || "No target set"}</span>
          <span className="text-gray-600">Lat: {currentTargetInfo.latitude || "N/A"}</span>
          <span className="text-gray-600">Long: {currentTargetInfo.longitude || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

export default PayloadInfo;