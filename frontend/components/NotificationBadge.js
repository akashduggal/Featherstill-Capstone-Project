import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A small red notification badge with a count.
 *
 * @param {number} count – number to display inside the badge
 */
export const NotificationBadge = ({ count }) => {
    if (!count || count <= 0) return null;

    return (
        <View style={styles.badge}>
            <Text style={styles.text}>{count}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    text: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
