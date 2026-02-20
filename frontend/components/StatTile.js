import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A single stat tile shown in a 2-column grid (center-aligned).
 *
 * @param {string}  label       – e.g. "Min Cell Voltage"
 * @param {string}  value       – formatted value string
 * @param {string}  [unit]      – optional unit appended after value
 * @param {string}  [valueColor]– override colour for the value text
 * @param {object}  colors      – theme colours (must include `icon`, `text`)
 */
export const StatTile = ({ label, value, unit, valueColor, colors }) => {
    return (
        <View style={styles.tile}>
            <Text style={[styles.label, { color: colors.icon }]}>{label}</Text>
            <Text
                style={[
                    styles.value,
                    { color: colors.text },
                    valueColor && { color: valueColor },
                ]}
            >
                {value}
                {unit ? ` ${unit}` : ''}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tile: {
        width: '48%',
        marginBottom: 16,
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    value: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
});
