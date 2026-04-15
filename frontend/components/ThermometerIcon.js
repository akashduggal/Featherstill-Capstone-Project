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
    minTemp = 0, // Base scale minimum in Celsius
    maxTemp = 60, // Base scale maximum in Celsius
    isFahrenheit = false,
    colors,
}) => {
    const tubeW = 8;
    const tubeH = 22;
    const bulbSize = 14;
    const borderW = 1.5;

    // 1. Explicitly define boundaries in both units
    const minC = minTemp;
    const maxC = maxTemp;
    
    // F = (C * 9/5) + 32
    const minF = (minC * 9 / 5) + 32;
    const maxF = (maxC * 9 / 5) + 32;

    // 2. Select the correct active range bounds based on selected unit
    const activeMin = isFahrenheit ? minF : minC;
    const activeMax = isFahrenheit ? maxF : maxC;

    // 3. Normalize the current temperature value back to Celsius strictly for the color picker
    // C = (F - 32) * 5/9
    const tempInC = isFahrenheit ? (temperature - 32) * 5 / 9 : temperature;

    // 4. Calculate fill percentage purely within the active unit's range bounds
    const clamped = Math.max(activeMin, Math.min(activeMax, temperature));
    let fillPct = ((clamped - activeMin) / (activeMax - activeMin)) * 100;
    
    // Fallback safety to ensure it doesn't break SVG/View height constraints
    if (isNaN(fillPct)) fillPct = 0;

    const fillH = ((tubeH - borderW * 2 - 2) * fillPct) / 100;
    const color = tempColor(tempInC);

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
