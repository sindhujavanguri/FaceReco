import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  employeeDeleteDocumentApi,
  employeeDocumentListApi,
  employeeDownloadDocumentApi,
  getCurrentDocumentListResponse,
} from '../redux/DocumentSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';
import UploadDocuments from './UploadDocuments';

const formatValue = (value, fallback = '-') =>
  value === undefined || value === null || value === '' ? fallback : String(value);

export default function Documents({ navigate }) {
  const session = getCurrentAuthSession();
  const [documentResponse, setDocumentResponse] = useState(getCurrentDocumentListResponse());
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(!getCurrentDocumentListResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [downloadId, setDownloadId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDocuments = useCallback(async ({ refresh = false } = {}) => {
    if (session?.mode !== 'employee') {
      setLoading(false);
      return;
    }

    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await employeeDocumentListApi();
      setDocumentResponse(response);
      setError('');
    } catch (documentError) {
      setError(documentError.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.mode]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDownload = useCallback(async (document) => {
    try {
      setDownloadId(document.id);
      setMessage('');
      const response = await employeeDownloadDocumentApi({
        documentId: document.id,
        downloadUrl: document.download_url,
        fileName: document.file_name,
      });
      setMessage(`Document downloaded: ${response?.data?.filePath || document.file_name}`);
    } catch (downloadError) {
      setMessage('Unable to download document.');
    } finally {
      setDownloadId(null);
    }
  }, []);

  const deleteDocument = useCallback(async (document) => {
    try {
      setDeleteId(document.id);
      setMessage('');
      await employeeDeleteDocumentApi({ documentId: document.id });
      setMessage('Document deleted successfully.');
      await loadDocuments({ refresh: true });
    } catch (deleteError) {
      setMessage(deleteError.message || 'Unable to delete document.');
    } finally {
      setDeleteId(null);
    }
  }, [loadDocuments]);

  const handleDelete = useCallback((document) => {
    Alert.alert(
      'Delete document',
      `Delete ${document.file_name || 'this document'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteDocument(document), style: 'destructive' },
      ]
    );
  }, [deleteDocument]);

  const documentData = documentResponse?.data?.data || {};
  const employee = documentData.employee || {};
  const documents = documentData.documents || [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDocuments({ refresh: true })}
          tintColor="#2664b4"
        />
      }
      contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16, paddingTop: 10 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#ffffff' }}
    >
      <View style={{ backgroundColor: '#2664b4', borderRadius: 8, padding: 16 }}>
        <Text style={{ color: '#FCE3C1', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }}>
          EMPLOYEE DOCUMENTS
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginTop: 7 }}>
          {formatValue(employee.emp_name, 'Employee')}
        </Text>
        <Text style={{ color: '#D8E7FA', fontSize: 13, fontWeight: '800', marginTop: 4 }}>
          {formatValue(employee.emp_code, '')}
        </Text>
      </View>

      <View style={{
        backgroundColor: '#F4F8FD',
        borderColor: '#D2E1F4',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 4,
        marginTop: 14,
        padding: 3,
      }}>
        <Pressable
          accessibilityRole="button"
          style={{
            alignItems: 'center',
            backgroundColor: activeTab === 'list' ? '#f08c3c' : 'transparent',
            borderRadius: 6,
            flex: 1,
            paddingVertical: 12,
          }}
          onPress={() => setActiveTab('list')}
        >
          <Text style={{
            color: activeTab === 'list' ? '#ffffff' : '#2664b4',
            fontSize: 13,
            fontWeight: '900',
          }}>
            Document List
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={{
            alignItems: 'center',
            backgroundColor: activeTab === 'upload' ? '#f08c3c' : 'transparent',
            borderRadius: 6,
            flex: 1,
            paddingVertical: 12,
          }}
          onPress={() => setActiveTab('upload')}
        >
          <Text style={{
            color: activeTab === 'upload' ? '#ffffff' : '#2664b4',
            fontSize: 13,
            fontWeight: '900',
          }}>
            Upload Documents
          </Text>
        </Pressable>
      </View>

      {activeTab === 'upload' ? (
        <UploadDocuments
          embedded
          navigate={navigate}
          onUploaded={async () => {
            await loadDocuments({ refresh: true });
            setActiveTab('list');
          }}
        />
      ) : (
        <>
      {loading && (
        <View style={{
          alignItems: 'center',
          borderColor: '#D2E1F4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 14,
        }}>
          <ActivityIndicator color="#2664b4" />
          <Text style={{ color: '#667085', fontSize: 13, fontWeight: '700', marginTop: 8 }}>
            Loading documents...
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
            Documents API error
          </Text>
          <Text style={{ color: '#c92a2a', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
            {error}
          </Text>
        </View>
      )}

      {!!message && (
        <View style={{
          backgroundColor: '#F4F8FD',
          borderColor: '#D2E1F4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 12,
          padding: 12,
        }}>
          <Text style={{ color: '#113A70', fontSize: 13, fontWeight: '800' }}>
            {message}
          </Text>
        </View>
      )}

      <View style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 18,
      }}>
        <Text style={{ color: '#2664b4', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 }}>
          DOCUMENT LIST
        </Text>
        <Text style={{ color: '#f5a623', fontSize: 12, fontWeight: '900' }}>
          {documents.length} Records
        </Text>
      </View>

      {documents.length ? (
        documents.map((document) => (
          <View
            key={document.id}
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#D2E1F4',
              borderRadius: 8,
              borderWidth: 1,
              marginBottom: 10,
              padding: 14,
            }}
          >
            <Text style={{ color: '#113A70', fontSize: 15, fontWeight: '900' }}>
              {formatValue(document.document_type, 'Document')}
            </Text>
            <Text style={{ color: '#4A6078', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
              {formatValue(document.file_name)}
            </Text>
            <Text style={{ color: '#7B8EA6', fontSize: 12, fontWeight: '700', marginTop: 6 }}>
              Uploaded: {formatValue(document.uploaded_at || document.created_on)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                accessibilityRole="button"
                disabled={downloadId === document.id}
                style={{
                  alignItems: 'center',
                  backgroundColor: '#2664b4',
                  borderRadius: 8,
                  flex: 1,
                  opacity: downloadId === document.id ? 0.65 : 1,
                  paddingVertical: 10,
                }}
                onPress={() => handleDownload(document)}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>
                  {downloadId === document.id ? 'Downloading...' : 'Download'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={deleteId === document.id}
                style={{
                  alignItems: 'center',
                  backgroundColor: '#fff1f0',
                  borderColor: '#ffd6d4',
                  borderRadius: 8,
                  borderWidth: 1,
                  flex: 1,
                  opacity: deleteId === document.id ? 0.65 : 1,
                  paddingVertical: 10,
                }}
                onPress={() => handleDelete(document)}
              >
                <Text style={{ color: '#b42318', fontSize: 12, fontWeight: '900' }}>
                  {deleteId === document.id ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        !loading && (
          <View style={{
            borderColor: '#D2E1F4',
            borderRadius: 8,
            borderWidth: 1,
            marginTop: 14,
            padding: 14,
          }}>
            <Text style={{ color: '#113A70', fontSize: 15, fontWeight: '900' }}>
              No documents found
            </Text>
            <Text style={{ color: '#6B7F99', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
              Upload a document to see it here.
            </Text>
          </View>
        )
      )}
        </>
      )}
    </ScrollView>
  );
}
