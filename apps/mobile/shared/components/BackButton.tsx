import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../theme';

export default function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ArrowLeft size={18} color={colors.primaryDark} strokeWidth={2.2} />
      <Text style={styles.text}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingVertical: 4 },
  pressed: { opacity: 0.65 },
  text: { color: colors.primaryDark, fontSize: 14, fontWeight: '700', marginLeft: 7 },
});
