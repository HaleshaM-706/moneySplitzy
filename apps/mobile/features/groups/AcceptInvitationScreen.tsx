import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { KeyRound } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAcceptGroupInvitationMutation } from '../../services/api/apiSlice';
import AppTextInput from '../../shared/components/AppTextInput';
import BackButton from '../../shared/components/BackButton';
import PrimaryButton from '../../shared/components/PrimaryButton';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AcceptInvitation'>;

export default function AcceptInvitationScreen({ navigation }: Props) {
  const [token, setToken] = useState('');
  const [formError, setFormError] = useState('');
  const [acceptInvitation, { isLoading }] = useAcceptGroupInvitationMutation();

  const submit = async () => {
    const inviteToken = token.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inviteToken)) {
      setFormError('Enter a valid invite code.');
      return;
    }
    setFormError('');
    try {
      const result = await acceptInvitation(inviteToken).unwrap();
      navigation.replace('GroupDetails', { groupId: result.groupId });
    } catch {
      setFormError('Could not join this group. The invitation may be expired, already used, or for a different account email.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Join a group" subtitle="Enter the invite code shared with you." icon={KeyRound} />
      <AppTextInput
        placeholder="Invite code"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={36}
      />
      <Text style={styles.hint}>Sign in with the email address the invitation was sent to.</Text>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton title={isLoading ? 'Joining group...' : 'Join group'} onPress={submit} disabled={isLoading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2, marginBottom: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
