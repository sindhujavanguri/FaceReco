import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCurrentEmployeeNavigationResponse } from '../redux/employeeSlice';

const findMenuItem = (items, routeKey) => {
  for (const item of items || []) {
    if (item.routeKey === routeKey || item.key === routeKey) {
      return item;
    }

    const child = findMenuItem(item.children || [], routeKey);
    if (child) {
      return child;
    }
  }

  return null;
};

const routeToMenuKey = {
  addExpense: 'add_expense',
  addWorkReport: 'add_work_report',
  dailyWorkReport: 'daily_work_report',
  documents: 'documents',
  expenses: 'expenses',
  monthlyWorkReport: 'monthly_work_report',
  payroll: 'payroll',
  timesheet: 'timesheet',
  uploadDocuments: 'upload_documents',
  viewDocuments: 'view_documents',
  viewExpenses: 'view_expenses',
  workReports: 'work_reports',
};

function FeaturePage({ routeKey, fallbackTitle }) {
  const menu = getCurrentEmployeeNavigationResponse()?.data?.data?.menu || [];
  const menuItem = findMenuItem(menu, routeToMenuKey[routeKey] || routeKey);
  const title = menuItem?.title || fallbackTitle;
  const apiPath = menuItem?.api || 'API will be connected here';
  const children = menuItem?.children || [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>EMPLOYEE MODULE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{apiPath}</Text>
      </View>

      {!!children.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPTIONS</Text>
          {children.map((child) => (
            <View key={child.key} style={styles.optionCard}>
              <Text style={styles.optionTitle}>{child.title}</Text>
              <Text style={styles.optionApi}>{child.api}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Ready for dynamic data</Text>
        <Text style={styles.infoText}>
          This page is connected to the navigation menu. Add the module API next
          and the content can be rendered here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F4F8FD',
  },
  content: {
    paddingBottom: 28,
    marginTop:10,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: '#113A70',
    borderRadius: 12,
    padding: 18,
  },
  eyebrow: {
    color: '#9FC2EC',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: '#C6DCF6',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  optionTitle: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  optionApi: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  infoTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
  },
  infoText: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
  },
});

export default FeaturePage;
