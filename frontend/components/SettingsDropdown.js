import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    UIManager,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * An interactive dropdown selector with animated expand/collapse.
 *
 * @param {string}   label         – section label above the dropdown
 * @param {string[]} options       – list of option strings
 * @param {number}   selectedIndex – currently selected index
 * @param {function} onSelect      – callback(index) when an option is tapped
 * @param {string}   [subText]     – optional info text below the dropdown
 * @param {object}   colors        – theme colours
 * @param {React.ReactNode} [labelRight] – optional element to the right of the label
 */
export const SettingsDropdown = ({
    label,
    options,
    selectedIndex,
    onSelect,
    subText,
    colors,
    labelRight,
}) => {
    const [open, setOpen] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(!open);
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                {labelRight}
            </View>

            {/* Selected value / trigger */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggle}
                style={[
                    styles.dropdown,
                    {
                        backgroundColor: colors.surface,
                        borderColor: open ? colors.tint : colors.success,
                    },
                ]}
            >
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {options[selectedIndex]}
                </Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.icon}
                />
            </TouchableOpacity>

            {/* Options list (animated) */}
            {open && (
                <View
                    style={[
                        styles.optionsList,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.cardBorder,
                        },
                    ]}
                >
                    {options.map((option, i) => {
                        const isSelected = i === selectedIndex;
                        return (
                            <TouchableOpacity
                                key={i}
                                activeOpacity={0.6}
                                onPress={() => {
                                    LayoutAnimation.configureNext(
                                        LayoutAnimation.Presets.easeInEaseOut
                                    );
                                    onSelect(i);
                                    setOpen(false);
                                }}
                                style={[
                                    styles.option,
                                    isSelected && {
                                        backgroundColor: colors.tint + '18',
                                    },
                                    i < options.length - 1 && {
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                        borderBottomColor: colors.cardBorder,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: isSelected ? colors.tint : colors.text },
                                        isSelected && { fontWeight: '700' },
                                    ]}
                                >
                                    {option}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={18} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

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
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1.5,
        marginBottom: 6,
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '500',
    },
    optionsList: {
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 6,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    subText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
