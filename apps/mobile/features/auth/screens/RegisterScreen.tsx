import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';
import { useRegisterMutation } from '../../../services/api/apiSlice';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function RegisterScreen({ navigation }: any) {
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });
  const [register, { isLoading }] = useRegisterMutation();

  const onSubmit = async (data: any) => {
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      navigation.replace('Login');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.data?.message || 'Unable to create account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Controller
        name="name"
        control={control}
        defaultValue=""
        render={({ field: { onChange, value } }) => <AppTextInput placeholder="Name" value={value} onChangeText={onChange} />}
      />
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
      <PrimaryButton title={isLoading ? 'Registering...' : 'Register'} onPress={handleSubmit(onSubmit)} disabled={isLoading} />
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  link: { marginTop: 12, textAlign: 'center', color: '#2ecc71', fontWeight: '600' },
});
