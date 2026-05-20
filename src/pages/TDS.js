import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getCurrentTaxFinancialYearsResponse,
  taxFinancialYearsApi,
} from '../redux/EmployeeTdsSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';
import {
  StatusCard,
  FinancialYearPicker,
} from './tds/TDSSections';
import {
  extractFinancialYears,
  getCurrentFinancialYear,
} from './tds/TDSHelpers';

function TDS({ navigate }) {
  const session = getCurrentAuthSession();
  const [financialYearsResponse, setFinancialYearsResponse] = useState(
    getCurrentTaxFinancialYearsResponse()
  );
  const [selectedYear, setSelectedYear] = useState(getCurrentFinancialYear());
  const [loading, setLoading] = useState(!getCurrentTaxFinancialYearsResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const financialYears = useMemo(() => {
    const years = extractFinancialYears(financialYearsResponse);
    return years.length ? years : [selectedYear || getCurrentFinancialYear()];
  }, [financialYearsResponse, selectedYear]);

  const loadFinancialYears = useCallback(async () => {
    if (session?.mode !== 'employee') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await taxFinancialYearsApi();
      const years = extractFinancialYears(response);
      setFinancialYearsResponse(response);
      if (years.length && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
      setError('');
    } catch (taxError) {
      setError(taxError.message || 'Unable to load financial years.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, session?.mode]);

  const refreshYears = useCallback(
    ({ refresh = false } = {}) => {
      refresh ? setRefreshing(true) : setLoading(true);
      return loadFinancialYears().finally(() => setRefreshing(false));
    },
    [loadFinancialYears]
  );

  useEffect(() => {
    loadFinancialYears();
  }, [loadFinancialYears]);

  const handleSelectYear = (year) => {
    setSelectedYear(year);
    setError('');
  };

  const handleViewYear = () => {
    if (!selectedYear) {
      setError('Please select a financial year.');
      return;
    }

    navigate('tdsDetails', { financialYear: selectedYear });
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refreshYears({ refresh: true })}
          tintColor="#f08c3c"
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ADMIN TAX</Text>
        <Text style={styles.title}>Employee Tax Details</Text>
        <Text style={styles.subtitle}>
          Select a financial year first, then view HRA, declarations, preview, and PDF actions.
        </Text>
      </View>

      <FinancialYearPicker
        financialYears={financialYears}
        selectedYear={selectedYear}
        loading={loading}
        onChange={handleSelectYear}
        onView={handleViewYear}
      />

      {!!error && <StatusCard title="Tax API error" message={error} tone="error" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: '#143f76',
    borderRadius: 6,
    marginHorizontal: 14,
    marginTop: 10,
    padding: 15,
  },
  eyebrow: {
    color: '#FCE3C1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 8,
  },
});

export default TDS;
