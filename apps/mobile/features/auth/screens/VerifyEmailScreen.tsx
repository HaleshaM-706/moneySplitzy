import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MailCheck, Wallet } from 'lucide-react-native';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useResendVerificationMutation } from '../../../services/api/apiSlice';
import { colors, spacing } from '../../../shared/theme';

type Props = {
  navigation: any;
  route: { params: { email: string; emailSent: boolean } };
};

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { email, emailSent } = route.params;
  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const [message, setMessage] = useState(
    emailSent
      ? 'We sent you a verification link. Open it to confirm your email address.'
      : 'Your account was created, but we could not send the verification email. Please try again.',
  );

  const onResend = async () => {
    try {
      const result = await resendVerification({ email }).unwrap();
      setMessage(result.message);
    } catch {
      Alert.alert('Could not send email', 'Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Wallet size={27} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.brand}>Money Splitzy</Text>
        <View style={styles.icon}>
          <MailCheck size={34} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>{message}</Text>
        <Text style={styles.email}>{email}</Text>
        <PrimaryButton
          title={isLoading ? 'Sending...' : 'Resend verification email'}
          onPress={onResend}
          disabled={isLoading}
          style={styles.resendButton}
        />
        <Pressable onPress={() => navigation.replace('Login')} style={styles.linkButton}>
          <Text style={styles.link}>Back to log in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { padding: spacing.screen, alignItems: 'flex-start' },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', letterSpacing: 0.2, marginBottom: 34 },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  email: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 13, marginBottom: 24 },
  resendButton: { width: '100%' },
  linkButton: { alignSelf: 'center', marginTop: 22 },
  link: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
