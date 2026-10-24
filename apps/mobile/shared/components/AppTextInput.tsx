import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../theme';

interface Props extends TextInputProps {
  icon?: LucideIcon;
}

export default function AppTextInput({ icon: Icon, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      {Icon ? <Icon size={19} color={colors.muted} strokeWidth={1.8} /> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#98A39C"
        selectionColor={colors.primary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 13,
    marginLeft: 11,
  },
});
