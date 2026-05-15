import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCurrentEmployeeDashboardResponse } from '../redux/employeeSlice';

const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

function LeaveCard({ leave }) {
  const approvedBy = leave.approved_by || leave.rejected_by || 'Not available';

  return (
    <View style={styles.leaveCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.leaveType}>{formatValue(leave.leave_cat_name, 'Leave')}</Text>
          <Text style={styles.leaveDates}>
            {formatValue(leave.start_date)} to {formatValue(leave.end_date)}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{formatValue(leave.leave_status, 'Pending')}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Cause</Text>
        <Text style={styles.detailValue}>{formatValue(leave.leave_reason)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Approved By</Text>
        <Text style={styles.detailValue}>{approvedBy}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Applied On</Text>
        <Text style={styles.detailValue}>{formatValue(leave.applied_on)}</Text>
      </View>
    </View>
  );
}

function Leave() {
  const latestLeaves =
    getCurrentEmployeeDashboardResponse()?.data?.data?.latest_leaves || [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
   

      {latestLeaves.length ? (
        latestLeaves.map((leave) => (
          <LeaveCard key={leave.leave_apply_id} leave={leave} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No leave records</Text>
          <Text style={styles.emptyText}>Latest leave schedule is not available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F4F8FD',
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  title: {
    color: '#113A70',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  leaveCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
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
    backgroundColor: '#EAF2FF',
    borderColor: '#BFD5F3',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#174F93',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailRow: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  detailLabel: {
    color: '#6B7F99',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  emptyTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default Leave;
