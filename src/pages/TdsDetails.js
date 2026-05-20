import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getCurrentTaxDeclarationListResponse,
  getCurrentTaxHraListResponse,
  getCurrentTaxPreviewResponse,
  taxDeclarationListApi,
  taxDownloadPdfApi,
  taxHraListApi,
  taxPreviewApi,
  taxPreviewUrlApi,
  taxSaveDeclarationApi,
  taxSaveDeclarationBulkApi,
  taxSaveHraApi,
  taxSaveHraBulkApi,
  taxSubmitApi,
} from '../redux/EmployeeTdsSlice';
import {
  asArray,
  getCurrentFinancialYear,
  getResponseData,
} from './tds/TDSHelpers';
import { StatusCard } from './tds/TDSSections';
import {
  DeclarationsTab,
  HraTab,
  PillTabs,
  PreviewTab,
} from './tds/TDSSections';

function TdsDetails({ routeParams = {} }) {
  const financialYear = routeParams.financialYear || getCurrentFinancialYear();
  const [activeTab, setActiveTab] = useState('hra');
  const [hraResponse, setHraResponse] = useState(getCurrentTaxHraListResponse());
  const [declarationResponse, setDeclarationResponse] = useState(
    getCurrentTaxDeclarationListResponse()
  );
  const [previewResponse, setPreviewResponse] = useState(getCurrentTaxPreviewResponse());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRecords = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const [hra, declarations, preview] = await Promise.all([
          taxHraListApi({ financial_year: financialYear }),
          taxDeclarationListApi({ financial_year: financialYear }),
          taxPreviewApi({ financial_year: financialYear }),
        ]);

        setHraResponse(hra);
        setDeclarationResponse(declarations);
        setPreviewResponse(preview);
        setError('');
      } catch (taxError) {
        setError(taxError.message || 'Unable to load employee tax records.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [financialYear]
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const loadHra = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await taxHraListApi({ financial_year: financialYear });
        setHraResponse(response);
        setError('');
      } catch (taxError) {
        setError(taxError.message || 'Unable to load HRA list.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [financialYear]
  );

  const loadDeclarations = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await taxDeclarationListApi({ financial_year: financialYear });
        setDeclarationResponse(response);
        setError('');
      } catch (taxError) {
        setError(taxError.message || 'Unable to load declaration list.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [financialYear]
  );

  const loadPreview = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const response = await taxPreviewApi({ financial_year: financialYear });
        setPreviewResponse(response);
        setError('');
      } catch (taxError) {
        setError(taxError.message || 'Unable to load tax preview.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [financialYear]
  );

  const refreshActiveTab = useCallback(
    ({ refresh = false } = {}) => {
      if (activeTab === 'declarations') {
        return loadDeclarations({ refresh });
      }

      if (activeTab === 'preview') {
        return loadPreview({ refresh });
      }

      return loadHra({ refresh });
    },
    [activeTab, loadDeclarations, loadHra, loadPreview]
  );

  const runAction = async (action, successMessage, actionKey = 'action') => {
    try {
      setActionLoading(actionKey);
      setMessage('');
      await action();
      setMessage(successMessage);
      await loadRecords({ refresh: true });
    } catch (taxError) {
      setMessage(taxError.message || 'Tax API action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const hraItems = asArray(getResponseData(hraResponse));
  const declarationItems = asArray(getResponseData(declarationResponse));
  const previewData = getResponseData(previewResponse);
  const summary = previewData?.summary || previewData?.tax_summary || previewData || {};
  const totalRecords = hraItems.length + declarationItems.length + (previewData ? 1 : 0);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refreshActiveTab({ refresh: true })}
          tintColor="#f08c3c"
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>EMPLOYEE TAX</Text>
        <Text style={styles.title}>TDS Details</Text>
        <Text style={styles.overviewText}>
          {financialYear}  |  {totalRecords} records found
        </Text>
      </View>

      {!!error && <StatusCard title="Tax API error" message={error} tone="error" />}
      {!!message && (
        <StatusCard
          title={message.toLowerCase().includes('failed') ? 'Action failed' : 'Done'}
          message={message}
          tone={message.toLowerCase().includes('failed') ? 'error' : 'success'}
        />
      )}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#2664b4" />
          <Text style={styles.loadingText}>Loading tax records...</Text>
        </View>
      )}

      <PillTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'hra' && (
        <HraTab
          actionLoading={actionLoading}
          hraItems={hraItems}
          loading={loading}
          selectedYear={financialYear}
          onRefresh={() => loadHra({ refresh: true })}
          onSave={(payload) =>
            runAction(() => taxSaveHraApi({ payload }), 'HRA month saved successfully.', 'saveHra')
          }
          onBulkSave={(payload) =>
            runAction(
              () => taxSaveHraBulkApi({ payload }),
              'Multiple HRA months saved successfully.',
              'saveHraBulk'
            )
          }
        />
      )}

      {activeTab === 'declarations' && (
        <DeclarationsTab
          actionLoading={actionLoading}
          declarationItems={declarationItems}
          loading={loading}
          selectedYear={financialYear}
          onRefresh={() => loadDeclarations({ refresh: true })}
          onSave={(payload) =>
            runAction(
              () => taxSaveDeclarationApi({ payload }),
              'Declaration saved successfully.',
              'saveDeclaration'
            )
          }
          onBulkSave={(payload) =>
            runAction(
              () => taxSaveDeclarationBulkApi({ payload }),
              'Multiple declarations saved successfully.',
              'saveDeclarationBulk'
            )
          }
        />
      )}

      {activeTab === 'preview' && (
        <PreviewTab
          actionLoading={actionLoading}
          loading={loading}
          previewData={previewData}
          onRefresh={() => loadPreview({ refresh: true })}
          onSubmit={() =>
            runAction(
              () => taxSubmitApi({ payload: { financial_year: financialYear } }),
              'Tax declarations submitted successfully.',
              'submit'
            )
          }
          onDownload={() =>
            runAction(
              () => taxDownloadPdfApi({ financial_year: financialYear }),
              'Tax PDF downloaded successfully. Check the notification/download arrow.',
              'download'
            )
          }
          onOpenPreviewUrl={() =>
            runAction(async () => {
              const response = await taxPreviewUrlApi({ financial_year: financialYear });
              const url =
                response?.data?.data?.url ||
                response?.data?.data?.preview_url ||
                response?.data?.url ||
                '';

                if (url) {
                  await Linking.openURL(url);
                }
              }, 'Web preview opened successfully.', 'previewUrl')
          }
        />
      )}

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
    fontWeight: '800',
    marginTop: 8,
  },
  overviewText: {
    color: '#D8E7FA',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 8,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
  },
  loadingText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
});

export default TdsDetails;
