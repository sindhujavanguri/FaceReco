import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  applyLeaveApi,
  employeeLeaveListApi,
  getCurrentLeaveCategoriesResponse,
  leaveCategoriesApi,
} from '../redux/LeaveSlice';

const today = new Date().toISOString().slice(0, 10);

function ApplyLeave({ navigate }) {
  const cachedCategories = getCurrentLeaveCategoriesResponse()?.data?.data?.categories || [];
  const [categories, setCategories] = useState(cachedCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    cachedCategories[0]?.leave_cat_id ? String(cachedCategories[0].leave_cat_id) : ''
  );
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(!cachedCategories.length);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState(null);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.leave_cat_id) === String(selectedCategoryId)
      ),
    [categories, selectedCategoryId]
  );

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await leaveCategoriesApi();
      const nextCategories = response?.data?.data?.categories || [];
      setCategories(nextCategories);
      if (!selectedCategoryId && nextCategories[0]?.leave_cat_id) {
        setSelectedCategoryId(String(nextCategories[0].leave_cat_id));
      }
      setError('');
    } catch (categoryError) {
      setError(categoryError.message || 'Unable to load leave categories.');
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async () => {
    if (!selectedCategoryId || !startDate || !endDate || !reason.trim()) {
      setError('Please select category, dates, and leave reason.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await applyLeaveApi({
        leave_cat_id: Number(selectedCategoryId),
        start_date: startDate,
        end_date: endDate,
        leave_reason: reason.trim(),
        leave_remarks: remarks.trim(),
      });

      await employeeLeaveListApi({ status: 'all' });

      setPopup({
        success: response?.data?.success !== false,
        message:
          response?.data?.message ||
          (response?.data?.success === false
            ? 'Leave request submitted with a warning.'
            : 'Leave applied successfully.'),
      });
    } catch (applyError) {
      setPopup({
        success: false,
        message: applyError.message || 'Unable to apply leave.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closePopup = () => {
    setPopup(null);
    if (popup?.success) {
      navigate('leaveList', { status: 'all' });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>APPLY LEAVE</Text>
          <Text style={styles.title}>Create leave request</Text>
          <Text style={styles.subtitle}>Choose a category, date range, and reason.</Text>
        </View>

        {loadingCategories && (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2664b4" />
            <Text style={styles.stateText}>Loading leave options...</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Apply leave</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Leave Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const active =
                String(category.leave_cat_id) === String(selectedCategoryId);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={category.leave_cat_id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategoryId(String(category.leave_cat_id))}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.leave_cat_name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.selectedText}>
            Selected: {selectedCategory?.leave_cat_name || 'No category selected'}
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#98A2B3"
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#98A2B3"
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Leave Reason</Text>
          <TextInput
            multiline
            placeholder="Reason"
            placeholderTextColor="#98A2B3"
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
          />

          <Text style={styles.fieldLabel}>Leave Remarks</Text>
          <TextInput
            multiline
            placeholder="Optional remarks"
            placeholderTextColor="#98A2B3"
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
          />

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Submit Apply Leave</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={!!popup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <View style={[styles.tickCircle, !popup?.success && styles.warningCircle]}>
              <Text style={styles.tickText}>{popup?.success ? '✓' : '!'}</Text>
            </View>
            <Text style={styles.popupTitle}>
              {popup?.success ? 'Leave applied successfully' : 'Leave request message'}
            </Text>
            <Text style={styles.popupMessage}>{popup?.message}</Text>
            <Pressable style={styles.popupButton} onPress={closePopup}>
              <Text style={styles.popupButtonText}>
                {popup?.success ? 'View Leave List' : 'Close'}
              </Text>
            </Pressable>
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
  hero: {
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
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 7,
  },
  subtitle: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
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
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  fieldLabel: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F4F8FD',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: '#f08c3c',
    borderColor: '#f08c3c',
  },
  categoryChipText: {
    color: '#2664b4',
    fontSize: 12,
    fontWeight: '900',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  selectedText: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52,
  },
  submitButtonPressed: {
    backgroundColor: '#1F5598',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 42, 67, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    maxWidth: 330,
    padding: 22,
    width: '100%',
  },
  tickCircle: {
    alignItems: 'center',
    backgroundColor: '#12B76A',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  warningCircle: {
    backgroundColor: '#f5a623',
  },
  tickText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  popupTitle: {
    color: '#113A70',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },
  popupMessage: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default ApplyLeave;
