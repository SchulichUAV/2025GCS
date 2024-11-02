import React from 'react'

const AltitudePanel = () => {
  return (
    <div className="altitude-panel">
      <div className="bg-gray-200 p-2 mb-2">
        <input type="text" placeholder="Takeoff Altitude" className="border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2">Submit</button>
      </div>
      <div className="bg-gray-200 p-2">
        <input type="text" placeholder="Go-to Altitude" className="border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2">Submit</button>
      </div>
    </div>
  )
}

export default AltitudePanel
