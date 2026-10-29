import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LockKeyhole, Mail, Wallet } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useAppDispatch } from '../../../shared/hooks/useAppHooks';
import { setCredentials } from '../authSlice';
import { saveAuthSession } from '../authStorage';
import { useLoginMutation } from '../../../services/api/apiSlice';
import { colors, spacing } from '../../../shared/theme';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function getLoginErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return 'Unable to log in. Please try again.';
  }

  const { status, data } = error as { status?: unknown; data?: unknown };
  const responseMessage =
    typeof data === 'object' && data !== null
      ? (data as { message?: unknown }).message
      : undefined;

  if (typeof responseMessage === 'string') {
    return responseMessage;
  }
  if (Array.isArray(responseMessage)) {
    const messages = responseMessage.filter((message): message is string => typeof message === 'string');
    if (messages.length > 0) return messages.join('\n');
  }
  if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
    return typeof data === 'string' && data.length > 0
      ? data
      : 'Could not connect to the API. Check your connection and make sure API_URL points to an address your device can reach.';
  }
  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  return 'Unable to log in. Please try again.';
}

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const result = await login(data).unwrap();
      await saveAuthSession(result);
      dispatch(setCredentials({ token: result.access, refreshToken: result.refresh, user: result.user }));
    } catch (error) {
      Alert.alert('Login failed', getLoginErrorMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Wallet size={27} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.brand}>Money Splitzy</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to keep shared spending simple.</Text>
        <View style={styles.form}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <View>
                <AppTextInput
                  icon={Mail}
                  placeholder="Email address"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.email ? <Text style={styles.fieldError}>{errors.email.message}</Text> : null}
              </View>
            )}
          />
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <View>
                <AppTextInput
                  icon={LockKeyhole}
                  placeholder="Password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
                {errors.password ? <Text style={styles.fieldError}>Password must be at least 8 characters.</Text> : null}
              </View>
            )}
          />
          <PrimaryButton title={isLoading ? 'Logging in...' : 'Log in'} onPress={handleSubmit(onSubmit)} disabled={isLoading} />
        </View>
        <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
          <Text style={styles.linkPrompt}>New to Money Splitzy?</Text>
          <Text style={styles.link}> Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen, paddingVertical: 36 },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', letterSpacing: 0.2, marginBottom: 38 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 26 },
  form: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: -9, marginBottom: 12, marginLeft: 5 },
  linkButton: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  linkPrompt: { color: colors.muted, fontSize: 14 },
  link: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
