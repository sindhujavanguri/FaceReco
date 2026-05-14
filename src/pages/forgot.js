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

const logo = require('../../assets/images/mainlogo.png');

// ── Reusable FloatingInput (same as Signup) ──────────────────────────────────
function FloatingInput({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }) {
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
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          style={inputStyles.input}
          value={value}
        />
      </Animated.View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
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

// ── Forgot Screen ─────────────────────────────────────────────────────────────
function Forgot({ navigate }) {
  const [email, setEmail] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Image source={logo} style={styles.topLogo} resizeMode="contain" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reset Password</Text>

        <FloatingInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send reset link"
          onPress={() => navigate('login')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        </Pressable>

        <View style={styles.footerDivider}>
          <View style={styles.footerLine} />
          <Text style={styles.footerOr}>or</Text>
          <View style={styles.footerLine} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remember your password?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to login"
            onPress={() => navigate('login')}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.footerLink}> Sign in</Text>
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

  // Footer divider
  footerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 16,
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

  // Footer sign-in
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

export default Forgot;
