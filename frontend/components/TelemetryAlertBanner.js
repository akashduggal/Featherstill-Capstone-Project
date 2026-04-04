import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A unified alert banner used for rendering critical telemetry validations
 * like Overvoltage, Deep Discharge, or Temperature Extremes.
 *
 * @param {string}  title   – The title of the alert
 * @param {string}  detail  – Descriptive text with the actual values/thresholds
 * @param {string}  [level='warning'] – 'warning' (yellow) or 'error' (red)
 * @param {object}  colors  – The theme colors object containing .warning, .danger, .text
 */
export const TelemetryAlertBanner = ({
    title,
    detail,
    level = 'warning',
    colors,
}) => {
    const isError = level === 'error';
    const themeColor = isError ? colors.danger : colors.warning;
    const bgColor = themeColor + '20'; // 20% opacity using hex append

    return (
        <View style={[styles.container, { backgroundColor: bgColor, borderColor: themeColor }]}>
            
            {/* Conditional Icon Rendering based on Alert Severity */}
            {!isError ? (
                // Yellow Triangle for Warnings
                <View style={styles.iconOuter}>
                    <View style={[styles.triangle, { borderBottomColor: themeColor }]} />
                    <Text style={[styles.exclamation, { color: '#000' }]}>!</Text>
                </View>
            ) : (
                // Solid Red Circle for Critical Errors
                <View style={[styles.iconOuter, { height: 28, width: 28, borderRadius: 14, backgroundColor: themeColor }]}>
                    <Text style={[styles.exclamation, { color: '#fff', marginTop: -1 }]}>!</Text>
                </View>
            )}

            {/* Alert Text Block */}
            <View style={styles.textBlock}>
                <Text style={[styles.title, { color: themeColor }]}>
                    {title}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                    {detail}
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
        marginBottom: 12,
        gap: 12,
        width: '100%',
    },

    /* Warning Icon Geometry */
    iconOuter: {
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
        position: 'absolute',
    },
    exclamation: {
        fontSize: 16,
        fontWeight: '900',
        marginTop: 6,
        zIndex: 1,
    },

    /* Text Block Styling */
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
        lineHeight: 16,
    },
});
