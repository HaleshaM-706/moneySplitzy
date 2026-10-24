import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Wallet } from 'lucide-react-native';
import { colors } from '../../../shared/theme';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Wallet size={34} color={colors.primaryDark} strokeWidth={2} />
        <View style={styles.sparkle}><Sparkles size={15} color={colors.primaryDark} strokeWidth={2} /></View>
      </View>
      <Text style={styles.title}>Money Splitzy</Text>
      <Text style={styles.subtitle}>Good friends. Clear balances.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  sparkle: { position: 'absolute', top: 10, right: 9 },
  title: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 9,
    color: '#E9FFF2',
    fontSize: 15,
  },
});
