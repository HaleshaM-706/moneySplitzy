import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { colors } from '../theme';

export default function BalanceCard({ title, amount, currency = 'INR' }: { title: string; amount: number; currency?: string }) {
  const isOwed = amount >= 0;
  const Icon = isOwed ? ArrowDownLeft : ArrowUpRight;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, !isOwed && styles.owedIconWrap]}>
        <Icon size={19} color={isOwed ? colors.primaryDark : colors.danger} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.amount, !isOwed && styles.owedAmount]}>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Math.abs(amount) / 100)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owedIconWrap: { backgroundColor: colors.dangerLight },
  copy: { marginLeft: 13 },
  title: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  amount: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  owedAmount: { color: colors.text },
});
