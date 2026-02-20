import React from 'react';
import { View } from 'react-native';

/**
 * Returns a colour on a red → yellow → green gradient for 0 → 100 %.
 */
function batteryColor(pct) {
    const p = Math.max(0, Math.min(100, pct));
    if (p <= 50) {
        const ratio = p / 50;
        const r = 255;
        const g = Math.round(200 * ratio);
        return `rgb(${r},${g},0)`;
    }
    const ratio = (p - 50) / 50;
    const r = Math.round(255 * (1 - ratio));
    const g = 200;
    return `rgb(${r},${g},0)`;
}

/**
 * A native battery icon whose fill % and colour reflect the charge level.
 *
 * @param {number}  percentage  – 0-100 charge %
 * @param {number}  [size=48]   – controls overall icon dimensions
 * @param {object}  colors      – theme colours (must include `text`)
 */
export const BatteryIcon = ({ percentage, size = 48, colors }) => {
    const w = size * 2;
    const h = size;
    const borderW = 2;
    const tipW = size * 0.1;
    const tipH = h * 0.4;
    const innerW = w - borderW * 2 - 4;
    const innerH = h - borderW * 2 - 4;
    const fillW = (innerW * Math.min(100, Math.max(0, percentage))) / 100;
    const color = batteryColor(percentage);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Battery body */}
            <View
                style={{
                    width: w,
                    height: h,
                    borderWidth: borderW,
                    borderColor: colors.text,
                    borderRadius: 6,
                    justifyContent: 'center',
                    padding: 2,
                }}
            >
                {/* Fill */}
                <View
                    style={{
                        width: fillW,
                        height: innerH,
                        backgroundColor: color,
                        borderRadius: 3,
                    }}
                />
            </View>
            {/* Positive terminal nub */}
            <View
                style={{
                    width: tipW,
                    height: tipH,
                    backgroundColor: colors.text,
                    borderTopRightRadius: 3,
                    borderBottomRightRadius: 3,
                }}
            />
        </View>
    );
};
