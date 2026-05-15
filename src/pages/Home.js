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
  employeeDashboardApi,
  getCurrentEmployeeDashboardResponse,
} from '../redux/employeeSlice';
import {
  employeeMonthlyAttendanceApi,
  getCurrentMonth,
  getCurrentMonthlyAttendanceResponse,
} from '../redux/attendanceSlice';
import {
  faceAttendanceTodayStatusApi,
  getCurrentFaceAttendanceTodayStatusResponse,
} from '../redux/faceAttendanceSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';

const homeIcon = require('../../assets/images/home3.png');
const scanIcon = require('../../assets/images/scan.png');
const settingIcon = require('../../assets/images/newsetting.png');

const formatDisplayDate = (dateValue) => {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();

  return {
    inline: date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };
};

const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const getStatusData = (response) => response?.data?.data || response?.data || {};

const readStatusFlag = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value === true || value === 1 || value === '1') {
      return true;
    }
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (['yes', 'true', 'registered', 'login', 'logged_in', 'in', 'present'].includes(normalized)) {
        return true;
      }
      if (['no', 'false', 'not_registered', 'logout', 'logged_out', 'out'].includes(normalized)) {
        return false;
      }
    }
    if (value === false || value === 0 || value === '0') {
      return false;
    }
  }
  return undefined;
};

function SummaryCard({ label, value, tone }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryValue, tone && styles[tone]]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function UpdateRow({ label, value }) {
  return (
    <View style={styles.updateRow}>
      <Text style={styles.updateLabel}>{label}</Text>
      <Text style={styles.updateValue}>{value}</Text>
    </View>
  );
}

