
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ActionButton } from './ActionButton';

const ProgressBar = ({ progress, colors }) => (
  <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
    <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.accent }]} />
  </View>
);

const PacketAnimation = ({ colors }) => {
  const packetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(packetAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = packetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  return (
    <View style={styles.animationContainer}>
      <Ionicons name="phone-portrait-outline" size={32} color={colors.icon} />
      <View style={[styles.pathway, { backgroundColor: colors.surface }]}>
        <Animated.View style={[styles.packet, { backgroundColor: colors.accent, transform: [{ translateX }] }]} />
      </View>
      <Ionicons name="hardware-chip-outline" size={32} color={colors.icon} />
    </View>
  );
};

export const OtaUpdateModal = ({ visible, status, progress, onClose, onAbort, colors }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'starting':
        return 'Preparing for update...';
      case 'in_progress':
        return `Update in progress: ${progress}%`;
      case 'success':
        return 'Update successful! The device will now reboot.';
      case 'error':
        return 'OTA update failed. Please try again.';
      default:
        return `Status: ${status}`;
    }
  };

  const isUpdateInProgress = status === 'in_progress' || status === 'starting';

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.content, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
          <Ionicons name="cloud-upload-outline" size={80} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>
            Firmware Update
          </Text>
          <View style={styles.illustrationContainer}>
            {status === 'in_progress' 
              && <PacketAnimation colors={colors} />
            }
          </View>
          <View style={styles.statusContainer}>
            {status === 'starting' && (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 20 }} />
            )}
            <Text style={[styles.statusText, { color: colors.text }]}>
              {getStatusMessage()}
            </Text>
            {status === 'in_progress' && (
              <ProgressBar progress={progress} colors={colors} />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <ActionButton
              title="Close"
              onPress={isUpdateInProgress ? onAbort : onClose}
              colors={colors}
              variant={isUpdateInProgress ? 'outline' : 'filled'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    width: '85%',
    borderWidth: 1,
  },
  illustrationContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
  },
  pathway: {
    width: 150,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  packet: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statusContainer: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
  },
  progressBarContainer: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});
