import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { PurpleTheme } from '@/constants/Purple';
import { Inter } from '@/constants/Typography';

const COLORS = {
  bg: '#F4F1FB',
  decor: '#E7DFF7',
  card: '#FFFFFF',
  dark: '#1C1730',
  gray: '#8B87A0',
  border: '#E7E3F2',
  primary: PurpleTheme.primary,
  error: '#E0483E',
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
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  function onSubmit(_data: SignUpForm) {
    router.replace('/home/today');
  }

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled'>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name='checkmark' size={18} color='#fff' />
          </View>
          <Text style={styles.logoText}>TaskFlow</Text>
        </View>

        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>Join your team's workspace. It only takes a minute.</Text>

        <View style={styles.fieldGroup}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <Controller
              control={control}
              name='email'
              render={({ field: { onChange, value } }) => <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} placeholder='you@studionorth.co' placeholderTextColor={COLORS.gray} autoCapitalize='none' keyboardType='email-address' />}
            />
          </View>
          {errors.email ? <Text style={styles.fieldError}>{errors.email.message}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>USERNAME</Text>
            <Controller
              control={control}
              name='username'
              render={({ field: { onChange, value } }) => <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} placeholder='Enter your username' placeholderTextColor={COLORS.gray} autoCapitalize='words' />}
            />
          </View>
          {errors.username ? <Text style={styles.fieldError}>{errors.username.message}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.field}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                <Text style={styles.showLink}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name='password'
              render={({ field: { onChange, value } }) => <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} placeholder='Enter your password' placeholderTextColor={COLORS.gray} secureTextEntry={!showPassword} />}
            />
          </View>
          {errors.password ? <Text style={styles.fieldError}>{errors.password.message}</Text> : null}
        </View>

        <Pressable style={styles.signUpButton} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.signUpText}>Sign up</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.socialButton}>
          <AntDesign name='google' size={18} color='#EA4335' style={styles.socialIcon} />
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>

        <Pressable style={styles.socialButton}>
          <FontAwesome name='facebook' size={18} color='#0A54B8' style={styles.socialIcon} />
          <Text style={styles.socialText}>Continue with Facebook</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  decorCircle: {
    position: 'absolute',
    top: -80,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.decor,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 19,
    color: COLORS.dark,
  },
  heading: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 32,
    lineHeight: 38,
    color: COLORS.dark,
    marginBottom: 12,
  },
  subheading: {
    ...Inter.body,
    color: COLORS.gray,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  field: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fieldError: {
    ...Inter.body,
    fontSize: 13,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 18,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    ...Inter.label,
    color: COLORS.gray,
    marginBottom: 6,
  },
  fieldInput: {
    ...Inter.input,
    color: COLORS.dark,
    padding: 0,
  },
  showLink: {
    ...Inter.link,
    color: COLORS.primary,
  },
  signUpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  signUpText: {
    ...Inter.button,
    color: '#fff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...Inter.label,
    color: COLORS.gray,
    marginHorizontal: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 30,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialText: {
    ...Inter.bodyMedium,
    color: COLORS.dark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    ...Inter.body,
    fontSize: 14,
    color: COLORS.gray,
  },
  footerLink: {
    ...Inter.link,
    color: COLORS.primary,
  },
});
