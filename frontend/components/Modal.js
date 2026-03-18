import React from 'react';
import { Modal as RNModal, View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Card } from './Card';
import { Colors } from '../constants/Colors';

export const Modal = ({ visible, title, message, onClose }) => {
  const theme = "dark";
  const colors = Colors[theme];

  return (
    <RNModal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Card style={styles.modalCard} colors={colors}>
          <Typography variant="h2" style={[styles.title, { color: colors.text }]}>{title}</Typography>
          <Typography style={[styles.message, { color: colors.text }]}>{message}</Typography>
          <Button title="Close" onPress={onClose} style={styles.button} />
        </Card>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
