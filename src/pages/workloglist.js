import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  deleteEmployeeWorkLogApi,
  employeeWorkLogListApi,
  getCurrentEmployeeWorkLogListResponse,
} from '../redux/employeeworklogSlice';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const getMonthRange = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) {
    return {from: '', to: ''};
  }

  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${monthValue}-01`,
    to: `${monthValue}-${String(lastDay).padStart(2, '0')}`,
  };
};

const getListData = (response) => response?.data?.data || {};
const getLogs = (response) => getListData(response).logs || [];

const formatValue = (value, fallback = '-') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

function SummaryBox({label, value}) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{formatValue(value, '0')}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function WorkLogCard({log, onDeletePress, onEditPress}) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logTopRow}>
        <View style={styles.logMain}>
          <Text style={styles.logTitle} numberOfLines={2}>
            {log.narration || 'Work log'}
          </Text>
          <Text style={styles.logDate}>{formatValue(log.work_date)}</Text>
        </View>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{formatValue(log.work_type)}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Time</Text>
          <Text style={styles.metaValue}>
            {formatValue(log.from_time)} - {formatValue(log.to_time)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Hours</Text>
          <Text style={styles.metaValue}>{formatValue(log.duration_hours, 0)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={styles.metaValue}>{formatValue(log.task_status)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit work log"
          onPress={onEditPress}
          style={({pressed}) => [styles.editButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete work log"
          onPress={onDeletePress}
          style={({pressed}) => [styles.deleteButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WorkLogList({navigate, routeParams}) {
  const [listResponse, setListResponse] = useState(
    getCurrentEmployeeWorkLogListResponse(),
  );
  const [logs, setLogs] = useState(getLogs(getCurrentEmployeeWorkLogListResponse()));
  const [month, setMonth] = useState(routeParams?.month || getCurrentMonth());
  const [date, setDate] = useState(routeParams?.date || getToday());
  const [from, setFrom] = useState(routeParams?.from || `${getCurrentMonth()}-01`);
  const [to, setTo] = useState(routeParams?.to || getMonthRange(getCurrentMonth()).to);
  const [workType] = useState(routeParams?.workType || '');
  const [taskStatus] = useState(routeParams?.taskStatus || '');
  const [activeFilter, setActiveFilter] = useState('default');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Loading work logs...');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const didInitialLoad = useRef(false);
  const lastRefreshValue = useRef(routeParams?.refreshWorkLogs);

  const loadLogs = useCallback(
    async (filterMode = 'default') => {
      const payload = {taskStatus, workType};

      if (filterMode === 'month') {
        payload.month = month.trim();
      }
      if (filterMode === 'date') {
        payload.date = date.trim();
      }
      if (filterMode === 'range') {
        payload.from = from.trim();
        payload.to = to.trim();
      }

      try {
        setLoading(true);
        setActiveFilter(filterMode);
        setStatusText('Fetching work logs...');
        const response = await employeeWorkLogListApi(payload);
        setListResponse(response);
        setLogs(getLogs(response));
        setStatusText(response?.data?.message || 'Work logs fetched successfully.');
      } catch (error) {
        console.log('Work Log List Page Error:', error?.response || error);
        setStatusText(error.message || 'Unable to fetch work logs.');
      } finally {
        setLoading(false);
      }
    },
    [date, from, month, taskStatus, to, workType],
  );

  useEffect(() => {
    const refreshChanged = lastRefreshValue.current !== routeParams?.refreshWorkLogs;
    if (!didInitialLoad.current || refreshChanged) {
      didInitialLoad.current = true;
      lastRefreshValue.current = routeParams?.refreshWorkLogs;
      loadLogs(routeParams?.filterMode || 'default');
    }
  }, [loadLogs, routeParams?.refreshWorkLogs, routeParams?.filterMode]);

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      setDeleteTarget(null);
      return;
    }

    try {
      setLoading(true);
      setStatusText('Deleting work log...');
      await deleteEmployeeWorkLogApi({workLogId: deleteTarget.id});
      setDeleteTarget(null);
      setStatusText('Work log deleted successfully.');
      await loadLogs(activeFilter);
    } catch (error) {
      console.log('Delete Work Log Page Error:', error?.response || error);
      setStatusText(error.message || 'Delete work log failed.');
    } finally {
      setLoading(false);
    }
  };

  const data = getListData(listResponse);
  const employee = data.employee || {};
  const workTypeSummary = data.work_type_summary || [];
  const taskStatusSummary = data.task_status_summary || [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerPanel}>
          <View>
            <Text style={styles.headerLabel}>WORK LOGS</Text>
            <Text style={styles.headerTitle}>{employee.emp_name || 'Employee'}</Text>
            <Text style={styles.headerSub}>
              {workType || 'All work types'} / {taskStatus || 'All statuses'}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeValue}>{formatValue(data.total, 0)}</Text>
            <Text style={styles.headerBadgeLabel}>Logs</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryBox label="Hours" value={data.total_hours} />
          <SummaryBox label="Minutes" value={data.total_minutes} />
          <SummaryBox label="Page" value={data.page || 1} />
        </View>

        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Filters</Text>
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Work log month"
              onChangeText={setMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#93aac2"
              style={styles.input}
              value={month}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load work logs by month"
              disabled={loading}
              onPress={() => loadLogs('month')}
              style={({pressed}) => [
                styles.filterButton,
                activeFilter === 'month' && styles.filterButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.filterButtonText}>Month</Text>
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Work log date"
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#93aac2"
              style={styles.input}
              value={date}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load work logs by date"
              disabled={loading}
              onPress={() => loadLogs('date')}
              style={({pressed}) => [
                styles.filterButton,
                activeFilter === 'date' && styles.filterButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.filterButtonText}>Date</Text>
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Work log from date"
              onChangeText={setFrom}
              placeholder="From"
              placeholderTextColor="#93aac2"
              style={styles.input}
              value={from}
            />
            <TextInput
              accessibilityLabel="Work log to date"
              onChangeText={setTo}
              placeholder="To"
              placeholderTextColor="#93aac2"
              style={styles.input}
              value={to}
            />
          </View>

          <View style={styles.filterActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load default work logs"
              disabled={loading}
              onPress={() => loadLogs('default')}
              style={({pressed}) => [
                styles.secondaryButton,
                activeFilter === 'default' && styles.secondaryButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Default</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load range work logs"
              disabled={loading}
              onPress={() => loadLogs('range')}
              style={({pressed}) => [
                styles.secondaryButton,
                activeFilter === 'range' && styles.secondaryButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Range</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add work log"
            onPress={() =>
              navigate?.('addWorkLog', {
                taskStatus,
                workType,
              })
            }
            style={({pressed}) => [styles.addButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.addButtonText}>Add Work Log</Text>
          </Pressable>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        {!!workTypeSummary.length && (
          <View style={styles.miniSummaryPanel}>
            {workTypeSummary.map((item) => (
              <View key={item.work_type} style={styles.miniSummaryItem}>
                <Text style={styles.miniSummaryValue}>{item.total_hours}</Text>
                <Text style={styles.miniSummaryLabel}>{item.work_type}</Text>
              </View>
            ))}
          </View>
        )}

        {!!taskStatusSummary.length && (
          <View style={styles.statusSummaryPanel}>
            {taskStatusSummary.map((item) => (
              <Text key={item.task_status} style={styles.statusSummaryText}>
                {item.task_status}: {item.total_logs}
              </Text>
            ))}
          </View>
        )}

        {logs.length ? (
          logs.map((log) => (
            <WorkLogCard
              key={log.id}
              log={log}
              onDeletePress={() => setDeleteTarget(log)}
              onEditPress={() =>
                navigate?.('editWorkLog', {
                  log,
                  taskStatus,
                  workType,
                })
              }
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No work logs found</Text>
            <Text style={styles.emptyText}>Try another filter or add a new work log.</Text>
          </View>
        )}
      </ScrollView>

      {deleteTarget && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Delete work log?</Text>
            <Text style={styles.confirmText}>
              This will remove the {deleteTarget.work_date} log.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel delete work log"
                onPress={() => setDeleteTarget(null)}
                style={({pressed}) => [styles.noButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.noButtonText}>No</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm delete work log"
                disabled={loading}
                onPress={handleDelete}
                style={({pressed}) => [
                  styles.yesButton,
                  loading && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.yesButtonText}>Yes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f5f8fb',
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  headerPanel: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLabel: {
    color: '#9fc2ec',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  headerSub: {
    color: '#d8e7fa',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    minWidth: 62,
    padding: 9,
  },
  headerBadgeValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  headerBadgeLabel: {
    color: '#d8e7fa',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  summaryBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  summaryValue: {
    color: '#113a70',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  panelTitle: {
    color: '#113a70',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 86,
  },
  filterButtonActive: {
    backgroundColor: '#2664b4',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  secondaryButtonActive: {
    backgroundColor: '#e9f2fb',
    borderColor: '#2664b4',
  },
  secondaryButtonText: {
    color: '#113a70',
    fontSize: 13,
    fontWeight: '900',
  },
  actionRow: {
    marginTop: 12,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 12,
    textAlign: 'center',
  },
  miniSummaryPanel: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  miniSummaryItem: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 9,
  },
  miniSummaryValue: {
    color: '#113a70',
    fontSize: 14,
    fontWeight: '900',
  },
  miniSummaryLabel: {
    color: '#6b7f99',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 3,
  },
  statusSummaryPanel: {
    backgroundColor: '#eef6ff',
    borderColor: '#cfe0ef',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    padding: 10,
  },
  statusSummaryText: {
    color: '#113a70',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  logTopRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  logMain: {
    flex: 1,
  },
  logTitle: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  logDate: {
    color: '#6b7f99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  typePillText: {
    color: '#027a48',
    fontSize: 10,
    fontWeight: '900',
  },
  metaGrid: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#113a70',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  deleteButtonText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: '#113a70',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6b7f99',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  confirmOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,24,40,0.28)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 18,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  confirmBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    width: '100%',
  },
  confirmTitle: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '900',
  },
  confirmText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 7,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  noButton: {
    alignItems: 'center',
    backgroundColor: '#f4f8fd',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  noButtonText: {
    color: '#113a70',
    fontSize: 14,
    fontWeight: '900',
  },
  yesButton: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  yesButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default WorkLogList;
