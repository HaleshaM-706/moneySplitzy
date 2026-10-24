import React from 'react';
import { FlatList, StyleSheet, View, Pressable, Text } from 'react-native';
import { KeyRound, Plus, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GroupCard from '../../shared/components/GroupCard';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { useGetGroupsQuery } from '../../services/api/apiSlice';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

export default function GroupsScreen() {
  const { data: groups = [], isLoading, isError } = useGetGroupsQuery();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (isLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (isError) {
    return <View style={styles.state}><EmptyState message="Could not load your groups. Please try again later." /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={groups}
      keyExtractor={group => group.id}
      ListHeaderComponent={
        <View>
          <ScreenHeader title="Your groups" subtitle="Keep every shared plan in one place." icon={Users} />
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Create a group</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => navigation.navigate('AcceptInvitation')}
          >
            <KeyRound size={17} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.joinButtonText}>Join with an invite code</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={<EmptyState message="You are not in any groups yet." />}
      renderItem={({ item }) => (
        <GroupCard
          name={item.name}
          subtitle={`${item.memberCount} members`}
          onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 28 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  addButton: {
    minHeight: 50,
    marginTop: -7,
    marginBottom: 18,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButton: {
    minHeight: 46,
    marginTop: -8,
    marginBottom: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
