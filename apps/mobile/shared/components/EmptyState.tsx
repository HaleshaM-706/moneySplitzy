import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#667085',
    fontSize: 14,
  },
});
