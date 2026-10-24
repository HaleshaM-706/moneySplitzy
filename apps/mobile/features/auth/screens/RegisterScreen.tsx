import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LockKeyhole, Mail, UserRound, Wallet } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useRegisterMutation } from '../../../services/api/apiSlice';
import { colors, spacing } from '../../../shared/theme';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function RegisterScreen({ navigation }: any) {
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });
  const [register, { isLoading }] = useRegisterMutation();

  const onSubmit = async (data: any) => {
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      navigation.replace('Login');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.data?.message || 'Unable to create account. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Wallet size={27} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.brand}>Money Splitzy</Text>
        <Text style={styles.title}>Let’s get started</Text>
        <Text style={styles.subtitle}>Create an account and make splitting simple.</Text>
        <View style={styles.form}>
          <Controller
            name="name"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <AppTextInput icon={UserRound} placeholder="Your name" value={value} onChangeText={onChange} autoCapitalize="words" />
            )}
          />
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <AppTextInput icon={Mail} placeholder="Email address" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" />
            )}
          />
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <AppTextInput icon={LockKeyhole} placeholder="Password (8+ characters)" secureTextEntry value={value} onChangeText={onChange} />
            )}
          />
          <PrimaryButton title={isLoading ? 'Creating account...' : 'Create account'} onPress={handleSubmit(onSubmit)} disabled={isLoading} />
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.linkButton}>
          <Text style={styles.linkPrompt}>Already have an account?</Text>
          <Text style={styles.link}> Log in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen, paddingVertical: 30 },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', letterSpacing: 0.2, marginBottom: 28 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  form: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16 },
  linkButton: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  linkPrompt: { color: colors.muted, fontSize: 14 },
  link: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
