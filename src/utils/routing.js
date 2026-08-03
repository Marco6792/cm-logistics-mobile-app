import cartoService from '../services/carto';

/**
 * Get directions/routing between coordinates using the free OSRM service.
 *
 * @param {object} origin - Origin coordinates {latitude, longitude}
 * @param {object} destination - Destination coordinates {latitude, longitude}
 * @param {Array} waypoints - Optional array of waypoint coordinates
 * @returns {Promise<object|null>} Route data or null on error
 */
export async function getDirections(origin, destination, waypoints = []) {
    console.log('Using OSRM for routing');
    try {
        const originCoord = { lat: origin.latitude, lng: origin.longitude };
        const destCoord = { lat: destination.latitude, lng: destination.longitude };
        const waypointCoords = waypoints.map((wp) => ({ lat: wp.latitude, lng: wp.longitude }));

        const routeData = await cartoService.getDirections(originCoord, destCoord, waypointCoords);
        return routeData;
    } catch (error) {
        console.warn('OSRM routing error:', error);
        return null;
    }
}

/**
 * Custom routing is always used (free OSRM fallback).
 * @returns {boolean}
 */
export function shouldUseCustomRouting() {
    return true;
}

export default {
    getDirections,
    shouldUseCustomRouting,
};
