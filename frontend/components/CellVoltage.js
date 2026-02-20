import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A single cell-voltage card with a colored accent bar.
 * Highlights the cell in warning/error color if its voltage is the
 * min or max in the pack.
 *
 * @param {number}  index    – 1-based cell number
 * @param {number}  voltage  – voltage reading
 * @param {boolean} [isMin]  – true if this is the lowest voltage cell
 * @param {boolean} [isMax]  – true if this is the highest voltage cell
 * @param {object}  colors   – theme colours
 */
export const CellVoltage = ({ index, voltage, isMin, isMax, colors }) => {
    const accentColor = isMin
        ? colors.error
        : isMax
            ? colors.success
            : colors.accent;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                },
            ]}
        >
            {/* Accent strip */}
            <View style={[styles.strip, { backgroundColor: accentColor }]} />

            <View style={styles.content}>
                <Text style={[styles.label, { color: accentColor }]}>V{index}</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                    {voltage.toFixed(3)} V
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '48%',
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    strip: {
        width: 4,
    },
    content: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    value: {
        fontSize: 15,
        fontWeight: '600',
    },
});
