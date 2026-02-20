import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Yellow triangle ⚠ warning banner shown when cell voltage imbalance
 * exceeds a safe threshold.
 *
 * @param {number}  delta       – voltage difference (maxV - minV)
 * @param {number}  [threshold=0.2] – delta above which to show the warning
 * @param {object}  colors      – theme colours (must include `warning`, `text`)
 */
export const CellImbalanceWarning = ({
    delta,
    threshold = 0.2,
    colors,
}) => {
    if (delta < threshold) return null;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.warning + '20', borderColor: colors.warning },
            ]}
        >
            {/* Triangle icon built with borders */}
            <View style={styles.triangleOuter}>
                <View style={[styles.triangle, { borderBottomColor: colors.warning }]} />
                <Text style={[styles.exclamation, { color: '#000' }]}>!</Text>
            </View>

            <View style={styles.textBlock}>
                <Text style={[styles.title, { color: colors.warning }]}>
                    Cell Imbalance Detected
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                    Voltage difference: {delta.toFixed(3)} V (threshold: {threshold.toFixed(1)} V)
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 20,
        gap: 12,
    },

    /* Triangle ⚠ icon */
    triangleOuter: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    triangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 16,
        borderRightWidth: 16,
        borderBottomWidth: 28,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#F59E0B',
        position: 'absolute',
    },
    exclamation: {
        fontSize: 16,
        fontWeight: '900',
        marginTop: 6,
        zIndex: 1,
    },

    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    detail: {
        fontSize: 12,
        fontWeight: '500',
    },
});
