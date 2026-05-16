import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const tabs = [
  {
    description: 'Browse all employee leave applications',
    label: 'Leave List',
    route: 'adminLeaveList',
  },
  {
    description: 'Review pending, approved, and rejected leaves',
    label: 'Admin Leave Status',
    route: 'adminLeaveStatus',
  },
];

function AdminLeaves({ navigate }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LEAVE MANAGEMENT</Text>
        <Text style={styles.title}>Manage employee leaves</Text>
        <Text style={styles.subtitle}>
          Review requests, monitor status, and approve or reject pending leaves.
        </Text>
      </View>

      <View style={styles.tabList}>
        {tabs.map((tab) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${tab.label}`}
            key={tab.route}
            style={({ pressed }) => [
              styles.tabCard,
              pressed && styles.tabCardPressed,
            ]}
            onPress={() => navigate(tab.route)}
          >
            <View style={styles.tabIcon}>
              <Text style={styles.tabIconText}>{tab.label.charAt(0)}</Text>
            </View>
            <View style={styles.tabCopy}>
              <Text style={styles.tabTitle}>{tab.label}</Text>
              <Text style={styles.tabDescription}>{tab.description}</Text>
            </View>
            <Text style={styles.chevron}></Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  hero: {
    backgroundColor: '#2664b4',
    borderRadius: 8,
    padding: 16,
  },
  eyebrow: {
    color: '#FCE3C1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
  },
  tabList: {
    gap: 12,
    marginTop: 14,
  },
  tabCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 86,
    padding: 14,
  },
  tabCardPressed: {
    backgroundColor: '#F4F8FD',
  },
  tabIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  tabIconText: {
    color: '#f08c3c',
    fontSize: 18,
    fontWeight: '900',
  },
  tabCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  tabTitle: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  tabDescription: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 4,
  },
  chevron: {
    color: '#C9942D',
    fontSize: 24,
    fontWeight: '800',
  },
});

export default AdminLeaves;
