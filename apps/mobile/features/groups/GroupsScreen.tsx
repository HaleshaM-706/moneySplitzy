import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, Pressable, Text, TextInput } from 'react-native';
import { KeyRound, Plus, Search, Users } from 'lucide-react-native';
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
  const { data: groups = [], isLoading, isError, refetch } = useGetGroupsQuery();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const visibleGroups = useMemo(
    () => groups.filter(group => group.name.toLowerCase().includes(search.trim().toLowerCase())),
    [groups, search],
  );

  if (isLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (isError) {
    return (
      <View style={styles.state}>
        <EmptyState message="Could not load your groups. Check your connection and try again." />
        <Pressable onPress={refetch} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={visibleGroups}
      keyExtractor={group => group.id}
      refreshing={isLoading}
      onRefresh={() => { refetch(); }}
      ListHeaderComponent={
        <View>
          <ScreenHeader title="My Groups" subtitle="Keep every shared plan in one place." icon={Users} />
          {groups.length > 3 ? (
            <View style={styles.search}>
              <Search size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search groups"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                accessibilityLabel="Search groups"
              />
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Create New Group</Text>
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
      ListEmptyComponent={
        <EmptyState message={groups.length === 0 ? 'You are not in any groups yet. Create one or join with an invite code to get started.' : 'No groups match your search.'} />
      }
      renderItem={({ item }) => (
        <GroupCard
          name={item.name}
          subtitle={`${item.memberCount} members`}
          icon={item.icon}
          totalMinor={item.totalMinor}
          netMinor={item.netMinor}
          currency={item.currency}
          recentActivity={item.recentActivity}
          lastActivityAt={item.lastActivityAt}
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
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 9,
  },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 9, fontSize: 14 },
  retry: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  retryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
