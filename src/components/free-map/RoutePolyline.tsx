import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { isArray, isObject } from '../../utils';

/**
 * Route polyline rendered as a MapLibre LineLayer.
 * Coordinates are expected as an array of `{ latitude, longitude }`.
 */
const RoutePolyline = ({ coordinates = [], id = 'route', strokeColor = '#2563eb', strokeWidth = 4, lineDashPattern = undefined, opacity = 1 }) => {
    const shape = useMemo(() => {
        const positions = coordinates
            .map((coord) => {
                if (isArray(coord)) {
                    return coord.length >= 2 ? [coord[1], coord[0]] : null;
                }

                if (isObject(coord) && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
                    return [coord.longitude, coord.latitude];
                }

                return null;
            })
            .filter(Boolean);

        if (positions.length < 2) {
            return null;
        }

        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: positions,
                    },
                },
            ],
        };
    }, [coordinates]);

    if (!shape) {
        return null;
    }

    const style = {
        lineColor: strokeColor,
        lineWidth: strokeWidth,
        lineOpacity: opacity,
        lineCap: 'round',
        lineJoin: 'round',
    };

    if (isArray(lineDashPattern)) {
        style.lineDasharray = lineDashPattern;
    }

    return (
        <MapLibreGL.ShapeSource id={`${id}-source`} shape={shape}>
            <MapLibreGL.LineLayer id={`${id}-line-layer`} style={style} />
        </MapLibreGL.ShapeSource>
    );
};

export default RoutePolyline;
