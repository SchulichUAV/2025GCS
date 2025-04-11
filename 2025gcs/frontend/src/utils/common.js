// Function to calculate distance between two points in meters
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const q1 = lat1 * Math.PI / 180;
    const q2 = lat2 * Math.PI / 180;
    const x = (lat2 - lat1) * Math.PI / 180;
    const y = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(q1) * Math.cos(q2) * Math.sin(y / 2) * Math.sin(y / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Compute the median latitude and longitude from arrays of latitudes and longitudes
export const computeMedian = (latitudes, longitudes) => {
    const sortedLat = [...latitudes].sort((a, b) => a - b);
    const sortedLon = [...longitudes].sort((a, b) => a - b);

    const midIndex = Math.floor(sortedLat.length / 2);
    let medianLat, medianLon;
    if (sortedLat.length % 2 === 0) {
        medianLat = (sortedLat[midIndex - 1] + sortedLat[midIndex]) / 2;
        medianLon = (sortedLon[midIndex - 1] + sortedLon[midIndex]) / 2;
    } else {
        medianLat = sortedLat[midIndex];
        medianLon = sortedLon[midIndex];
    }
    return { medianLat, medianLon };
};

// sets the severity of the outlier based on distance
export const outlierSeverity = {
    normal: 40,
    minor: 65,
    mild: 90
}