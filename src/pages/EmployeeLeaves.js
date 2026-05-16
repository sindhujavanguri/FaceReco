import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const tabs = [
  {
    description: 'View yearly leave category rules',
    label: 'Leave Category',
    route: 'leaveCategories',
  },
  {
    description: 'Track approved, rejected, and pending leaves',
    label: 'Employee Leave List',
    route: 'leaveList',
  },
  {
    description: 'Create and submit a leave request',
    label: 'Apply Leave',
    route: 'applyLeave',
  },
];

function EmployeeLeaves({ navigate }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      {/* Sleek Professional Hero section */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LEAVE MANAGEMENT</Text>
        <Text style={styles.title}>Manage employee leaves</Text>
        <Text style={styles.subtitle}>
          Apply for time off, track approvals, and review active leave categories.
        </Text>
      </View>

      {/* Modernized Card List */}
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

            {/* Modernized minimal chevron indicator */}
            <View style={styles.chevronContainer}>
              <Text style={styles.chevron}>→</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f8fafc', // Slightly off-white background brings out the white cards better
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#2664b4',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  eyebrow: {
    color: '#FCE3C1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#D8E7FA',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 8,
    opacity: 0.9,
  },
  tabList: {
    gap: 14,
    marginTop: -16, // Offsets the cards slightly over the hero section for depth
    paddingHorizontal: 16,
  },
  tabCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    minHeight: 90,
    padding: 16,
    
    // Smooth modern box shadow
    shadowColor: '#102a43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tabCardPressed: {
    backgroundColor: '#F2F7FE',
    transform: [{ scale: 0.99 }], // Subtle micro-interaction on tap
  },
  tabIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  tabIconText: {
    color: '#f08c3c',
    fontSize: 18,
    fontWeight: '700',
  },
  tabCopy: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabDescription: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 4,
  },
  chevronContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  chevron: {
    color: '#000',
    fontSize: 25,
    fontWeight: '600',
  },
});

export default EmployeeLeaves;