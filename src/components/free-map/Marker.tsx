import React, { useRef } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { isObject } from '../../utils';

const Marker = ({ coordinate, anchor = { x: 0.5, y: 1 }, children, onPress = undefined, id = undefined, centerOffset = undefined, tracksViewChanges = undefined, ...rest }) => {
    const latitude = isObject(coordinate) ? coordinate.latitude : null;
    const longitude = isObject(coordinate) ? coordinate.longitude : null;

    const annotationId = useRef(id || `marker-${Math.random().toString(36).slice(2, 10)}`).current;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return null;
    }

    return (
        <MapLibreGL.PointAnnotation id={annotationId} coordinate={[longitude, latitude]} anchor={anchor} onSelected={onPress ? () => onPress() : undefined} {...rest}>
            {children}
        </MapLibreGL.PointAnnotation>
    );
};

export default Marker;
