import React, { useState, useRef } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loginApi } from '../redux/loginSlice';

const logo = require('../../assets/images/mainlogo.png');

function FloatingInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#1a56db'],
  });

  return (
    <View style={inputStyles.wrapper}>
      <Text style={[inputStyles.label, focused && inputStyles.labelFocused]}>{label}</Text>
      <Animated.View style={[inputStyles.inputWrapper, { borderColor }]}>
        <TextInput
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={secureTextEntry ? 'Enter password' : placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={secureTextEntry}
          style={inputStyles.input}
          value={value}
        />
      </Animated.View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  labelFocused: { color: '#1a56db' },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
    minHeight: 50,
    paddingHorizontal: 16,
  },
});

function Login({ navigate, onSignIn }) {
  const [loginMode, setLoginMode] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    try {
      const loginDetails = await loginApi({ email, password, mode: loginMode });

      console.log('Login Screen Full Response:', loginDetails);
      setError('');
      setSuccess(
        `${loginMode === 'employee' ? 'Employee' : 'Admin'} login successful.`
      );
      setTimeout(() => {
        onSignIn?.();
      }, 800);
    } catch (loginError) {
      console.log('Login Screen Error:', loginError);
      setSuccess('');
      setError(loginError.message || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Image source={logo} style={styles.topLogo} resizeMode="contain" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SignIn</Text>

        <View style={styles.modeTabs}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use admin login"
            onPress={() => setLoginMode('admin')}
            style={[
              styles.modeTab,
              loginMode === 'admin' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                loginMode === 'admin' && styles.modeTabTextActive,
              ]}
            >
              Admin
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use employee login"
            onPress={() => setLoginMode('employee')}
            style={[
              styles.modeTab,
              loginMode === 'employee' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                loginMode === 'employee' && styles.modeTabTextActive,
              ]}
            >
              Employee
            </Text>
          </Pressable>
        </View>

        <FloatingInput
          label="Username"
          value={email}
          onChangeText={setEmail}
          placeholder={loginMode === 'employee' ? '8985981169' : 'sindhu'}
        />
        <FloatingInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorDot}>●</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!!success && (
          <View style={styles.successBox}>
            <Text style={styles.successDot}>OK</Text>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={handleLogin}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          onPress={() => navigate?.('forgot')}
          style={({ pressed }) => [styles.forgotButton, pressed && styles.forgotButtonPressed]}
        >
          <Text style={styles.forgotText}>Forgot your password?</Text>
        </Pressable>

        <View style={styles.footerDivider}>
          <View style={styles.footerLine} />
          <Text style={styles.footerOr}>or</Text>
          <View style={styles.footerLine} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            onPress={() => navigate?.('signup')}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.footerLink}> Create one</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topLogo: {
    height: 70,
    marginBottom: 18,
    width: 210,
  },
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dde1e7',
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    width: '100%',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
  },
  modeTabs: {
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 18,
    padding: 4,
  },
  modeTab: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  modeTabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
  modeTabTextActive: {
    color: '#1a56db',
  },

  // Error
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorDot: {
    color: '#e03131',
    fontSize: 8,
    marginRight: 8,
  },
  errorText: {
    color: '#c92a2a',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  successBox: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successDot: {
    color: '#027a48',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
  },
  successText: {
    color: '#027a48',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // CTA
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1a56db',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 50,
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonPressed: {
    backgroundColor: '#1344b8',
    shadowOpacity: 0.1,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Forgot
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  forgotButtonPressed: {
    opacity: 0.6,
  },
  forgotText: {
    color: '#1a56db',
    fontSize: 13,
    fontWeight: '600',
  },

  // Footer divider
  footerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  footerLine: {
    backgroundColor: '#e2e8f0',
    flex: 1,
    height: 1,
  },
  footerOr: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
  },

  // Footer sign-up
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '400',
  },
  footerLink: {
    color: '#1a56db',
    fontSize: 13,
    fontWeight: '700',
  },
  linkPressed: {
    opacity: 0.6,
  },
});

export default Login;
