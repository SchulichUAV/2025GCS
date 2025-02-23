import React, { useState } from 'react';
import SavedCoords from './DataComponents/SavedCoords';
// import Category2 from './Category2';
// import Category3 from './Category3';

const categories = {
  'Saved Coordinates': SavedCoords,
  'Category 2': 'replace',
  'Category 3': 'replace',
};

function DataPage() {
  const [activeTab, setActiveTab] = useState(Object.keys(categories)[0]);

  const renderContent = () => {
    const ActiveComponent = categories[activeTab];
    return <ActiveComponent />;
  };

  return (
    <div className="flex flex-col min-h-screen w-screen">
      <div className="flex flex-grow p-4 mt-20 gap-4 h-full">
        <div className="flex flex-col w-full">
          <div className="flex space-x-4 mb-4">
            {Object.keys(categories).map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded ${activeTab === category ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex-grow p-4 border rounded bg-white shadow-md">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPage;