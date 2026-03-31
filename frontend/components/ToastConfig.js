import React from 'react';
import { BaseToast } from 'react-native-toast-message';
import { Colors } from '../constants/Colors';

const colors = Colors.dark; // App is using dark theme

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.success, backgroundColor: colors.surface, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.icon,
      }}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.error, backgroundColor: colors.surface, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.icon,
      }}
    />
  ),
};