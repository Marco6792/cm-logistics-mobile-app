import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { getCartoTileUrl } from '../utils/mapProvider';

/**
 * CartoDB Tile Layer Component
 * Renders CartoDB raster tiles as a MapLibre raster source.
 */
const CartoTileLayer = ({ style = 'voyager', format = 'png', opacity = 1 }) => {
    const tileUrl = getCartoTileUrl(style, format);

    return (
        <MapLibreGL.RasterSource id='carto-tiles' tileUrlTemplates={[tileUrl]} tileSize={256}>
            <MapLibreGL.RasterLayer id='carto-tiles-layer' style={{ rasterOpacity: opacity }} />
        </MapLibreGL.RasterSource>
    );
};

export default CartoTileLayer;
