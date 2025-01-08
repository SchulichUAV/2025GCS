import React from "react";

const Controls = ({ addPhoto, clearPhoto }) => {
  return (
    <div className="flex justify-between mb-4">
      <button
        onClick={addPhoto}
        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        #
      </button>
      <button
        onClick={addPhoto}
        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        📸
      </button>
      <button
        onClick={clearPhoto}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Clear
      </button>
    </div>
  );
};

export default Controls;
