import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  adminTaxFinancialYearsApi,
  getCurrentAdminTaxFinancialYearsResponse,
} from '../redux/admintaxslice';
import {getCurrentAuthSession} from '../redux/loginSlice';

const getYears = (response) => response?.data?.data?.financial_years || [];

function FinancialYears({navigate}) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const cachedResponse = getCurrentAdminTaxFinancialYearsResponse();
  const [yearsResponse, setYearsResponse] = useState(cachedResponse);
  const [selectedYear, setSelectedYear] = useState(getYears(cachedResponse)[0] || '');
  const [loading, setLoading] = useState(!cachedResponse);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('Loading financial years...');

  const years = useMemo(() => getYears(yearsResponse), [yearsResponse]);

  const loadYears = useCallback(
    async ({refresh = false} = {}) => {
      if (!isAdmin) {
        setLoading(false);
        setMessage('Admin login required.');
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await adminTaxFinancialYearsApi();
        const nextYears = getYears(response);
        setYearsResponse(response);
        setSelectedYear((current) => current || nextYears[0] || '');
        setMessage(response?.data?.message || 'Financial years fetched successfully.');
      } catch (error) {
        console.log('Admin Tax Financial Years Page Error:', error?.response || error);
        setMessage(error.message || 'Unable to fetch financial years.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const handleFilter = () => {
    if (!selectedYear) {
      setMessage('Select a financial year first.');
      return;
    }
    navigate?.('taxSubmissionList', {financialYear: selectedYear});
  };

  if (!isAdmin) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Admin access only</Text>
        <Text style={styles.lockedText}>Tax review is available only after admin login.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadYears({refresh: true})}
          tintColor="#2664b4"
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.summaryBand}>
        <Text style={styles.eyebrow}>ADMIN TAX</Text>
        <Text style={styles.summaryTitle}>Financial years</Text>
        <Text style={styles.summarySub}>{years.length} years available</Text>
      </View>

      <Text style={styles.statusText}>{message}</Text>

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.stateText}>Calling financial years API...</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>SELECT YEAR</Text>
        <Text style={styles.countText}>{selectedYear || 'None'}</Text>
      </View>

      {years.length ? (
        <View style={styles.yearGrid}>
          {years.map((year) => {
            const selected = selectedYear === year;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select financial year ${year}`}
                key={year}
                onPress={() => setSelectedYear(year)}
                style={({pressed}) => [
                  styles.yearCard,
                  selected && styles.yearCardSelected,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.yearText, selected && styles.yearTextSelected]}>
                  {year}
                </Text>
                <Text style={[styles.yearSub, selected && styles.yearSubSelected]}>
                  Tax submissions
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        !loading && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No financial years</Text>
            <Text style={styles.emptyText}>The API did not return any years.</Text>
          </View>
        )
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter tax submissions by selected financial year"
        disabled={!selectedYear || loading}
        onPress={handleFilter}
        style={({pressed}) => [
          styles.filterButton,
          (!selectedYear || loading) && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.filterButtonText}>Filter</Text>
      </Pressable>
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
    backgroundColor: '#113a70',
    borderRadius: 8,
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
    marginTop: 7,
  },
  summarySub: {
    color: '#d8e7fa',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
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
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 88,
    padding: 14,
    width: '48.5%',
  },
  yearCardSelected: {
    backgroundColor: '#2664b4',
    borderColor: '#2664b4',
  },
  yearText: {
    color: '#113a70',
    fontSize: 17,
    fontWeight: '900',
  },
  yearTextSelected: {
    color: '#ffffff',
  },
  yearSub: {
    color: '#6b7f99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  yearSubSelected: {
    color: '#d8e7fa',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
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

export default FinancialYears;
