import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const DOCUMENT_LIST_API_URL = 'https://api.apphrms.com/employee/documents/list.php';
const DOCUMENT_UPLOAD_API_URL = 'https://api.apphrms.com/employee/documents/upload.php';
const DOCUMENT_DOWNLOAD_API_URL = 'https://api.apphrms.com/employee/documents/download.php';
const DOCUMENT_DELETE_API_URL = 'https://api.apphrms.com/employee/documents/delete.php';

let latestDocumentListResponse = null;
let latestUploadDocumentResponse = null;
let latestDownloadDocumentResponse = null;
let latestDeleteDocumentResponse = null;

const getResponseHeaders = (headers) => {
  if (!headers) {
    return {};
  }

  if (typeof headers.map === 'object') {
    return headers.map;
  }

  if (typeof headers.forEach === 'function') {
    const headerMap = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    return headerMap;
  }

  return {};
};

const parseResponse = async (response) => {
  const responseText = await response.text();

  try {
    return responseText ? JSON.parse(responseText) : null;
  } catch (parseError) {
    return responseText;
  }
};

const isApiFailure = (data) =>
  data?.status === false ||
  data?.success === false ||
  data?.status === 'false' ||
  data?.success === 'false';

const buildAuthHeaders = (token = getCurrentAuthToken(), accept = 'application/json') => ({
  Accept: accept,
  'X-Client-Code': CLIENT_CODE,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const buildBlobAuthHeaders = (token = getCurrentAuthToken(), accept = 'application/json') => ({
  Accept: accept,
  'X-Client-Code': CLIENT_CODE,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const buildFullResponse = ({ config, data, response, url }) => ({
  config,
  data,
  headers: getResponseHeaders(response.headers),
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  url: response.url || url,
});

const throwIfDocumentError = ({ data, fullResponse, message, response }) => {
  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || message);
    error.response = fullResponse;
    throw error;
  }
};

const normalizeBlobHeaders = (headers = {}) => {
  const normalizedHeaders = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalizedHeaders[key.toLowerCase()] = value;
  });
  return normalizedHeaders;
};

const parseDownloadedError = async (path) => {
  try {
    const fileText = await RNBlobUtil.fs.readFile(path, 'utf8');
    return fileText ? JSON.parse(fileText) : null;
  } catch (error) {
    return null;
  }
};

const getDocumentFileName = (documentId, contentDisposition = '') => {
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] || `document-${documentId || Date.now()}.pdf`;
};

