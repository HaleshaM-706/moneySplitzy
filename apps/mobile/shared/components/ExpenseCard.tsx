import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { colors } from '../theme';

export default function ExpenseCard({
  title,
  amount,
  currency = 'INR',
  subtitle,
}: {
  title: string;
  amount: number;
  currency?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Receipt size={18} color={colors.primaryDark} strokeWidth={1.9} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.amount}>
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount / 100)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginHorizontal: 11 },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  amount: { color: colors.text, fontWeight: '800', fontSize: 14 },
});
