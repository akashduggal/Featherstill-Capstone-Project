import React from 'react';
import { View } from 'react-native';

/**
 * Returns a temperature colour:
 *   ≤ 10 °C → blue (cold)
 *   10–35 °C → green (normal)
 *   35–45 °C → orange (warm)
 *   > 45 °C  → red (danger)
 */
function tempColor(temp) {
    if (temp <= 10) return '#3B82F6';   // blue
    if (temp <= 35) return '#10B981';   // green
    if (temp <= 45) return '#F59E0B';   // orange/warning
    return '#EF4444';                    // red
}

/**
 * A thermometer icon with a mercury fill that reflects the temperature.
 *
 * @param {number}  temperature – current temperature in °C
 * @param {number}  [minTemp=0] – bottom of scale
 * @param {number}  [maxTemp=60]– top of scale
 * @param {object}  colors      – theme colours (must include `text`, `cardBorder`)
 */
export const ThermometerIcon = ({
    temperature,
    minTemp = 0,
    maxTemp = 60,
    colors,
}) => {
    const tubeW = 8;
    const tubeH = 22;
    const bulbSize = 14;
    const borderW = 1.5;

    const clamped = Math.max(minTemp, Math.min(maxTemp, temperature));
    const fillPct = ((clamped - minTemp) / (maxTemp - minTemp)) * 100;
    const fillH = ((tubeH - borderW * 2 - 2) * fillPct) / 100;
    const color = tempColor(temperature);

    return (
        <View style={{ alignItems: 'center' }}>
            {/* Tube */}
            <View
                style={{
                    width: tubeW,
                    height: tubeH,
                    borderWidth: borderW,
                    borderColor: colors.cardBorder || colors.text,
                    borderTopLeftRadius: tubeW / 2,
                    borderTopRightRadius: tubeW / 2,
                    borderBottomWidth: 0,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        width: tubeW - borderW * 2 - 1,
                        height: fillH,
                        backgroundColor: color,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                    }}
                />
            </View>
            {/* Bulb */}
            <View
                style={{
                    width: bulbSize,
                    height: bulbSize,
                    borderRadius: bulbSize / 2,
                    backgroundColor: color,
                    borderWidth: borderW,
                    borderColor: colors.cardBorder || colors.text,
                    marginTop: -borderW,
                }}
            />
        </View>
    );
};
