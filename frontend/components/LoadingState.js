import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Typography } from './Typography';

export const LoadingState = ({ message = 'Loading...', size = 'large', color = '#007AFF', style }) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} style={styles.spinner} />
      {message && <Typography variant="body" color="#666" align="center">{message}</Typography>}
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
  spinner: {
    marginBottom: 12,
  },
});
