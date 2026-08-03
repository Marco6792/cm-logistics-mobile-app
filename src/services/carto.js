import axios from 'axios';
import { getCartoConfig } from '../utils/mapProvider';

/**
 * CartoDB Service
 * Handles all CartoDB API interactions including geocoding, routing, and search
 */

/**
 * Get CartoDB API configuration
 */
function getCartoApiConfig() {
    const { apiUrl, apiKey } = getCartoConfig();
    return {
        baseUrl: apiUrl,
        apiKey,
    };
}

/**
 * Perform reverse geocoding (coordinates to address)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<object|null>} Geocoding result or null on error
 */
export async function reverseGeocode(latitude, longitude) {
    try {
        const { baseUrl, apiKey } = getCartoApiConfig();
        
        // Using CartoDB Data Services API for geocoding
        // Note: CartoDB may require different endpoint for geocoding
        // This is a basic implementation using nominatim as fallback or Carto's geocoding API
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                'accept-language': 'en-US',
            },
            headers: {
                'User-Agent': 'FleetbaseNavigator',
            },
        });

        if (response.data) {
            // Convert to Google-like format for compatibility
            return {
                formatted_address: response.data.display_name,
                address_components: parseNominatimComponents(response.data.address),
                geometry: {
                    location: {
                        lat: parseFloat(response.data.lat),
                        lng: parseFloat(response.data.lon),
                    },
                },
                place_id: response.data.place_id,
                types: ['geocode'],
            };
        }

        return null;
    } catch (error) {
        console.warn('CartoDB reverse geocoding error:', error.message);
        return null;
    }
}

/**
 * Perform forward geocoding (address to coordinates)
 * @param {string} address - Address string to geocode
 * @returns {Promise<Array>} Array of geocoding results
 */
export async function forwardGeocode(address) {
    try {
        const { baseUrl, apiKey } = getCartoApiConfig();
        
        // Using Nominatim OSM as fallback for forward geocoding
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 5,
                'accept-language': 'en-US',
            },
            headers: {
                'User-Agent': 'FleetbaseNavigator',
            },
        });

        return response.data.map((result) => ({
            formatted_address: result.display_name,
            address_components: parseNominatimComponents(result.address),
            geometry: {
                location: {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                },
            },
            place_id: result.place_id,
            types: ['geocode'],
        }));
    } catch (error) {
        console.warn('CartoDB forward geocoding error:', error.message);
        return [];
    }
}

/**
 * Parse Nominatim address components to Google-like format
 * @param {object} address - Nominatim address object
 * @returns {Array} Array of address components
 */
function parseNominatimComponents(address) {
    if (!address) return [];

    const components = [];
    const mapping = {
        house_number: 'street_number',
        road: 'route',
        suburb: 'sublocality',
        city: 'locality',
        town: 'locality',
        village: 'locality',
        county: 'administrative_area_level_2',
        state: 'administrative_area_level_1',
        postcode: 'postal_code',
        country: 'country',
    };

    for (const [key, value] of Object.entries(address)) {
        if (mapping[key]) {
            components.push({
                long_name: value,
                short_name: value,
                types: [mapping[key]],
            });
        }
    }

    return components;
}

/**
 * Get place details by place ID
 * @param {string} placeId - Place ID from geocoding results
 * @returns {Promise<object|null>} Place details or null on error
 */
export async function getPlaceDetails(placeId) {
    try {
        // For Nominatim, we can use the place_id to get details
        const response = await axios.get('https://nominatim.openstreetmap.org/lookup', {
            params: {
                place_ids: placeId,
                format: 'json',
                addressdetails: 1,
            },
            headers: {
                'User-Agent': 'FleetbaseNavigator',
            },
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                name: result.display_name,
                formatted_address: result.display_name,
                geometry: {
                    location: {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon),
                    },
                },
                place_id: result.place_id,
                address_components: parseNominatimComponents(result.address),
                types: ['geocode'],
            };
        }

        return null;
    } catch (error) {
        console.warn('CartoDB place details error:', error.message);
        return null;
    }
}

