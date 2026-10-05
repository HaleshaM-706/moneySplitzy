import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export default function AppTextInput(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#888" {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});
