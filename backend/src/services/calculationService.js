    // backend/src/services/calculationService.js

    // Function to convert degrees to radians
    const toRadians = (deg) => deg * (Math.PI / 180);

    // Function to convert radians to degrees
    const toDegrees = (rad) => rad * (180 / Math.PI);

    /**
     * Calculates the Haversine distance between two points on Earth.
     * @param {number} lat1 - Latitude of point 1 in degrees
     * @param {number} lon1 - Longitude of point 1 in degrees
     * @param {number} lat2 - Latitude of point 2 in degrees
     * @param {number} lon2 - Longitude of point 2 in degrees
     * @returns {number} Distance in kilometers
     */
    const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of Earth in kilometers

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in km
    };

    /**
     * Calculates the angle at the Warehouse point (PWC) using the Spherical Law of Cosines.
     * @param {object} plant - { lat, lon }
     * @param {object} warehouse - { lat, lon }
     * @param {object} city - { lat, lon }
     * @returns {object} { angleDegrees, isBackwardMovement, distancePW, distanceWC, distancePC }
     */
    const analyzeMovement = (plant, warehouse, city) => {
        // Convert all coordinates to radians for calculations
        const pLat = toRadians(plant.lat);
        const pLon = toRadians(plant.lon);
        const wLat = toRadians(warehouse.lat);
        const wLon = toRadians(warehouse.lon);
        const cLat = toRadians(city.lat);
        const cLon = toRadians(city.lon);

        // Calculate angular distances (sides of the spherical triangle)
        // d_pw = angular distance between Plant and Warehouse
        const d_pw = Math.acos(
            Math.sin(pLat) * Math.sin(wLat) +
            Math.cos(pLat) * Math.cos(wLat) * Math.cos(pLon - wLon)
        );

        // d_wc = angular distance between Warehouse and City
        const d_wc = Math.acos(
            Math.sin(wLat) * Math.sin(cLat) +
            Math.cos(wLat) * Math.cos(cLat) * Math.cos(wLon - cLon)
        );

        // d_pc = angular distance between Plant and City
        const d_pc = Math.acos(
            Math.sin(pLat) * Math.sin(cLat) +
            Math.cos(pLat) * Math.cos(cLat) * Math.cos(pLon - cLon)
        );

        // Now, apply the Spherical Law of Cosines to find the angle at the Warehouse (angle C in the formula, where C is the warehouse vertex)
        // cos(A) = (cos(a) - cos(b)cos(c)) / (sin(b)sin(c))
        // We want to find angle_W (opposite side d_pc).
        // Let a = d_pc, b = d_pw, c = d_wc
        let angle_W_radians;
        const numerator = Math.cos(d_pc) - Math.cos(d_pw) * Math.cos(d_wc);
        const denominator = Math.sin(d_pw) * Math.sin(d_wc);

        // Handle edge cases where denominator is zero (e.g., points are collinear or identical)
        if (denominator === 0) {
            angle_W_radians = 0; // Or handle as an error/undefined depending on desired behavior
        } else {
            // Clamp the value to [-1, 1] to avoid Math.acos returning NaN due to floating point inaccuracies
            const value = numerator / denominator;
            angle_W_radians = Math.acos(Math.max(-1, Math.min(1, value)));
        }

        const angleDegrees = toDegrees(angle_W_radians);
        const isBackwardMovement = angleDegrees < 90; // Acute angle means backward movement

        // Also calculate actual distances for user info
        const R = 6371; // Earth radius in km
        const distancePW = calculateHaversineDistance(plant.lat, plant.lon, warehouse.lat, warehouse.lon);
        const distanceWC = calculateHaversineDistance(warehouse.lat, warehouse.lon, city.lat, city.lon);
        const distancePC = calculateHaversineDistance(plant.lat, plant.lon, city.lat, city.lon);


        return {
            angleDegrees: angleDegrees,
            isBackwardMovement: isBackwardMovement,
            distancePlantWarehouseKm: distancePW,
            distanceWarehouseCityKm: distanceWC,
            distancePlantCityKm: distancePC,
        };
    };

    module.exports = { analyzeMovement, calculateHaversineDistance };
    