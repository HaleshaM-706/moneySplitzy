import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupCard({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#667085' },
});
