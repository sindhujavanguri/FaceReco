import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  PayrollDetails,
  PayrollTabs,
  PayslipCard,
  SummaryCard,
  formatValue,
} from './payroll/PayrollComponents';
import {
  employeeDownloadPayslipApi,
  employeePayrollDetailsApi,
  employeePayrollListApi,
  getCurrentPayrollDetailsResponse,
  getCurrentPayrollListResponse,
} from '../redux/EmployeePaySlice';
import { getCurrentAuthSession } from '../redux/loginSlice';

function Payroll() {
  const session = getCurrentAuthSession();
  const [activeTab, setActiveTab] = useState('payslips');
  const [payrollResponse, setPayrollResponse] = useState(getCurrentPayrollListResponse());
  const [detailsResponse, setDetailsResponse] = useState(getCurrentPayrollDetailsResponse());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(!getCurrentPayrollListResponse());
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');

  const loadPayroll = useCallback(async ({ refresh = false } = {}) => {
    if (session?.mode !== 'employee') {
      setLoading(false);
      return;
    }

    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await employeePayrollListApi();
      const firstMonth = response?.data?.data?.payslips?.[0]?.month || '';
      setPayrollResponse(response);
      setSelectedMonth((current) => current || firstMonth);
      setError('');
    } catch (payrollError) {
      setError(payrollError.message || 'Unable to load payroll list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.mode]);

  const loadDetails = useCallback(async (month) => {
    if (!month) {
      return;
    }

    try {
      setDetailsLoading(true);
      setSelectedMonth(month);
      const response = await employeePayrollDetailsApi({ month });
      setDetailsResponse(response);
      setDetailsError('');
      setActiveTab('details');
    } catch (payrollError) {
      setDetailsError(payrollError.message || 'Unable to load payroll details.');
      setActiveTab('details');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const downloadPayslip = useCallback(async (month) => {
    if (!month) {
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadMessage('');
      const response = await employeeDownloadPayslipApi({ month });
      const filePath = response?.data?.filePath;
      setDownloadMessage(
        filePath
          ? `Payslip PDF downloaded: ${filePath}`
          : `Payslip PDF downloaded for ${month}.`
      );
    } catch (payrollError) {
      setDownloadMessage(payrollError.message || 'Unable to download payslip.');
    } finally {
      setDownloadLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const payrollData = payrollResponse?.data?.data || {};
  const employee = payrollData.employee || {};
  const payslips = payrollData.payslips || [];
  const detailsData = detailsResponse?.data?.data || null;
  const selectedPayslip = useMemo(
    () => payslips.find((payslip) => payslip.month === selectedMonth) || payslips[0] || {},
    [payslips, selectedMonth]
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadPayroll({ refresh: true })}
          tintColor="#f08c3c"
        />
      }
      contentContainerStyle={{
        paddingBottom: 30,
        paddingHorizontal: 16,
        paddingTop: 10,
      }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#ffffff' }}
    >
      <View style={{ backgroundColor: '#2664b4', borderRadius: 8, padding: 16 }}>
        <Text style={{ color: '#FCE3C1', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }}>
          EMPLOYEE PAYROLL
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginTop: 7 }}>
          {formatValue(employee.emp_name, 'Employee')}
        </Text>
        <Text style={{ color: '#D8E7FA', fontSize: 13, fontWeight: '800', marginTop: 4 }}>
          {formatValue(employee.emp_code, '')}
        </Text>
      </View>

      <PayrollTabs activeTab={activeTab} onChange={setActiveTab} />

      {loading && (
        <View style={{
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderColor: '#D2E1F4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 14,
        }}>
          <ActivityIndicator color="#2664b4" />
          <Text style={{ color: '#667085', fontSize: 13, fontWeight: '700', marginTop: 8 }}>
            Loading payroll...
          </Text>
        </View>
      )}

      {!!error && (
        <View style={{
          backgroundColor: '#fff1f0',
          borderColor: '#ffd6d4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 14,
        }}>
          <Text style={{ color: '#b42318', fontSize: 14, fontWeight: '900' }}>
            Payroll API error
          </Text>
          <Text style={{ color: '#c92a2a', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
            {error}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        <SummaryCard label="Gross Salary" value={selectedPayslip.gross_salary} />
        <SummaryCard label="Deduction" tone="danger" value={selectedPayslip.total_deduction} />
        <SummaryCard label="Provident Fund" value={selectedPayslip.total_provident_fund} />
        <SummaryCard label="Net Salary" tone="success" value={selectedPayslip.net_salary} />
      </View>

      {!!downloadMessage && (
        <View style={{
          backgroundColor: '#F4F8FD',
          borderColor: '#D2E1F4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 12,
        }}>
          <Text style={{ color: '#113A70', fontSize: 13, fontWeight: '800' }}>
            {downloadMessage}
          </Text>
        </View>
      )}

      {activeTab === 'payslips' ? (
        <>
          <View style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
            marginTop: 18,
          }}>
            <Text style={{
              color: '#2664b4',
              fontSize: 11,
              fontWeight: '900',
              letterSpacing: 1.1,
            }}>
              PAYSLIP HISTORY
            </Text>
            <Text style={{ color: '#f5a623', fontSize: 12, fontWeight: '900' }}>
              {payslips.length} Records
            </Text>
          </View>

          {payslips.length ? (
            payslips.map((payslip) => (
              <PayslipCard
                isSelected={selectedPayslip.month === payslip.month}
                key={payslip.total_sal_id || payslip.month}
                onDetailsPress={() => loadDetails(payslip.month)}
                onDownloadPress={() => downloadPayslip(payslip.month)}
                payslip={payslip}
              />
            ))
          ) : (
            !loading && (
              <View style={{
                backgroundColor: '#ffffff',
                borderColor: '#D2E1F4',
                borderRadius: 8,
                borderWidth: 1,
                marginTop: 14,
                padding: 14,
              }}>
                <Text style={{ color: '#113A70', fontSize: 15, fontWeight: '900' }}>
                  No payslips found
                </Text>
                <Text style={{
                  color: '#6B7F99',
                  fontSize: 13,
                  fontWeight: '700',
                  marginTop: 4,
                }}>
                  Payroll list is not available.
                </Text>
              </View>
            )
          )}
        </>
      ) : (
        <>
          {detailsLoading && (
            <View style={{
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderColor: '#D2E1F4',
              borderRadius: 8,
              borderWidth: 1,
              marginTop: 12,
              padding: 14,
            }}>
              <ActivityIndicator color="#2664b4" />
              <Text style={{ color: '#667085', fontSize: 13, fontWeight: '700', marginTop: 8 }}>
                Loading payroll details...
              </Text>
            </View>
          )}

          {!!detailsError && (
            <View style={{
              backgroundColor: '#fff1f0',
              borderColor: '#ffd6d4',
              borderRadius: 8,
              borderWidth: 1,
              marginTop: 12,
              padding: 14,
            }}>
              <Text style={{ color: '#b42318', fontSize: 14, fontWeight: '900' }}>
                Payroll details API error
              </Text>
              <Text style={{
                color: '#c92a2a',
                fontSize: 13,
                fontWeight: '600',
                marginTop: 4,
              }}>
                {detailsError}
              </Text>
            </View>
          )}

          <PayrollDetails details={detailsData} />
        </>
      )}

      {downloadLoading && (
        <View style={{
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderColor: '#D2E1F4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 14,
        }}>
          <ActivityIndicator color="#2664b4" />
          <Text style={{ color: '#667085', fontSize: 13, fontWeight: '700', marginTop: 8 }}>
            Calling download payslip API...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

export default Payroll;
