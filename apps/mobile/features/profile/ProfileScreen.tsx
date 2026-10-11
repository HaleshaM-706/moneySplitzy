import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGetCurrentUserQuery } from '../../services/api/apiSlice';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';

export default function ProfileScreen() {
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();

  if (isLoading) return <LoadingIndicator />;
  if (isError || !user) return <EmptyState message="Could not load your profile. Please try again later." />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.text}>{user.name || 'Name not provided'}</Text>
      <Text style={styles.text}>{user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  text: { marginTop: 8 },
});
