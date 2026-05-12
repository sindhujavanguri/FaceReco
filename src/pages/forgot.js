import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

function Forgot({ navigate }) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email address to continue.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="admin@example.com"
          placeholderTextColor="#98a2b3"
          style={styles.input}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigate('login')}
        >
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigate('login')}
        >
          <Text style={styles.secondaryText}>Back to login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  },
  title: {
    color: '#101828',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 6,
    textAlign: 'center',
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
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingTop: 16,
  },
  secondaryText: {
    color: '#0b6bcb',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default Forgot;
