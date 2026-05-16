import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  adminLeaveListApi,
  getCurrentAdminLeaveListResponse,
} from '../redux/AdminSlice';

const formatValue = (value, fallback = 'Not available') =>
  value === null ||
  value === undefined ||
  value === '' ||
  value === '0000-00-00 00:00:00'
    ? fallback
    : String(value);

const normalizeStatus = (status) => String(status || '').toLowerCase();

function StatusPill({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const isApproved = normalizedStatus === 'approved';
  const isRejected = normalizedStatus === 'rejected';

  return (
    <View
      style={[
        styles.statusPill,
        isApproved && styles.approvedPill,
        isRejected && styles.rejectedPill,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isApproved && styles.approvedText,
          isRejected && styles.rejectedText,
        ]}
      >
        {formatValue(status, 'Pending')}
      </Text>
    </View>
  );
}

function AdminLeaveCard({ leave }) {
  const employee = leave.employee || {};
  const image = employee.emp_image;

  return (
    <View style={styles.leaveCard}>
      <View style={styles.employeeRow}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {formatValue(employee.emp_name, 'E').charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.employeeCopy}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {formatValue(employee.emp_name, 'Employee')}
          </Text>
          <Text style={styles.employeeMeta} numberOfLines={1}>
            {formatValue(employee.emp_code, '')} - {formatValue(employee.designation_name, '')}
          </Text>
        </View>
        <StatusPill status={leave.leave_status} />
      </View>

      <View style={styles.leaveHeader}>
        <View style={styles.leaveTitleBlock}>
          <Text style={styles.leaveType}>{formatValue(leave.leave_cat_name, 'Leave')}</Text>
          <Text style={styles.leaveDates}>
            {formatValue(leave.start_date)} to {formatValue(leave.end_date)}
          </Text>
        </View>
        <Text style={styles.daysText}>{formatValue(leave.leave_days, '0')} Days</Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Applied On</Text>
          <Text style={styles.metaValue}>{formatValue(leave.applied_on)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Department</Text>
          <Text style={styles.metaValue}>{formatValue(employee.department_name)}</Text>
        </View>
      </View>

      <View style={styles.reasonBlock}>
        <Text style={styles.metaLabel}>Reason</Text>
        <Text style={styles.reasonText}>{formatValue(leave.leave_reason)}</Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Approved By</Text>
          <Text style={styles.metaValue}>{formatValue(leave.approved_by)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Rejected By</Text>
          <Text style={styles.metaValue}>{formatValue(leave.rejected_by)}</Text>
        </View>
      </View>
    </View>
  );
}

function AdminLeaveList() {
  const [leaveResponse, setLeaveResponse] = useState(
    getCurrentAdminLeaveListResponse()
  );
  const [loading, setLoading] = useState(!getCurrentAdminLeaveListResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLeaves = useCallback(async ({ refresh = false } = {}) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await adminLeaveListApi({ status: 'all' });
      setLeaveResponse(response);
      setError('');
    } catch (leaveError) {
      setError(leaveError.message || 'Unable to load admin leaves.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const leaveData = leaveResponse?.data?.data || {};
  const leaves = leaveData.leaves || [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadLeaves({ refresh: true })}
          tintColor="#f08c3c"
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.summaryBand}>
        <Text style={styles.eyebrow}>ADMIN LEAVE LIST</Text>
        <Text style={styles.summaryTitle}>Employee leave applications</Text>
        <Text style={styles.summarySub}>
          {formatValue(leaveData.total, leaves.length)} records
        </Text>
      </View>

      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.stateText}>Loading admin leaves...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Admin leave API error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>EMPLOYEE LEAVES</Text>
        <Text style={styles.countText}>{leaves.length} Records</Text>
      </View>

      {leaves.length ? (
        leaves.map((leave) => (
          <AdminLeaveCard key={leave.leave_apply_id} leave={leave} />
        ))
      ) : (
        !loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No leave records</Text>
            <Text style={styles.emptyText}>Admin leave list is not available.</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryBand: {
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
  summaryTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },
  summarySub: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
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
    borderRadius: 8,
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
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 18,
  },
  sectionTitle: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  countText: {
    color: '#f5a623',
    fontSize: 12,
    fontWeight: '900',
  },
  leaveCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  employeeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#113A70',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  employeeCopy: {
    flex: 1,
    paddingHorizontal: 10,
  },
  employeeName: {
    color: '#113A70',
    fontSize: 14,
    fontWeight: '900',
  },
  employeeMeta: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  leaveHeader: {
    alignItems: 'flex-start',
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  leaveTitleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  leaveType: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
  },
  leaveDates: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  daysText: {
    color: '#f08c3c',
    fontSize: 12,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: '#FFF8E8',
    borderColor: '#FAD991',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  approvedPill: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  rejectedPill: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  statusText: {
    color: '#B76E00',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  approvedText: {
    color: '#027A48',
  },
  rejectedText: {
    color: '#B42318',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    color: '#6B7F99',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 4,
  },
  reasonBlock: {
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    marginTop: 13,
    paddingTop: 12,
  },
  reasonText: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
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

export default AdminLeaveList;
