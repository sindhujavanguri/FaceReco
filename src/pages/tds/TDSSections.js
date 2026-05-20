import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  formatAmount,
  formatLabel,
  formatValue,
  getField,
} from './TDSHelpers';

const tabs = [
  { key: 'hra', label: 'HRA' },
  { key: 'declarations', label: 'Declarations' },
  { key: 'preview', label: 'Preview' },
];

export function StatusCard({ message, tone = 'info', title }) {
  const isError = tone === 'error';
  const isSuccess = tone === 'success';

  return (
    <View
      style={[
        styles.statusCard,
        isError && styles.errorCard,
        isSuccess && styles.successCard,
      ]}
    >
      <Text
        style={[
          styles.statusTitle,
          isError && styles.errorTitle,
          isSuccess && styles.successTitle,
        ]}
      >
        {title}
      </Text>
      {!!message && (
        <Text
          style={[
            styles.statusText,
            isError && styles.errorText,
            isSuccess && styles.successText,
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

export function PillTabs({ activeTab, onChange }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <Pressable
          accessibilityRole="button"
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function YearSelector({ financialYears, selectedYear, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.yearList}
    >
      {financialYears.map((year) => (
        <Pressable
          accessibilityRole="button"
          key={year}
          onPress={() => onChange(year)}
          style={[styles.yearPill, selectedYear === year && styles.activeYearPill]}
        >
          <Text style={[styles.yearText, selectedYear === year && styles.activeYearText]}>
            {year}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function FinancialYearPicker({
  financialYears,
  loading,
  onChange,
  onView,
  selectedYear,
}) {
  return (
    <View style={styles.yearPanel}>
      <View style={styles.yearPanelHeader}>
        <View>
          <Text style={styles.sectionKicker}>SELECT YEAR</Text>
          <Text style={styles.yearCount}>
            {financialYears.length} {financialYears.length === 1 ? 'year' : 'years'} available
          </Text>
        </View>
        {!!selectedYear && <Text style={styles.selectedYearLabel}>{selectedYear}</Text>}
      </View>

      {loading && <ActivityIndicator color="#2664b4" style={styles.loader} />}

      <View style={styles.yearGrid}>
        {financialYears.map((year) => {
          const isSelected = selectedYear === year;

          return (
            <Pressable
              accessibilityRole="button"
              key={year}
              onPress={() => onChange(year)}
              style={[styles.yearCard, isSelected && styles.activeYearCard]}
            >
              <Text style={[styles.yearCardTitle, isSelected && styles.activeYearCardTitle]}>
                {year}
              </Text>
              <Text style={[styles.yearCardSub, isSelected && styles.activeYearCardSub]}>
                Tax details
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!selectedYear || loading}
        onPress={onView}
        style={[styles.viewButton, (!selectedYear || loading) && styles.disabledButton]}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </Pressable>
    </View>
  );
}

function DataCard({ item, title }) {
  const entries = Object.entries(item || {}).filter(([, value]) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    return typeof value !== 'object';
  });

  return (
    <View style={styles.dataCard}>
      <Text style={styles.dataTitle}>{title}</Text>
      {entries.slice(0, 8).map(([key, value]) => (
        <View key={key} style={styles.dataRow}>
          <Text style={styles.dataLabel}>{formatLabel(key)}</Text>
          <Text style={styles.dataValue}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <View style={styles.metricCard}>
      <Text
        style={[
          styles.metricValue,
          tone === 'success' && styles.metricSuccess,
          tone === 'danger' && styles.metricDanger,
        ]}
      >
        {formatAmount(value)}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function HraTab({
  actionLoading,
  hraItems,
  loading,
  onBulkSave,
  onRefresh,
  onSave,
  selectedYear,
}) {
  const isBooleanLoading = typeof actionLoading === 'boolean';
  const isSaveLoading = isBooleanLoading ? actionLoading : actionLoading === 'saveHra';
  const isBulkSaveLoading = isBooleanLoading ? actionLoading : actionLoading === 'saveHraBulk';
  const [month, setMonth] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [bulkText, setBulkText] = useState('');

  const saveOne = () =>
    onSave({
      financial_year: selectedYear,
      landlord_name: landlordName,
      landlord_pan: landlordPan,
      month,
      rent_amount: rentAmount,
    });

  const saveBulk = () => {
    let entries = [];

    try {
      entries = bulkText.trim() ? JSON.parse(bulkText) : [];
    } catch (error) {
      entries = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [entryMonth, amount] = line.split(',').map((part) => part.trim());
          return { month: entryMonth, rent_amount: amount };
        });
    }

    onBulkSave({
      financial_year: selectedYear,
      hra: entries,
    });
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>HOUSE RENT ALLOWANCE</Text>
          <Text style={styles.sectionTitle}>{hraItems.length} HRA records</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={onRefresh}>
          <Text style={styles.smallButtonText}>Refresh</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color="#2664b4" style={styles.loader} />}

      {hraItems.length ? (
        hraItems.map((item, index) => (
          <DataCard
            item={item}
            key={item.id || item.hra_id || item.month || index}
            title={formatValue(
              getField(item, ['month', 'salary_month', 'financial_month'], `HRA ${index + 1}`)
            )}
          />
        ))
      ) : (
        !loading && (
          <StatusCard
            title="No HRA records"
            message="Add monthly rent details for this financial year."
          />
        )
      )}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Save one HRA month</Text>
        <TextInput
          placeholder="Month (example: 2026-04)"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={month}
          onChangeText={setMonth}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Rent amount"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={rentAmount}
          onChangeText={setRentAmount}
        />
        <TextInput
          placeholder="Landlord name"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={landlordName}
          onChangeText={setLandlordName}
        />
        <TextInput
          autoCapitalize="characters"
          placeholder="Landlord PAN"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={landlordPan}
          onChangeText={setLandlordPan}
        />
        <Pressable
          disabled={isSaveLoading}
          style={[styles.primaryButton, isSaveLoading && styles.disabledButton]}
          onPress={saveOne}
        >
          <Text style={styles.primaryButtonText}>Save HRA</Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Save multiple HRA months</Text>
        <TextInput
          multiline
          placeholder={'Add monthly rent entries\n\nExample:\n2026-04, 12000\n2026-05, 12000'}
          placeholderTextColor="#98A2B3"
          style={[styles.input, styles.textArea]}
          value={bulkText}
          onChangeText={setBulkText}
        />
        <Pressable
          disabled={isBulkSaveLoading}
          style={[styles.secondaryButton, isBulkSaveLoading && styles.disabledButton]}
          onPress={saveBulk}
        >
          <Text style={styles.secondaryButtonText}>Save Multiple HRA</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function DeclarationsTab({
  actionLoading,
  declarationItems,
  loading,
  onBulkSave,
  onRefresh,
  onSave,
  selectedYear,
}) {
  const isBooleanLoading = typeof actionLoading === 'boolean';
  const isSaveLoading = isBooleanLoading
    ? actionLoading
    : actionLoading === 'saveDeclaration';
  const isBulkSaveLoading = isBooleanLoading
    ? actionLoading
    : actionLoading === 'saveDeclarationBulk';
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bulkText, setBulkText] = useState('');

  const saveOne = () =>
    onSave({
      amount,
      declaration_name: category,
      financial_year: selectedYear,
      remarks,
    });

  const saveBulk = () => {
    let entries = [];

    try {
      entries = bulkText.trim() ? JSON.parse(bulkText) : [];
    } catch (error) {
      entries = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, entryAmount] = line.split(',').map((part) => part.trim());
          return { amount: entryAmount, declaration_name: name };
        });
    }

    onBulkSave({
      declarations: entries,
      financial_year: selectedYear,
    });
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>TAX DECLARATIONS</Text>
          <Text style={styles.sectionTitle}>{declarationItems.length} declaration records</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={onRefresh}>
          <Text style={styles.smallButtonText}>Refresh</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color="#2664b4" style={styles.loader} />}

      {declarationItems.length ? (
        declarationItems.map((item, index) => (
          <DataCard
            item={item}
            key={item.id || item.declaration_id || item.name || index}
            title={formatValue(
              getField(
                item,
                ['declaration_name', 'name', 'section', 'title'],
                `Declaration ${index + 1}`
              )
            )}
          />
        ))
      ) : (
        !loading && (
          <StatusCard
            title="No declarations"
            message="Add investment, deduction, and exemption declarations here."
          />
        )
      )}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Save one declaration</Text>
        <TextInput
          placeholder="Declaration name or section"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Amount"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          placeholder="Remarks"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          value={remarks}
          onChangeText={setRemarks}
        />
        <Pressable
          disabled={isSaveLoading}
          style={[styles.primaryButton, isSaveLoading && styles.disabledButton]}
          onPress={saveOne}
        >
          <Text style={styles.primaryButtonText}>Save Declaration</Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Save multiple declarations</Text>
        <TextInput
          multiline
          placeholder={'Add declaration entries\n\nExample:\n80C, 50000\nHRA, 120000'}
          placeholderTextColor="#98A2B3"
          style={[styles.input, styles.textArea]}
          value={bulkText}
          onChangeText={setBulkText}
        />
        <Pressable
          disabled={isBulkSaveLoading}
          style={[styles.secondaryButton, isBulkSaveLoading && styles.disabledButton]}
          onPress={saveBulk}
        >
          <Text style={styles.secondaryButtonText}>Save Multiple Declarations</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PreviewTab({
  actionLoading,
  loading,
  onDownload,
  onOpenPreviewUrl,
  onRefresh,
  onSubmit,
  previewData,
}) {
  const summary = previewData?.summary || previewData?.tax_summary || previewData || {};
  const isBooleanLoading = typeof actionLoading === 'boolean';
  const isSubmitLoading = isBooleanLoading ? actionLoading : actionLoading === 'submit';
  const isDownloadLoading = isBooleanLoading ? actionLoading : actionLoading === 'download';
  const isPreviewUrlLoading = isBooleanLoading ? actionLoading : actionLoading === 'previewUrl';

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>TAX PREVIEW</Text>
          <Text style={styles.sectionTitle}>Review before submit</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={onRefresh}>
          <Text style={styles.smallButtonText}>Refresh</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color="#2664b4" style={styles.loader} />}

      <View style={styles.metricGrid}>
        <MetricCard
          label="Gross Income"
          value={getField(summary, ['gross_income', 'gross_salary', 'income'], 0)}
        />
        <MetricCard
          label="Declarations"
          value={getField(summary, ['total_declarations', 'deductions', 'total_deduction'], 0)}
          tone="success"
        />
        <MetricCard
          label="Taxable Income"
          value={getField(summary, ['taxable_income', 'taxable'], 0)}
        />
        <MetricCard
          label="Estimated Tax"
          value={getField(summary, ['tax_payable', 'estimated_tax', 'tax'], 0)}
          tone="danger"
        />
      </View>

      {previewData ? (
        <DataCard item={summary} title="Preview Details" />
      ) : (
        !loading && (
          <StatusCard
            title="Preview not loaded"
            message="Refresh the preview after adding HRA and declarations."
          />
        )
      )}

      <View style={styles.actionGrid}>
        <Pressable
          disabled={isSubmitLoading}
          style={[
            styles.primaryButton,
            styles.actionButton,
            isSubmitLoading && styles.disabledButton,
          ]}
          onPress={onSubmit}
        >
          <Text style={styles.primaryButtonText}>Submit</Text>
        </Pressable>
        <Pressable
          disabled={isDownloadLoading}
          style={[
            styles.secondaryButton,
            styles.actionButton,
            isDownloadLoading && styles.disabledButton,
          ]}
          onPress={onDownload}
        >
          <Text style={styles.secondaryButtonText}>Download PDF</Text>
        </Pressable>
        <Pressable
          disabled={isPreviewUrlLoading}
          style={[styles.lightButton, isPreviewUrlLoading && styles.disabledButton]}
          onPress={onOpenPreviewUrl}
        >
          <Text style={styles.lightButtonText}>Open Web Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  yearList: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  yearPill: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  activeYearPill: {
    backgroundColor: '#FFF1E5',
    borderColor: '#f08c3c',
  },
  yearText: {
    color: '#2664b4',
    fontSize: 12,
    fontWeight: '900',
  },
  activeYearText: {
    color: '#C35C10',
  },
  yearPanel: {
    marginTop: 14,
  },
  yearPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  yearCount: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  selectedYearLabel: {
    color: '#f08c3c',
    fontSize: 12,
    fontWeight: '900',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  yearCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 76,
    padding: 12,
    width: '48.8%',
  },
  activeYearCard: {
    backgroundColor: '#2f68ba',
    borderColor: '#2f68ba',
  },
  yearCardTitle: {
    color: '#123f78',
    fontSize: 16,
    fontWeight: '900',
  },
  activeYearCardTitle: {
    color: '#ffffff',
  },
  yearCardSub: {
    color: '#425f86',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
  activeYearCardSub: {
    color: '#ffffff',
  },
  viewButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 7,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 5,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 11,
  },
  activeTabButton: {
    backgroundColor: '#f08c3c',
  },
  tabText: {
    color: '#2664b4',
    fontSize: 12,
    fontWeight: '900',
  },
  activeTabText: {
    color: '#ffffff',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionKicker: {
    color: '#2664b4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  smallButton: {
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  smallButtonText: {
    color: '#174F93',
    fontSize: 12,
    fontWeight: '900',
  },
  loader: {
    marginTop: 16,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
  },
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
  },
  successCard: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  statusTitle: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
  },
  errorTitle: {
    color: '#b42318',
  },
  successTitle: {
    color: '#027A48',
  },
  statusText: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 4,
  },
  errorText: {
    color: '#c92a2a',
  },
  successText: {
    color: '#027A48',
  },
  dataCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  dataTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  dataRow: {
    alignItems: 'flex-start',
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dataLabel: {
    color: '#6B7F99',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    paddingRight: 10,
  },
  dataValue: {
    color: '#101828',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
  },
  formTitle: {
    color: '#113A70',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#101828',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#C35C10',
    fontSize: 13,
    fontWeight: '900',
  },
  lightButton: {
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
  },
  lightButtonText: {
    color: '#174F93',
    fontSize: 13,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 78,
    padding: 12,
    width: '47.5%',
  },
  metricValue: {
    color: '#113A70',
    fontSize: 17,
    fontWeight: '900',
  },
  metricSuccess: {
    color: '#027A48',
  },
  metricDanger: {
    color: '#B42318',
  },
  metricLabel: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
  },
});
