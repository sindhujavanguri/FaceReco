import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  adminLeaveActionApi,
  adminLeaveListApi,
  getCurrentAdminLeaveApprovedResponse,
  getCurrentAdminLeavePendingResponse,
  getCurrentAdminLeaveRejectedResponse,
} from '../redux/AdminSlice';

const statuses = ['pending', 'approved', 'rejected'];

const formatValue = (value, fallback = 'Not available') =>
  value === null ||
  value === undefined ||
  value === '' ||
  value === '0000-00-00 00:00:00'
    ? fallback
    : String(value);

const getCachedResponse = (status) => {
  if (status === 'approved') return getCurrentAdminLeaveApprovedResponse();
  if (status === 'rejected') return getCurrentAdminLeaveRejectedResponse();
  return getCurrentAdminLeavePendingResponse();
};

function StatusLeaveCard({ leave, onAction, actingId }) {
  const employee = leave.employee || {};
  const isPending = String(leave.leave_status || '').toLowerCase() === 'pending';
  const isActing = actingId === leave.leave_apply_id;

  return (
    <View style={styles.leaveCard}>
      <View style={styles.leaveHeader}>
        <View style={styles.leaveTitleBlock}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {formatValue(employee.emp_name, 'Employee')}
          </Text>
          <Text style={styles.employeeMeta} numberOfLines={1}>
            {formatValue(employee.emp_code, '')} - {formatValue(employee.designation_name, '')}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{formatValue(leave.leave_status, 'Pending')}</Text>
        </View>
      </View>

      <View style={styles.leaveBlock}>
        <Text style={styles.leaveType}>{formatValue(leave.leave_cat_name, 'Leave')}</Text>
        <Text style={styles.leaveDates}>
          {formatValue(leave.start_date)} to {formatValue(leave.end_date)}
        </Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Applied On</Text>
          <Text style={styles.metaValue}>{formatValue(leave.applied_on)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Used Days</Text>
          <Text style={styles.metaValue}>{formatValue(leave.leave_days, '0')}</Text>
        </View>
      </View>

      <View style={styles.reasonBlock}>
        <Text style={styles.metaLabel}>Reason</Text>
        <Text style={styles.reasonText}>{formatValue(leave.leave_reason)}</Text>
      </View>

      {isPending && (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isActing}
            style={({ pressed }) => [
              styles.actionButton,
              styles.approveButton,
              pressed && styles.actionButtonPressed,
              isActing && styles.actionButtonDisabled,
            ]}
            onPress={() => onAction(leave, 'approve')}
          >
            <Text style={styles.approveButtonText}>
              {isActing ? 'Saving...' : 'Approve'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isActing}
            style={({ pressed }) => [
              styles.actionButton,
              styles.rejectButton,
              pressed && styles.actionButtonPressed,
              isActing && styles.actionButtonDisabled,
            ]}
            onPress={() => onAction(leave, 'reject')}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function AdminLeaveStatus() {
  const [activeStatus, setActiveStatus] = useState('pending');
  const [responses, setResponses] = useState({
    approved: getCachedResponse('approved'),
    pending: getCachedResponse('pending'),
    rejected: getCachedResponse('rejected'),
  });
  const [loading, setLoading] = useState({
    approved: false,
    pending: !getCachedResponse('pending'),
    rejected: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState('');

  const loadLeaves = useCallback(async ({ status = activeStatus, refresh = false } = {}) => {
    try {
      refresh ? setRefreshing(true) : setLoading((state) => ({ ...state, [status]: true }));
      const response = await adminLeaveListApi({ status });
      setResponses((state) => ({ ...state, [status]: response }));
      setError('');
    } catch (leaveError) {
      setError(leaveError.message || 'Unable to load admin leave status.');
    } finally {
      setLoading((state) => ({ ...state, [status]: false }));
      setRefreshing(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    loadLeaves({ status: 'pending' });
  }, [loadLeaves]);

  const handleStatusPress = (status) => {
    setActiveStatus(status);
    loadLeaves({ status });
  };

  const openAction = (leave, action) => {
    setRemarks('');
    setActionModal({ action, leave });
  };

  const submitAction = async () => {
    if (!actionModal?.leave) return;

    try {
      setActingId(actionModal.leave.leave_apply_id);
      setError('');
      await adminLeaveActionApi({
        action: actionModal.action,
        leave_apply_id: actionModal.leave.leave_apply_id,
        leave_remarks: remarks.trim(),
      });
      setActionModal(null);
      await loadLeaves({ status: activeStatus, refresh: true });
    } catch (actionError) {
      setError(actionError.message || 'Unable to update leave status.');
    } finally {
      setActingId(null);
    }
  };

  const activeResponse = responses[activeStatus];
  const leaveData = activeResponse?.data?.data || {};
  const leaves = leaveData.leaves || [];
  const isLoading = loading[activeStatus];

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLeaves({ status: activeStatus, refresh: true })}
            tintColor="#f08c3c"
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.summaryBand}>
          <Text style={styles.eyebrow}>ADMIN LEAVE STATUS</Text>
          <Text style={styles.summaryTitle}>Review leave requests</Text>
          <Text style={styles.summarySub}>Approve, reject, and track employee leaves.</Text>
        </View>

        <View style={styles.segment}>
          {statuses.map((status) => (
            <Pressable
              accessibilityRole="button"
              key={status}
              style={[
                styles.segmentButton,
                activeStatus === status && styles.segmentButtonActive,
              ]}
              onPress={() => handleStatusPress(status)}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeStatus === status && styles.segmentTextActive,
                ]}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading && (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2664b4" />
            <Text style={styles.stateText}>Loading leave status...</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Admin leave status</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>{activeStatus.toUpperCase()} LEAVES</Text>
          <Text style={styles.countText}>{leaves.length} Records</Text>
        </View>

        {leaves.length ? (
          leaves.map((leave) => (
            <StatusLeaveCard
              actingId={actingId}
              key={leave.leave_apply_id}
              leave={leave}
              onAction={openAction}
            />
          ))
        ) : (
          !isLoading && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No leave records</Text>
              <Text style={styles.emptyText}>
                No {activeStatus} leave applications found.
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <Modal transparent visible={!!actionModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {actionModal?.action === 'reject' ? 'Reject leave' : 'Approve leave'}
            </Text>
            <Text style={styles.modalText}>
              {formatValue(actionModal?.leave?.employee?.emp_name, 'Employee')}
            </Text>
            <TextInput
              multiline
              onChangeText={setRemarks}
              placeholder="Remarks"
              placeholderTextColor="#98A2B3"
              style={styles.remarksInput}
              value={remarks}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setActionModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={submitAction}>
                <Text style={styles.confirmText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
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
    lineHeight: 18,
    marginTop: 5,
  },
  segment: {
    backgroundColor: '#F4F8FD',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
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
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
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
  employeeName: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  employeeMeta: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  statusPill: {
    backgroundColor: '#FFF8E8',
    borderColor: '#FAD991',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#B76E00',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaveBlock: {
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  approveButton: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.76,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  approveButtonText: {
    color: '#027A48',
    fontSize: 13,
    fontWeight: '900',
  },
  rejectButtonText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '900',
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 42, 67, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: '#113A70',
    fontSize: 18,
    fontWeight: '900',
  },
  modalText: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  remarksInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    minHeight: 90,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#F4F8FD',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  cancelText: {
    color: '#2664b4',
    fontSize: 13,
    fontWeight: '900',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default AdminLeaveStatus;
