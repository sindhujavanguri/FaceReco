import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {editEmployeeExpenseApi} from '../redux/Employeeexpensesslice';

function EditExpense({navigate, routeParams}) {
  const expense = routeParams?.expense || {};
  const [date, setDate] = useState(expense.date || '');
  const [amount, setAmount] = useState(String(expense.amount || ''));
  const [narration, setNarration] = useState(expense.narration || '');
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState(
    expense.id ? `Editing expense #${expense.id}` : 'Expense details not found.',
  );

  const handleDone = async () => {
    if (!expense.id) {
      setStatusText('Expense ID is missing.');
      return;
    }

    if (!date.trim() || !amount.trim() || !narration.trim()) {
      setStatusText('Date, amount and narration are required.');
      return;
    }

    try {
      setSaving(true);
      setStatusText('Updating expense...');
      await editEmployeeExpenseApi({
        amount: amount.trim(),
        date: date.trim(),
        expenseId: expense.id,
        narration: narration.trim(),
      });
      setStatusText('Expense updated successfully.');
      navigate?.('expenses', {refreshExpenses: Date.now()});
    } catch (error) {
      console.log('Edit Expense Page Error:', error?.response || error);
      setStatusText(error.message || 'Edit expense failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Expense</Text>
          <Text style={styles.expenseId}>Expense ID #{expense.id || '-'}</Text>

          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            accessibilityLabel="Expense date"
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={date}
          />

          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            accessibilityLabel="Expense amount"
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={amount}
          />

          <Text style={styles.inputLabel}>Narration</Text>
          <TextInput
            accessibilityLabel="Expense narration"
            multiline
            onChangeText={setNarration}
            placeholder="Enter expense narration"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={narration}
          />

          <Text style={styles.statusText}>{statusText}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done edit expense"
            disabled={saving || !expense.id}
            onPress={handleDone}
            style={({pressed}) => [
              styles.doneButton,
              (saving || !expense.id) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>
              {saving ? 'Saving...' : 'Done'}
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  formTitle: {
    color: '#113a70',
    fontSize: 20,
    fontWeight: '900',
  },
  expenseId: {
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
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default EditExpense;
