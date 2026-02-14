import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';

export const ErrorState = ({ 
  title = 'Something went wrong', 
  message = 'We encountered an error while processing your request.', 
  onRetry, 
  retryLabel = 'Try Again',
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="h3" color="#dc3545" align="center" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="body" align="center" style={styles.message}>
        {message}
      </Typography>
      {onRetry && (
        <Button 
          title={retryLabel} 
          onPress={onRetry} 
          variant="outline" 
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    color: '#666',
  },
  button: {
    minWidth: 120,
  },
});
