import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { getFreeMapStyle } from '../../utils/mapProvider';
import { isObject, get } from '../../utils';

const MAX_ZOOM = 24;
const MIN_ZOOM = 0;

const clampZoom = (zoom) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom || 0));

const latitudeDeltaToZoom = (latitudeDelta) => clampZoom(Math.log2(360 / (latitudeDelta || 1)));

const zoomToLatitudeDelta = (zoom) => 360 / Math.pow(2, clampZoom(zoom));

const DEFAULT_CAMERA = {
    centerCoordinate: [9.7679, 4.0511],
    zoomLevel: 14,
};

const regionToCamera = (region = {}) => {
    const latitude = get(region, 'latitude', 4.0511);
    const longitude = get(region, 'longitude', 9.7679);
    const latitudeDelta = get(region, 'latitudeDelta', 0.005);

    return {
        centerCoordinate: [longitude, latitude],
        zoomLevel: latitudeDeltaToZoom(latitudeDelta),
    };
};

const MapView = forwardRef((props, ref) => {
    const {
        initialRegion,
        style,
        mapStyle,
        scrollEnabled = true,
        zoomEnabled = true,
        pitchEnabled = true,
        rotateEnabled = true,
        attributionEnabled = true,
        onPress,
        onRegionChangeComplete,
        onDidFinishLoadingMap,
        children,
        ...rest
    } = props;

    const mapRef = useRef(null);
    const cameraRef = useRef(null);

    const defaultCamera = useMemo(() => (isObject(initialRegion) ? regionToCamera(initialRegion) : DEFAULT_CAMERA), []);

    const applyCamera = useCallback((cameraSettings, duration = 0) => {
        if (!cameraRef.current) {
            return;
        }

        if (duration > 0) {
            cameraRef.current.setCamera({
                ...cameraSettings,
                animationDuration: duration,
                animationMode: 'easeTo',
            });
            return;
        }

        cameraRef.current.setCamera({
            ...cameraSettings,
            animationDuration: 0,
            animationMode: 'moveTo',
        });
    }, []);

    const fitToCoordinates = useCallback(
        (coordinates = [], options = {}) => {
            if (!cameraRef.current || !coordinates.length) {
                return;
            }

            const { edgePadding = {}, animated = true } = options;
            const positions = coordinates
                .map((coord) => ({
                    latitude: get(coord, 'latitude'),
                    longitude: get(coord, 'longitude'),
                }))
                .filter((coord) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number');

            if (!positions.length) {
                return;
            }

            const longitudes = positions.map((coord) => coord.longitude);
            const latitudes = positions.map((coord) => coord.latitude);

            const ne = [Math.max(...longitudes), Math.max(...latitudes)];
            const sw = [Math.min(...longitudes), Math.min(...latitudes)];

            const padding = [
                get(edgePadding, 'top', 50),
                get(edgePadding, 'right', 50),
                get(edgePadding, 'bottom', 50),
                get(edgePadding, 'left', 50),
            ];

            cameraRef.current.fitBounds(ne, sw, padding, animated ? 500 : 0);
        },
        []
    );

    const animateToRegion = useCallback(
        (region = {}, duration = 500) => {
            applyCamera(regionToCamera(region), duration);
        },
        [applyCamera]
    );

    useImperativeHandle(
        ref,
        () => ({
            animateToRegion,
            fitToCoordinates,
            applyCamera,
            setCamera: applyCamera,
            getMapRef: () => mapRef.current,
            getCenter: async () => {
                if (!mapRef.current) {
                    return null;
                }

                const position = await mapRef.current.getCenter();
                return position ? { latitude: position[1], longitude: position[0] } : null;
            },
            getZoom: async () => {
                if (!mapRef.current) {
                    return null;
                }

                return mapRef.current.getZoom();
            },
        }),
        [animateToRegion, fitToCoordinates, applyCamera]
    );

    const handleRegionDidChange = (feature) => {
        if (typeof onRegionChangeComplete !== 'function') {
            return;
        }

        const coordinates = get(feature, 'geometry.coordinates');
        const zoomLevel = get(feature, 'properties.zoomLevel') ?? get(feature, 'payload.zoomLevel');
        const longitude = coordinates && coordinates.length >= 1 ? coordinates[0] : 9.7679;
        const latitude = coordinates && coordinates.length >= 2 ? coordinates[1] : 4.0511;

        const latitudeDelta = zoomToLatitudeDelta(zoomLevel);

        onRegionChangeComplete({
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta: latitudeDelta,
        });
    };

    const handlePress = (feature) => {
        if (typeof onPress !== 'function') {
            return;
        }

        const coordinates = get(feature, 'geometry.coordinates');
        const longitude = coordinates && coordinates.length >= 1 ? coordinates[0] : null;
        const latitude = coordinates && coordinates.length >= 2 ? coordinates[1] : null;

        onPress({
            nativeEvent: {
                coordinate: { latitude, longitude },
            },
        });
    };

    return (
        <MapLibreGL.MapView
            ref={mapRef}
            style={style}
            mapStyle={mapStyle ?? getFreeMapStyle()}
            onPress={handlePress}
            onRegionDidChange={handleRegionDidChange}
            onDidFinishLoadingMap={onDidFinishLoadingMap}
            scrollEnabled={scrollEnabled}
            zoomEnabled={zoomEnabled}
            pitchEnabled={pitchEnabled}
            rotateEnabled={rotateEnabled}
            attributionEnabled={attributionEnabled}
            logoEnabled={false}
            {...rest}
        >
            <MapLibreGL.Camera ref={cameraRef} defaultSettings={defaultCamera} />
            {children}
        </MapLibreGL.MapView>
    );
});

export default MapView;
