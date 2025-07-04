import React, { useState } from "react";
import { DRONE_IP, ENDPOINT_IP } from "../../../config";
import ReactSlider from "react-slider";

const FlightControl = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [lockIcon, setLockIcon] = useState(
    "https://as1.ftcdn.net/v2/jpg/09/71/35/30/1000_F_971353035_aVx5TB2fKRp9pd6EKtuGFN6CalQekcQ3.jpg"
  );

  const handleSetFlightMode = async (mode_id) => {
    if (!isUnlocked) return;
    relockSlider();
    const data = { mode_id };
    await fetch(`http://${ENDPOINT_IP}/set_flight_mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  };

  const handleTakeoff = async (altitude) => {
    if (!isUnlocked) return;
    relockSlider();
    const data = { altitude };
    await fetch(`http://${DRONE_IP}:5000/takeoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  };

  const unlockSlider = () => {
    setIsUnlocked(true);
    setLockIcon("https://www.svgrepo.com/show/326700/lock-open-outline.svg");
    setTimeout(() => relockSlider(), 10000);
  };

  const relockSlider = () => {
    setIsUnlocked(false);
    setSliderValue(0);
    setLockIcon(
      "https://as1.ftcdn.net/v2/jpg/09/71/35/30/1000_F_971353035_aVx5TB2fKRp9pd6EKtuGFN6CalQekcQ3.jpg"
    );
  };

  const handleSliderChange = (value) => {
    setSliderValue(value);
  };

  const handleSliderAfterChange = (value) => {
    if (value >= 75) {
      setSliderValue(100);
      unlockSlider();
    } else {
      setSliderValue(0);
      relockSlider();
    }
  };

  return (
    <div className="py-4 px-20 w-full mx-auto space-y-2 bg-white rounded-xl shadow-lg">
      <div className="flex items-center space-x-4">
        <img
          src={lockIcon}
          alt="Lock Icon"
          className="w-8 h-8"
          draggable="false"
        />
        <ReactSlider
          className="w-full h-2 bg-gray-300 rounded-lg cursor-pointer"
          thumbClassName="transform -translate-y-1 w-4 h-4 bg-blue-500 rounded-full cursor-pointer focus:outline-none"
          trackClassName="h-2 rounded-lg"
          min={0}
          max={100}
          value={sliderValue}
          onChange={handleSliderChange}
          onAfterChange={handleSliderAfterChange}
        />
        <span className="text-gray-500 select-none">
          {sliderValue === 100 ? "Unlocked!" : "Locked"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Manual", id: 0 },
          { label: "Circle", id: 1 },
          { label: "Stablilize", id: 2 },
          { label: "Fly_By_Wire_A", id: 5 },
          { label: "Fly_By_Wire_B", id: 6 },
          { label: "Cruise", id: 7 },
          { label: "Auto", id: 10 },
          { label: "RTL", id: 11 },
          { label: "Loiter", id: 12 },
          { label: "Guided", id: 15 },
        ].map((mode) => (
          <button
            key={mode.label}
            onClick={() =>
              mode.isTakeoff ? handleTakeoff(25) : handleSetFlightMode(mode.id)
            }
            disabled={!isUnlocked}
            className={`px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-md focus:outline-none focus:ring-4 ${
              isUnlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FlightControl;
