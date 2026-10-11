import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function PrimaryButton({ title, onPress, style, disabled = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  text: { color: '#fff', fontWeight: '700' },
  disabledText: { opacity: 0.8 },
});
