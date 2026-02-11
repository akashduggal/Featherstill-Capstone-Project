import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const Typography = ({ 
  children, 
  variant = 'body', 
  color, 
  align = 'left',
  style,
  ...props 
}) => {
  const getStyle = () => {
    switch (variant) {
      case 'h1': return styles.h1;
      case 'h2': return styles.h2;
      case 'h3': return styles.h3;
      case 'caption': return styles.caption;
      default: return styles.body;
    }
  };

  return (
    <Text 
      style={[
        getStyle(), 
        { textAlign: align },
        color && { color },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  caption: {
    fontSize: 12,
    color: '#666',
  },
});
