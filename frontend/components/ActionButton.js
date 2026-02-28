import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * A full-width bordered action button.
 *
 * @param {string}   title   – button label
 * @param {function} onPress – press handler
 * @param {object}   colors  – theme colours
 */
export const ActionButton = ({ title, onPress, colors }) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.surface,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.text, { color: colors.text }]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
