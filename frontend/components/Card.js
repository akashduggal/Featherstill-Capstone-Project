import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Card = ({ children, style, variant = 'default', colors }) => {
  const cardStyle = {
    backgroundColor: colors ? colors.surface : '#fff',
    borderColor: colors ? colors.cardBorder : '#eee',
  };

  return (
    <View style={[styles.card, cardStyle, variant === 'elevated' && styles.elevated, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  elevated: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
