import React, {useCallback, useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  employeeWorkLogOptionsApi,
  getCurrentEmployeeWorkLogOptionsResponse,
} from '../redux/employeeworklogSlice';

const getOptionsData = (response) => response?.data?.data || {};

function OptionChip({active, label, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${label}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.optionChip,
        active && styles.optionChipActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function WorkLogOptions({navigate, routeParams}) {
  const [optionsResponse, setOptionsResponse] = useState(
    getCurrentEmployeeWorkLogOptionsResponse(),
  );
  const [selectedWorkType, setSelectedWorkType] = useState(
    routeParams?.workType || '',
  );
  const [selectedTaskStatus, setSelectedTaskStatus] = useState(
    routeParams?.taskStatus || '',
  );
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Loading work log options...');

  const loadOptions = useCallback(async () => {
    try {
      setLoading(true);
      setStatusText('Fetching work log options...');
      const response = await employeeWorkLogOptionsApi();
      const data = getOptionsData(response);
      setOptionsResponse(response);
      setSelectedWorkType((current) => current || data.work_types?.[0] || '');
      setSelectedTaskStatus((current) => current || data.task_statuses?.[0] || '');
      setStatusText(response?.data?.message || 'Work log options loaded.');
    } catch (error) {
      console.log('Work Log Options Page Error:', error?.response || error);
      setStatusText(error.message || 'Unable to load work log options.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const data = getOptionsData(optionsResponse);
  const employee = data.employee || {};
  const workTypes = data.work_types || [];
  const taskStatuses = data.task_statuses || [];
  const canProceed = selectedWorkType && selectedTaskStatus;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View>
            <Text style={styles.heroLabel}>EMPLOYEE WORK LOGS</Text>
            <Text style={styles.heroTitle}>{employee.emp_name || 'Work Reports'}</Text>
            <Text style={styles.heroSub}>{employee.emp_code || 'Select report options'}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeValue}>{workTypes.length}</Text>
            <Text style={styles.countBadgeLabel}>Types</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Work Type</Text>
          <View style={styles.chipWrap}>
            {workTypes.map((workType) => (
              <OptionChip
                active={selectedWorkType === workType}
                key={workType}
                label={workType}
                onPress={() => setSelectedWorkType(workType)}
              />
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Task Status</Text>
          <View style={styles.chipWrap}>
            {taskStatuses.map((taskStatus) => (
              <OptionChip
                active={selectedTaskStatus === taskStatus}
                key={taskStatus}
                label={taskStatus}
                onPress={() => setSelectedTaskStatus(taskStatus)}
              />
            ))}
          </View>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Proceed to work log list"
          disabled={loading || !canProceed}
          onPress={() =>
            navigate?.('workLogList', {
              taskStatus: selectedTaskStatus,
              workType: selectedWorkType,
            })
          }
          style={({pressed}) => [
            styles.primaryButton,
            (loading || !canProceed) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Loading...' : 'Proceed'}
          </Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 32,
  },
  heroPanel: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  heroLabel: {
    color: '#9fc2ec',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },
  heroSub: {
    color: '#d8e7fa',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 64,
    padding: 9,
  },
  countBadgeValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  countBadgeLabel: {
    color: '#d8e7fa',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  panelTitle: {
    color: '#113a70',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: '#2664b4',
    borderColor: '#2664b4',
  },
  optionChipText: {
    color: '#113a70',
    fontSize: 13,
    fontWeight: '900',
  },
  optionChipTextActive: {
    color: '#ffffff',
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 14,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default WorkLogOptions;
