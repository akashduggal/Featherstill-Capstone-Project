import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Intuitive color palettes for each alert level.
 * Each palette has a solid background, border, icon, title, and detail color
 * designed for maximum readability on dark backgrounds.
 */
const ALERT_PALETTES = {
    error: {
        bg: '#7F1D1D',      // deep red background
        border: '#EF4444',   // bright red border
        icon: '#FCA5A5',     // soft red icon
        title: '#FCA5A5',    // soft red title
        detail: '#FECACA',   // very light red detail text
        ionicon: 'alert-circle',
    },
    warning: {
        bg: '#3D3000',      // deep yellow background
        border: '#EAB308',   // yellow border
        icon: '#FDE047',     // bright yellow icon
        title: '#FDE047',    // bright yellow title
        detail: '#FEF9C3',   // very light yellow detail text
        ionicon: 'warning',
    },
    info: {
        bg: '#1E3A5F',      // deep blue background
        border: '#3B82F6',   // bright blue border
        icon: '#93C5FD',     // light blue icon
        title: '#93C5FD',    // light blue title
        detail: '#DBEAFE',   // very light blue detail text
        ionicon: 'information-circle',
    },
};

/**
 * A telemetry alert banner with solid, readable colors.
 *
 * @param {string}  title   – The title of the alert
 * @param {string}  detail  – Descriptive text with the actual values/thresholds
 * @param {string}  [level='warning'] – 'error' (red), 'warning' (amber), or 'info' (blue)
 */
export const TelemetryAlertBanner = ({
    title,
    detail,
    level = 'warning',
}) => {
    const isError = level === 'error';
    const themeColor = isError ? "#EF4444" : colors.warning;
    const bgColor = themeColor + '20'; // 20% opacity using hex append

    return (
        <View style={[styles.container, { backgroundColor: bgColor, borderColor: themeColor }]}>
            
            {/* Conditional Icon Rendering based on Alert Severity */}
            {!isError ? (
                // Yellow Triangle for Warnings
                <View style={styles.iconOuter}>
                    <View style={[styles.triangle, { borderBottomColor: themeColor }]} />
                    <Text style={[styles.exclamation, { color: colors.background }]}>!</Text>
                </View>
            ) : (
                // Solid Red Circle for Critical Errors
                <View style={[styles.iconOuter, { height: 28, width: 28, borderRadius: 14, backgroundColor: themeColor }]}>
                    <Text style={[styles.exclamation, { color: colors.background, marginTop: -1 }]}>!</Text>
                </View>
            )}

            <View style={styles.textBlock}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.detail, { color: palette.detail }]}>
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
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 12,
        gap: 12,
        width: '100%',
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
    },
    detail: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 17,
    },
});
