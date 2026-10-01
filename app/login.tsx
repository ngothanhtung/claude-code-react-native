import { Ionicons } from '@expo/vector-icons';
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

const MOCK_EMAIL = 'admin@claude.ai';
const MOCK_PASSWORD = '123456789';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  keepSignedIn: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      keepSignedIn: true,
    },
  });

  const keepSignedIn = watch('keepSignedIn');

  function onSubmit(data: LoginForm) {
    const isValid = data.email.trim().toLowerCase() === MOCK_EMAIL && data.password === MOCK_PASSWORD;

    if (!isValid) {
      setAuthError('Email hoặc mật khẩu không đúng.');
      return;
    }

    setAuthError('');
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

        <Text style={styles.heading}>Sign in to your workspace</Text>
        <Text style={styles.subheading}>Studio North · 5 members. Use your work email or single sign-on.</Text>

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

        <View style={styles.optionsRow}>
          <Pressable style={styles.checkboxRow} onPress={() => setValue('keepSignedIn', !keepSignedIn)} hitSlop={8}>
            <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>{keepSignedIn && <Ionicons name='checkmark' size={14} color='#fff' />}</View>
            <Text style={styles.checkboxLabel}>Keep me signed in</Text>
          </Pressable>
          <Pressable hitSlop={8}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>
        </View>

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <Pressable style={styles.signInButton} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.ssoButton}>
          <Ionicons name='lock-closed-outline' size={18} color={COLORS.primary} style={styles.ssoIcon} />
          <Text style={styles.ssoText}>Continue with SSO</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>No account yet? </Text>
          <Pressable onPress={() => router.replace('/signup')}>
            <Text style={styles.footerLink}>Sign up</Text>
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 96,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    ...Inter.body,
    fontSize: 14,
    color: COLORS.dark,
  },
  forgotLink: {
    ...Inter.link,
    color: COLORS.primary,
  },
  errorText: {
    ...Inter.bodyMedium,
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  signInText: {
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
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 30,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },
  ssoIcon: {
    marginRight: 10,
  },
  ssoText: {
    ...Inter.bodyMedium,
    color: COLORS.dark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
