import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

function Location() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPanel}>
        <View style={styles.pin}>
          <Text style={styles.pinText}>⌖</Text>
        </View>
        <Text style={styles.mapLabel}>Bengaluru HQ</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Location Details</Text>
        <Text style={styles.row}>Branch: Bengaluru Main Office</Text>
        <Text style={styles.row}>Access zone: Main entrance</Text>
        <Text style={styles.row}>Scan policy: On-site verification</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  mapPanel: {
    alignItems: 'center',
    backgroundColor: '#dff3ff',
    borderColor: '#b7e4ff',
    borderRadius: 8,
    borderWidth: 1,
    height: 210,
    justifyContent: 'center',
  },
  pin: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  pinText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  mapLabel: {
    color: '#0b4f8f',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  title: {
    color: '#101828',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  row: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
  },
});

export default Location;