function Home({ navigate, routeParams }) {
  const session = getCurrentAuthSession();
  const isEmployeeAccess = session?.mode === 'employee';
  const [dashboardResponse, setDashboardResponse] = useState(
    getCurrentEmployeeDashboardResponse()
  );
  const [attendanceResponse, setAttendanceResponse] = useState(
    getCurrentMonthlyAttendanceResponse()
  );
  const [faceStatusResponse, setFaceStatusResponse] = useState(
    getCurrentFaceAttendanceTodayStatusResponse()
  );
  const [faceRegisteredInThisFlow, setFaceRegisteredInThisFlow] = useState(false);
  const [error, setError] = useState('');
  const [faceStatusError, setFaceStatusError] = useState('');
  const month = getCurrentMonth();

  const loadDashboard = useCallback(async () => {
    if (!isEmployeeAccess) {
      return;
    }

    try {
      const response = await employeeDashboardApi();
      setDashboardResponse(response);
      setError('');
    } catch (dashboardError) {
      setError(dashboardError.message || 'Unable to load dashboard.');
    }
  }, [isEmployeeAccess]);

  const loadMonthlyAttendance = useCallback(async () => {
    if (!isEmployeeAccess) {
      return;
    }

    try {
      const response = await employeeMonthlyAttendanceApi({ month });
      setAttendanceResponse(response);
    } catch (attendanceError) {
      console.log('Home Monthly Attendance Error:', attendanceError);
    }
  }, [isEmployeeAccess, month]);

  const loadFaceTodayStatus = useCallback(async () => {
    if (!isEmployeeAccess) {
      return;
    }

    try {
      const response = await faceAttendanceTodayStatusApi();
      setFaceStatusResponse(response);
      setFaceStatusError('');
    } catch (statusError) {
      console.log('Home Face Attendance Today Status Error:', statusError?.response || statusError);
      setFaceStatusError(statusError.message || 'Unable to load today face attendance.');
    }
  }, [isEmployeeAccess]);

  useEffect(() => {
    loadDashboard();
    loadMonthlyAttendance();
    loadFaceTodayStatus();
  }, [
    loadDashboard,
    loadMonthlyAttendance,
    loadFaceTodayStatus,
    routeParams?.refreshFaceAttendance,
  ]);

  useEffect(() => {
    if (routeParams?.faceRegistered === true) {
      setFaceRegisteredInThisFlow(true);
    }
  }, [routeParams?.faceRegistered]);

  const dashboardData = dashboardResponse?.data?.data || {};
  const dashboardEmployee = dashboardData.employee || {};
  const sessionUser = session?.user || {};
  const employee =
    isEmployeeAccess
      ? { ...sessionUser, ...dashboardEmployee }
      : sessionUser;
  const userName =
    employee.emp_name ||
    employee.admin_name ||
    employee.name ||
    employee.emp_username ||
    employee.admin_username ||
    'User';
  const locationName =
    employee.location ||
    session?.company?.comp_city ||
    session?.company?.comp_state ||
    session?.company?.comp_country ||
    'Location not available';

  const today = formatDisplayDate(dashboardData.today);
  const monthlyAttendance = attendanceResponse?.data?.data || {};
  const attendanceSummary = monthlyAttendance.calculated_summary || {};
  const todayFaceStatus = getStatusData(faceStatusResponse);
  const isFaceRegistered = faceRegisteredInThisFlow;
  const loggedInFlag = readStatusFlag(todayFaceStatus, [
    'logged_in',
    'is_logged_in',
    'punched_in',
    'is_punched_in',
    'login_status',
    'attendance_status',
  ]);
  const isFaceLoggedIn = Boolean(loggedInFlag);
  const faceActionMode = isFaceLoggedIn ? 'logout' : 'login';
  const faceActionLabel = isFaceLoggedIn ? 'Logout' : 'Login';
  const noticesCount = dashboardData.notices?.length || 0;
  const birthdaysCount = dashboardData.todays_birthdays?.length || 0;
  const profileUpdateStatus = dashboardData.profile_update_request
    ? 'Request in progress'
    : 'No pending request';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.body}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.dateInline}>{today.inline}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {locationName}
          </Text>
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Dashboard API error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isEmployeeAccess && !!faceStatusError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Face attendance API error</Text>
            <Text style={styles.errorText}>{faceStatusError}</Text>
          </View>
        )}

        {/* Attendance Card */}
        <View style={styles.attendanceCard}>
          <Text style={styles.cardEyebrow}>ATTENDANCE</Text>
          <Text style={styles.cardTitle}>Today Attendance</Text>

          {isEmployeeAccess && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isFaceRegistered ? `${faceActionLabel} face scan` : 'Register face'
                }
                style={({ pressed }) => [
                  styles.faceActionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() =>
                  isFaceRegistered
                    ? navigate('scan', { mode: faceActionMode })
                    : navigate('faceRegister')
                }
              >
                <Text style={styles.faceActionButtonText}>
                  {isFaceRegistered ? faceActionLabel : 'Register'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start face scan"
                style={styles.scanButton}
                onPress={() => navigate('scan', { mode: faceActionMode })}
              >
                <Text style={styles.scanButtonText}>Start Scan</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Monthly Attendance Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MONTHLY ATTENDANCE</Text>
        </View>

        <View style={styles.attendanceSummaryCard}>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Present"
              value={formatValue(attendanceSummary.present_days, '0')}
              tone="approvedText"
            />
            <SummaryCard
              label="Absent"
              value={formatValue(attendanceSummary.absent_days, '0')}
              tone="rejectedText"
            />
            <SummaryCard
              label="Leave"
              value={formatValue(attendanceSummary.leave_days, '0')}
            />
            <SummaryCard
              label="Records"
              value={formatValue(attendanceSummary.total_records, '0')}
            />
          </View>
        </View>

        <View style={styles.updatesCard}>
          <Text style={styles.updatesTitle}>Today Updates</Text>
          <UpdateRow
            label="Attendance Month"
            value={monthlyAttendance.month || month}
          />
          <UpdateRow
            label="Attendance Records"
            value={`${formatValue(attendanceSummary.total_records, '0')} entries`}
          />
          <UpdateRow label="Notices" value={`${noticesCount} active`} />
          <UpdateRow label="Birthdays" value={`${birthdaysCount} today`} />
          <UpdateRow label="Profile Update" value={profileUpdateStatus} />
        </View>

        </View>
      </ScrollView>

      <View style={styles.taskBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open home"
          style={({ pressed }) => [
            styles.taskBarItem,
            pressed && styles.taskBarItemPressed,
          ]}
          onPress={() => navigate('home')}
        >
          <Image source={homeIcon} style={[styles.taskBarIcon, styles.homeIcon]} resizeMode="contain" />
          <Text style={styles.taskBarText}>Home</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open scan"
          style={({ pressed }) => [
            styles.taskBarItem,
            pressed && styles.taskBarItemPressed,
          ]}
          onPress={() => navigate('scan', { mode: faceActionMode })}
        >
          <Image source={scanIcon} style={styles.taskBarIcon} resizeMode="contain" />
          <Text style={styles.taskBarText}>Scan</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={({ pressed }) => [
            styles.taskBarItem,
            pressed && styles.taskBarItemPressed,
          ]}
          onPress={() => navigate('settings')}
        >
          <Image source={settingIcon} style={styles.taskBarIcon} resizeMode="contain" />
          <Text style={styles.taskBarText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#Ffff',
    flex: 1,
  },
  scrollView: {
    backgroundColor: '#Ffff',
    flex: 1,
  },
  content: {
    paddingBottom: 108,
  },
  body: {
    paddingHorizontal: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#2664b4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  dateInline: {
    color: '#F08C3C',
    fontSize: 18,
    fontWeight: '900',
  },
  name: {
    color: '#113A70',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  location: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },

  // State / Error
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
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

  // Attendance
  attendanceCard: {
    backgroundColor: '#113A70',
    borderRadius: 12,
    marginTop: 14,
    padding: 16,
    shadowColor: '#113A70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  cardEyebrow: {
    color: '#9FC2EC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    paddingVertical: 14,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  faceActionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  actionButtonPressed: {
    opacity: 0.78,
  },
  faceActionButtonText: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },

  // Section Header
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 22,
  },
  sectionTitle: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  attendanceSummaryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#2664b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#F4F8FD',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    justifyContent: 'center',
    padding: 10,
  },
  summaryValue: {
    color: '#113A70',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },
  approvedText: {
    color: '#027a48',
  },
  rejectedText: {
    color: '#b42318',
  },
  updatesCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
    shadowColor: '#2664b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  updatesTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  updateRow: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  updateLabel: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  updateValue: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  taskBar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: '#D2E1F4',
    borderTopWidth: 1,
    bottom: 0,
    height: 76,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingHorizontal: 34,
    position: 'absolute',
    right: 0,
  },
  taskBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  taskBarItemPressed: {
    opacity: 0.75,
  },
  taskBarIcon: {
    height: 28,
    width: 28,
  },
  homeIcon: {
    height: 30,
    width: 30,
  },
  taskBarText: {
    color: '#174F93',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },

});

export default Home;