const sanitizeFileName = (fileName) =>
  String(fileName || 'document.pdf').replace(/[\\/:*?"<>|]/g, '_');

export const getCurrentDocumentListResponse = () => latestDocumentListResponse;
export const getCurrentUploadDocumentResponse = () => latestUploadDocumentResponse;
export const getCurrentDownloadDocumentResponse = () => latestDownloadDocumentResponse;
export const getCurrentDeleteDocumentResponse = () => latestDeleteDocumentResponse;

export const employeeDocumentListApi = async ({ token } = {}) => {
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(DOCUMENT_LIST_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config,
    data,
    response,
    url: DOCUMENT_LIST_API_URL,
  });

  console.log('Document List Full Response:', fullResponse);

  throwIfDocumentError({
    data,
    fullResponse,
    message: 'Document list fetch failed.',
    response,
  });

  latestDocumentListResponse = fullResponse;
  return fullResponse;
};

export const employeeUploadDocumentApi = async ({
  documentType,
  file,
  token,
} = {}) => {
  if (!file?.uri) {
    throw new Error('Document file is required.');
  }

  const fileUri = file.fileCopyUri || file.localCopyUri || file.uri;
  const filePath = decodeURIComponent(fileUri.replace('file://', ''));
  const uploadFile = {
    filename: file.name || 'document.pdf',
    name: 'document_file',
    type: file.type || 'application/pdf',
    data: RNBlobUtil.wrap(filePath),
  };
  const body = [
    {
      name: 'document_type',
      data: documentType || 'Document',
    },
    uploadFile,
  ];
  const headers = buildBlobAuthHeaders(token);

  const response = await RNBlobUtil.fetch('POST', DOCUMENT_UPLOAD_API_URL, headers, body);
  const responseInfo = response.info();
  const responseText = await response.text();
  let data = responseText;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (parseError) {
    data = responseText;
  }

  const status = Number(responseInfo.status || 0);
  const fullResponse = {
    config: {
      body: {
        document_type: documentType || 'Document',
        document_file: file.name || file.uri,
      },
      headers,
      method: 'POST',
    },
    data,
    headers: responseInfo.headers || {},
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    url: DOCUMENT_UPLOAD_API_URL,
  };

  console.log('Upload Document Full Response:', fullResponse);

  throwIfDocumentError({
    data,
    fullResponse,
    message: 'Document upload failed.',
    response: fullResponse,
  });

  latestUploadDocumentResponse = fullResponse;
  return fullResponse;
};

export const employeeDownloadDocumentApi = async ({
  documentId,
  downloadUrl,
  fileName,
  token,
} = {}) => {
  const url =
    downloadUrl || `${DOCUMENT_DOWNLOAD_API_URL}?id=${encodeURIComponent(documentId || '')}`;
  const headers = buildAuthHeaders(token, 'application/pdf, application/json');
  const downloadDir =
    Platform.OS === 'android'
      ? RNBlobUtil.fs.dirs.DownloadDir
      : RNBlobUtil.fs.dirs.DocumentDir;
  const fallbackFileName = fileName || `document-${documentId || Date.now()}.pdf`;
  const safeFileName = sanitizeFileName(fallbackFileName);
  const filePath = `${downloadDir}/${safeFileName}`;
  const config =
    Platform.OS === 'android'
      ? {
          addAndroidDownloads: {
            description: 'Employee document PDF',
            mediaScannable: true,
            mime: 'application/pdf',
            notification: true,
            path: filePath,
            title: safeFileName,
            useDownloadManager: true,
          },
          fileCache: true,
          path: filePath,
        }
      : {
          fileCache: true,
          path: filePath,
        };

  const response = await RNBlobUtil.config(config).fetch('GET', url, headers);
  const responseInfo = response.info();
  const responseHeaders = normalizeBlobHeaders(responseInfo.headers);
  const contentType = responseHeaders['content-type'] || '';
  const contentDisposition = responseHeaders['content-disposition'] || '';
  const status = Number(responseInfo.status || 0);
  const isJsonResponse = contentType.includes('application/json');
  const errorData = isJsonResponse ? await parseDownloadedError(response.path()) : null;
  const data = {
    fileName: getDocumentFileName(documentId, contentDisposition),
    filePath: response.path(),
    id: documentId,
  };
  const fullResponse = {
    config: {
      headers,
      method: 'GET',
      saveConfig: config,
    },
    data: errorData || data,
    headers: responseInfo.headers || {},
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    url,
  };

  console.log('Download Document Full Response:', fullResponse);

  if (!fullResponse.ok || isApiFailure(errorData)) {
    const error = new Error(errorData?.message || 'Document download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (Platform.OS === 'ios') {
    RNBlobUtil.ios.openDocument(response.path());
  }

  latestDownloadDocumentResponse = fullResponse;
  return fullResponse;
};

export const employeeDeleteDocumentApi = async ({ documentId, token } = {}) => {
  const requestBody = {
    document_id: documentId,
    id: documentId,
  };
  const url = `${DOCUMENT_DELETE_API_URL}?id=${encodeURIComponent(documentId || '')}`;
  const jsonConfig = {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  const buildDeleteResponse = async (response, config, responseUrl) => {
    const data = await parseResponse(response);
    return buildFullResponse({
      config,
      data,
      response,
      url: responseUrl,
    });
  };

  const jsonResponse = await fetch(url, jsonConfig);
  let fullResponse = await buildDeleteResponse(
    jsonResponse,
    {
      ...jsonConfig,
      body: requestBody,
    },
    url
  );

  if (!jsonResponse.ok || isApiFailure(fullResponse.data)) {
    const formBody = `id=${encodeURIComponent(documentId || '')}&document_id=${encodeURIComponent(
      documentId || ''
    )}`;
    const formConfig = {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(token),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    };
    const formResponse = await fetch(url, formConfig);
    fullResponse = await buildDeleteResponse(
      formResponse,
      {
        ...formConfig,
        body: requestBody,
      },
      url
    );
  }

  console.log('Delete Document Full Response:', fullResponse);

  throwIfDocumentError({
    data: fullResponse.data,
    fullResponse,
    message: 'Document delete failed.',
    response: fullResponse,
  });

  latestDeleteDocumentResponse = fullResponse;
  return fullResponse;
};

export const employeeDocumentListThunk = createAsyncThunk(
  'employeeDocuments/employeeDocumentListThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeeDocumentListApi(payload);
    } catch (error) {
      console.log('Document List Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeUploadDocumentThunk = createAsyncThunk(
  'employeeDocuments/employeeUploadDocumentThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeeUploadDocumentApi(payload);
    } catch (error) {
      console.log('Upload Document Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeDownloadDocumentThunk = createAsyncThunk(
  'employeeDocuments/employeeDownloadDocumentThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeeDownloadDocumentApi(payload);
    } catch (error) {
      console.log('Download Document Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeDeleteDocumentThunk = createAsyncThunk(
  'employeeDocuments/employeeDeleteDocumentThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeeDeleteDocumentApi(payload);
    } catch (error) {
      console.log('Delete Document Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const documentSlice = createSlice({
  name: 'employeeDocuments',
  initialState: {
    employee: null,
    documents: [],
    listFullResponse: null,
    uploadFullResponse: null,
    downloadFullResponse: null,
    deleteFullResponse: null,
    listLoading: false,
    uploadLoading: false,
    downloadLoading: false,
    deleteLoading: false,
    listError: '',
    uploadError: '',
    downloadError: '',
    deleteError: '',
  },
  reducers: {
    clearEmployeeDocumentData(state) {
      state.employee = null;
      state.documents = [];
      state.listFullResponse = null;
      state.uploadFullResponse = null;
      state.downloadFullResponse = null;
      state.deleteFullResponse = null;
      state.listLoading = false;
      state.uploadLoading = false;
      state.downloadLoading = false;
      state.deleteLoading = false;
      state.listError = '';
      state.uploadError = '';
      state.downloadError = '';
      state.deleteError = '';
      latestDocumentListResponse = null;
      latestUploadDocumentResponse = null;
      latestDownloadDocumentResponse = null;
      latestDeleteDocumentResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeDocumentListThunk.pending, (state) => {
        state.listLoading = true;
        state.listError = '';
      })
      .addCase(employeeDocumentListThunk.fulfilled, (state, action) => {
        const documentData = action.payload?.data?.data || {};
        state.listLoading = false;
        state.listFullResponse = action.payload;
        state.employee = documentData.employee || null;
        state.documents = documentData.documents || [];
      })
      .addCase(employeeDocumentListThunk.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || 'Document list fetch failed.';
      })
      .addCase(employeeUploadDocumentThunk.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = '';
      })
      .addCase(employeeUploadDocumentThunk.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadFullResponse = action.payload;
      })
      .addCase(employeeUploadDocumentThunk.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload || 'Document upload failed.';
      })
      .addCase(employeeDownloadDocumentThunk.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = '';
      })
      .addCase(employeeDownloadDocumentThunk.fulfilled, (state, action) => {
        state.downloadLoading = false;
        state.downloadFullResponse = action.payload;
      })
      .addCase(employeeDownloadDocumentThunk.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload || 'Document download failed.';
      })
      .addCase(employeeDeleteDocumentThunk.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = '';
      })
      .addCase(employeeDeleteDocumentThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteFullResponse = action.payload;
      })
      .addCase(employeeDeleteDocumentThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || 'Document delete failed.';
      });
  },
});

export const { clearEmployeeDocumentData } = documentSlice.actions;
export default documentSlice.reducer;
