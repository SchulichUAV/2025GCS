import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";
import { ENDPOINT_IP } from "../../../config";
import { calculateDistance, outlierSeverity, computeMedian } from '../../../utils/common.js';

const getOutlierColor = (severity) => {
    switch (severity) {
        case "major": return "red";
        case "mild": return "orange";
        case "minor": return "yellow";
        default: return "blue";
    }
};
    
const getClassIcon = (className, severity, isCompleted = false) => {
    const color = isCompleted ? "green" : getOutlierColor(severity);
    const opacity = isCompleted ? 0.45 : 1;
    
    let svgPath;
    switch (className) {
        case "person":
            svgPath = `<path d="M10,2 a4,4 0 1,1 0,8 a4,4 0 1,1 0,-8 M6,16 v-3 c0,-2.5 8,-2.5 8,0 v3" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>`;
            break;
        case "car":
            svgPath = `<path d="M3,12 h14 v3 h-14 z M4,12 v-2 h12 v2 M5,10 l2,-4 h6 l2,4" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <circle cx="6" cy="15" r="1.5" fill="black" opacity="${opacity}"/>
                       <circle cx="14" cy="15" r="1.5" fill="black" opacity="${opacity}"/>`;
            break;
        case "bus":
            svgPath = `<rect x="3" y="5" width="14" height="11" rx="1" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <rect x="5" y="8" width="2" height="2" fill="white" opacity="${opacity}"/>
                       <rect x="9" y="8" width="2" height="2" fill="white" opacity="${opacity}"/>
                       <rect x="13" y="8" width="2" height="2" fill="white" opacity="${opacity}"/>
                       <circle cx="6" cy="16" r="1.5" fill="black" opacity="${opacity}"/>
                       <circle cx="14" cy="16" r="1.5" fill="black" opacity="${opacity}"/>`;
            break;
        case "boat":
            svgPath = `<path d="M4,12 h12 v2 h-12 z M5,12 v-2 h10 v2 M10,10 v-6" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M10,4 l-3,3 h6 z" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>`;
            break;
        case "snowboard":
            svgPath = `<rect x="4" y="4" width="12" height="3" rx="1.5" stroke="black" stroke-width="1" fill="${color}" transform="rotate(45 10 10)" opacity="${opacity}"/>`;
            break;
        case "umbrella":
            svgPath = `<path d="M10,16 v-8 M3,8 c0,-5 14,-5 14,0" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/> 
                       <path d="M3,8 c0,-5 14,-5 14,0" stroke="none" fill="${color}" opacity="${opacity}"/>
                       <path d="M10,16 c0,-2 3,-2 3,0" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>`;
            break;
        case "skis":
            svgPath = `<path d="M6,3 v12 c0,2 -2,2 -2,0 v-8 M14,3 v12 c0,2 -2,2 -2,0 v-8" stroke="black" stroke-width="1.5" fill="${color}" opacity="${opacity}"/>`;
            break;
        case "plane":
            svgPath = `<path d="M10,3 l6,6 v2 l-6,2 v4 l2,1 v1 l-4,0 l-4,0 v-1 l2,-1 v-4 l-6,-2 v-2 l6,-6 z" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>`;
            break;
        case "sports ball":
            svgPath = `<circle cx="10" cy="10" r="7" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M10,3 v14 M3,10 h14 M6,6 a 8,8 0 0,0 8,8 M14,6 a 8,8 0 0,1 -8,8" stroke="black" stroke-width="0.5" fill="none" opacity="${opacity}"/>`;
            break;
        case "bed":
            svgPath = `<rect x="3" y="8" width="14" height="6" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <rect x="3" y="6" width="4" height="2" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M3,14 v2 h2 v-2 M15,14 v2 h2 v-2" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>`;
            break;
        case "tennis racket":
            svgPath = `<circle cx="10" cy="7" r="5" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M10,12 l-1,6 h2 l-1,-6" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M7,4 l6,6 M13,4 l-6,6" stroke="black" stroke-width="0.5" fill="none" opacity="${opacity}"/>`;
            break;
        case "stop sign":
            svgPath = `<polygon points="7,3 13,3 17,7 17,13 13,17 7,17 3,13 3,7" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <text x="10" y="12" font-size="4" text-anchor="middle" fill="white" opacity="${opacity}">STOP</text>`;
            break;
        case "suitcase":
            svgPath = `<rect x="4" y="7" width="12" height="10" rx="1" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M7,7 v-2 a3,3 0 0,1 6,0 v2" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>
                       <rect x="8" y="11" width="4" height="2" stroke="black" stroke-width="0.5" fill="white" opacity="${opacity}"/>`;
            break;
        case "motorcycle":
            svgPath = `<circle cx="4" cy="14" r="3" stroke="black" stroke-width="1" fill="black" opacity="${opacity}"/>
                       <circle cx="16" cy="14" r="3" stroke="black" stroke-width="1" fill="black" opacity="${opacity}"/>
                       <path d="M7,14 h6 M13,14 l3,-4 l-6,-3 l-3,3 h-3" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>
                       <path d="M13,10 l-3,-3" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>
                       <path d="M16,10 v-2 h-2" stroke="black" stroke-width="1" fill="none" opacity="${opacity}"/>`;
            break;
        case "Football":
            svgPath = `<ellipse cx="10" cy="10" rx="7" ry="5" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>
                       <path d="M4,10 h12 M10,5 v10 M6,7 l8,6 M6,13 l8,-6" stroke="black" stroke-width="0.5" fill="none" opacity="${opacity}"/>`;
            break;
        case "baseball bat":
            svgPath = `<rect x="8" y="3" width="4" height="14" rx="1" stroke="black" stroke-width="1" fill="${color}" opacity="${opacity}"/>`
            break;
        default:
            svgPath = `<polygon points="10,3 17,8 14,16 6,16 3,8" fill="${color}" stroke="black" stroke-width="1" opacity="${opacity}"/>`;
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${svgPath}</svg>`; 
    return L.divIcon({ html: svg, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
};

const MapComponent = () => {
    const [objects, setObjects] = useState([]);
    const [activeTarget, setActiveTarget] = useState({ class: "", latitude: 0, longitude: 0 });
    const [showCompleted, setShowCompleted] = useState(false);

    const Legend = () => {
        const map = useMap();
        const handleGoTo = () => {
            if (activeTarget.latitude && activeTarget.longitude) {
                map.flyTo([activeTarget.latitude, activeTarget.longitude], 18, { duration: 0.85 });
            }
        };

        return (
            <div className="absolute top-2 right-2 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs opacity-90">
           <div className="flex items-center mb-2">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                <div className="w-1 h-1 rounded-full bg-green-700 absolute"></div>
                            </div>
                        </div>
                    </div>
                    <span>
                        Active Target <b>({activeTarget.class})</b>
                    </span>
                    <button
                        onClick={handleGoTo}
                        className="ml-2 px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Go to
                    </button>
                </div>
            
                <div className="font-bold mt-2 mb-2">Outliers</div>
            
                <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Normal</span>
                </div>
                <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span>Minor</span>
                </div>
                <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span>Mild</span>
                </div>
                <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>Major</span>
                </div>
                {showCompleted && (
                    <div className="mb-2">
                        <hr className="border-t border-gray-400 mb-2" />
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-600 mr-2 opacity-50"></div>
                            <span>Completed (faded)</span>
                        </div>
                    </div>
                )}

                <div className="mt-3">
                    <button
                        onClick={() => {setShowCompleted(!showCompleted);}}
                        className={`w-full px-3 py-2 text-sm text-white ${showCompleted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} rounded transition-colors duration-200`}>
                        {showCompleted ? "Hide Completed" : "Show Completed"}
                    </button>
                </div>
            </div>        
        );         
    };    
    
    const computeOutliers = (data, completedTargets, targetClass) => {
        const outlierResults = {};
        
        Object.keys(data).forEach(className => {
            const items = data[className];
            if (!items || items.length === 0 || (!showCompleted && completedTargets.includes(className))) return;

            const latitudes = items.map(item => item.lat);
            const longitudes = items.map(item => item.lon);

            const { medianLat, medianLon } = computeMedian(latitudes, longitudes);

            // Set the active target when it matches the target class
            if (className === targetClass) {
                setActiveTarget({
                    class: targetClass,
                    latitude: medianLat,
                    longitude: medianLon
                });
            }

            // Process outliers for the current class
            outlierResults[className] = items.map((item, originalIndex) => {
                const distance = calculateDistance(item.lat, item.lon, medianLat, medianLon);
                let severity = "normal";
                if (distance < outlierSeverity.normal) severity = "normal";
                else if (distance < outlierSeverity.minor) severity = "minor";
                else if (distance < outlierSeverity.mild) severity = "mild";
                else severity = "major";

                return {
                    ...item,
                    className,
                    originalIndex,
                    severity,
                    isCompleted: completedTargets.includes(className),
                };
            });
        });
    
        const flattened = Object.values(outlierResults).flat();
        setObjects(flattened);
    };

    const handleDeletePrediction = async (className, index) => {
        try {
            const response = await axios.delete(`http://${ENDPOINT_IP}/delete-prediction`, {
                data: { class_name: className, index },
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 200) {
                fetchData();
            }
        } catch (error) { console.error("Error deleting prediction:", error); }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://${ENDPOINT_IP}/fetch-TargetInformation`);
            if (response.data) {  
                if (response.data.targets) {
                    computeOutliers(response.data.targets, response.data.completed_targets, response.data.current_target);
                }
            }
        } catch (error) { console.error("Error fetching data:", error); }
    };

    useEffect(() => {
        fetchData();
    }, [showCompleted]);

    const defaultCenter = [50.976600, -114.071400];     // (Calgary)(for testing)
    // const defaultCenter = [38.315575, -76.551095]; // (Maryland airstrip)(for comp)
    return (
        <div className="h-full w-full relative">
            <MapContainer center={defaultCenter} zoom={15} minZoom={3} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />    
                <Legend />
                {/* Display active target as a green dot only if coordinates are valid */}
                {activeTarget.latitude && activeTarget.longitude && !isNaN(activeTarget.latitude) && !isNaN(activeTarget.longitude) && (
                    <Marker
                    position={[activeTarget.latitude, activeTarget.longitude]}
                    icon={L.divIcon({ 
                        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <!-- Outer Ring -->
                                <circle cx="12" cy="12" r="11" stroke="black" stroke-width="0.5" fill="green" opacity="0.7"/>
                                <!-- Middle Ring -->
                                <circle cx="12" cy="12" r="7" stroke="black" stroke-width="0.5" fill="white" opacity="0.8"/>
                                <!-- Inner Ring -->
                                <circle cx="12" cy="12" r="3" stroke="black" stroke-width="0.5" fill="green" opacity="0.9"/>
                                <!-- Center Dot -->
                                <circle cx="12" cy="12" r="1" stroke="none" fill="black"/>
                            </svg>`, 
                        className: '', 
                        iconSize: [30, 30], 
                        iconAnchor: [15, 15] 
                    })}
                    zIndexOffset={1000}
                >
                    <Popup>
                        <div>
                            <p><strong>Active Target:</strong> {activeTarget.class}</p>
                            <p><strong>Lat:</strong> {activeTarget.latitude.toFixed(6)}</p>
                            <p><strong>Lon:</strong> {activeTarget.longitude.toFixed(6)}</p>
                        </div>
                    </Popup>
                </Marker>
                )}        
                {/* Filter out invalid coordinates before mapping */}
                {objects.filter(obj => obj && obj.lat && obj.lon && !isNaN(obj.lat) && !isNaN(obj.lon)).map((obj, index) => (
                    <Marker
                        key={index}
                        position={[obj.lat, obj.lon]}
                        icon={getClassIcon(obj.className, obj.severity, obj.isCompleted)}
                    >
                        <Popup>
                            <div>
                                <p><strong>Class:</strong> {obj.className}</p>
                                <p><strong>Lat:</strong> {obj.lat ? obj.lat.toFixed(6) : "N/A"}</p>
                                <p><strong>Lon:</strong> {obj.lon ? obj.lon.toFixed(6) : "N/A"}</p>
                                <p><strong>Conf:</strong> {obj.confidence ? obj.confidence.toFixed(2) : "N/A"}</p>
                                {obj.isCompleted ? (
                                    <p className="text-gray-500"><em>Completed target</em></p>
                                ) : (
                                    <button
                                        onClick={() => handleDeletePrediction(obj.className, obj.originalIndex)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
export default MapComponent;