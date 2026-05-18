import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addAdminExpenseApi,
  editAdminExpenseApi,
} from '../redux/adminexpenseslice';
import {getCurrentAuthSession} from '../redux/loginSlice';

const getToday = () => new Date().toISOString().slice(0, 10);

function AdminExpenseForm({navigate, routeParams}) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const expense = routeParams?.expense || null;
  const isEditing = !!expense?.id;
  const [empCode, setEmpCode] = useState(expense?.emp_code || '');
  const [date, setDate] = useState(expense?.date || getToday());
  const [amount, setAmount] = useState(
    expense?.amount !== undefined ? String(expense.amount) : '',
  );
  const [narration, setNarration] = useState(expense?.narration || '');
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState(
    isEditing ? `Editing expense #${expense.id}` : 'Fill expense details.',
  );

  const handleSubmit = async () => {
    if (!isAdmin) {
      setStatusText('Admin login required.');
      return;
    }

    if (!empCode.trim() || !date.trim() || !amount.trim()) {
      setStatusText('Employee code, date and amount are required.');
      return;
    }

    try {
      setSaving(true);
      setStatusText(isEditing ? 'Updating expense...' : 'Adding expense...');

      const payload = {
        amount: amount.trim(),
        date: date.trim(),
        emp_code: empCode.trim(),
        narration: narration.trim(),
      };

      if (isEditing) {
        await editAdminExpenseApi({...payload, expenseId: expense.id});
      } else {
        await addAdminExpenseApi(payload);
      }

      setStatusText(isEditing ? 'Expense updated successfully.' : 'Expense added successfully.');
      navigate?.('adminExpensesList', {refreshExpenses: Date.now()});
    } catch (error) {
      console.log('Admin Expense Form Page Error:', error?.response || error);
      setStatusText(error.message || 'Expense save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Admin access only</Text>
        <Text style={styles.lockedText}>Please login as admin to manage expenses.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>

          <Text style={styles.inputLabel}>Employee Code</Text>
          <TextInput
            accessibilityLabel="Admin expense employee code"
            autoCapitalize="characters"
            onChangeText={setEmpCode}
            placeholder="AZ-113"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={empCode}
          />

          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            accessibilityLabel="Admin expense date"
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={date}
          />

          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            accessibilityLabel="Admin expense amount"
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={amount}
          />

          <Text style={styles.inputLabel}>Narration</Text>
          <TextInput
            accessibilityLabel="Admin expense narration"
            multiline
            onChangeText={setNarration}
            placeholder="Expense details"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={narration}
          />

          <Text style={styles.statusText}>{statusText}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Update admin expense' : 'Add admin expense'}
            disabled={saving}
            onPress={handleSubmit}
            style={({pressed}) => [
              styles.doneButton,
              saving && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Text>
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
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  formTitle: {
    color: '#113a70',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
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
  textArea: {
    minHeight: 112,
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
  lockedScreen: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  lockedTitle: {
    color: '#113a70',
    fontSize: 18,
    fontWeight: '900',
  },
  lockedText: {
    color: '#6b7f99',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default AdminExpenseForm;
