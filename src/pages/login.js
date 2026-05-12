import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STATIC_EMAIL = 'admin@example.com';
const STATIC_PASSWORD = 'password123';

function Login({ navigate, onSignIn }) {
  const [email, setEmail] = useState(STATIC_EMAIL);
  const [password, setPassword] = useState(STATIC_PASSWORD);
  const [error, setError] = useState('');

  const handleLogin = () => {
    const validEmail = email.trim().toLowerCase() === STATIC_EMAIL;
    const validPassword = password === STATIC_PASSWORD;

    if (validEmail && validPassword) {
      setError('');
      onSignIn();
      return;
    }

    setError('Use admin@example.com and password123 to sign in.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>ID</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in with the static credentials.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="password123"
            placeholderTextColor="#98a2b3"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={handleLogin}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          onPress={() => navigate('forgot')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>No account?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            onPress={() => navigate('signup')}
          >
            <Text style={styles.footerLink}> Sign up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#eef5fb',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
    width: '100%',
  },
  logoBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#102a43',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: '#101828',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 22,
    marginTop: 6,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#f8fbfd',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkText: {
    color: '#0b6bcb',
    fontSize: 14,
    fontWeight: '900',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLink: {
    color: '#0b6bcb',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default Login;
