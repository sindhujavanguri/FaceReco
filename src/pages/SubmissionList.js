import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  adminTaxSubmissionsApi,
  getCurrentAdminTaxSubmissionsResponse,
} from '../redux/admintaxslice';
import {getCurrentAuthSession} from '../redux/loginSlice';

const statuses = ['all', 'submitted', 'approved', 'rejected', 'resubmitted', 'saved'];

const getSubmissionData = (response) => response?.data?.data || {};
const getEmployees = (response) => getSubmissionData(response).employees || [];

const formatValue = (value, fallback = '-') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

function StatusPill({status}) {
  const normalizedStatus = String(status || '').toLowerCase();
  const approved = normalizedStatus === 'approved';
  const rejected = normalizedStatus === 'rejected';
  const submitted = normalizedStatus === 'submitted' || normalizedStatus === 'resubmitted';

  return (
    <View
      style={[
        styles.statusPill,
        approved && styles.approvedPill,
        rejected && styles.rejectedPill,
        submitted && styles.submittedPill,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          approved && styles.approvedText,
          rejected && styles.rejectedText,
          submitted && styles.submittedText,
        ]}
      >
        {formatValue(status, 'Pending')}
      </Text>
    </View>
  );
}

function SummaryText({label, value}) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{formatValue(value, '0')}</Text>
    </View>
  );
}

