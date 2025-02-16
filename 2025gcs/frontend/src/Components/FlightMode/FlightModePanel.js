
import React, { useState } from 'react';
import { DRONE_IP } from '../../config';

const FlightControl = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [lockIcon, setLockIcon] = useState(
    'https://as1.ftcdn.net/v2/jpg/09/71/35/30/1000_F_971353035_aVx5TB2fKRp9pd6EKtuGFN6CalQekcQ3.jpg'
  );

  const handleSetFlightMode = async (mode_id) => {
    if (!isUnlocked) return;
    relockSlider();
    const data = { mode_id };
    await fetch(`http://${DRONE_IP}:5000/set_flight_mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };

  const handleTakeoff = async (altitude) => {
    if (!isUnlocked) return;
    relockSlider();
    const data = { altitude };
    await fetch(`http://${DRONE_IP}:5000/takeoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };

  const unlockSlider = () => {
    setIsUnlocked(true);
    setLockIcon(
      'https://www.svgrepo.com/show/326700/lock-open-outline.svg'
    );
    setTimeout(() => relockSlider(), 10000);
  };

  const relockSlider = () => {
    setIsUnlocked(false);
    setSliderValue(0);
    setLockIcon(
      'https://as1.ftcdn.net/v2/jpg/09/71/35/30/1000_F_971353035_aVx5TB2fKRp9pd6EKtuGFN6CalQekcQ3.jpg'
    );
  };

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
    if (e.target.value === '100') unlockSlider();
  };

  return (
    <div className="flight-control-panel py-6 px-20 max-w-3xl w-full mx-auto space-y-4 bg-white rounded-xl shadow-lg">
      <div className="flex items-center space-x-4">
        <img src={lockIcon} alt="Lock Icon" className="w-8 h-8" />
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer focus:outline-none"
        />
        <span className="text-gray-500">
          {sliderValue === '100' ? 'Unlocked!' : 'Slide to unlock'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Loiter', id: 5 },
          { label: 'Stabilize', id: 0 },
          { label: 'Guided', id: 4 },
          { label: 'RTL', id: 6 },
          { label: 'Auto', id: 3 },
          { label: 'Land', id: 9 },
          { label: 'Alt Hold', id: 2 },
          { label: 'Takeoff', id: 'takeoff', isTakeoff: true },
        ].map((mode) => (
          <button
            key={mode.label}
            onClick={() =>
              mode.isTakeoff ? handleTakeoff(25) : handleSetFlightMode(mode.id)
            }
            disabled={!isUnlocked}
            className={`px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-md focus:outline-none focus:ring-4 ${
              isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
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
