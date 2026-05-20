import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  employeeNavigationApi,
  getCurrentEmployeeNavigationResponse,
} from '../redux/employeeSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';

const employeeRouteByKey = {
  add_expense: 'addExpense',
  add_work_report: 'addWorkReport',
  daily_work_report: 'dailyWorkReport',
  dashboard: 'home',
  documents: 'documents',
  expenses: 'expenses',
  leave_management: 'employeeLeaves',
  monthly_work_report: 'monthlyWorkReport',
  payroll: 'payroll',
  profile: 'profile',
  employee_tax: 'tds',
  income_tax: 'tds',
  tax: 'tds',
  tax_management: 'tds',
  tds: 'tds',
  timesheet: 'timesheet',
  upload_documents: 'uploadDocuments',
  view_documents: 'viewDocuments',
  view_expenses: 'expenses',
  work_reports: 'workLogOptions',
};

const adminRouteByKey = {
  add_expense: 'addExpense',
  add_work_report: 'addWorkReport',
  admin_tax: 'taxFinancialYears',
  daily_work_report: 'dailyWorkReport',
  dashboard: 'home',
  documents: 'documents',
  expenses: 'adminExpensesList',
  leave_management: 'adminLeaves',
  monthly_work_report: 'monthlyWorkReport',
  payroll: 'payroll',
  profile: 'profile',
  employee_tax: 'taxFinancialYears',
  income_tax: 'taxFinancialYears',
  tax: 'taxFinancialYears',
  tax_management: 'taxFinancialYears',
  tds: 'taxFinancialYears',
  timesheet: 'timesheet',
  upload_documents: 'uploadDocuments',
  view_documents: 'viewDocuments',
  view_expenses: 'expenses',
  work_reports: 'workLogOptions',
};

const adminMenu = [
  {
    enabled: true,
    key: 'dashboard',
    title: 'Dashboard',
  },
  {
    enabled: true,
    key: 'admin_tax',
    title: 'TDS',
  },
  {
    enabled: true,
    key: 'profile',
    title: 'Employee Profile',
  },
  {
    enabled: true,
    key: 'timesheet',
    title: 'Timesheet',
  },
  {
    enabled: true,
    key: 'leave_management',
    title: 'Leave Management',
  },
  {
    enabled: true,
    key: 'payroll',
    title: 'Payroll',
  },
  {
    enabled: true,
    key: 'documents',
    title: 'Documents',
  },
  {
    enabled: true,
    key: 'work_reports',
    title: 'Work Reports',
  },
  {
    enabled: true,
    key: 'expenses',
    title: 'Expenses',
  },
];

const menuIcons = {
  dashboard: require('../../assets/images/home3.png'),
  documents: require('../../assets/images/documents.png'),
  expenses: require('../../assets/images/expense.png'),
  leave_management: require('../../assets/images/leave.png'),
  payroll: require('../../assets/images/payroll.png'),
  profile: require('../../assets/images/profil.png'),
  admin_tax: require('../../assets/images/payroll.png'),
  tax: require('../../assets/images/payroll.png'),
  timesheet: require('../../assets/images/schedule.png'),
  work_reports: require('../../assets/images/report.png'),
};

const menuMeta = {
  dashboard:       { subtitle: 'Overview',       iconBg: '#FEF0E4', iconTint: '#C06A1E' },
  leave_management:{ subtitle: 'Apply & track',  iconBg: '#E6EEF9', iconTint: '#185FA5' },
  timesheet:       { subtitle: 'Daily hours',    iconBg: '#E1F5EE', iconTint: '#0F6E56' },
  payroll:         { subtitle: 'Salary slips',   iconBg: '#EAF3DE', iconTint: '#3B6D11' },
  employee_tax:    { subtitle: 'TDS forms',      iconBg: '#E9F7F7', iconTint: '#0F6E6E' },
  income_tax:      { subtitle: 'TDS forms',      iconBg: '#E9F7F7', iconTint: '#0F6E6E' },
  tax:             { subtitle: 'TDS forms',      iconBg: '#E9F7F7', iconTint: '#0F6E6E' },
  tax_management:  { subtitle: 'TDS forms',      iconBg: '#E9F7F7', iconTint: '#0F6E6E' },
  tds:             { subtitle: 'TDS forms',      iconBg: '#E9F7F7', iconTint: '#0F6E6E' },
  expenses:        { subtitle: 'Claims',         iconBg: '#FAEEDA', iconTint: '#854F0B' },
  work_reports:    { subtitle: 'Daily & monthly',iconBg: '#EEEDFE', iconTint: '#534AB7' },
  documents:       { subtitle: 'View & upload',  iconBg: '#FCEBEB', iconTint: '#A32D2D' },
  profile:         { subtitle: 'Your info',      iconBg: '#FBEAF0', iconTint: '#993556' },
  admin_tax:        { subtitle: 'Tax review',     iconBg: '#EAF4FF', iconTint: '#175CD3' },
};

