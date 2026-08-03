import React from 'react';
import { View } from 'react-native';

const sizeMap = {
    xxs: 0.3,
    xs: 0.5,
    sm: 0.75,
    md: 1,
    lg: 1.3,
    xl: 1.8,
};

const LocationMarker = ({ lifted = false, size = 'md', color = '#2563EB' }) => {
    const scale = sizeMap[size] || sizeMap.md;
    const headSize = Math.round(32 * scale);
    const innerSize = Math.round(14 * scale);
    const tailHeight = Math.round(10 * scale);
    const tailWidth = Math.round(8 * scale);

    return (
        <View style={{ alignItems: 'center' }} pointerEvents='none'>
            {/* Pin head */}
            <View
                style={{
                    width: headSize,
                    height: headSize,
                    borderRadius: headSize / 2,
                    backgroundColor: color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 8,
                }}
            >
                <View
                    style={{
                        width: innerSize,
                        height: innerSize,
                        borderRadius: innerSize / 2,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                    }}
                />
            </View>
            {/* Pin tail */}
            <View
                style={{
                    width: 0,
                    height: 0,
                    marginTop: -2,
                    borderLeftWidth: tailWidth / 2,
                    borderRightWidth: tailWidth / 2,
                    borderTopWidth: tailHeight,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: color,
                }}
            />
        </View>
    );
};

export default LocationMarker;
