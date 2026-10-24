import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Layers3 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateGroupMutation } from '../../services/api/apiSlice';
import AppTextInput from '../../shared/components/AppTextInput';
import BackButton from '../../shared/components/BackButton';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import PrimaryButton from '../../shared/components/PrimaryButton';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [formError, setFormError] = useState('');
  const [createGroup, { isLoading, error }] = useCreateGroupMutation();

  const submit = async () => {
    const trimmedName = name.trim();
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!trimmedName) {
      setFormError('Enter a group name.');
      return;
    }
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setFormError('Enter a valid 3-letter currency code, such as INR or USD.');
      return;
    }

    setFormError('');
    try {
      await createGroup({
        name: trimmedName,
        description: description.trim() || undefined,
        currency: normalizedCurrency,
      }).unwrap();
      navigation.goBack();
    } catch {
      setFormError('Could not create the group. Please check your connection and try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Create a group" subtitle="Set up a shared place for expenses." icon={Layers3} />
      <Text style={styles.label}>Group name</Text>
      <AppTextInput
        placeholder="e.g. Weekend trip"
        value={name}
        onChangeText={setName}
        maxLength={100}
        returnKeyType="next"
      />
      <Text style={styles.label}>Description (optional)</Text>
      <AppTextInput
        placeholder="What is this group for?"
        value={description}
        onChangeText={setDescription}
        maxLength={1000}
        multiline
        style={styles.descriptionInput}
      />
      <Text style={styles.label}>Currency</Text>
      <AppTextInput
        placeholder="INR"
        value={currency}
        onChangeText={setCurrency}
        autoCapitalize="characters"
        maxLength={3}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {error && !formError ? <EmptyState message="Could not create the group. Please try again." /> : null}
      {isLoading ? <LoadingIndicator /> : null}
      <PrimaryButton title={isLoading ? 'Creating group...' : 'Create group'} onPress={submit} disabled={isLoading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  descriptionInput: { minHeight: 92, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
