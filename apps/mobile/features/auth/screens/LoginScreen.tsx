import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useAppDispatch } from '../../../shared/hooks/useAppHooks';
import { setCredentials } from '../authSlice';
import { useLoginMutation } from '../../../services/api/apiSlice';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const result = await login(data).unwrap();
      console.log('Login successful=====>', result);
      dispatch(setCredentials({ token: result.access, refreshToken: result.refresh, user: result.user }));
      navigation.replace('Main');
    } catch (error) {
      const message = (error as { data?: { message?: string | string[] } })?.data?.message;
      Alert.alert('Login failed', Array.isArray(message) ? message.join('\n') : message || 'Unable to log in. Please try again.');
    }
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
      <PrimaryButton title={isLoading ? 'Logging in...' : 'Login'} onPress={handleSubmit(onSubmit)} disabled={isLoading} />
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
