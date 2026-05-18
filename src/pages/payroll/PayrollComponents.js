import React from 'react';
import { Pressable, Text, View } from 'react-native';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN')}`;
};

const formatLabel = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getMonthLabel = (month) => {
  if (!month) {
    return 'Select month';
  }

  const [year, monthNumber] = month.split('-');
  return `${monthNames[Number(monthNumber) - 1] || monthNumber} ${year}`;
};

export function SummaryCard({ label, tone, value }) {
  const toneColor = tone === 'success' ? '#027A48' : tone === 'danger' ? '#B42318' : '#113A70';

  return (
    <View style={{
      backgroundColor: '#F4F8FD',
      borderColor: '#D2E1F4',
      borderRadius: 8,
      borderWidth: 1,
      minHeight: 76,
      padding: 12,
      width: '47.5%',
    }}>
      <Text style={{ color: toneColor, fontSize: 18, fontWeight: '900' }}>
        {formatAmount(value)}
      </Text>
      <Text style={{ color: '#6B7F99', fontSize: 12, fontWeight: '800', marginTop: 5 }}>
        {label}
      </Text>
    </View>
  );
}

export function PayrollTabs({ activeTab, onChange }) {
  return (
    <View style={{
      backgroundColor: '#F4F8FD',
      borderColor: '#D2E1F4',
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
      padding: 5,
    }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('payslips')}
        style={{
          alignItems: 'center',
          backgroundColor: activeTab === 'payslips' ? '#f08c3c' : 'transparent',
          borderRadius: 6,
          flex: 1,
          paddingVertical: 11,
        }}
      >
        <Text style={{
          color: activeTab === 'payslips' ? '#ffffff' : '#2664b4',
          fontSize: 13,
          fontWeight: '900',
        }}>
          Payslips
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('details')}
        style={{
          alignItems: 'center',
          backgroundColor: activeTab === 'details' ? '#f08c3c' : 'transparent',
          borderRadius: 6,
          flex: 1,
          paddingVertical: 11,
        }}
      >
        <Text style={{
          color: activeTab === 'details' ? '#ffffff' : '#2664b4',
          fontSize: 13,
          fontWeight: '900',
        }}>
          Details
        </Text>
      </Pressable>
    </View>
  );
}

export function PayslipCard({ isSelected, onDetailsPress, onDownloadPress, payslip }) {
  return (
    <View style={{
      backgroundColor: '#ffffff',
      borderColor: isSelected ? '#f08c3c' : '#D2E1F4',
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 10,
      padding: 14,
    }}>
      <View style={{ alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: '#113A70', fontSize: 16, fontWeight: '900' }}>
            {getMonthLabel(payslip.month)}
          </Text>
          <Text style={{ color: '#6B7F99', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
            {formatValue(payslip.month)}
          </Text>
        </View>
        <View style={{
          backgroundColor: '#ECFDF3',
          borderColor: '#ABEFC6',
          borderRadius: 8,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}>
          <Text style={{ color: '#027A48', fontSize: 11, fontWeight: '900' }}>
            {Number(payslip.status) === 1 ? 'PAID' : 'PENDING'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#6B7F99',
            fontSize: 10,
            fontWeight: '900',
            textTransform: 'uppercase',
          }}>
            Gross
          </Text>
          <Text style={{ color: '#101828', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
            {formatAmount(payslip.gross_salary)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#6B7F99',
            fontSize: 10,
            fontWeight: '900',
            textTransform: 'uppercase',
          }}>
            Deduction
          </Text>
          <Text style={{ color: '#101828', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
            {formatAmount(payslip.total_deduction)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#6B7F99',
            fontSize: 10,
            fontWeight: '900',
            textTransform: 'uppercase',
          }}>
            Net Salary
          </Text>
          <Text style={{ color: '#027A48', fontSize: 12, fontWeight: '900', marginTop: 4 }}>
            {formatAmount(payslip.net_salary)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable
          style={{
            alignItems: 'center',
            backgroundColor: '#FFF1E5',
            borderRadius: 8,
            flex: 1,
            paddingVertical: 11,
          }}
          onPress={onDetailsPress}
        >
          <Text style={{ color: '#C35C10', fontSize: 13, fontWeight: '900' }}>Details</Text>
        </Pressable>
        <Pressable
          style={{
            alignItems: 'center',
            backgroundColor: '#2664b4',
            borderRadius: 8,
            flex: 1,
            paddingVertical: 11,
          }}
          onPress={onDownloadPress}
        >
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>Download</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DetailSection({ data, title }) {
  if (!data) {
    return null;
  }

  return (
    <View style={{
      borderTopColor: '#EEF2F6',
      borderTopWidth: 1,
      marginTop: 14,
      paddingTop: 12,
    }}>
      <Text style={{
        color: '#2664b4',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
      }}>
        {title}
      </Text>
      {Object.entries(data).map(([key, value]) => (
        <View
          key={key}
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 5,
          }}
        >
          <Text style={{
            color: '#6B7F99',
            flex: 1,
            fontSize: 12,
            fontWeight: '800',
            paddingRight: 10,
          }}>
            {formatLabel(key)}
          </Text>
          <Text style={{
            color: '#101828',
            flex: 1,
            fontSize: 12,
            fontWeight: '800',
            textAlign: 'right',
          }}>
            {formatValue(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PayrollDetails({ details }) {
  if (!details) {
    return (
      <View style={{
        backgroundColor: '#ffffff',
        borderColor: '#D2E1F4',
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 14,
        padding: 14,
      }}>
        <Text style={{ color: '#113A70', fontSize: 15, fontWeight: '900' }}>
          No details loaded
        </Text>
        <Text style={{
          color: '#6B7F99',
          fontSize: 13,
          fontWeight: '700',
          marginTop: 4,
        }}>
          Tap Details on a payslip to load payroll details.
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: '#ffffff',
      borderColor: '#D2E1F4',
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 14,
      padding: 14,
    }}>
      <Text style={{ color: '#113A70', fontSize: 16, fontWeight: '900' }}>
        Payroll Details
      </Text>
      <Text style={{ color: '#6B7F99', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
        {getMonthLabel(details.month)}
      </Text>
      <DetailSection data={details.total} title="Total" />
      <DetailSection data={details.allowances} title="Allowances" />
      <DetailSection data={details.deductions} title="Deductions" />
      <DetailSection data={details.salary_details} title="Salary Details" />
    </View>
  );
}
