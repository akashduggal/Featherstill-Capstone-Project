
import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { ActionButton } from './ActionButton';

// A simple, local ProgressBar component to avoid external dependencies.
const ProgressBar = ({ progress, colors }) => (
  <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
    <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: colors.primary }]} />
  </View>
);

export const OtaUpdateModal = ({ visible, status, progress, onClose, onAbort, colors }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'starting':
        return 'Starting OTA update...';
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

  const showProgressBar = status === 'in_progress' || status === 'starting';
  const showAbortButton = status === 'in_progress' || status === 'starting';
  const showCloseButton = status === 'success' || status === 'error' ||  status === 'idle';

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Firmware Update
          </Text>

          <View style={styles.statusContainer}>
            <Text style={{ color: colors.text }}>
              {getStatusMessage()}
            </Text>
            {showProgressBar && (
              <ProgressBar progress={progress} colors={colors} />
            )}
          </View>

          <View style={styles.buttonContainer}>
            {showAbortButton && (
              <ActionButton title="Abort" onPress={onAbort} colors={colors} variant="outline" />
            )}
            {showCloseButton && (
              <ActionButton title="Close" onPress={onClose} colors={colors} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 10,
    width: '80%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusContainer: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  progressBarContainer: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    marginTop: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
});
