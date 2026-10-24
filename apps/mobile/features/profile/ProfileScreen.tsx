import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mail, UserRound } from 'lucide-react-native';
import { useGetCurrentUserQuery } from '../../services/api/apiSlice';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { colors, spacing } from '../../shared/theme';

export default function ProfileScreen() {
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();

  if (isLoading) return <View style={styles.state}><LoadingIndicator /></View>;
  if (isError || !user) {
    return <View style={styles.state}><EmptyState message="Could not load your profile. Please try again later." /></View>;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Your profile" subtitle="Your account details in one place." icon={UserRound} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
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
