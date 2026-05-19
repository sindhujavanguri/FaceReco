import React, {useCallback, useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  editEmployeeWorkLogApi,
  employeeWorkLogOptionsApi,
  getCurrentEmployeeWorkLogOptionsResponse,
} from '../redux/employeeworklogSlice';

const getOptionsData = (response) => response?.data?.data || {};
const trimSeconds = (value) => String(value || '').slice(0, 5);

function ChoiceChip({active, label, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${label}`}
      onPress={onPress}
      style={({pressed}) => [
        styles.choiceChip,
        active && styles.choiceChipActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function EditWorkLog({navigate, routeParams}) {
  const log = routeParams?.log || {};
  const [optionsResponse, setOptionsResponse] = useState(
    getCurrentEmployeeWorkLogOptionsResponse(),
  );
  const [workDate, setWorkDate] = useState(log.work_date || '');
  const [fromTime, setFromTime] = useState(trimSeconds(log.from_time));
  const [toTime, setToTime] = useState(trimSeconds(log.to_time));
  const [workType, setWorkType] = useState(log.work_type || routeParams?.workType || '');
  const [taskStatus, setTaskStatus] = useState(
    log.task_status || routeParams?.taskStatus || '',
  );
  const [narration, setNarration] = useState(log.narration || '');
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState('Edit work log details.');

  const loadOptions = useCallback(async () => {
    try {
      const response = await employeeWorkLogOptionsApi();
      setOptionsResponse(response);
    } catch (error) {
      console.log('Edit Work Log Options Error:', error?.response || error);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleDone = async () => {
    if (!log.id) {
      setStatusText('Work log id is missing.');
      return;
    }

    if (
      !workDate.trim() ||
      !fromTime.trim() ||
      !toTime.trim() ||
      !workType.trim() ||
      !taskStatus.trim() ||
      !narration.trim()
    ) {
      setStatusText('Date, time, work type, task status and narration are required.');
      return;
    }

    try {
      setSaving(true);
      setStatusText('Updating work log...');
      await editEmployeeWorkLogApi({
        fromTime: fromTime.trim(),
        narration: narration.trim(),
        taskStatus: taskStatus.trim(),
        toTime: toTime.trim(),
        workDate: workDate.trim(),
        workLogId: log.id,
        workType: workType.trim(),
      });
      setStatusText('Work log updated successfully.');
      navigate?.('workLogList', {
        refreshWorkLogs: Date.now(),
        taskStatus,
        workType,
      });
    } catch (error) {
      console.log('Edit Work Log Page Error:', error?.response || error);
      setStatusText(error.message || 'Edit work log failed.');
    } finally {
      setSaving(false);
    }
  };

  const optionsData = getOptionsData(optionsResponse);
  const workTypes = optionsData.work_types || [];
  const taskStatuses = optionsData.task_statuses || [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Work Log</Text>
          <Text style={styles.formSub}>Record #{log.id || '-'}</Text>

          <Text style={styles.inputLabel}>Work Date</Text>
          <TextInput
            accessibilityLabel="Work date"
            onChangeText={setWorkDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={workDate}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.inputLabel}>From Time</Text>
              <TextInput
                accessibilityLabel="From time"
                onChangeText={setFromTime}
                placeholder="10:00"
                placeholderTextColor="#93aac2"
                style={styles.input}
                value={fromTime}
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.inputLabel}>To Time</Text>
              <TextInput
                accessibilityLabel="To time"
                onChangeText={setToTime}
                placeholder="12:00"
                placeholderTextColor="#93aac2"
                style={styles.input}
                value={toTime}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Work Type</Text>
          <View style={styles.chipWrap}>
            {workTypes.map((item) => (
              <ChoiceChip
                active={workType === item}
                key={item}
                label={item}
                onPress={() => setWorkType(item)}
              />
            ))}
          </View>

          <Text style={styles.inputLabel}>Task Status</Text>
          <View style={styles.chipWrap}>
            {taskStatuses.map((item) => (
              <ChoiceChip
                active={taskStatus === item}
                key={item}
                label={item}
                onPress={() => setTaskStatus(item)}
              />
            ))}
          </View>

          <Text style={styles.inputLabel}>Narration</Text>
          <TextInput
            accessibilityLabel="Work log narration"
            multiline
            onChangeText={setNarration}
            placeholder="Describe the work"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={narration}
          />

          <Text style={styles.statusText}>{statusText}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done edit work log"
            disabled={saving}
            onPress={handleDone}
            style={({pressed}) => [
              styles.doneButton,
              saving && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>{saving ? 'Saving...' : 'Done'}</Text>
          </Pressable>
        </View>
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
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  formTitle: {
    color: '#113a70',
    fontSize: 20,
    fontWeight: '900',
  },
  formSub: {
    color: '#6b7f99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  inputLabel: {
    color: '#6b7f99',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    fontSize: 14,
    fontWeight: '800',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeField: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: '#2664b4',
    borderColor: '#2664b4',
  },
  choiceChipText: {
    color: '#113a70',
    fontSize: 13,
    fontWeight: '900',
  },
  choiceChipTextActive: {
    color: '#ffffff',
  },
  textArea: {
    minHeight: 116,
    paddingTop: 12,
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 14,
    textAlign: 'center',
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  doneButtonText: {
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

export default EditWorkLog;
