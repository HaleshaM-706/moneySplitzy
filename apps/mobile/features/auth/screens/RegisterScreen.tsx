import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AppTextInput from '../../../shared/components/AppTextInput';
import PrimaryButton from '../../../shared/components/PrimaryButton';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function RegisterScreen({ navigation }: any) {
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = (data: any) => {
    console.log('register', data);
    navigation.replace('Login');
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
      <PrimaryButton title="Register" onPress={handleSubmit(onSubmit)} />
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
