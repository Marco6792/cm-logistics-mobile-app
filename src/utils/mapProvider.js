import { config } from './index';

/**
 * Map provider types
 */
export const MAP_PROVIDERS = {
    GOOGLE: 'google',
    CARTO: 'carto',
    AUTO: 'auto',
};

/**
 * Get the current map provider based on configuration
 * @returns {string} The active map provider
 */
export function getMapProvider() {
    const configuredProvider = config('MAP_PROVIDER', 'auto');
    
    // If explicitly set to a provider, use it
    if (configuredProvider === MAP_PROVIDERS.GOOGLE) {
        return MAP_PROVIDERS.GOOGLE;
    }
    
    if (configuredProvider === MAP_PROVIDERS.CARTO) {
        return MAP_PROVIDERS.CARTO;
    }
    
    // Auto mode: Use Google if API key is available, otherwise fallback to Carto
    const googleApiKey = config('GOOGLE_MAPS_API_KEY', '');
    const cartoApiKey = config('CARTODB_API_KEY', '');
    
    if (googleApiKey && googleApiKey.trim().length > 0) {
        console.log('MapProvider: Using Google Maps (API key available)');
        return MAP_PROVIDERS.GOOGLE;
    }
    
    if (cartoApiKey && cartoApiKey.trim().length > 0) {
        console.log('MapProvider: Using CartoDB (Google Maps API key not available)');
        return MAP_PROVIDERS.CARTO;
    }
    
    // Default fallback to CartoDB if neither API key is available
    console.log('MapProvider: No API keys available, defaulting to CartoDB');
    return MAP_PROVIDERS.CARTO;
}

/**
 * Check if Google Maps is the current provider
 * @returns {boolean}
 */
export function isGoogleMaps() {
    return getMapProvider() === MAP_PROVIDERS.GOOGLE;
}

/**
 * Check if CartoDB is the current provider
 * @returns {boolean}
 */
export function isCartoDB() {
    return getMapProvider() === MAP_PROVIDERS.CARTO;
}

/**
 * Get CartoDB configuration
 * @returns {object} CartoDB configuration object
 */
export function getCartoConfig() {
    return {
        apiUrl: config('CARTODB_API_URL', 'https://gcp-us-east1.api.carto.com'),
        apiKey: config('CARTODB_API_KEY', ''),
    };
}

/**
 * Get Google Maps API key
 * @returns {string}
 */
export function getGoogleMapsApiKey() {
    return config('GOOGLE_MAPS_API_KEY', '');
}

/**
 * Generate CartoDB tile URL for react-native-maps
 * @param {string} style - The tile style (e.g., 'voyager', 'dark_matter', 'positron')
 * @param {string} format - The tile format (e.g., 'png', 'mvt')
 * @returns {string} The tile URL template
 */
export function getCartoTileUrl(style = 'voyager', format = 'png') {
    const { apiUrl, apiKey } = getCartoConfig();
    
    // CartoDB tile URL format
    // https://{account}.carto.com/api/v1/map/{style}/tiles/{z}/{x}/{y}.{format}?api_key={key}
    return `${apiUrl}/api/v1/map/${style}/tiles/{z}/{x}/{y}.${format}?api_key=${apiKey}`;
}

/**
 * Get the appropriate map tile URL based on current provider
 * @returns {string|null} Tile URL or null if using Google Maps (which doesn't need custom tiles)
 */
export function getMapTileUrl() {
    if (isGoogleMaps()) {
        return null; // Google Maps uses its own tiles
    }
    
    return getCartoTileUrl('voyager', 'png');
}

/**
 * Free OpenStreetMap based raster style for MapLibre (no API key required).
 * @returns {object} MapLibre style JSON
 */
export function getFreeMapRasterStyle() {
    return {
        version: 8,
        sources: {
            openstreetmap: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                maxzoom: 19,
                attribution: '© OpenStreetMap contributors',
            },
        },
        layers: [
            {
                id: 'openstreetmap',
                type: 'raster',
                source: 'openstreetmap',
            },
        ],
    };
}

/**
 * Get the MapLibre style for the free map provider.
 * Uses OpenFreeMap (free vector tiles, no key required) with a raster fallback.
 * @returns {string|object} MapLibre style URL or style JSON
 */
export function getFreeMapStyle() {
    return getFreeMapRasterStyle();
}

export default {
    getMapProvider,
    isGoogleMaps,
    isCartoDB,
    getCartoConfig,
    getGoogleMapsApiKey,
    getCartoTileUrl,
    getMapTileUrl,
    getFreeMapStyle,
};
