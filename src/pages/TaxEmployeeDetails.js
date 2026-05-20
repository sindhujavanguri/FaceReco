import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  adminTaxActionApi,
  adminTaxDownloadPdfApi,
  adminTaxEmployeeDetailsApi,
  adminTaxPreviewUrlApi,
  getCurrentAdminTaxEmployeeResponse,
} from '../redux/admintaxslice';
import {getCurrentAuthSession} from '../redux/loginSlice';

const formatValue = (value, fallback = '-') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const formatTitle = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const getDetailsData = (response) => response?.data?.data || {};

const getApiErrorMessage = (error, fallback) => {
  const response = error?.response;
  const apiMessage = response?.data?.message || response?.data?.error;
  const status = response?.status;

  if (apiMessage && status) {
    return `${apiMessage} (${status})`;
  }
  if (apiMessage) {
    return apiMessage;
  }
  if (status) {
    return `${fallback} (${status})`;
  }

  return error?.message || fallback;
};

const looksLikeTaxRecord = (record) =>
  isPlainObject(record) &&
  (record.id ||
    record.section_key ||
    record.section_label ||
    record.status ||
    record.eligible_amount ||
    record.declared_amount ||
    record.amount ||
    record.rent_amount);

const collectRecords = (source, matcher, parentKey = '') => {
  if (!source || typeof source !== 'object') {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .filter(looksLikeTaxRecord)
      .map((item) => ({...item, __parentKey: parentKey}));
  }

  return Object.entries(source).flatMap(([key, value]) => {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;
    const keyMatches = matcher(nextKey);

    if (Array.isArray(value) && keyMatches) {
      return value
        .filter(looksLikeTaxRecord)
        .map((item) => ({...item, __parentKey: nextKey}));
    }

    if (isPlainObject(value) && keyMatches && looksLikeTaxRecord(value)) {
      return [{...value, __parentKey: nextKey}];
    }

    if (isPlainObject(value) || Array.isArray(value)) {
      return collectRecords(value, matcher, nextKey);
    }

    return [];
  });
};

const getEmployee = (data, fallbackEmployee = {}) =>
  data.employee || data.emp || data.employee_details || fallbackEmployee || {};

const getAmount = (record) =>
  record.eligible_amount ||
  record.approved_amount ||
  record.declared_amount ||
  record.amount ||
  record.rent_amount ||
  record.value ||
  '';

const getRecordTitle = (record, fallback) =>
  record.section_label ||
  record.title ||
  record.name ||
  record.label ||
  record.month ||
  fallback;

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

function DetailPair({label, value}) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {formatValue(value)}
      </Text>
    </View>
  );
}

