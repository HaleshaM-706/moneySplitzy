import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useAppDispatch } from '../../../shared/hooks/useAppHooks';
import { setCredentials } from '../authSlice';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = (data: any) => {
    dispatch(
      setCredentials({
        token: 'dev-token',
        refreshToken: 'dev-refresh-token',
        user: { id: 'u1', email: data.email, name: 'Demo User' },
      }),
    );
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <AppTextInput placeholder="Email" value={value} onChangeText={onChange} autoCapitalize="none" />
        )}
      />
      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <AppTextInput placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
        )}
      />
      <PrimaryButton title="Login" onPress={handleSubmit(onSubmit)} />
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Need an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  link: { marginTop: 12, textAlign: 'center', color: '#2ecc71', fontWeight: '600' },
});
