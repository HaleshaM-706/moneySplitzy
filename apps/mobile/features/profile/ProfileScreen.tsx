import React from 'react';
import { Alert, View, Text, StyleSheet, Pressable } from 'react-native';
import { LogOut, Mail, UserRound } from 'lucide-react-native';
import { apiSlice, useGetCurrentUserQuery, useLogoutMutation } from '../../services/api/apiSlice';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { clearAuthSession } from '../auth/authStorage';
import { clearCredentials } from '../auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks/useAppHooks';
import { colors, spacing } from '../../shared/theme';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector(state => state.auth.refreshToken);
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    let storageFailed = false;
    const logoutRequest = logout({ refreshToken });

    try {
      await clearAuthSession();
    } catch {
      storageFailed = true;
    }
    dispatch(clearCredentials());
    dispatch(apiSlice.util.resetApiState());

    if (storageFailed) {
      Alert.alert('Sign-out incomplete', 'Could not remove the saved session from secure storage. Please try again.');
    }

    logoutRequest.unwrap().catch(() => {
      if (!storageFailed) {
        Alert.alert(
          'Signed out',
          'Your session was removed from this device, but the server could not confirm that it was revoked.',
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Your profile" subtitle="Your account details in one place." icon={UserRound} />
      {isLoading ? (
        <View style={styles.state}><LoadingIndicator /></View>
      ) : isError || !user ? (
        <View style={styles.state}><EmptyState message="Could not load your profile. Please try again later." /></View>
      ) : (
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.name || user.email).trim().charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.name || 'Name not provided'}</Text>
            <Text style={styles.caption}>Money Splitzy member</Text>
          </View>
          <Text style={styles.sectionTitle}>Account details</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><UserRound size={18} color={colors.primaryDark} /></View>
            <View>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.name || 'Name not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Mail size={18} color={colors.primaryDark} /></View>
            <View>
              <Text style={styles.label}>Email address</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>
        </>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={isLoggingOut}
        onPress={handleLogout}
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
      >
        <LogOut size={19} color={colors.danger} />
        <Text style={styles.logoutText}>{isLoggingOut ? 'Signing out...' : 'Log out'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  logoutButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  disabledButton: { opacity: 0.6 },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700', marginLeft: 9 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.primaryDark, fontSize: 27, fontWeight: '800' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 13, marginTop: 5 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: { color: colors.muted, fontSize: 12 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
});