/**
 * Place autocomplete/search
 * @param {string} input - Search query
 * @param {Array} coordinates - Optional [lat, lng] for location bias
 * @returns {Promise<Array>} Array of autocomplete predictions
 */
export async function placeAutocomplete(input, coordinates = null) {
    try {
        const params = {
            q: input,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            'accept-language': 'en-US',
        };

        // Add location bias if coordinates provided
        if (coordinates && coordinates.length === 2) {
            params.viewbox = `${coordinates[1] - 0.1},${coordinates[0] - 0.1},${coordinates[1] + 0.1},${coordinates[0] + 0.1}`;
            params.bounded = 1;
        }

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params,
            headers: {
                'User-Agent': 'FleetbaseNavigator',
            },
        });

        return response.data.map((result) => ({
            description: result.display_name,
            place_id: result.place_id,
            structured_formatting: {
                main_text: result.display_name.split(',')[0],
                secondary_text: result.display_name.split(',').slice(1).join(',').trim(),
            },
            terms: parseAutocompleteTerms(result.display_name),
        }));
    } catch (error) {
        console.warn('CartoDB autocomplete error:', error.message);
        return [];
    }
}

/**
 * Parse autocomplete terms from description
 * @param {string} description - Full address description
 * @returns {Array} Array of terms
 */
function parseAutocompleteTerms(description) {
    if (!description) return [];
    
    return description
        .split(',')
        .map((term) => term.trim())
        .filter((term) => term.length > 0);
}

/**
 * Get routing/directions between coordinates
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {object} destination - Destination coordinates {lat, lng}
 * @param {Array} waypoints - Optional array of waypoint coordinates
 * @returns {Promise<object|null>} Route data or null on error
 */
export async function getDirections(origin, destination, waypoints = []) {
    try {
        // Using OSRM (Open Source Routing Machine) as fallback for routing
        // OSRM is commonly used with OpenStreetMap data
        const coordinates = [origin, ...waypoints, destination]
            .map((coord) => `${coord.lng},${coord.lat}`)
            .join(';');

        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}`, {
            params: {
                overview: 'full',
                geometries: 'geojson',
            },
        });

        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            
            // Convert to Google-like format for compatibility
            return {
                routes: [
                    {
                        summary: route.legs.map((leg) => leg.summary).join(', '),
                        coordinates: route.geometry.coordinates,
                        legs: route.legs.map((leg) => ({
                            distance: { value: leg.distance, text: formatDistance(leg.distance) },
                            duration: { value: leg.duration, text: formatDuration(leg.duration) },
                            steps: leg.steps.map((step) => ({
                                distance: { value: step.distance, text: formatDistance(step.distance) },
                                duration: { value: step.duration, text: formatDuration(step.duration) },
                                instruction: step.maneuver?.modifier || 'Continue',
                            })),
                        })),
                        overview_polyline: {
                            points: encodePolyline(route.geometry.coordinates),
                        },
                        bounds: {
                            northeast: {
                                lat: route.geometry.coordinates[0][1],
                                lng: route.geometry.coordinates[0][0],
                            },
                            southwest: {
                                lat: route.geometry.coordinates[route.geometry.coordinates.length - 1][1],
                                lng: route.geometry.coordinates[route.geometry.coordinates.length - 1][0],
                            },
                        },
                    },
                ],
            };
        }

        return null;
    } catch (error) {
        console.warn('CartoDB routing error:', error.message);
        return null;
    }
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Encode GeoJSON coordinates to Google polyline format
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {string} Encoded polyline string
 */
function encodePolyline(coordinates) {
    // Simplified polyline encoding
    // In production, use a proper polyline encoding library
    return coordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
}

export default {
    reverseGeocode,
    forwardGeocode,
    getPlaceDetails,
    placeAutocomplete,
    getDirections,
};
