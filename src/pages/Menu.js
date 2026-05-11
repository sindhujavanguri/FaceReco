import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

const menuItems = [
  ['home', 'Dashboard', 'Face recognition overview'],
  ['scan', 'Scan', 'Open front camera flow'],
  ['profile', 'Profile', 'Personal information'],
  ['location', 'Location', 'Branch details'],
  ['account', 'Account', 'Security status'],
  ['settings', 'Settings', 'App controls'],
];

function Menu({navigate}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Menu</Text>
        {menuItems.map(([route, title, detail]) => (
          <Pressable key={route} style={styles.menuRow} onPress={() => navigate(route)}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowIconText}>›</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{title}</Text>
              <Text style={styles.rowDetail}>{detail}</Text>
            </View>
          </Pressable>
        ))}
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
    padding: 14,
  },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuRow: {
    alignItems: 'center',
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: '#eaf5ff',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowIconText: {
    color: '#0b6bcb',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 27,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
  },
  rowDetail: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default Menu;
