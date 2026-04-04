import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

const DownloadProgressModal = ({ visible }) => {
  const colors = Colors['dark'];

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.modalText, { color: colors.text }]}>
            Downloading update...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginTop: 15,
    fontSize: 16,
  },
});

export default DownloadProgressModal;