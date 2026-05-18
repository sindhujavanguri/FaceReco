import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  employeeNavigationApi,
  employeeProfileApi,
  getCurrentEmployeeDashboardResponse,
  getCurrentEmployeeNavigationResponse,
  getCurrentEmployeeProfileResponse,
} from './src/redux/employeeSlice';
import {
  getCurrentAuthSession,
} from './src/redux/loginSlice';

const HomeScreen = require('./src/pages/Home').default;
const LoginScreen = require('./src/pages/login').default;
const FaceRegisterScreen = require('./src/pages/FaceRegister').default;
const FaceRegisterEditScreen = require('./src/pages/FaceRegisterEdit').default;
const FaceProfileViewScreen = require('./src/pages/FaceProfileView').default;
const ScanScreen = require('./src/pages/scan').default;
const SettingsScreen = require('./src/pages/Settings').default;
const MenuScreen = require('./src/pages/Menu').default;
const ProfileScreen = require('./src/pages/Profile').default;
const LeaveScreen = require('./src/pages/Leave').default;
const EmployeeLeavesScreen = require('./src/pages/EmployeeLeaves').default;
const LeaveCategoriesScreen = require('./src/pages/Categories').default;
const LeaveListScreen = require('./src/pages/LeaveList').default;
const ApplyLeaveScreen = require('./src/pages/ApplyLeave').default;
const AdminLeavesScreen = require('./src/pages/AdminLeaves').default;
const AdminLeaveListScreen = require('./src/pages/AdminLeaveList').default;
const AdminLeaveStatusScreen = require('./src/pages/AdminLeaveStatus').default;
const TimesheetScreen = require('./src/pages/Timesheet').default;
const PayrollScreen = require('./src/pages/Payroll').default;
const DocumentsScreen = require('./src/pages/Documents').default;
const UploadDocumentsScreen = require('./src/pages/UploadDocuments').default;
const ViewDocumentsScreen = require('./src/pages/ViewDocuments').default;
const WorkReportsScreen = require('./src/pages/WorkReports').default;
const AddWorkReportScreen = require('./src/pages/AddWorkReport').default;
const MonthlyWorkReportScreen = require('./src/pages/MonthlyWorkReport').default;
const DailyWorkReportScreen = require('./src/pages/DailyWorkReport').default;
const ExpensesScreen = require('./src/pages/Expenses').default;
const AdminExpensesListScreen = require('./src/pages/AdminExpensesList').default;
const AdminExpenseFormScreen = require('./src/pages/AdminExpenseForm').default;
const AddExpenseScreen = require('./src/pages/AddExpense').default;
const EditExpenseScreen = require('./src/pages/EditExpense').default;
const ViewExpensesScreen = require('./src/pages/ViewExpenses').default;

const backIcon = require('./assets/images/back.png');
const mainLogo = require('./assets/images/mainlogo.png');

type RouteName =
  | 'login'
  | 'home'
  | 'faceRegister'
  | 'faceRegisterEdit'
  | 'faceProfileView'
  | 'scan'
  | 'settings'
  | 'menu'
  | 'profile'
  | 'leave'
  | 'employeeLeaves'
  | 'leaveCategories'
  | 'leaveList'
  | 'applyLeave'
  | 'adminLeaves'
  | 'adminLeaveList'
  | 'adminLeaveStatus'
  | 'timesheet'
  | 'payroll'
  | 'documents'
  | 'uploadDocuments'
  | 'viewDocuments'
  | 'workReports'
  | 'addWorkReport'
  | 'monthlyWorkReport'
  | 'dailyWorkReport'
  | 'expenses'
  | 'adminExpensesList'
  | 'adminExpenseForm'
  | 'addExpense'
  | 'editExpense'
  | 'viewExpenses';

type AppPageProps = {
  navigate: (route: RouteName, params?: Record<string, any>) => void;
  onSignIn?: () => void;
  routeParams?: Record<string, any>;
};

