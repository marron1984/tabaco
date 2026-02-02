import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    const result = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.error);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const result = await signInAsGuest();
    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🗺️</Text>
            <Text style={styles.title}>
              {mode === 'signin' ? 'おかえりなさい' : 'アカウント作成'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? '隠れスポットやレビューを見るにはログイン'
                : 'お気に入りのスポットを共有しよう'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'signup' ? '6文字以上' : 'パスワード'}
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              disabled={loading}
            >
              <Text style={styles.toggleText}>
                {mode === 'signin'
                  ? 'アカウントをお持ちでない方 → 新規登録'
                  : 'アカウントをお持ちの方 → ログイン'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Login */}
          <TouchableOpacity
            style={[styles.guestButton, loading && styles.disabled]}
            onPress={handleGuestLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.guestIcon}>👤</Text>
            <Text style={styles.guestText}>ゲストとして続ける</Text>
          </TouchableOpacity>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.note}>
              ゲストは公開スポットのみ閲覧可能です。{'\n'}
              ログインするとユーザー投稿スポットやレビューが見られます。
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.small,
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },

  // Form
  form: {
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: COLORS.textLight,
    fontSize: 17,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  guestText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  // Note
  noteContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  note: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
