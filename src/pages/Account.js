import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

function Account({navigate}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>◎</Text>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Signed in as Sindhu</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Device trust</Text>
          <Text style={styles.value}>Verified</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Face profile</Text>
          <Text style={styles.value}>Enabled</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Last check</Text>
          <Text style={styles.value}>Today</Text>
        </View>
      </View>
      <Pressable style={styles.button} onPress={() => navigate('scan')}>
        <Text style={styles.buttonText}>Scan Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  icon: {
    color: '#0b6bcb',
    fontSize: 34,
    fontWeight: '900',
  },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 4,
  },
  row: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  label: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default Account;


