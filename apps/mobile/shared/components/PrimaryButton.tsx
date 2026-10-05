import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function PrimaryButton({ title, onPress, style }: Props) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.text}>{title}</Text>
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
  text: { color: '#fff', fontWeight: '700' },
});
