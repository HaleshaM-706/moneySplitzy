import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MailPlus, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetCurrentUserQuery, useGetGroupDetailsQuery, useInviteGroupMemberMutation } from '../../services/api/apiSlice';
import AppTextInput from '../../shared/components/AppTextInput';
import BackButton from '../../shared/components/BackButton';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import PrimaryButton from '../../shared/components/PrimaryButton';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteMember'>;

export default function InviteMemberScreen({ route, navigation }: Props) {
  const { data: group, isLoading: groupLoading, isError: groupError } = useGetGroupDetailsQuery(route.params.groupId);
  const { data: user, isLoading: userLoading, isError: userError } = useGetCurrentUserQuery();
  const [invite, { data: invitation, isLoading: inviting }] = useInviteGroupMemberMutation();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = group?.members.some(member => member.user.id === user?.id && member.role === 'ADMIN') ?? false;

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setFormError('');
    try {
      await invite({ groupId: route.params.groupId, email: normalizedEmail }).unwrap();
    } catch {
      setFormError('Could not create the invitation. Only group admins can invite members.');
    }
  };

  if (groupLoading || userLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (groupError || userError || !group || !user) {
    return <View style={styles.state}><EmptyState message="Could not load the group or your account. Please try again later." /></View>;
  }
  if (!isAdmin) {
    return (
      <View style={styles.state}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState message="Only group admins can invite new members." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Invite a member" subtitle={`Invite someone to join ${group.name}.`} icon={UserPlus} />
      <Text style={styles.label}>Their email address</Text>
      <AppTextInput
        icon={MailPlus}
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={254}
        editable={!invitation}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {invitation ? (
        <View style={styles.invitationCard}>
          <Text style={styles.successTitle}>Invitation created</Text>
          <Text style={styles.message}>
            Share this invite code with {invitation.email}. They must sign in with that email and enter the code in the Groups tab to join.
          </Text>
          <Text selectable style={styles.token}>{invitation.token}</Text>
          {invitation.expiresAt ? (
            <Text style={styles.expiry}>Expires {new Date(invitation.expiresAt).toLocaleString()}</Text>
          ) : null}
          <Text style={styles.note}>The app does not send invitation emails automatically; share the code directly.</Text>
        </View>
      ) : (
        <PrimaryButton title={inviting ? 'Creating invitation...' : 'Create invitation'} onPress={submit} disabled={inviting} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  invitationCard: {
    padding: 18,
    marginTop: 8,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successTitle: { color: colors.primaryDark, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  message: { color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: 15 },
  token: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    padding: 12,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden',
  },
  expiry: { color: colors.muted, fontSize: 12, marginTop: 10 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
