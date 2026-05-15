import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  employeeMonthlyAttendanceApi,
  getCurrentMonth,
  getCurrentMonthlyAttendanceResponse,
} from '../redux/attendanceSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';

const formatValue = (value, fallback = 'Not available') =>
  value === null ||
  value === undefined ||
  value === '' ||
  value === '0000-00-00 00:00:00'
    ? fallback
    : String(value);

function SummaryCard({ label, value, tone }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryValue, tone && styles[tone]]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function AttendanceRow({ item }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.recordDate}>{formatValue(item.attendance_date)}</Text>
          <Text style={styles.recordSource}>{formatValue(item.added_by)}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{formatValue(item.emp_attd, '-')}</Text>
        </View>
      </View>
      <View style={styles.recordGrid}>
        <View style={styles.recordMeta}>
          <Text style={styles.metaLabel}>Login Time</Text>
          <Text style={styles.metaValue}>{formatValue(item.emp_attd_dt)}</Text>
        </View>
        <View style={styles.recordMeta}>
          <Text style={styles.metaLabel}>Logout Time</Text>
          <Text style={styles.metaValue}>{formatValue(item.logout)}</Text>
        </View>
      </View>
    </View>
  );
}

function Timesheet() {
  const session = getCurrentAuthSession();
  const [attendanceResponse, setAttendanceResponse] = useState(
    getCurrentMonthlyAttendanceResponse()
  );
  const [loading, setLoading] = useState(!getCurrentMonthlyAttendanceResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const month = getCurrentMonth();

  const loadAttendance = useCallback(
    async ({ refresh = false } = {}) => {
      if (session?.mode !== 'employee') {
        setLoading(false);
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await employeeMonthlyAttendanceApi({ month });
        setAttendanceResponse(response);
        setError('');
      } catch (attendanceError) {
        setError(
          attendanceError.message || 'Unable to load monthly attendance.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month, session?.mode]
  );

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const attendanceData = attendanceResponse?.data?.data || {};
  const employee = attendanceData.employee || {};
  const summary = attendanceData.calculated_summary || {};
  const records = attendanceData.attendance || [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAttendance({ refresh: true })}
          tintColor="#F08C3C"
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>MONTHLY ATTENDANCE</Text>
        
      </View>

      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#174F93" />
          <Text style={styles.stateText}>Loading attendance...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Attendance API error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.summaryGrid}>
        <SummaryCard label="Present" value={formatValue(summary.present_days, '0')} tone="presentText" />
        <SummaryCard label="Absent" value={formatValue(summary.absent_days, '0')} tone="absentText" />
        <SummaryCard label="Leave" value={formatValue(summary.leave_days, '0')} />
        <SummaryCard label="Records" value={formatValue(summary.total_records, '0')} />
      </View>

      <Text style={styles.sectionTitle}>ATTENDANCE RECORDS</Text>
      {records.length ? (
        records.map((item) => (
          <AttendanceRow key={item.emp_attd_id} item={item} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No records found</Text>
          <Text style={styles.emptyText}>Monthly attendance is not available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 28,
    marginTop:10,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: '#113A70',
    borderRadius: 12,
    padding: 16,
  },
  eyebrow: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: '#C6DCF6',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  stateText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  summaryCard: {
    backgroundColor: '#F4F8FD',
    borderColor: '#D2E1F4',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 76,
    padding: 12,
    width: '47.5%',
  },
  summaryValue: {
    color: '#113A70',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  presentText: {
    color: '#027a48',
  },
  absentText: {
    color: '#b42318',
  },
  sectionTitle: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  recordHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordDate: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  recordSource: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  statusPill: {
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    color: '#174F93',
    fontSize: 12,
    fontWeight: '900',
  },
  recordGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  recordMeta: {
    flex: 1,
  },
  metaLabel: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  emptyTitle: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default Timesheet;
