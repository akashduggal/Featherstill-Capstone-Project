import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const UpdateReadyBanner = ({ onRestart }) => {
  const colors = Colors['dark'];

  return (
    <View style={[styles.banner, { backgroundColor: colors.tint }]}>
      <Ionicons name="arrow-down-circle-outline" size={24} color={colors.background} />
      <Text style={[styles.bannerText, { color: colors.background }]}>
        A new update is ready to install.
      </Text>
      <TouchableOpacity onPress={onRestart} style={styles.restartButton}>
        <Text style={[styles.restartButtonText, { color: colors.background }]}>Restart</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  restartButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default UpdateReadyBanner;