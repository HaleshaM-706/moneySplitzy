import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BalanceCard({ title, amount }: { title: string; amount: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>${Math.abs(amount) / 100}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
});
