import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Inter } from '@/constants/Typography';

const COLORS = {
  primary: '#F4693F',
  dark: '#151A2E',
  gray: '#8891A5',
  fieldBg: '#F5F6F8',
  facebook: '#0A54B8',
  error: '#E0483E',
  errorBg: '#FDF1F0',
  success: '#3DBB63',
};

// Simulates an email that's already registered (matches the login mock user).
const EXISTING_EMAIL = 'admin@claude.ai';

const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ')
    .refine((val) => val.trim().toLowerCase() !== EXISTING_EMAIL, {
      message: 'This email is already taken',
    }),
  username: z.string().min(2, 'Username ít nhất 2 ký tự'),
  password: z.string().length(9, 'Password must be 9 characters'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedUsername = watch('username');

  function onSubmit(_data: SignUpForm) {
    router.replace('/(tabs)');
  }

  const emailTaken =
    watchedEmail.trim().toLowerCase() === EXISTING_EMAIL && watchedEmail.length > 0;
  const emailValid =
    watchedEmail.trim().length > 0 && !emailTaken && !errors.email;
  const passwordInvalid =
    watchedPassword.length > 0 && watchedPassword.length !== 9;
  const passwordValid = watchedPassword.length === 9;
  const usernameValid = watchedUsername.trim().length >= 2;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image
        source={require('@/assets/images/eatme-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.heading}>Getting Started</Text>
      <Text style={styles.subheading}>Create an account to continue!</Text>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Email</Text>
          {emailTaken ? (
            <Text style={styles.errorText}>This email is already taken</Text>
          ) : null}
        </View>
        <View style={[styles.inputWrapper, emailTaken && styles.inputWrapperError]}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
          <Ionicons
            name={
              emailTaken
                ? 'close-circle'
                : emailValid
                ? 'checkmark-circle'
                : 'checkmark-circle-outline'
            }
            size={22}
            color={emailTaken ? COLORS.error : emailValid ? COLORS.success : COLORS.gray}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrapper}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Enter your username"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="words"
              />
            )}
          />
          {usernameValid ? (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.gray} />
          )}
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Password</Text>
          {passwordInvalid ? (
            <Text style={styles.errorText}>Password must be 9 characters</Text>
          ) : null}
        </View>
        <View style={[styles.inputWrapper, passwordInvalid && styles.inputWrapperError]}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showPassword}
              />
            )}
          />
          {passwordInvalid ? (
            <Ionicons name="close-circle" size={22} color={COLORS.error} />
          ) : (
            <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={passwordValid ? COLORS.success : COLORS.gray}
              />
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.signUpButton} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.signUpText}>Sign Up</Text>
      </Pressable>

      <View style={styles.signInRow}>
        <Text style={styles.optionText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
      </View>

      <View style={styles.socialButtons}>
        <Pressable style={[styles.socialButton, { backgroundColor: COLORS.facebook }]}>
          <FontAwesome name="facebook" size={20} color="#fff" style={styles.socialIcon} />
          <Text style={styles.socialTextLight}>Continue With Facebook</Text>
        </Pressable>

        <Pressable style={[styles.socialButton, { backgroundColor: COLORS.fieldBg }]}>
          <AntDesign name="google" size={20} color="#EA4335" style={styles.socialIcon} />
          <Text style={styles.socialTextDark}>Continue With Google</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 220,
    height: 72,
    alignSelf: 'center',
    marginBottom: 32,
  },
  heading: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 26,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    ...Inter.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    ...Inter.label,
    fontSize: 13,
    textTransform: 'none' as const,
    color: COLORS.gray,
    marginBottom: 8,
  },
  errorText: {
    ...Inter.caption,
    fontFamily: 'Inter_500Medium',
    color: COLORS.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fieldBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperError: {
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    ...Inter.body,
    color: COLORS.dark,
  },
  signUpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  signUpText: {
    ...Inter.button,
    color: '#fff',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  optionText: {
    ...Inter.body,
    fontSize: 14,
    color: COLORS.gray,
  },
  signInText: {
    ...Inter.link,
    color: COLORS.primary,
  },
  socialButtons: {
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 56,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialTextLight: {
    ...Inter.bodyMedium,
    color: '#fff',
  },
  socialTextDark: {
    ...Inter.bodyMedium,
    color: COLORS.dark,
  },
});
