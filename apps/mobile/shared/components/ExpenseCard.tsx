import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExpenseCard({ title, amount }: { title: string; amount: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>${amount / 100}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#edf2f7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontWeight: '600' },
  amount: { fontWeight: '700' },
});
