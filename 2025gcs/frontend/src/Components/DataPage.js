import React, { useState } from 'react';

function DataPage() {
  const [activeTab, setActiveTab] = useState('Category1');

  const renderContent = () => {
    switch (activeTab) {
      case 'Category1':
        return <div>Content for Category 1</div>;
      case 'Category2':
        return <div>Content for Category 2</div>;
      case 'Category3':
        return <div>Content for Category 3</div>;
      default:
        return <div>Select a category</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen">
      <div className="flex flex-grow p-4 mt-20 gap-4 h-full">
        <div className="flex flex-col w-full">
          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 rounded ${activeTab === 'Category1' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('Category1')}
            >
              Category 1
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'Category2' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('Category2')}
            >
              Category 2
            </button>
            <button
              className={`px-4 py-2 rounded ${activeTab === 'Category3' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('Category3')}
            >
              Category 3
            </button>
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