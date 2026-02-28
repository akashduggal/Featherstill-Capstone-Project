import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * An interactive checkbox with label and optional subtext.
 *
 * @param {boolean}  checked   – whether the checkbox is checked
 * @param {function} onToggle  – callback called when tapped
 * @param {string}   label     – label text next to the checkbox
 * @param {string}   [subText] – optional description below
 * @param {object}   colors    – theme colours
 */
export const SettingsCheckbox = ({ checked, onToggle, label, subText, colors }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onToggle}
                style={styles.row}
            >
                <View
                    style={[
                        styles.checkbox,
                        {
                            backgroundColor: checked ? colors.success : 'transparent',
                            borderColor: checked ? colors.success : colors.icon,
                        },
                    ]}
                >
                    {checked && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                </View>
                <Text style={[styles.label, { color: colors.text }]}>
                    {label}
                </Text>
            </TouchableOpacity>
            {subText && (
                <Text style={[styles.subText, { color: colors.icon }]}>
                    {subText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    subText: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 30,
        marginTop: 2,
    },
});