const fallbackMeta = { subtitle: '', iconBg: '#F1EFE8', iconTint: '#5F5E5A' };

const getTaxRouteFromTitle = (title = '', isAdmin = false) => {
  const normalizedTitle = String(title).toLowerCase();
  if (!normalizedTitle.includes('tds') && !normalizedTitle.includes('tax')) {
    return '';
  }
  return isAdmin ? 'taxFinancialYears' : 'tds';
};

function MenuItem({ item, index, onPress }) {
  const icon = menuIcons[item.key];
  const meta = menuMeta[item.key] || fallbackMeta;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      disabled={!item.enabled}
      style={({ pressed }) => [
        styles.menuCard,
        !item.enabled && styles.disabledCard,
        pressed && styles.menuCardPressed,
      ]}
      onPress={() => onPress(item)}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: meta.iconBg }]}>
        {icon ? (
          <Image
            source={icon}
            style={[styles.iconImage, { tintColor: meta.iconTint }]}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.iconLetter, { color: meta.iconTint }]}>
            {item.title.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* Label row */}
      <View style={styles.labelRow}>
        <View style={styles.labelText}>
          <Text style={styles.menuLabel} numberOfLines={1}>{item.title}</Text>
          {!!meta.subtitle && (
            <Text style={styles.menuSub} numberOfLines={1}>{meta.subtitle}</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

function Menu({ navigate }) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const [navigationResponse, setNavigationResponse] = useState(
    getCurrentEmployeeNavigationResponse()
  );
  const [loading, setLoading] = useState(
    !isAdmin && !getCurrentEmployeeNavigationResponse()
  );
  const [error, setError] = useState('');

  const loadNavigation = useCallback(async () => {
    if (isAdmin) {
      setLoading(false);
      setError('');
      return;
    }

    try {
      setLoading(true);
      const response = await employeeNavigationApi();
      setNavigationResponse(response);
      setError('');
    } catch (navigationError) {
      setError(navigationError.message || 'Unable to load menu.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !navigationResponse) loadNavigation();
  }, [isAdmin, loadNavigation, navigationResponse]);

  const navigationData = navigationResponse?.data?.data || {};
  const menu = isAdmin ? adminMenu : navigationData.menu || [];

  const handleMenuPress = (item) => {
    const routeByKey = isAdmin ? adminRouteByKey : employeeRouteByKey;
    const normalizedKey = String(item.key || '').toLowerCase();
    const route =
      routeByKey[item.key] ||
      routeByKey[normalizedKey] ||
      getTaxRouteFromTitle(item.title, isAdmin) ||
      'home';
    navigate(route);
  };

  // Pair items into rows of 2
  const rows = [];
  for (let i = 0; i < menu.length; i += 2) {
    rows.push([menu[i], menu[i + 1] || null]);
  }

  // Skeleton rows while loading
  const skeletonRows = [[0, 1], [2, 3], [4, 5], [6, 7]];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <Text style={styles.sectionLabel}>Quick access</Text>

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to load menu</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.grid}>
          {skeletonRows.flat().map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {menu.map((item, index) => (
            <MenuItem key={item.key} item={item} index={index} onPress={handleMenuPress} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#Fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },

  sectionLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 2,
  },

  // ── Grid ─────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Menu Card ────────────────────────────────────────────
  menuCard: {
    backgroundColor: '#ffffff',
    borderColor: '#EBEBEB',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: '48.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuCardPressed: {
    backgroundColor: '#FAFAFA',
    opacity: 0.9,
  },
  disabledCard: {
    opacity: 0.38,
  },

  // ── Icon ─────────────────────────────────────────────────
  iconCircle: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginBottom: 14,
    width: 44,
  },
  iconImage: {
    height: 24,
    width: 24,
  },
  iconLetter: {
    fontSize: 18,
    fontWeight: '900',
  },

  // ── Label ────────────────────────────────────────────────
  labelRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    flex: 1,
  },
  menuLabel: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  menuSub: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    color: '#C8C8C8',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 22,
    marginLeft: 4,
  },

  // ── Skeleton ─────────────────────────────────────────────
  skeletonCard: {
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    height: 110,
    width: '48.5%',
  },

  // ── Error ────────────────────────────────────────────────
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    color: '#c92a2a',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default Menu;
