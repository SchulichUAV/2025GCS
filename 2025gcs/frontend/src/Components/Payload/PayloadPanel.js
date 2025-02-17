import React, { useState } from 'react';

const PayloadPanel = () => {
  // State variable to store the selected drone type.
  // Values: null, 'Quadcopter', 'Fixed Wing'
  const [droneType, setDroneType] = useState(null);

  return (
    <div className="payload-panel py-6 px-20 max-w-3xl w-full mx-auto space-y-2 bg-white rounded-xl shadow-lg">
      <div className="p-2 mb-2">
        <div className="flex items-center flex-col">
          {droneType === null && (
            <div>
              <h2 className="text-xl font-bold mb-2">Select drone type.</h2>
              <div className="flex w-full">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
                  onClick={() => setDroneType('Quadcopter')}
                >
                  Quadcopter
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => setDroneType('Fixed Wing')}
                >
                  Fixed Wing
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 w-full flex justify-center">
            {droneType === 'Quadcopter' && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-bold justify-center">Stepper 1</h3>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold justify-center">Stepper 2</h3>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <input type="number" id="stepper1-up-distance" placeholder="Distance ↑" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper1-up-speed" placeholder="Speed ↑" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper1-down-distance" placeholder="Distance ↓" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper1-down-speed" placeholder="Speed ↓" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper2-up-distance" placeholder="Distance ↑" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper2-up-speed" placeholder="Speed ↑" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                  <div>
                    <input type="number" id="stepper2-down-distance" placeholder="Distance ↓" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <input type="number" id="stepper2-down-speed" placeholder="Speed ↓" className="w-full border border-gray-300 rounded-md p-2" style={{ background: "white" }} />
                    <button className="ml-2 bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-md">Submit</button>
                  </div>
                </div>
              </div>
            )}
            {droneType === 'Fixed Wing' && (
              <div>
                <div className="grid grid-cols-2 gap-6">
                  {['Payload Bay 1', 'Payload Bay 2', 'Payload Bay 3', 'Payload Bay 4'].map((bay, index) => {
                    const payloadId = index + 1;
                    
                    const handleRelease = async () => {
                      try {
                        const response = await fetch('http://127.0.0.1:80/payload_release', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ payload_id: payloadId }),
                        });
                        if (!response.ok) throw new Error('Failed to release payload');
                        console.log(`Payload ${payloadId} released`);
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    };
                    
                    const handleToggle = async () => {
                      try {
                        const response = await fetch('http://127.0.0.1:80/payload_toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ payload_id: payloadId }),
                        });
                        if (!response.ok) throw new Error('Failed to toggle payload control');
                        console.log(`Payload ${payloadId} manual control toggled`);
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    };
                    
                    return (
                      <div key={index} className="p-4 border border-gray-300 rounded-md flex flex-col items-center">
                        <h3 className="text-lg font-bold mb-2">{bay}</h3>
                        <div className="flex space-x-4">
                          <button 
                            onClick={handleRelease} 
                            className="bg-gray-500 hover:bg-gray-400 text-white px-2 py-2 rounded-md"
                          >
                            Release
                          </button>
                          <button 
                            onClick={handleToggle} 
                            className="bg-gray-500 hover:bg-gray-400 text-white px-2 py-2 rounded-md"
                          >
                            Toggle
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

export default PayloadPanel;