function TaxRecordCard({itemType, onAction, record}) {
  const canAct = record.id || record.section_key;

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleBlock}>
          <Text style={styles.recordTitle} numberOfLines={2}>
            {getRecordTitle(record, itemType === 'hra' ? 'HRA' : 'Declaration')}
          </Text>
          <Text style={styles.recordSub} numberOfLines={1}>
            {formatValue(record.__parentKey || record.section_key, itemType)}
          </Text>
        </View>
        <StatusPill status={record.status} />
      </View>

      <View style={styles.metaGrid}>
        <DetailPair label="ID" value={record.id} />
        <DetailPair label="Amount" value={getAmount(record)} />
      </View>
      <View style={styles.metaGrid}>
        <DetailPair label="Section" value={record.section_key || record.section} />
        <DetailPair label="Reason" value={record.reject_reason || record.reason} />
      </View>

      {canAct && (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onAction(record, itemType, 'approve')}
            style={({pressed}) => [
              styles.actionButton,
              styles.approveButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onAction(record, itemType, 'reject')}
            style={({pressed}) => [
              styles.actionButton,
              styles.rejectButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function RawDataBlock({data}) {
  const simpleEntries = Object.entries(data || {}).filter(
    ([, value]) => !Array.isArray(value) && !isPlainObject(value),
  );

  if (!simpleEntries.length) {
    return null;
  }

  return (
    <View style={styles.rawCard}>
      <Text style={styles.rawTitle}>Other Details</Text>
      {simpleEntries.slice(0, 18).map(([key, value]) => (
        <View style={styles.rawRow} key={key}>
          <Text style={styles.rawKey}>{formatTitle(key)}</Text>
          <Text style={styles.rawValue}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );
}

function TaxEmployeeDetails({routeParams}) {
  const session = getCurrentAuthSession();
  const isAdmin = session?.mode !== 'employee';
  const financialYear = routeParams?.financialYear || '';
  const empCode = routeParams?.empCode || routeParams?.employee?.emp_code || '';
  const fallbackEmployee = routeParams?.employee || {};
  const cachedResponse = getCurrentAdminTaxEmployeeResponse();
  const [detailsResponse, setDetailsResponse] = useState(cachedResponse);
  const [loading, setLoading] = useState(!cachedResponse);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('Loading employee tax details...');
  const [actionModal, setActionModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [eligibleAmount, setEligibleAmount] = useState('');
  const [acting, setActing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadDetails = useCallback(
    async ({refresh = false} = {}) => {
      if (!isAdmin) {
        setLoading(false);
        setMessage('Admin login required.');
        return;
      }

      if (!financialYear || !empCode) {
        setLoading(false);
        setMessage('Missing financial year or employee code.');
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await adminTaxEmployeeDetailsApi({
          emp_code: empCode,
          financial_year: financialYear,
        });
        setDetailsResponse(response);
        setMessage(response?.data?.message || 'Employee tax details fetched successfully.');
      } catch (error) {
        console.log('Admin Employee Tax Details Page Error:', error?.response || error);
        setMessage(
          getApiErrorMessage(error, 'Unable to fetch employee tax details.'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [empCode, financialYear, isAdmin],
  );

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const data = getDetailsData(detailsResponse);
  const employee = getEmployee(data, fallbackEmployee);
  const hraRecords = useMemo(
    () => collectRecords(data, (key) => key.toLowerCase().includes('hra')),
    [data],
  );
  const declarationRecords = useMemo(
    () =>
      collectRecords(data, (key) => {
        const lowerKey = key.toLowerCase();
        return (
          lowerKey.includes('declaration') ||
          lowerKey.includes('section') ||
          lowerKey.includes('deduction')
        );
      }).filter((record) => !String(record.__parentKey || '').toLowerCase().includes('hra')),
    [data],
  );

  const openAction = (record, itemType, action) => {
    setRejectReason('');
    setEligibleAmount(formatValue(getAmount(record), ''));
    setActionModal({action, itemType, record});
  };

  const submitAction = async () => {
    if (!actionModal?.record) {
      return;
    }

    try {
      setActing(true);
      const record = actionModal.record;
      await adminTaxActionApi({
        action: actionModal.action,
        eligible_amount: eligibleAmount,
        emp_code: empCode,
        financial_year: financialYear,
        id: record.id,
        item_type: actionModal.itemType,
        reject_reason: rejectReason.trim(),
        section_key: record.section_key,
      });
      setActionModal(null);
      setMessage('Tax action saved. Refreshing employee tax details...');
      await loadDetails({refresh: true});
    } catch (error) {
      console.log('Admin Tax Action Page Error:', error?.response || error);
      setMessage(getApiErrorMessage(error, 'Unable to submit tax action.'));
    } finally {
      setActing(false);
    }
  };

  const openPreview = async () => {
    try {
      setPreviewing(true);
      setMessage('Generating preview URL...');
      const response = await adminTaxPreviewUrlApi({
        emp_code: empCode,
        financial_year: financialYear,
      });
      const url = response?.data?.data?.url || response?.data?.url;
      if (url) {
        await Linking.openURL(url);
        setMessage('Preview URL opened.');
      } else {
        setMessage('Preview API completed, but no URL was returned.');
      }
    } catch (error) {
      console.log('Admin Tax Preview URL Page Error:', error?.response || error);
      setMessage(getApiErrorMessage(error, 'Unable to open preview URL.'));
    } finally {
      setPreviewing(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setDownloading(true);
      setMessage('Downloading tax PDF...');
      const response = await adminTaxDownloadPdfApi({
        emp_code: empCode,
        financial_year: financialYear,
      });
      setMessage(
        response?.data?.visibleInDownloads
          ? 'PDF downloaded to Downloads.'
          : 'PDF downloaded successfully.',
      );
    } catch (error) {
      console.log('Admin Tax PDF Download Page Error:', error?.response || error);
      setMessage(getApiErrorMessage(error, 'Unable to download tax PDF.'));
    } finally {
      setDownloading(false);
    }
  };

  const topBusy = loading || refreshing || acting || previewing || downloading;

  if (!isAdmin) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Admin access only</Text>
        <Text style={styles.lockedText}>Employee tax details are available only after admin login.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDetails({refresh: true})}
            tintColor="#2664b4"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryBand}>
          <Text style={styles.eyebrow}>EMPLOYEE TAX DETAILS</Text>
          <Text style={styles.summaryTitle} numberOfLines={2}>
            {formatValue(employee.emp_name || fallbackEmployee.emp_name, 'Employee')}
          </Text>
          <Text style={styles.summarySub}>
            {formatValue(empCode)} - {formatValue(financialYear)}
          </Text>
        </View>

        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            disabled={previewing || downloading}
            onPress={openPreview}
            style={({pressed}) => [
              styles.previewButton,
              (previewing || downloading) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.previewButtonText}>
              {previewing ? 'Loading...' : 'Preview'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={downloading || previewing}
            onPress={downloadPdf}
            style={({pressed}) => [
              styles.downloadButton,
              (downloading || previewing) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Downloading...' : 'PDF'}
            </Text>
          </Pressable>
        </View>

        {topBusy && (
          <View style={styles.topLoader}>
            <ActivityIndicator color="#2664b4" size="small" />
            <Text style={styles.topLoaderText}>
              {downloading
                ? 'Downloading PDF...'
                : previewing
                  ? 'Opening preview...'
                  : acting
                    ? 'Saving tax action...'
                    : 'Loading tax details...'}
            </Text>
          </View>
        )}

        <Text style={styles.statusMessage}>{message}</Text>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#2664b4" />
            <Text style={styles.stateText}>Calling employee tax details API...</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.metaGrid}>
            <DetailPair label="Email" value={employee.emp_email || fallbackEmployee.emp_email} />
            <DetailPair label="Phone" value={employee.emp_phone || fallbackEmployee.emp_phone} />
          </View>
          <View style={styles.metaGrid}>
            <DetailPair label="PAN" value={employee.emp_pan || fallbackEmployee.emp_pan} />
            <DetailPair
              label="Designation"
              value={employee.designation_name || fallbackEmployee.designation_name}
            />
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>HRA RECORDS</Text>
          <Text style={styles.countText}>{hraRecords.length}</Text>
        </View>
        {hraRecords.length ? (
          hraRecords.map((record, index) => (
            <TaxRecordCard
              itemType="hra"
              key={`hra-${record.id || record.section_key || index}`}
              onAction={openAction}
              record={record}
            />
          ))
        ) : (
          !loading && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No HRA records</Text>
              <Text style={styles.emptyText}>The employee API did not return HRA rows.</Text>
            </View>
          )
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>DECLARATIONS</Text>
          <Text style={styles.countText}>{declarationRecords.length}</Text>
        </View>
        {declarationRecords.length ? (
          declarationRecords.map((record, index) => (
            <TaxRecordCard
              itemType="declaration"
              key={`declaration-${record.id || record.section_key || index}`}
              onAction={openAction}
              record={record}
            />
          ))
        ) : (
          !loading && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No declarations</Text>
              <Text style={styles.emptyText}>The employee API did not return declaration rows.</Text>
            </View>
          )
        )}

        <RawDataBlock data={data} />
      </ScrollView>

      <Modal transparent visible={!!actionModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {actionModal?.action === 'reject' ? 'Reject' : 'Approve'}{' '}
              {actionModal?.itemType === 'declaration' ? 'Declaration' : 'HRA'}
            </Text>
            <Text style={styles.modalText}>
              ID {formatValue(actionModal?.record?.id)} - {formatValue(empCode)}
            </Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setEligibleAmount}
              placeholder="Eligible amount"
              placeholderTextColor="#98a2b3"
              style={styles.modalInput}
              value={eligibleAmount}
            />
            {actionModal?.action === 'reject' && (
              <TextInput
                multiline
                onChangeText={setRejectReason}
                placeholder="Reject reason"
                placeholderTextColor="#98a2b3"
                style={[styles.modalInput, styles.reasonInput]}
                value={rejectReason}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable
                disabled={acting}
                onPress={() => setActionModal(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={acting} onPress={submitAction} style={styles.confirmButton}>
                <Text style={styles.confirmText}>{acting ? 'Saving...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#ffffff',
    flex: 1,
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
    lineHeight: 25,
    marginTop: 7,
  },
  summarySub: {
    color: '#d8e7fa',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  downloadButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
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
  topLoader: {
    alignItems: 'center',
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topLoaderText: {
    color: '#113a70',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  infoCard: {
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 16,
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
  recordCard: {
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  recordHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  recordTitleBlock: {
    flex: 1,
  },
  recordTitle: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
  },
  recordSub: {
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  approveButton: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: '#fef3f2',
    borderColor: '#fecdca',
    borderWidth: 1,
  },
  approveButtonText: {
    color: '#027a48',
    fontSize: 13,
    fontWeight: '900',
  },
  rejectButtonText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '900',
  },
  rawCard: {
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  rawTitle: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  rawRow: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  rawKey: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rawValue: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  emptyBox: {
    alignItems: 'center',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: '#113a70',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6b7f99',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 42, 67, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: '#113a70',
    fontSize: 18,
    fontWeight: '900',
  },
  modalText: {
    color: '#6b7f99',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  modalInput: {
    backgroundColor: '#f8faff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  reasonInput: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#f4f8fd',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#f08c3c',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  cancelText: {
    color: '#2664b4',
    fontSize: 13,
    fontWeight: '900',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 13,
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
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

export default TaxEmployeeDetails;
