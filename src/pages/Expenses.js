import React, {useCallback, useEffect, useState} from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  downloadEmployeeExpenseAttachmentApi,
  employeeExpenseListApi,
  getCurrentEmployeeExpenseListResponse,
} from '../redux/Employeeexpensesslice';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getExpensesFromResponse = (response) =>
  response?.data?.data?.expenses || response?.data?.expenses || [];

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'No date';
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  const numberValue = Number(amount);
  if (!Number.isFinite(numberValue)) {
    return `Rs ${amount || '0.00'}`;
  }

  return `Rs ${numberValue.toFixed(2)}`;
};

function ExpenseCard({expense, navigate, onDownload}) {
  const amount = Number(expense.amount);
  const isCredit = Number.isFinite(amount) && amount < 0;

  return (
    <View style={styles.expenseCard}>
      <View style={styles.expenseTopRow}>
        <View style={styles.expenseMain}>
          <Text style={styles.expenseNarration} numberOfLines={2}>
            {expense.narration || 'Expense'}
          </Text>
          <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
        </View>
        <Text style={[styles.expenseAmount, isCredit && styles.creditAmount]}>
          {formatCurrency(expense.amount)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>ID #{expense.id}</Text>
        <Text style={styles.metaText}>
          {expense.has_attachment ? 'Attachment available' : 'No attachment'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit expense"
          style={({pressed}) => [styles.smallButton, pressed && styles.buttonPressed]}
          onPress={() => navigate('editExpense', {expense})}
        >
          <Text style={styles.smallButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download expense attachment"
          style={({pressed}) => [
            styles.smallButton,
            styles.downloadButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => onDownload(expense)}
        >
          <Text style={styles.smallButtonText}>Download</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Expenses({navigate, routeParams}) {
  const [expenses, setExpenses] = useState(
    getExpensesFromResponse(getCurrentEmployeeExpenseListResponse()),
  );
  const [month, setMonth] = useState(routeParams?.month || getCurrentMonth());
  const [activeMonth, setActiveMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Loading expenses...');

  const loadExpenses = useCallback(async (selectedMonth = '') => {
    try {
      setLoading(true);
      setStatusText(selectedMonth ? `Loading ${selectedMonth} expenses...` : 'Loading expenses...');
      const response = await employeeExpenseListApi({month: selectedMonth});
      setExpenses(getExpensesFromResponse(response));
      setActiveMonth(response?.data?.data?.month || selectedMonth || '');
      setStatusText('Expenses fetched successfully.');
    } catch (error) {
      console.log('Expenses Page List Error:', error?.response || error);
      setStatusText(error.message || 'Unable to fetch expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses('');
  }, [loadExpenses, routeParams?.refreshExpenses]);

  const handleFilter = () => {
    loadExpenses(month.trim());
  };

  const handleDownload = async (expense) => {
    try {
      setStatusText('Downloading attachment...');
      if (expense.attachment_url) {
        await Linking.openURL(expense.attachment_url);
        setStatusText('Attachment opened for download.');
        return;
      }

      const response = await downloadEmployeeExpenseAttachmentApi({
        expenseId: expense.id,
      });
      await Linking.openURL(response.url);
      setStatusText('Attachment opened for download.');
    } catch (error) {
      console.log('Expense Attachment Download Error:', error?.response || error);
      setStatusText(error.message || 'Expense attachment not found.');
    }
  };

  const totalAmount = expenses.reduce((sum, expense) => {
    const value = Number(expense.amount);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryPanel}>
          <View>
            <Text style={styles.summaryLabel}>
              {activeMonth ? 'FILTERED MONTH' : 'ALL EXPENSES'}
            </Text>
            <Text style={styles.summaryValue}>{expenses.length} records</Text>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        <View style={styles.filterPanel}>
          <Text style={styles.inputLabel}>Month and year</Text>
          <View style={styles.filterRow}>
            <TextInput
              accessibilityLabel="Expense month"
              onChangeText={setMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#93aac2"
              style={styles.monthInput}
              value={month}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter expenses by month"
              disabled={loading}
              onPress={handleFilter}
              style={({pressed}) => [
                styles.filterButton,
                loading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            style={({pressed}) => [styles.addButton, pressed && styles.buttonPressed]}
            onPress={() => navigate('addExpense')}
          >
            <Text style={styles.addButtonText}>Add Expense</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh expenses"
            disabled={loading}
            style={({pressed}) => [
              styles.refreshButton,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => loadExpenses(activeMonth)}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        {expenses.length ? (
          expenses.map((expense) => (
            <ExpenseCard
              expense={expense}
              key={expense.id}
              navigate={navigate}
              onDownload={handleDownload}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptyText}>Try another month or add a new expense.</Text>
          </View>
        )}
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
  summaryPanel: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryLabel: {
    color: '#9fc2ec',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  totalAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  inputLabel: {
    color: '#6b7f99',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  monthInput: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 92,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    width: 104,
  },
  refreshButtonText: {
    color: '#113a70',
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
  expenseCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  expenseTopRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  expenseMain: {
    flex: 1,
  },
  expenseNarration: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  expenseDate: {
    color: '#6b7f99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  expenseAmount: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
  },
  creditAmount: {
    color: '#b42318',
  },
  metaRow: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
  },
  metaText: {
    color: '#7b8ea3',
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  downloadButton: {
    backgroundColor: '#113a70',
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 12,
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
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default Expenses;
