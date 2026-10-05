import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import GroupCard from '../../shared/components/GroupCard';

const groups = [{ id: 'g1', name: 'Weekend Trip', members: 3 }];

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={g => g.id}
        renderItem={({ item }) => <GroupCard name={item.name} subtitle={`${item.members} members`} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
