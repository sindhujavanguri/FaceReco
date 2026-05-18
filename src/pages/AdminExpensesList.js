import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  adminExpenseListApi,
  deleteAdminExpenseApi,
  downloadAdminExpenseAttachmentApi,
  getCurrentAdminExpenseListResponse,
} from '../redux/adminexpenseslice';
import {getCurrentAuthSession} from '../redux/loginSlice';

const getExpensesData = (response) => response?.data?.data || {};
const getExpensesFromResponse = (response) => getExpensesData(response).expenses || [];

const formatCurrency = (amount) => {
  const numberValue = Number(amount);
  if (!Number.isFinite(numberValue)) {
    return `Rs ${amount || '0.00'}`;
  }

  return `Rs ${numberValue.toFixed(2)}`;
};

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

const formatName = (employee = {}) =>
  employee.emp_name || employee.emp_code || 'Employee';

function AdminExpenseCard({expense, onDelete, onDownload, onEdit}) {
  const employee = expense.employee || {};

  return (
    <View style={styles.expenseCard}>
      <View style={styles.expenseTopRow}>
        <View style={styles.expenseCopy}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {formatName(employee)}
          </Text>
          <Text style={styles.employeeMeta} numberOfLines={1}>
            {expense.emp_code || employee.emp_code || '-'} - {employee.designation_name || 'Expense'}
          </Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
      </View>

      <Text style={styles.narration} numberOfLines={2}>
        {expense.narration || 'No narration'}
      </Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Expense Date</Text>
          <Text style={styles.metaValue}>{formatDate(expense.date)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Created On</Text>
          <Text style={styles.metaValue}>{expense.created_on || '-'}</Text>
        </View>
      </View>

      <View style={styles.attachmentRow}>
        <Text style={styles.attachmentText}>
          #{expense.id} - {expense.has_attachment ? 'Attachment available' : 'No attachment'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit admin expense"
          onPress={() => onEdit(expense)}
          style={({pressed}) => [styles.smallButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.smallButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download admin expense attachment"
          onPress={() => onDownload(expense)}
          style={({pressed}) => [
            styles.smallButton,
            styles.downloadButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.smallButtonText}>Download</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete admin expense"
          onPress={() => onDelete(expense)}
          style={({pressed}) => [
            styles.smallButton,
            styles.deleteButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.smallButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AdminExpensesList({navigate, routeParams}) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const [expenseResponse, setExpenseResponse] = useState(
    getCurrentAdminExpenseListResponse(),
  );
  const [expenses, setExpenses] = useState(
    getExpensesFromResponse(getCurrentAdminExpenseListResponse()),
  );
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!getCurrentAdminExpenseListResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [statusText, setStatusText] = useState('Loading admin expenses...');

  const loadExpenses = useCallback(
    async ({refresh = false, nextMonth = '', nextSearch = ''} = {}) => {
      if (!isAdmin) {
        setStatusText('Admin login required.');
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setStatusText('Fetching admin expenses...');
        const response = await adminExpenseListApi({
          month: nextMonth.trim(),
          search: nextSearch.trim(),
        });
        setExpenseResponse(response);
        setExpenses(getExpensesFromResponse(response));
        setStatusText(response?.data?.message || 'Expenses fetched successfully.');
      } catch (error) {
        console.log('Admin Expenses List Page Error:', error?.response || error);
        setStatusText(error.message || 'Unable to fetch admin expenses.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadExpenses({nextMonth: '', nextSearch: ''});
  }, [loadExpenses, routeParams?.refreshExpenses]);

  const expenseData = getExpensesData(expenseResponse);
  const total = expenseData.total ?? expenses.length;
  const computedTotalAmount = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        const value = Number(expense.amount);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    [expenses],
  );
  const totalAmount = expenseData.total_amount ?? computedTotalAmount;

  const handleFilter = () => {
    loadExpenses({nextMonth: month, nextSearch: search});
  };

  const handleClearFilters = () => {
    setMonth('');
    setSearch('');
    loadExpenses({nextMonth: '', nextSearch: ''});
  };

  const handleDownload = async (expense) => {
    try {
      setStatusText('Downloading attachment...');
      if (expense.attachment_url) {
        await Linking.openURL(expense.attachment_url);
        setStatusText('Attachment opened for download.');
        return;
      }

      const response = await downloadAdminExpenseAttachmentApi({
        expenseId: expense.id,
      });
      await Linking.openURL(response.url);
      setStatusText('Attachment opened for download.');
    } catch (error) {
      console.log('Admin Expense Attachment Download Error:', error?.response || error);
      setStatusText(error.message || 'Expense attachment not found.');
    }
  };

  const confirmDelete = (expense) => {
    Alert.alert(
      'Delete expense',
      `Delete expense #${expense.id} for ${expense.emp_code}?`,
      [
        {style: 'cancel', text: 'Cancel'},
        {
          onPress: () => handleDelete(expense),
          style: 'destructive',
          text: 'Delete',
        },
      ],
    );
  };

  const handleDelete = async (expense) => {
    try {
      setStatusText('Deleting expense...');
      await deleteAdminExpenseApi({
        emp_code: expense.emp_code,
        expenseId: expense.id,
      });
      setStatusText('Expense deleted successfully.');
      loadExpenses({nextMonth: month, nextSearch: search});
    } catch (error) {
      console.log('Admin Expense Delete Error:', error?.response || error);
      setStatusText(error.message || 'Admin delete expense failed.');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Admin access only</Text>
        <Text style={styles.lockedText}>
          Expenses in this section are available only after admin login.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() =>
            loadExpenses({refresh: true, nextMonth: month, nextSearch: search})
          }
          tintColor="#2664b4"
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.summaryBand}>
        <View>
          <Text style={styles.eyebrow}>ADMIN EXPENSES</Text>
          <Text style={styles.summaryTitle}>{total} records</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.simpleFilterRow}>
          <TextInput
            accessibilityLabel="Search admin expenses"
            autoCapitalize="characters"
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.simpleInput]}
            value={search}
          />
          <TextInput
            accessibilityLabel="Admin expense month filter"
            onChangeText={setMonth}
            placeholder="YYYY-MM"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.monthInput]}
            value={month}
          />
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add admin expense"
            onPress={() => navigate?.('adminExpenseForm')}
            style={({pressed}) => [styles.addTopButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.addTopButtonText}>Add</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Apply admin expense filters"
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear admin expense filters"
            onPress={handleClearFilters}
            style={({pressed}) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh admin expenses"
            disabled={loading}
            onPress={() => loadExpenses({nextMonth: month, nextSearch: search})}
            style={({pressed}) => [
              styles.secondaryButton,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.statusText}>{statusText}</Text>

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.stateText}>Loading admin expenses...</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>EXPENSE LIST</Text>
        <Text style={styles.countText}>{expenses.length} shown</Text>
      </View>

      {expenses.length ? (
        expenses.map((expense) => (
          <AdminExpenseCard
            expense={expense}
            key={expense.id}
            onDelete={confirmDelete}
            onDownload={handleDownload}
            onEdit={(selectedExpense) =>
              navigate?.('adminExpenseForm', {expense: selectedExpense})
            }
          />
        ))
      ) : (
        !loading && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptyText}>Try another month or search value.</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryBand: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  eyebrow: {
    color: '#fce3c1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  totalAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  inputLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  simpleFilterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simpleInput: {
    flex: 1.35,
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    fontSize: 14,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  monthInput: {
    flex: 0.9,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    flex: 1,
    minHeight: 42,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  secondaryButtonText: {
    color: '#113a70',
    fontSize: 13,
    fontWeight: '900',
  },
  addTopButton: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  addTopButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 12,
    textAlign: 'center',
  },
  stateBox: {
    alignItems: 'center',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  stateText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
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
  expenseCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  expenseTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  expenseCopy: {
    flex: 1,
  },
  employeeName: {
    color: '#113a70',
    fontSize: 14,
    fontWeight: '900',
  },
  employeeMeta: {
    color: '#6b7f99',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  expenseAmount: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
  },
  narration: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    color: '#6b7f99',
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
  attachmentRow: {
    marginTop: 10,
  },
  attachmentText: {
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
  deleteButton: {
    backgroundColor: '#b42318',
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyBox: {
    alignItems: 'center',
    borderColor: '#d2e1f4',
    borderRadius: 8,
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
    lineHeight: 19,
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

export default AdminExpensesList;
