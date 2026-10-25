import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [category, setCategory] = useState('TRIP');
  const [icon, setIcon] = useState('✈️');
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
      const createdGroup = await createGroup({
        name: trimmedName,
        description: description.trim() || undefined,
        currency: normalizedCurrency,
        category,
        icon,
      }).unwrap();
      navigation.replace('GroupDetails', { groupId: createdGroup.id });
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
      <Text style={styles.label}>Group type</Text>
      <View style={styles.options}>
        {['TRIP', 'HOME', 'FAMILY', 'EVENT', 'OTHER'].map(type => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: category === type }}
            onPress={() => setCategory(type)}
            style={[styles.option, category === type && styles.optionSelected]}
          >
            <Text style={[styles.optionText, category === type && styles.optionTextSelected]}>{type[0] + type.slice(1).toLowerCase()}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Group icon</Text>
      <View style={styles.options}>
        {['✈️', '🏠', '👨‍👩‍👧‍👦', '🎉', '👥'].map(emoji => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${emoji} group icon`}
            accessibilityState={{ selected: icon === emoji }}
            onPress={() => setIcon(emoji)}
            style={[styles.iconOption, icon === emoji && styles.optionSelected]}
          >
            <Text style={styles.iconText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
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
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  option: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primaryLight },
  optionText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  optionTextSelected: { color: colors.primaryDark },
  iconOption: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconText: { fontSize: 22 },
});
