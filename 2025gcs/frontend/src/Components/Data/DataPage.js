import React, { useState, useEffect } from 'react';
import SavedCoords from './DataComponents/SavedCoords';
import ImageData from './DataComponents/ImageData';
import ObjectMap from './DataComponents/ObjectMap';

const categories = {
  'Saved Coordinates': SavedCoords,
  'Image Data': ImageData,
  'Map' : ObjectMap
};

function DataPage() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || Object.keys(categories)[0];
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const renderContent = () => {
    const ActiveComponent = categories[activeTab];
    if (ActiveComponent) {
      return <ActiveComponent />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex flex-col flex-grow p-6 mt-20 gap-6 h-[calc(100vh-5rem)] overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <div className="flex justify-center space-x-6 mb-6">
            {Object.keys(categories).map((category) => (
              <button
                key={category}
                className={`px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${
                  activeTab === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex-grow p-6 border rounded-2xl bg-white shadow-xl overflow-auto h-full max-h-[calc(100vh-11rem)] transition-all duration-300">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPage;
