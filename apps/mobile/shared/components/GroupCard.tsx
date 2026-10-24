import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { colors } from '../theme';

type Props = {
  name: string;
  subtitle: string;
  onPress?: () => void;
};

export default function GroupCard({ name, subtitle, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.iconWrap}>
        <Users size={19} color={colors.primaryDark} strokeWidth={1.9} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
});
