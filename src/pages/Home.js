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
  getCurrentFaceAttendanceRegisterResponse,
} from '../redux/faceAttendanceSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';
import {
  formatFaceAttendanceLocation,
  getFaceAttendanceLocationPayload,
  getLatestFaceAttendanceLocationPayload,
} from '../utils/locationPayload';

const homeIcon = require('../../assets/images/home3.png');
const scanIcon = require('../../assets/images/scan.png');
const settingIcon = require('../../assets/images/setting.png');

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

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const monthValue = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${monthValue}-${day}`;
};

const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const getStatusData = (response) => response?.data?.data || response?.data || {};

const getRegistrationData = (response) => response?.data?.data || response?.data || {};

const readBooleanFlag = (source, keys, truthyWords = ['yes', 'true', 'registered']) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value === true || value === 1 || value === '1') {
      return true;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
      if (truthyWords.includes(normalized)) {
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

const readRegistrationFlag = (source) =>
  readBooleanFlag(source, [
    'face_registered',
    'is_face_registered',
    'registered',
    'is_registered',
    'has_face',
    'has_face_embedding',
    'registration_status',
    'face_status',
  ]);

const readLoggedInFlag = (source) =>
  readBooleanFlag(
    source,
    [
      'logged_in',
      'is_logged_in',
      'punched_in',
      'is_punched_in',
      'login_status',
      'attendance_status',
    ],
    ['yes', 'true', 'logged_in', 'in', 'login', 'present'],
  );

const findAttendanceValue = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    if (source[key] !== null && source[key] !== undefined && source[key] !== '') {
      return source[key];
    }
  }

  for (const value of Object.values(source)) {
    const nestedValue = findAttendanceValue(value, keys);
    if (nestedValue !== undefined) {
      return nestedValue;
    }
  }

  return undefined;
};

const readTodayLoggedInFlag = (source) => {
  const directFlag = readLoggedInFlag(source);
  if (directFlag !== undefined) {
    return directFlag;
  }

  const logoutValue = findAttendanceValue(source, [
    'logout',
    'logout_time',
    'logged_out_at',
    'out_time',
  ]);
  if (logoutValue !== undefined) {
    return false;
  }

  const loginValue = findAttendanceValue(source, [
    'login',
    'login_time',
    'logged_in_at',
    'in_time',
  ]);
  return loginValue !== undefined ? true : undefined;
};

const readTodayLoggedOutFlag = (source) => {
  const logoutValue = findAttendanceValue(source, [
    'logout',
    'logout_time',
    'logged_out_at',
    'out_time',
  ]);

  return logoutValue !== undefined;
};

const getAttendanceRecords = (monthlyAttendance = {}) =>
  Array.isArray(monthlyAttendance.attendance)
    ? monthlyAttendance.attendance
    : Array.isArray(monthlyAttendance.records)
      ? monthlyAttendance.records
      : [];

const getRecordDate = (record = {}) => {
  const dateValue =
    record.attendance_date ||
    record.emp_attd_date ||
    record.work_date ||
    record.date ||
    record.emp_attd_dt;

  return String(dateValue || '').slice(0, 10);
};

const isValidLogoutValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim();
  return Boolean(
    normalized &&
      normalized !== '0000-00-00 00:00:00' &&
      normalized !== '0000-00-00' &&
      normalized !== '00:00:00' &&
      normalized.toLowerCase() !== 'null',
  );
};

const getTodayAttendanceRecord = (monthlyAttendance = {}) => {
  const todayKey = getTodayKey();
  return getAttendanceRecords(monthlyAttendance).find(
    (record) => getRecordDate(record) === todayKey,
  );
};

const getAttendanceStepFromRecord = ({
  faceRegistered,
  isEmployeeAccess,
  monthlyAttendance,
  routeAction,
  todayFaceStatus,
}) => {
  if (!isEmployeeAccess) {
    return 'login';
  }

  if (routeAction === 'logout') {
    return 'done';
  }

  if (routeAction === 'login') {
    return 'logout';
  }

  if (!faceRegistered) {
    return 'register';
  }

  const todayRecord = getTodayAttendanceRecord(monthlyAttendance);
  if (todayRecord) {
    return isValidLogoutValue(todayRecord.logout) ? 'done' : 'logout';
  }

  const todayLoggedIn = readTodayLoggedInFlag(todayFaceStatus);
  if (todayLoggedIn === true) {
    return 'logout';
  }
  if (todayLoggedIn === false) {
    return 'done';
  }

  return 'login';
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
  const isEmployeeAccess =
    session?.mode === 'employee' ||
    Boolean(
      session?.user?.emp_id ||
        session?.user?.employee_id ||
        session?.user?.emp_name ||
        session?.user?.emp_username,
    );
  const [dashboardResponse, setDashboardResponse] = useState(
    getCurrentEmployeeDashboardResponse()
  );
  const [attendanceResponse, setAttendanceResponse] = useState(
    getCurrentMonthlyAttendanceResponse()
  );
  const [faceStatusResponse, setFaceStatusResponse] = useState(
    isEmployeeAccess ? null : getCurrentFaceAttendanceTodayStatusResponse()
  );
  const [attendanceStep, setAttendanceStep] = useState('login');
  const [error, setError] = useState('');
  const [faceStatusError, setFaceStatusError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(
    routeParams?.lastScanLocation || getLatestFaceAttendanceLocationPayload(),
  );
  const [locationStatus, setLocationStatus] = useState(
    routeParams?.lastScanLocation || getLatestFaceAttendanceLocationPayload()
      ? ''
      : 'Fetching current location...',
  );
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
    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (!isMounted) {
        return;
      }

      const latestLocation = getLatestFaceAttendanceLocationPayload();
      setCurrentLocation(latestLocation);
      setLocationStatus(latestLocation ? '' : 'Location will update during attendance scan.');
    }, 2000);

    const loadCurrentLocation = async () => {
      try {
        setLocationStatus((status) => status || 'Fetching current location...');
        const locationPayload = await getFaceAttendanceLocationPayload({
          highAccuracy: false,
          fallbackTimeout: 900,
          maximumAge: 300000,
          includeAddress: true,
          addressTimeout: 900,
          fallbackToCoordinates: false,
        });
        if (!isMounted) {
          return;
        }
        clearTimeout(fallbackTimer);
        setCurrentLocation(locationPayload.addressText ? locationPayload : null);
        setLocationStatus(
          locationPayload.addressText ? '' : 'Location will update during attendance scan.',
        );
      } catch (locationError) {
        console.log('Home Current Location Error:', locationError);
        if (!isMounted) {
          return;
        }
        clearTimeout(fallbackTimer);
        const latestLocation = getLatestFaceAttendanceLocationPayload();
        setCurrentLocation(latestLocation);
        setLocationStatus(latestLocation ? '' : 'Location will update during attendance scan.');
      }
    };

    loadCurrentLocation();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [routeParams?.refreshFaceAttendance]);

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
  const locationName = currentLocation
    ? formatFaceAttendanceLocation(currentLocation)
    : locationStatus;

  const today = formatDisplayDate(dashboardData.today);
  const monthlyAttendance = attendanceResponse?.data?.data || {};
  const attendanceSummary = monthlyAttendance.calculated_summary || {};
  const todayFaceStatus = getStatusData(faceStatusResponse);
  const latestRegisterStatus = getRegistrationData(getCurrentFaceAttendanceRegisterResponse());
  const routeFaceRegisteredFlag = routeParams?.faceRegistered === true;
  const apiFaceRegisteredFlag = readRegistrationFlag(todayFaceStatus);
  const registerResponseFlag = readRegistrationFlag(latestRegisterStatus);
  const faceRegisteredFlag =
    routeFaceRegisteredFlag ||
    apiFaceRegisteredFlag === true ||
    registerResponseFlag === true;
  const computedAttendanceStep = getAttendanceStepFromRecord({
    faceRegistered: faceRegisteredFlag,
    isEmployeeAccess,
    monthlyAttendance,
    routeAction: routeParams?.faceActionCompleted,
    todayFaceStatus,
  });
  const isFaceLoggedIn = computedAttendanceStep === 'logout';
  const isFaceLoggedOut =
    computedAttendanceStep === 'done' || readTodayLoggedOutFlag(todayFaceStatus);
  const faceActionMode = isFaceLoggedIn ? 'logout' : 'login';
  const currentScanMode = attendanceStep === 'logout' ? 'logout' : 'login';
  const currentScanLabel = currentScanMode === 'logout' ? 'Logout' : 'Login';
  const isAttendanceDone = attendanceStep === 'done' || isFaceLoggedOut;
  const shouldRegisterFace = isEmployeeAccess && attendanceStep === 'register';
  const noticesCount = dashboardData.notices?.length || 0;
  const birthdaysCount = dashboardData.todays_birthdays?.length || 0;
  const profileUpdateStatus = dashboardData.profile_update_request
    ? 'Request in progress'
    : 'No pending request';

  useEffect(() => {
    setAttendanceStep(computedAttendanceStep);
  }, [
    computedAttendanceStep,
  ]);

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
          {!!currentLocation?.accuracy && (
            <Text style={styles.locationMeta} numberOfLines={1}>
              Accuracy {currentLocation.accuracy}m
            </Text>
          )}
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
         
          <Text style={styles.cardTitle}>Today Attendance</Text>

          {(isEmployeeAccess || session?.mode === 'admin') && (
            <>
              {isEmployeeAccess && attendanceStep === 'register' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Register face"
                  style={({ pressed }) => [
                    styles.faceActionButton,
                    styles.registerButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => navigate('faceRegister')}
                >
                  <Text style={styles.faceActionButtonText}>Register Face</Text>
                </Pressable>
              )}

              {isEmployeeAccess && faceRegisteredFlag && (
                <View style={styles.faceProfileActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View face profile"
                    style={({ pressed }) => [
                      styles.faceProfileButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() =>
                      navigate('faceProfileView', {
                        lastScanLocation: currentLocation,
                      })
                    }
                  >
                    <Text style={styles.faceProfileButtonText}>View Face</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit face profile"
                    style={({ pressed }) => [
                      styles.faceProfileButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() => navigate('faceRegisterEdit')}
                  >
                    <Text style={styles.faceProfileButtonText}>Edit Face</Text>
                  </Pressable>
                </View>
              )}

              {attendanceStep !== 'register' && !isAttendanceDone && (
                <>
                  <View style={styles.faceActionStatus}>
                    <Text style={styles.faceActionStatusLabel}>Current Action</Text>
                    <Text style={styles.faceActionStatusValue}>{currentScanLabel}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${currentScanLabel.toLowerCase()} face scan`}
                    style={styles.scanButton}
                    onPress={() => navigate('scan', { mode: currentScanMode })}
                  >
                    <Text style={styles.scanButtonText}>{currentScanLabel}</Text>
                  </Pressable>
                </>
              )}

              {isAttendanceDone && (
                <View style={styles.attendanceDoneBox}>
                  <Text style={styles.attendanceDoneText}>Attendance Completed</Text>
                </View>
              )}
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
          accessibilityLabel={shouldRegisterFace ? 'Register face' : 'Open scan'}
          style={({ pressed }) => [
            styles.taskBarItem,
            pressed && styles.taskBarItemPressed,
          ]}
          onPress={() =>
            shouldRegisterFace
              ? navigate('faceRegister')
              : navigate('scan', { mode: faceActionMode })
          }
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
  locationMeta: {
    color: '#8A99AA',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
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
  registerButton: {
    marginBottom: 10,
  },
  faceActionStatus: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  faceActionStatusLabel: {
    color: '#9FC2EC',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  faceActionStatusValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  attendanceDoneBox: {
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  attendanceDoneText: {
    color: '#027A48',
    fontSize: 15,
    fontWeight: '900',
  },
  actionButtonPressed: {
    opacity: 0.78,
  },
  faceActionButtonText: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  faceProfileActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  faceProfileButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  faceProfileButtonText: {
    color: '#113A70',
    fontSize: 13,
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
