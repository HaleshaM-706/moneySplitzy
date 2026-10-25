import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { Sparkles, Wallet } from 'lucide-react-native';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { bareClient, checkApiHealth } from '../../../services/api/apiClient';
import { useAppDispatch } from '../../../shared/hooks/useAppHooks';
import { clearCredentials, setCredentials, setSessionChecked } from '../authSlice';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../authStorage';
import { colors } from '../../../shared/theme';

const MAX_ATTEMPTS = 6;
const INITIAL_RETRY_DELAY_MS = 15000;

export default function SplashScreen() {
  const dispatch = useAppDispatch();
  const [retryNonce, setRetryNonce] = useState(0);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let resolveRetry: (() => void) | undefined;

    const checkServer = async () => {
      setIsUnavailable(false);
      for (let currentAttempt = 1; currentAttempt <= MAX_ATTEMPTS; currentAttempt += 1) {
        if (cancelled) return;
        try {
          await checkApiHealth();
        } catch {
          if (cancelled) return;
          if (currentAttempt === MAX_ATTEMPTS) {
            setIsUnavailable(true);
            return;
          }
          const delay = INITIAL_RETRY_DELAY_MS * 2 ** (currentAttempt - 1);
          await new Promise<void>(resolve => {
            resolveRetry = resolve;
            retryTimer = setTimeout(() => {
              resolveRetry = undefined;
              resolve();
            }, delay);
          });
          continue;
        }

        try {
          const session = await loadAuthSession();
          if (cancelled) return;
          if (!session) {
            dispatch(setSessionChecked());
            return;
          }

          const response = await bareClient.post<{ access?: string; refresh?: string }>(
            '/auth/refresh',
            { userId: session.user.id, refresh: session.refresh },
          );
          if (cancelled) return;

          if (!response.data.access || !response.data.refresh) {
            try {
              await clearAuthSession();
            } catch {
              setIsUnavailable(true);
              return;
            }
            dispatch(clearCredentials());
            return;
          }

          const renewedSession = {
            access: response.data.access,
            refresh: response.data.refresh,
            user: session.user,
          };
          await saveAuthSession(renewedSession);
          if (!cancelled) {
            dispatch(setCredentials({
              token: renewedSession.access,
              refreshToken: renewedSession.refresh,
              user: renewedSession.user,
            }));
          }
          return;
        } catch (error) {
          if (cancelled) return;
          if (axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0)) {
            try {
              await clearAuthSession();
            } catch {
              setIsUnavailable(true);
              return;
            }
            dispatch(clearCredentials());
            return;
          }

          setIsUnavailable(true);
          return;
        }
      }
    };

    checkServer();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      resolveRetry?.();
    };
  }, [dispatch, retryNonce]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Wallet size={34} color={colors.primaryDark} strokeWidth={2} />
        <View style={styles.sparkle}><Sparkles size={15} color={colors.primaryDark} strokeWidth={2} /></View>
      </View>
      <Text style={styles.title}>Money Splitzy</Text>
      {isUnavailable ? (
        <>
          <Text style={styles.subtitle}>Could not restore your session.</Text>
          <Text style={styles.hint}>Check your internet connection and make sure the API server is running, then retry.</Text>
          <PrimaryButton
            title="Retry connection"
            onPress={() => {
              setRetryNonce(value => value + 1);
            }}
            style={styles.retryButton}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Good friends. Clear balances.</Text>
          <Text style={styles.hint}>Checking server connection....</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  sparkle: { position: 'absolute', top: 10, right: 9 },
  title: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 12,
    color: '#E9FFF2',
    fontSize: 15,
    textAlign: 'center',
  },
  hint: { marginTop: 8, marginHorizontal: 28, color: '#E9FFF2', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { width: '80%', marginTop: 24, backgroundColor: colors.primaryDark },
});
