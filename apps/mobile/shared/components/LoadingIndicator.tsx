import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function LoadingIndicator() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#2ecc71" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
