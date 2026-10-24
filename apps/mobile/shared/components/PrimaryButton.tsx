import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors } from '../theme';

interface Props {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function PrimaryButton({ title, onPress, style, disabled = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      disabled={disabled}
    >
      <View style={styles.content}>
        <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    borderRadius: 15,
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disabledButton: {
    opacity: 0.65,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledText: { opacity: 0.9 },
});
