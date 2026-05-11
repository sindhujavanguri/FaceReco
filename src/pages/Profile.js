import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

function Profile() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <Text style={styles.name}>Sindhu</Text>
        <Text style={styles.role}>Access Control Operator</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Profile status</Text>
          <Text style={styles.infoValue}>Face profile active</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>Security Operations</Text>
        </View>
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
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#102a43',
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  name: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 14,
  },
  role: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 4,
  },
  infoBox: {
    alignSelf: 'stretch',
    backgroundColor: '#f8fbfd',
    borderColor: '#e4edf5',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 13,
  },
  infoLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
  },
  infoValue: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
});

export default Profile;