const routes: Record<RouteName, React.ComponentType<AppPageProps>> = {
  login: LoginScreen,
  home: HomeScreen,
  faceRegister: FaceRegisterScreen,
  faceRegisterEdit: FaceRegisterEditScreen,
  faceProfileView: FaceProfileViewScreen,
  scan: ScanScreen,
  settings: SettingsScreen,
  menu: MenuScreen,
  profile: ProfileScreen,
  leave: LeaveScreen,
  employeeLeaves: EmployeeLeavesScreen,
  leaveCategories: LeaveCategoriesScreen,
  leaveList: LeaveListScreen,
  applyLeave: ApplyLeaveScreen,
  adminLeaves: AdminLeavesScreen,
  adminLeaveList: AdminLeaveListScreen,
  adminLeaveStatus: AdminLeaveStatusScreen,
  timesheet: TimesheetScreen,
  payroll: PayrollScreen,
  documents: DocumentsScreen,
  uploadDocuments: UploadDocumentsScreen,
  viewDocuments: ViewDocumentsScreen,
  workReports: WorkReportsScreen,
  addWorkReport: AddWorkReportScreen,
  monthlyWorkReport: MonthlyWorkReportScreen,
  dailyWorkReport: DailyWorkReportScreen,
  expenses: ExpensesScreen,
  adminExpensesList: AdminExpensesListScreen,
  adminExpenseForm: AdminExpenseFormScreen,
  addExpense: AddExpenseScreen,
  editExpense: EditExpenseScreen,
  viewExpenses: ViewExpensesScreen,
};

