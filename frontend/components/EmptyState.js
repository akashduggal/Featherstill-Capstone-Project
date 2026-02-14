import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';

export const EmptyState = ({ 
  title = 'No data available', 
  message = 'There is nothing to display here yet.', 
  actionLabel, 
  onAction,
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="h3" align="center" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="body" align="center" color="#666" style={styles.message}>
        {message}
      </Typography>
      {onAction && actionLabel && (
        <Button 
          title={actionLabel} 
          onPress={onAction} 
          variant="primary" 
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    opacity: 0.8,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});
