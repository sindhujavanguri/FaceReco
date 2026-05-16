import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  employeeLeaveListApi,
  getCurrentEmployeeLeaveListResponse,
  getCurrentEmployeeLeavePendingResponse,
} from '../redux/LeaveSlice';

const formatValue = (value, fallback = 'Not available') =>
  value === null ||
  value === undefined ||
  value === '' ||
  value === '0000-00-00 00:00:00'
    ? fallback
    : String(value);

const normalizeStatus = (status) => String(status || '').toLowerCase();

function LeaveRecord({ leave }) {
  const status = normalizeStatus(leave.leave_status);
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <View style={styles.leaveCard}>
      <View style={styles.leaveHeader}>
        <View style={styles.leaveTitleBlock}>
          <Text style={styles.leaveType}>{formatValue(leave.leave_cat_name, 'Leave')}</Text>
          <Text style={styles.leaveDates}>
            {formatValue(leave.start_date)} to {formatValue(leave.end_date)}
          </Text>
        </View>
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
            {formatValue(leave.leave_status, 'Pending')}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Applied On</Text>
          <Text style={styles.metaValue}>{formatValue(leave.applied_on)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Used Days</Text>
          <Text style={styles.metaValue}>{formatValue(leave.leaves_used, '0')}</Text>
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

function LeaveList({ routeParams }) {
  const initialStatus = routeParams?.status === 'pending' ? 'pending' : 'all';
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [listResponse, setListResponse] = useState(getCurrentEmployeeLeaveListResponse());
  const [pendingResponse, setPendingResponse] = useState(
    getCurrentEmployeeLeavePendingResponse()
  );
  const [loading, setLoading] = useState({
    all: !getCurrentEmployeeLeaveListResponse(),
    pending: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const loadedInitialStatus = useRef(false);

  const loadLeaves = useCallback(async ({ status = activeTab, refresh = false } = {}) => {
    try {
      refresh ? setRefreshing(true) : setLoading((state) => ({ ...state, [status]: true }));
      const response = await employeeLeaveListApi({ status });

      if (status === 'pending') {
        setPendingResponse(response);
      } else {
        setListResponse(response);
      }

      setError('');
    } catch (leaveError) {
      setError(leaveError.message || 'Unable to load employee leaves.');
    } finally {
      setLoading((state) => ({ ...state, [status]: false }));
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (loadedInitialStatus.current) {
      return;
    }

    loadedInitialStatus.current = true;
    loadLeaves({ status: initialStatus });
  }, [initialStatus, loadLeaves]);

  const handleTabPress = (status) => {
    setActiveTab(status);
    loadLeaves({ status });
  };

  const activeResponse = activeTab === 'pending' ? pendingResponse : listResponse;
  const leaveData = activeResponse?.data?.data || {};
  const employee = leaveData.employee || {};
  const leaves = leaveData.leaves || [];
  const isLoading = activeTab === 'pending' ? loading.pending : loading.all;

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadLeaves({ status: activeTab, refresh: true })}
          tintColor="#f08c3c"
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.employeeBand}>
        <Text style={styles.eyebrow}>EMPLOYEE LEAVE LIST</Text>
        <Text style={styles.employeeName}>{formatValue(employee.emp_name, 'Employee')}</Text>
        <Text style={styles.employeeCode}>{formatValue(employee.emp_code, '')}</Text>
      </View>

      <View style={styles.segment}>
        <Pressable
          accessibilityRole="button"
          style={[styles.segmentButton, activeTab === 'all' && styles.segmentButtonActive]}
          onPress={() => handleTabPress('all')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'all' && styles.segmentTextActive,
            ]}
          >
            Active
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[
            styles.segmentButton,
            activeTab === 'pending' && styles.segmentButtonActive,
          ]}
          onPress={() => handleTabPress('pending')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'pending' && styles.segmentTextActive,
            ]}
          >
            Pending
          </Text>
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.stateText}>Loading leave records...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Leave list API error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'pending' ? 'PENDING LEAVES' : 'EMPLOYEE LEAVES'}
        </Text>
        <Text style={styles.countText}>{leaves.length} Records</Text>
      </View>

      {leaves.length ? (
        leaves.map((leave) => (
          <LeaveRecord key={leave.leave_apply_id} leave={leave} />
        ))
      ) : (
        !isLoading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No leave records</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending'
                ? 'No pending leave applications found.'
                : 'Employee leave list is not available.'}
            </Text>
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
  employeeBand: {
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
  employeeName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },
  employeeCode: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  segment: {
    backgroundColor: '#F4F8FD',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 5,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 11,
  },
  segmentButtonActive: {
    backgroundColor: '#f08c3c',
  },
  segmentText: {
    color: '#2664b4',
    fontSize: 13,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: '#ffffff',
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
  leaveHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 11,
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

export default LeaveList;