const routeTitles: Record<RouteName, string> = {
  login: 'Login',
  home: 'Dashboard',
  faceRegister: 'Register Face',
  faceRegisterEdit: 'Edit Face',
  faceProfileView: 'View Face',
  scan: 'Scan Face',
  settings: 'Settings',
  menu: 'Menu',
  profile: 'Profile',
  leave: 'Leave',
  employeeLeaves: 'Leave Management',
  leaveCategories: 'Leave Categories',
  leaveList: 'Employee Leave List',
  applyLeave: 'Apply Leave',
  adminLeaves: 'Leave Management',
  adminLeaveList: 'Admin Leave List',
  adminLeaveStatus: 'Admin Leave Status',
  timesheet: 'Timesheet',
  payroll: 'Payroll',
  documents: 'Documents',
  uploadDocuments: 'Upload Documents',
  viewDocuments: 'View Documents',
  workReports: 'Work Reports',
  addWorkReport: 'Add Report',
  monthlyWorkReport: 'Monthly Report',
  dailyWorkReport: 'Daily Report',
  expenses: 'Expenses',
  adminExpensesList: 'Admin Expenses',
  adminExpenseForm: 'Admin Expense',
  addExpense: 'Add Expense',
  editExpense: 'Edit Expense',
  viewExpenses: 'View Expenses',
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'U';
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

const getUserImage = (user: Record<string, any>): string =>
  user.emp_image || user.admin_image || user.profile_image || user.image || '';

function App(): React.JSX.Element {
  const [route, setRoute] = useState<RouteName>('login');
  const [routeParams, setRouteParams] = useState<Record<string, any>>({});
  const [_routeStack, setRouteStack] = useState<RouteName[]>([]);
  const [headerImageFailed, setHeaderImageFailed] = useState(false);

  const ActiveScreen = routes[route];
  const isAuthRoute = route === 'login';
  const isHomeRoute = route === 'home';

  const session = getCurrentAuthSession();
  const profileEmployee = getCurrentEmployeeProfileResponse()?.data?.data?.employee || {};
  const dashboardEmployee = getCurrentEmployeeDashboardResponse()?.data?.data?.employee || {};
  const navigationEmployee = getCurrentEmployeeNavigationResponse()?.data?.data?.employee || {};

  const headerUser =
    session?.mode === 'employee'
      ? {
          ...(session?.user || {}),
          ...navigationEmployee,
          ...dashboardEmployee,
          ...profileEmployee,
        }
      : session?.user || {};

  const headerName =
    headerUser.emp_name ||
    headerUser.admin_name ||
    headerUser.name ||
    headerUser.emp_username ||
    headerUser.admin_username ||
    'User';

  const headerInitial = getInitials(headerName);
  const headerImage = getUserImage(headerUser);

  useEffect(() => {
    setHeaderImageFailed(false);
  }, [headerImage]);

  const navigateTo = (nextRoute: RouteName, params: Record<string, any> = {}): void => {
    setRouteStack((stack) => [...stack, route]);
    setRouteParams(params);
    setRoute(nextRoute);
  };

  const resetTo = (nextRoute: RouteName, params: Record<string, any> = {}): void => {
    setRouteStack([]);
    setRouteParams(params);
    setRoute(nextRoute);
  };

  const goBack = (): void => {
    setRouteStack((stack) => {
      const previousRoute = stack[stack.length - 1] || 'home';
      setRouteParams({});
      setRoute(previousRoute);
      return stack.slice(0, -1);
    });
  };

  const handleSignIn = async (): Promise<void> => {
    const currentSession = getCurrentAuthSession();
    if (currentSession?.mode !== 'employee') {
      resetTo('home');
      return;
    }
    try {
      await employeeProfileApi();
    } catch (profileError: any) {
      console.log('Employee Profile After Login Error:', profileError?.response || profileError);
    } finally {
      resetTo('home');
    }
  };

  const handleOpenProfile = async (): Promise<void> => {
    if (session?.mode !== 'employee') {
      navigateTo('profile');
      return;
    }
    try {
      await employeeProfileApi();
    } catch (profileError: any) {
      console.log('Header Profile Icon Error:', profileError?.response || profileError);
    } finally {
      navigateTo('profile');
    }
  };

  const handleOpenMenu = async (): Promise<void> => {
    if (session?.mode !== 'employee') {
      navigateTo('menu');
      return;
    }
    try {
      await employeeNavigationApi();
    } catch (navigationError: any) {
      console.log('Header Menu Error:', navigationError?.response || navigationError);
    } finally {
      navigateTo('menu');
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fb" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>

          {!isAuthRoute && (
            <View style={styles.headerWrap}>
              <View style={styles.topBar}>

              {/* Left — hamburger on home, back icon on sub-pages */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isHomeRoute ? 'Open menu' : 'Go back'}
                style={styles.topIconButton}
                onPress={() => (isHomeRoute ? handleOpenMenu() : goBack())}
              >
                {isHomeRoute ? (
                  <View style={styles.menuIcon}>
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                  </View>
                ) : (
                  <Image
                    source={backIcon}
                    style={styles.backIcon}
                    resizeMode="contain"
                  />
                )}
              </Pressable>

              {/* Center — logo on home, page title on sub-pages */}
              {isHomeRoute ? (
                <Image
                  source={mainLogo}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.titleBlock}>
                  <Text style={styles.eyebrow}>SECURE IDENTITY</Text>
                  <Text style={styles.title}>{routeTitles[route]}</Text>
                </View>
              )}

              {/* Right — avatar on home, spacer on sub-pages */}
              {isHomeRoute ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open profile"
                  style={styles.avatarButton}
                  onPress={handleOpenProfile}
                >
                  {headerImage && !headerImageFailed ? (
                    <Image
                      source={{ uri: headerImage }}
                      style={styles.headerAvatarImage}
                      resizeMode="cover"
                      onError={() => setHeaderImageFailed(true)}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{headerInitial}</Text>
                  )}
                </Pressable>
              ) : (
                <View style={styles.headerSpacer} />
              )}
              </View>
              <View style={styles.headerDivider} />
            </View>
          )}

          <View style={[styles.page, isAuthRoute && styles.authPage]}>
            <ActiveScreen
              navigate={navigateTo}
              onSignIn={handleSignIn}
              routeParams={routeParams}
            />
          </View>

        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffff',
    flex: 1,
  },
  appShell: {
    backgroundColor: '#ffff',
    flex: 1,
  },
  headerWrap: {
    backgroundColor: '#ffff',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topIconButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 16,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  menuIcon: {
    gap: 4,
    width: 20,
  },
  menuLine: {
    backgroundColor: '#102a43',
    borderRadius: 2,
    height: 3,
    width: 20,
  },
  backIcon: {
    height: 20,
    tintColor: '#102a43',
    width: 20,
  },
  headerLogo: {
    height: 44,
    width: 150,
  },
  headerDivider: {
    backgroundColor: '#d8e3ed',
    height: 1,
  },
  titleBlock: {
    alignItems: 'center',
  },
  eyebrow: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#101828',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#102a43',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 34,
  },
  headerAvatarImage: {
    height: 34,
    width: 34,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  headerSpacer: {
    height: 34,
    width: 34,
  },
  page: {
    flex: 1,
  },
  authPage: {
    backgroundColor: '#eef5fb',
  },
});

export default App;
