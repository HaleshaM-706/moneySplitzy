import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { colors } from '../theme';

type Props = {
  name: string;
  subtitle: string;
  onPress?: () => void;
  icon?: string;
  totalMinor?: number;
  netMinor?: number;
  currency?: string;
  recentActivity?: string;
  lastActivityAt?: string;
};

export default function GroupCard({
  name,
  subtitle,
  onPress,
  icon,
  totalMinor,
  netMinor,
  currency = 'INR',
  recentActivity,
  lastActivityAt,
}: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.iconWrap}>
        {icon ? <Text style={styles.emoji}>{icon}</Text> : <Users size={19} color={colors.primaryDark} strokeWidth={1.9} />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {recentActivity ? <Text style={styles.activity}>{recentActivity} · {lastActivityAt ? new Date(lastActivityAt).toLocaleDateString() : 'Recently'}</Text> : null}
        {typeof totalMinor === 'number' || typeof netMinor === 'number' ? (
          <View style={styles.summary}>
            {typeof totalMinor === 'number' ? (
              <Text style={styles.summaryText}>
                Total {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(totalMinor / 100)}
              </Text>
            ) : null}
            {typeof netMinor === 'number' ? (
              <Text style={[styles.summaryText, netMinor < 0 && styles.negative]}>
                {netMinor === 0 ? 'Settled up' : netMinor > 0 ? 'You are owed ' : 'You owe '}
                {netMinor === 0 ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.abs(netMinor) / 100)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <ChevronRight size={19} color="#A4AEA8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginHorizontal: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: colors.muted, fontSize: 13 },
  activity: { color: colors.muted, fontSize: 11, marginTop: 5 },
  emoji: { fontSize: 23 },
  summary: { marginTop: 7, gap: 3 },
  summaryText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  negative: { color: colors.danger },
});
