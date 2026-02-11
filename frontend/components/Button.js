import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  style,
  textStyle 
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'secondary': return 'transparent';
      case 'outline': return 'transparent';
      case 'danger': return '#dc3545';
      default: return '#007AFF';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666';
    switch (variant) {
      case 'secondary': return '#007AFF';
      case 'outline': return '#007AFF';
      default: return '#fff';
    }
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1, borderColor: '#007AFF' };
    return {};
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
