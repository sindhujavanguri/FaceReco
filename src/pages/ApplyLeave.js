import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
      const response = await leaveCategoriesApi();
      const nextCategories = response?.data?.data?.categories || [];
      setCategories(nextCategories);
      if (!selectedCategoryId && nextCategories[0]?.leave_cat_id) {
        setSelectedCategoryId(String(nextCategories[0].leave_cat_id));
      }
      setError('');
    } catch (categoryError) {
      setError(categoryError.message || 'Unable to load leave categories.');
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
        {/* High-Impact Solid Header Banner */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LEAVE APPLICATION</Text>
          <Text style={styles.title}>Create leave request</Text>
          <Text style={styles.subtitle}>Choose a category, date range, and reason parameters.</Text>
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>SUBMISSION SYSTEM WARNING</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Premium Neat Glassy-profile Card Form */}
        <View style={styles.formCard}>
          
          <Text style={styles.fieldLabel}>Select Leave Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const active = String(category.leave_cat_id) === String(selectedCategoryId);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={category.leave_cat_id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategoryId(String(category.leave_cat_id))}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {category.leave_cat_name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.selectionInfoPill}>
            <Text style={styles.selectedText}>
              Selected Category: <Text style={styles.boldSelectionText}>{selectedCategory?.leave_cat_name || 'None'}</Text>
            </Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Double Column Date Inputs */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Leave Reason</Text>
          <TextInput
            multiline
            placeholder="State your clear reason here..."
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
          />

          <Text style={styles.fieldLabel}>Leave Remarks (Optional)</Text>
          <TextInput
            multiline
            placeholder="Add any internal remarks..."
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
          />

          {/* High-Impact Solid Primary Action Button */}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>SUBMIT LEAVE APPLICATION</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* Modern High-Contrast Status Modal Overlay */}
      <Modal transparent visible={!!popup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <View style={[styles.tickCircle, !popup?.success && styles.warningCircle]}>
              <Text style={styles.tickText}>{popup?.success ? '✓' : '!'}</Text>
            </View>
            <Text style={styles.popupTitle}>
              {popup?.success ? 'Application Confirmed' : 'Request Process Message'}
            </Text>
            <Text style={styles.popupMessage}>{popup?.message}</Text>
            
            <Pressable style={styles.popupButton} onPress={closePopup}>
              <Text style={styles.popupButtonText}>
                {popup?.success ? 'VIEW LEAVE HISTORY LIST' : 'CLOSE SYSTEM WINDOW'}
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
    backgroundColor: '#F4F8FD', // Soft brand-tinted layout canvas
    flex: 1,
  },
  scrollView: {
    backgroundColor: '#F4F8FD',
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Bold Corporate Header Profile
  hero: {
    backgroundColor: '#2664b4',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#102a43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  eyebrow: {
    color: '#FCE3C1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
  },
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#fca5a5',
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
    padding: 16,
  },
  errorTitle: {
    color: '#b42318',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  // Crisp Glassy White-Profile Container Card
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 16,
    padding: 16,
    shadowColor: '#102a43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fieldLabel: {
    color: '#113A70',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
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
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: '#f08c3c',
    borderColor: '#f08c3c',
  },
  categoryChipText: {
    color: '#2664b4',
    fontSize: 13,
    fontWeight: '900',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  selectionInfoPill: {
    backgroundColor: '#FFF1E5',
    borderColor: 'rgba(240, 140, 60, 0.25)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  selectedText: {
    color: '#f08c3c',
    fontSize: 13,
    fontWeight: '700',
  },
  boldSelectionText: {
    fontWeight: '900',
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: '#EAF2FF',
    marginVertical: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  // Structural Clear Text Inputs
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D2E1F4',
    borderRadius: 10,
    borderWidth: 1.5,
    color: '#101828',
    fontSize: 14,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  // Vibrant High-Contrast Primary Buttons
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 54,
    shadowColor: '#2664b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonPressed: {
    backgroundColor: '#1C4D8C',
    transform: [{ scale: 0.99 }],
  },
  submitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Modern Layout Modal Popups
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 42, 67, 0.55)', // Dark premium blur backdrop mask
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D2E1F4',
    maxWidth: 340,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  tickCircle: {
    alignItems: 'center',
    backgroundColor: '#12B76A',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  warningCircle: {
    backgroundColor: '#f08c3c',
  },
  tickText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  popupTitle: {
    color: '#113A70',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  popupMessage: {
    color: '#6B7F99',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#f08c3c',
    borderRadius: 10,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default ApplyLeave;