import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

function Settings({ navigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Face scan preferences</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.label}>Front camera first</Text>
            <Text style={styles.hint}>Open scan with front mode</Text>
          </View>
          <Switch value />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.label}>Secure prompts</Text>
            <Text style={styles.hint}>Show clear access messages</Text>
          </View>
          <Switch value />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.label}>Location tag</Text>
            <Text style={styles.hint}>Attach branch to scans</Text>
          </View>
          <Switch value={false} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={styles.signOutButton}
          onPress={() => navigate('login')}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
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
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  settingRow: {
    alignItems: 'center',
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  label: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
  },
  hint: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default Settings;
