import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { employeeUploadDocumentApi } from '../redux/DocumentSlice';

export default function UploadDocuments({ embedded = false, navigate, onUploaded }) {
  const [documentType, setDocumentType] = useState('Aadhar Card');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const chooseFile = useCallback(async () => {
    try {
      setPicking(true);
      setError('');
      const {
        errorCodes,
        isErrorWithCode,
        pick,
        types,
      } = require('@react-native-documents/picker');
      const [file] = await pick({
        allowMultiSelection: false,
        mode: 'import',
        type: [types.pdf, types.images],
      });

      if (!file?.uri) {
        setError('Please select a file.');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const fileType = file.type || '';

      if (!allowedTypes.includes(fileType)) {
        setError('Only PDF, JPEG, and PNG files are allowed.');
        return;
      }

      setSelectedFile({
        name: file.name || 'document',
        size: file.size || 0,
        type: fileType,
        uri: file.uri,
      });
    } catch (pickError) {
      if (pickError?.code === 'OPERATION_CANCELED') {
        return;
      }

      setError(
        pickError?.message?.includes('RNDocumentPicker')
          ? 'File picker native module is not installed in this app build. Rebuild the Android app once.'
          : 'Unable to open file picker.'
      );
    } finally {
      setPicking(false);
    }
  }, []);

  const getFileLabel = (type) => {
    if (!type) return 'File selected';
    if (type === 'application/pdf') return 'PDF selected';
    if (type === 'image/png') return 'PNG image selected';
    if (type === 'image/jpeg' || type === 'image/jpg') return 'JPEG image selected';
    return 'File selected';
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile?.uri) {
      setError('Please choose a file.');
      setMessage('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await employeeUploadDocumentApi({
        documentType: documentType.trim() || 'Document',
        file: selectedFile,
      });
      setMessage(response?.data?.message || 'Document uploaded successfully.');
      onUploaded?.(response);
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload document.');
    } finally {
      setLoading(false);
    }
  }, [documentType, selectedFile]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16, paddingTop: 10 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#ffffff' }}
    >
      {!embedded && (
        <View style={{ backgroundColor: '#2664b4', borderRadius: 8, padding: 16 }}>
          <Text style={{ color: '#FCE3C1', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }}>
            UPLOAD DOCUMENT
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginTop: 7 }}>
            Upload Document
          </Text>
          <Text style={{ color: '#D8E7FA', fontSize: 13, fontWeight: '800', marginTop: 4 }}>
            POST /employee/documents/upload.php
          </Text>
        </View>
      )}

      <View style={{ marginTop: 18 }}>
        <Text style={{ color: '#113A70', fontSize: 13, fontWeight: '900', marginBottom: 7 }}>
          Document Type
        </Text>
        <TextInput
          value={documentType}
          onChangeText={setDocumentType}
          placeholder="Aadhar Card"
          placeholderTextColor="#98A2B3"
          style={{
            borderColor: '#D2E1F4',
            borderRadius: 8,
            borderWidth: 1,
            color: '#101828',
            fontSize: 14,
            fontWeight: '700',
            paddingHorizontal: 12,
            paddingVertical: 11,
          }}
        />
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ color: '#113A70', fontSize: 13, fontWeight: '900', marginBottom: 7 }}>
          File <Text style={{ color: '#6B7F99', fontWeight: '600' }}>(PDF, JPEG, PNG)</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={picking}
          style={{
            alignItems: 'center',
            backgroundColor: '#F4F8FD',
            borderColor: '#D2E1F4',
            borderRadius: 8,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 14,
          }}
          onPress={chooseFile}
        >
          <Text style={{ color: '#2664b4', fontSize: 14, fontWeight: '900' }}>
            {picking ? 'Opening Files...' : 'Choose File'}
          </Text>
        </Pressable>

        <Text style={{ color: '#98A2B3', fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center' }}>
          Supported formats: PDF · JPEG · PNG
        </Text>

        {!!selectedFile && (
          <View style={{
            backgroundColor: '#ffffff',
            borderColor: '#D2E1F4',
            borderRadius: 8,
            borderWidth: 1,
            marginTop: 10,
            padding: 12,
          }}>
            <Text style={{ color: '#113A70', fontSize: 14, fontWeight: '900' }}>
              {selectedFile.name}
            </Text>
            <Text style={{ color: '#6B7F99', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
              {getFileLabel(selectedFile.type)}
            </Text>
          </View>
        )}
      </View>

      {!!error && (
        <View style={{
          backgroundColor: '#fff1f0',
          borderColor: '#ffd6d4',
          borderRadius: 8,
          borderWidth: 1,
          marginTop: 14,
          padding: 14,
        }}>
          <Text style={{ color: '#b42318', fontSize: 14, fontWeight: '900' }}>
            Upload API error
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
          marginTop: 14,
          padding: 14,
        }}>
          <Text style={{ color: '#113A70', fontSize: 13, fontWeight: '900' }}>
            {message}
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        style={{
          alignItems: 'center',
          backgroundColor: '#f08c3c',
          borderRadius: 8,
          marginTop: 18,
          opacity: loading ? 0.65 : 1,
          paddingVertical: 13,
        }}
        onPress={handleUpload}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '900' }}>
            Upload Document
          </Text>
        )}
      </Pressable>

      {!embedded && (
        <Pressable
          accessibilityRole="button"
          style={{
            alignItems: 'center',
            backgroundColor: '#F4F8FD',
            borderColor: '#D2E1F4',
            borderRadius: 8,
            borderWidth: 1,
            marginTop: 10,
            paddingVertical: 12,
          }}
          onPress={() => navigate('documents')}
        >
          <Text style={{ color: '#2664b4', fontSize: 13, fontWeight: '900' }}>
            Back to Documents
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}