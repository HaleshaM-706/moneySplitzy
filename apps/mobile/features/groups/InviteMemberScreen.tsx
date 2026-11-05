import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MailPlus, UserPlus, UserRoundPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useAddExistingGroupMemberMutation,
  useGetCurrentUserQuery,
  useGetGroupDetailsQuery,
  useInviteGroupMemberMutation,
} from '../../services/api/apiSlice';
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
  const [invite, { data: invitation, isLoading: inviting, reset: resetInvitation }] = useInviteGroupMemberMutation();
  const [addExistingMember, { data: addedMember, isLoading: adding, reset: resetAddedMember }] =
    useAddExistingGroupMemberMutation();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [mode, setMode] = useState<'existing' | 'invite'>('existing');

  const isAdmin = group?.members.some(member => member.user.id === user?.id && member.role === 'ADMIN') ?? false;

  const selectMode = (nextMode: 'existing' | 'invite') => {
    setMode(nextMode);
    setFormError('');
    resetInvitation();
    resetAddedMember();
  };

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setFormError('');
    try {
      if (mode === 'existing') {
        await addExistingMember({ groupId: route.params.groupId, email: normalizedEmail }).unwrap();
      } else {
        await invite({ groupId: route.params.groupId, email: normalizedEmail }).unwrap();
      }
    } catch {
      setFormError(mode === 'existing'
        ? 'Could not add this user. Check that they already have an account and are not already in this group.'
        : 'Could not create the invitation. Please check the email and try again.');
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
        <EmptyState message="Only group admins can add or invite members." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Manage members" subtitle={`Add someone to ${group.name}.`} icon={UserPlus} />
      <View style={styles.modeSelector}>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectMode('existing')}
          style={[styles.modeButton, mode === 'existing' && styles.modeButtonSelected]}
        >
          <UserRoundPlus size={17} color={mode === 'existing' ? '#FFFFFF' : colors.primaryDark} />
          <Text style={[styles.modeText, mode === 'existing' && styles.modeTextSelected]}>Existing user</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectMode('invite')}
          style={[styles.modeButton, mode === 'invite' && styles.modeButtonSelected]}
        >
          <MailPlus size={17} color={mode === 'invite' ? '#FFFFFF' : colors.primaryDark} />
          <Text style={[styles.modeText, mode === 'invite' && styles.modeTextSelected]}>Invite by email</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>
        {mode === 'existing'
          ? 'Add a registered user directly using the email on their account.'
          : 'Send an invitation email. They can sign in or create an account with this email, then enter the code to join.'}
      </Text>
      <Text style={styles.label}>Email address</Text>
      <AppTextInput
        icon={mode === 'existing' ? UserRoundPlus : MailPlus}
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={254}
        editable={!invitation && !addedMember?.added}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {addedMember?.added ? (
        <View style={styles.invitationCard}>
          <Text style={styles.successTitle}>Member added</Text>
          <Text style={styles.message}>{email.trim()} has been added to {group.name}.</Text>
          <PrimaryButton title="Back to group" onPress={() => navigation.goBack()} />
        </View>
      ) : invitation ? (
        <View style={styles.invitationCard}>
          <Text style={styles.successTitle}>{invitation.emailSent ? 'Invitation sent' : 'Invitation created'}</Text>
          <Text style={styles.message}>
            {invitation.emailSent
              ? `We sent an invitation to ${invitation.email}. They must sign in with that email and enter the code in the Groups tab to join.`
              : `The invitation email could not be sent to ${invitation.email}. Share this code with them directly; they must sign in with that email and enter it in the Groups tab to join.`}
          </Text>
          <Text selectable style={styles.token}>{invitation.token}</Text>
          {invitation.expiresAt ? (
            <Text style={styles.expiry}>Expires {new Date(invitation.expiresAt).toLocaleString()}</Text>
          ) : null}
          {invitation.emailSent ? null : (
            <Text style={styles.note}>Configure the API email settings to send invitations automatically.</Text>
          )}
        </View>
      ) : (
        <PrimaryButton
          title={adding ? 'Adding member...' : inviting ? 'Creating invitation...' : mode === 'existing' ? 'Add existing user' : 'Create invitation'}
          onPress={submit}
          disabled={adding || inviting}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  modeSelector: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeButtonSelected: { backgroundColor: colors.primaryDark },
  modeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  modeTextSelected: { color: '#FFFFFF' },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
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
