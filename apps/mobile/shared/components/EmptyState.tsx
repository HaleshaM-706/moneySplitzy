import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleDollarSign } from 'lucide-react-native';
import { colors } from '../theme';

export default function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <CircleDollarSign size={24} color={colors.primaryDark} strokeWidth={1.8} />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  text: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
