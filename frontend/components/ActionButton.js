import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * A full-width action button with optional icon and danger variant.
 *
 * @param {string}   title    – button label
 * @param {function} onPress  – press handler
 * @param {object}   colors   – theme colours
 * @param {string}   [icon]   – optional Ionicons icon name
 * @param {string}   [variant]– "default" | "danger"
 */
export const ActionButton = ({ title, onPress, colors, icon, variant = 'default' }) => {
    const isDanger = variant === 'danger';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    borderColor: isDanger ? colors.error : colors.cardBorder,
                    backgroundColor: isDanger ? colors.error + '10' : colors.surface,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.inner}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isDanger ? colors.error : colors.tint}
                        style={styles.icon}
                    />
                )}
                <Text
                    style={[
                        styles.text,
                        { color: isDanger ? colors.error : colors.text },
                    ]}
                >
                    {title}
                </Text>
            </View>
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
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        marginRight: 2,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
