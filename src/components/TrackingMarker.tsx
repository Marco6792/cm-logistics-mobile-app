import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { Spinner, YStack } from 'tamagui';
import FastImage from 'react-native-fast-image';
import { Marker } from './free-map';
import { isObject } from '../utils';
import { SvgCssUri } from 'react-native-svg/css';

const TrackingMarker = forwardRef(
    ({ coordinate, imageSource, size = { width: 50, height: 50 }, moveDuration = 1000, initialRotation = 0, baseRotation = 0, rotationDuration = 500, onPress, children }, ref) => {
        const [svgLoading, setSvgLoading] = useState(true);

        // Current rendered position, updated smoothly as the driver moves.
        const [position, setPosition] = useState({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
        });

        // Keep a ref of the latest rendered position for interpolation.
        const positionRef = useRef(position);
        const animationRef = useRef(null);

        useEffect(() => {
            positionRef.current = position;
        }, [position]);

        // Animated value for rotation.
        const rotation = useRef(new Animated.Value(initialRotation)).current;

        // Smoothly move the marker between coordinates using a JS tween.
        const move = useCallback(
            (newLatitude, newLongitude, duration = moveDuration) => {
                const from = positionRef.current;

                if (typeof newLatitude !== 'number' || typeof newLongitude !== 'number') {
                    return;
                }

                if (duration <= 0 || (from.latitude === newLatitude && from.longitude === newLongitude)) {
                    setPosition({ latitude: newLatitude, longitude: newLongitude });
                    return;
                }

                if (animationRef.current) {
                    animationRef.current.stop();
                }

                const progress = new Animated.Value(0);
                animationRef.current = progress;

                const listener = progress.addListener(({ value }) => {
                    const latitude = from.latitude + (newLatitude - from.latitude) * value;
                    const longitude = from.longitude + (newLongitude - from.longitude) * value;
                    setPosition({ latitude, longitude });
                });

                Animated.timing(progress, {
                    toValue: 1,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }).start(({ finished }) => {
                    progress.removeListener(listener);
                    if (animationRef.current === progress) {
                        animationRef.current = null;
                    }

                    if (finished) {
                        setPosition({ latitude: newLatitude, longitude: newLongitude });
                    }
                });
            },
            [moveDuration]
        );

        // Rotate the marker to the new heading, taking the shortest path around the compass.
        const rotate = useCallback(
            (newHeading, duration = rotationDuration) => {
                const currentRotation = rotation.getValue();
                let delta = newHeading - currentRotation;
                if (Math.abs(delta) > 180) {
                    delta = delta - 360 * Math.sign(delta);
                }
                const finalRotation = (currentRotation + delta) % 360;

                Animated.timing(rotation, {
                    toValue: finalRotation,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }).start();
            },
            [rotation, rotationDuration]
        );

        // Expose move and rotate via ref.
        useImperativeHandle(ref, () => ({
            move,
            rotate,
        }));

        // Determine if the image source is an SVG.
        const isRemoteSvg = isObject(imageSource) && typeof imageSource.uri === 'string' && imageSource.uri.toLowerCase().endsWith('.svg');

        const onSvgLoadingError = () => {
            setSvgLoading(false);
        };

        const onSvgLoaded = () => {
            setSvgLoading(false);
        };

        return (
            <Marker coordinate={position} onPress={onPress}>
                <Animated.View
                    style={{
                        transform: [
                            { rotate: `${baseRotation}deg` },
                            {
                                rotate: rotation.interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                }),
                            },
                        ],
                    }}
                >
                    {isRemoteSvg ? (
                        <YStack
                            style={{
                                position: 'relative',
                                width: size.width,
                                height: size.height,
                            }}
                        >
                            <SvgCssUri uri={imageSource.uri} width={size.width} height={size.height} onError={onSvgLoadingError} onLoad={onSvgLoaded} />
                            {svgLoading && (
                                <YStack
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Spinner color='$textPrimary' size={size.width} />
                                </YStack>
                            )}
                        </YStack>
                    ) : (
                        <FastImage source={imageSource} style={{ width: size.width, height: size.height }} resizeMode={FastImage.resizeMode.contain} />
                    )}
                </Animated.View>
                {children && <YStack>{children}</YStack>}
            </Marker>
        );
    }
);

export default TrackingMarker;