function EmployeeTaxCard({employee, financialYear, onView}) {
  const summary = employee.status_summary || {};

  return (
    <View style={styles.employeeCard}>
      <View style={styles.employeeTopRow}>
        <View style={styles.employeeCopy}>
          <Text style={styles.employeeName} numberOfLines={2}>
            {formatValue(employee.emp_name, 'Employee')}
          </Text>
          <Text style={styles.employeeMeta} numberOfLines={1}>
            {formatValue(employee.emp_code)} - {formatValue(employee.designation_name, 'Tax')}
          </Text>
        </View>
        <StatusPill status={employee.overall_status} />
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Email</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {formatValue(employee.emp_email)}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>PAN</Text>
          <Text style={styles.metaValue}>{formatValue(employee.emp_pan)}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Department</Text>
          <Text style={styles.metaValue} numberOfLines={2}>
            {formatValue(employee.department_name)}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Financial Year</Text>
          <Text style={styles.metaValue}>{financialYear}</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryText label="Total" value={summary.total} />
        <SummaryText label="Approved" value={summary.approved} />
        <SummaryText label="Rejected" value={summary.rejected} />
        <SummaryText label="Submitted" value={summary.submitted} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View tax details for ${employee.emp_code}`}
        onPress={() => onView(employee)}
        style={({pressed}) => [styles.viewButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
      </Pressable>
    </View>
  );
}

function SubmissionList({navigate, routeParams}) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const initialYear = routeParams?.financialYear || '';
  const cachedResponse = getCurrentAdminTaxSubmissionsResponse();
  const [submissionsResponse, setSubmissionsResponse] = useState(cachedResponse);
  const [employees, setEmployees] = useState(getEmployees(cachedResponse));
  const [financialYear, setFinancialYear] = useState(
    initialYear || getSubmissionData(cachedResponse).financial_year || '',
  );
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!cachedResponse);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('Loading tax submissions...');

  const loadSubmissions = useCallback(
    async ({
      nextFinancialYear = financialYear,
      nextSearch = search,
      nextStatus = status,
      refresh = false,
    } = {}) => {
      if (!isAdmin) {
        setLoading(false);
        setMessage('Admin login required.');
        return;
      }

      if (!nextFinancialYear) {
        setLoading(false);
        setMessage('Please select financial year from Tax page.');
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setMessage('Fetching tax submissions...');
        const response = await adminTaxSubmissionsApi({
          financial_year: nextFinancialYear,
          search: nextSearch.trim(),
          status: nextStatus,
        });
        setSubmissionsResponse(response);
        setEmployees(getEmployees(response));
        setMessage(response?.data?.message || 'Tax submissions fetched successfully.');
      } catch (error) {
        console.log('Admin Tax Submissions Page Error:', error?.response || error);
        setMessage(error.message || 'Unable to fetch tax submissions.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [financialYear, isAdmin, search, status],
  );

  useEffect(() => {
    loadSubmissions({nextFinancialYear: financialYear || initialYear});
    // Load once for the selected year; typing in filters should wait for Filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialYear]);

  const submissionData = getSubmissionData(submissionsResponse);
  const total = submissionData.total ?? employees.length;
  const titleYear = financialYear || submissionData.financial_year || '-';
  const shownStatus = submissionData.status || status;

  const counts = useMemo(
    () =>
      employees.reduce(
        (result, employee) => {
          const current = String(employee.overall_status || 'unknown').toLowerCase();
          result[current] = (result[current] || 0) + 1;
          return result;
        },
        {approved: 0, rejected: 0, submitted: 0},
      ),
    [employees],
  );

  const handleFilter = () => {
    loadSubmissions({nextFinancialYear: financialYear, nextSearch: search, nextStatus: status});
  };

  const handleStatusPress = (nextStatus) => {
    setStatus(nextStatus);
    loadSubmissions({
      nextFinancialYear: financialYear,
      nextSearch: search,
      nextStatus,
    });
  };

  const handleView = (employee) => {
    navigate?.('taxEmployeeDetails', {
      empCode: employee.emp_code,
      employee,
      financialYear: titleYear,
    });
  };

  if (!isAdmin) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Admin access only</Text>
        <Text style={styles.lockedText}>Tax submissions are available only after admin login.</Text>
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
            loadSubmissions({
              nextFinancialYear: financialYear,
              nextSearch: search,
              nextStatus: status,
              refresh: true,
            })
          }
          tintColor="#2664b4"
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.summaryBand}>
        <View>
          <Text style={styles.eyebrow}>ADMIN TAX SUBMISSIONS</Text>
          <Text style={styles.summaryTitle}>{titleYear}</Text>
          <Text style={styles.summarySub}>{formatValue(shownStatus, 'all')} status</Text>
        </View>
        <Text style={styles.totalText}>{total}</Text>
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.filterRow}>
          <TextInput
            accessibilityLabel="Financial year"
            onChangeText={setFinancialYear}
            placeholder="2025-2026"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.yearInput]}
            value={financialYear}
          />
          <TextInput
            accessibilityLabel="Search employee tax submissions"
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.searchInput]}
            value={search}
          />
        </View>
        <View style={styles.segment}>
          {statuses.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => handleStatusPress(item)}
              style={[
                styles.segmentButton,
                status === item && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  status === item && styles.segmentTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply tax submission filters"
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

      <View style={styles.quickCounts}>
        <SummaryText label="Approved" value={counts.approved} />
        <SummaryText label="Rejected" value={counts.rejected} />
        <SummaryText label="Submitted" value={counts.submitted} />
      </View>

      <Text style={styles.statusMessage}>{message}</Text>

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.stateText}>Calling submissions API...</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>EMPLOYEES</Text>
        <Text style={styles.countText}>{employees.length} shown</Text>
      </View>

      {employees.length ? (
        employees.map((employee) => (
          <EmployeeTaxCard
            employee={employee}
            financialYear={titleYear}
            key={employee.emp_id || employee.emp_code}
            onView={handleView}
          />
        ))
      ) : (
        !loading && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No submissions found</Text>
            <Text style={styles.emptyText}>Try another status or search value.</Text>
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
  summarySub: {
    color: '#d8e7fa',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  totalText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  filterPanel: {
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    fontSize: 13,
    fontWeight: '800',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  yearInput: {
    flex: 0.9,
  },
  searchInput: {
    flex: 1.1,
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  segmentButton: {
    alignItems: 'center',
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  segmentButtonActive: {
    backgroundColor: '#2664b4',
    borderColor: '#2664b4',
  },
  segmentText: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 42,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  quickCounts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  summaryCell: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  summaryLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  statusMessage: {
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
  employeeCard: {
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  employeeTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  employeeCopy: {
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
    marginTop: 4,
  },
  statusPill: {
    backgroundColor: '#fff8e8',
    borderColor: '#fad991',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  approvedPill: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  rejectedPill: {
    backgroundColor: '#fef3f2',
    borderColor: '#fecdca',
  },
  submittedPill: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  statusText: {
    color: '#b76e00',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  approvedText: {
    color: '#027a48',
  },
  rejectedText: {
    color: '#b42318',
  },
  submittedText: {
    color: '#175cd3',
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 40,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 13,
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

export default SubmissionList;
