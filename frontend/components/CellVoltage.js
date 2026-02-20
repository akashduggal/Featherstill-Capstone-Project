import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A single cell-voltage entry for the cells grid.
 *
 * @param {number}  index   – 1-based cell number
 * @param {number}  voltage – voltage reading
 * @param {object}  colors  – theme colours (must include `accent`, `text`)
 */
export const CellVoltage = ({ index, voltage, colors }) => {
    return (
        <View style={styles.item}>
            <Text style={[styles.label, { color: colors.accent }]}>V{index}</Text>
            <Text style={[styles.value, { color: colors.text }]}>
                {voltage.toFixed(3)} V
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        width: '48%',
        marginBottom: 14,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
    },
    value: {
        fontSize: 16,
    },
});
