import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { Config } from '../Config';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const DOCUMENT_LIST_API_URL = `${Config.apiBaseUrl}/employee/documents/list.php`;
const DOCUMENT_UPLOAD_API_URL = `${Config.apiBaseUrl}/employee/documents/upload.php`;
const DOCUMENT_DOWNLOAD_API_URL = `${Config.apiBaseUrl}/employee/documents/download.php`;
const DOCUMENT_DELETE_API_URL = `${Config.apiBaseUrl}/employee/documents/delete.php`;

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

const readDownloadedText = async (path) => {
  try {
    return await RNBlobUtil.fs.readFile(path, 'utf8');
  } catch (error) {
    return '';
  }
};

const getDownloadedFileProbe = async (path) => {
  try {
    const [exists, stat, base64Data] = await Promise.all([
      RNBlobUtil.fs.exists(path),
      RNBlobUtil.fs.stat(path),
      RNBlobUtil.fs.readFile(path, 'base64'),
    ]);

    return {
      exists,
      firstBytesBase64: base64Data?.slice(0, 12) || '',
      isPdf: base64Data?.startsWith('JVBER') || false,
      size: Number(stat?.size || 0),
    };
  } catch (error) {
    return {
      error: error?.message || String(error),
      exists: false,
      firstBytesBase64: '',
      isPdf: false,
      size: 0,
    };
  }
};

const getDocumentFileName = (documentId, contentDisposition = '') => {
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] || `document-${documentId || Date.now()}.pdf`;
};

const sanitizeFileName = (fileName) =>
  String(fileName || 'document.pdf').replace(/[\\/:*?"<>|]/g, '_');

const getMimeType = (fileName = '', contentType = '') => {
  if (contentType && !contentType.includes('application/json')) {
    return contentType;
  }

  const normalizedFileName = String(fileName).toLowerCase();

  if (normalizedFileName.endsWith('.png')) {
    return 'image/png';
  }

  if (normalizedFileName.endsWith('.jpg') || normalizedFileName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  return 'application/pdf';
};

const publishDocumentToDownloads = async ({ fileName, filePath, mimeType }) => {
  if (Platform.OS !== 'android') {
    return {
      publicPath: filePath,
      publicUri: filePath,
      visibleInDownloads: false,
    };
  }

  try {
    const publicUri = await RNBlobUtil.MediaCollection.copyToMediaStore(
      {
        mimeType,
        name: fileName,
        parentFolder: '',
      },
      'Download',
      filePath
    );

    console.log('Download Document Published To Downloads:', {
      fileName,
      publicUri,
    });

    return {
      publicPath: 'Downloads',
      publicUri,
      visibleInDownloads: true,
    };
  } catch (error) {
    console.log('Download Document Publish Error:', {
      fileName,
      filePath,
      message: error?.message || String(error),
      stack: error?.stack,
    });

    return {
      publicPath: filePath,
      publicUri: filePath,
      publishError: error?.message || String(error),
      visibleInDownloads: false,
    };
  }
};

const showDocumentDownloadNotification = async ({ fileName, filePath, mimeType }) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.android.addCompleteDownload({
      description: 'Employee document downloaded',
      mime: mimeType,
      path: filePath,
      showNotification: true,
      title: fileName,
    });

    console.log('Download Document Notification Added:', {
      fileName,
      filePath,
    });

    return true;
  } catch (error) {
    console.log('Download Document Notification Error:', {
      fileName,
      filePath,
      message: error?.message || String(error),
      stack: error?.stack,
    });

    return false;
  }
};

const deleteTempDocumentFile = async (filePath) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.fs.unlink(filePath);
    console.log('Download Document Temp File Deleted:', filePath);
    return true;
  } catch (error) {
    console.log('Download Document Temp Delete Error:', {
      filePath,
      message: error?.message || String(error),
    });
    return false;
  }
};

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

  const uploadUri = file.fileCopyUri || file.localCopyUri || file.uri;
  const body = new FormData();
  body.append('document_type', documentType || 'Document');
  body.append('document', {
    name: file.name || 'document.pdf',
    type: file.type || 'application/pdf',
    uri: uploadUri,
  });
  const headers = buildBlobAuthHeaders(token);

  console.log('Upload Document Request:', {
    body: {
      document: file.name || file.uri,
      document_type: documentType || 'Document',
    },
    headers,
    method: 'POST',
    url: DOCUMENT_UPLOAD_API_URL,
  });

  const response = await fetch(DOCUMENT_UPLOAD_API_URL, {
    body,
    headers,
    method: 'POST',
  });
  const responseText = await response.text();
  let data = responseText;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (parseError) {
    data = responseText;
  }

  const fullResponse = {
    config: {
      body: {
        document_type: documentType || 'Document',
        document: file.name || file.uri,
      },
      headers,
      method: 'POST',
    },
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
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
  const headers = buildAuthHeaders(
    token,
    'application/pdf, image/jpeg, image/png, application/json'
  );
  const tempDir =
    Platform.OS === 'android'
      ? RNBlobUtil.fs.dirs.CacheDir
      : RNBlobUtil.fs.dirs.DocumentDir;
  const fallbackFileName = fileName || `document-${documentId || Date.now()}.pdf`;
  const safeFileName = sanitizeFileName(fallbackFileName);
  const filePath = `${tempDir}/${safeFileName}`;
  const config = {
    appendExt: safeFileName.split('.').pop() || 'pdf',
    fileCache: true,
    path: filePath,
  };

  console.log('Download Document Request:', {
    documentId,
    headers,
    method: 'GET',
    saveConfig: config,
    url,
  });

  let response;

  try {
    response = await RNBlobUtil.config(config).fetch('GET', url, headers);
  } catch (error) {
    console.log('Download Document Fetch Error:', {
      documentId,
      message: error?.message,
      response: error?.response,
      stack: error?.stack,
      url,
    });
    throw error;
  }

  const responseInfo = response.info();
  const responseHeaders = normalizeBlobHeaders(responseInfo.headers);
  const contentType = responseHeaders['content-type'] || '';
  const contentDisposition = responseHeaders['content-disposition'] || '';
  const status = Number(responseInfo.status || 0);
  const downloadedFileName = sanitizeFileName(
    getDocumentFileName(documentId, contentDisposition) || safeFileName
  );
  const mimeType = getMimeType(downloadedFileName, contentType);
  const fileProbe = await getDownloadedFileProbe(response.path());
  const isJsonResponse = contentType.includes('application/json');
  const isFileResponse = !isJsonResponse && fileProbe.exists && fileProbe.size > 0;
  const errorText = isJsonResponse || !isFileResponse ? await readDownloadedText(response.path()) : '';
  const errorData = isJsonResponse ? await parseDownloadedError(response.path()) : null;
  const publishResult = isFileResponse
    ? await publishDocumentToDownloads({
        fileName: downloadedFileName,
        filePath: response.path(),
        mimeType,
      })
    : null;
  const notificationShown = publishResult?.visibleInDownloads
    ? await showDocumentDownloadNotification({
        fileName: downloadedFileName,
        filePath: publishResult.publicUri,
        mimeType,
      })
    : false;
  const tempDeleted = publishResult?.visibleInDownloads
    ? await deleteTempDocumentFile(response.path())
    : false;
  const data = {
    fileName: downloadedFileName,
    filePath: publishResult?.publicPath || response.path(),
    id: documentId,
    isFile: isFileResponse,
    mimeType,
    notificationShown,
    publicUri: publishResult?.publicUri || response.path(),
    size: fileProbe.size,
    tempDeleted,
    tempFilePath: response.path(),
    visibleInDownloads: publishResult?.visibleInDownloads || false,
  };
  const fullResponse = {
    config: {
      headers,
      method: 'GET',
      saveConfig: config,
    },
    data: errorData || data,
    headers: responseInfo.headers || {},
    ok: (status >= 200 && status < 300 && isFileResponse) || (status === 0 && isFileResponse),
    status,
    statusText: '',
    url,
  };

  console.log('Download Document Raw Response Info:', responseInfo);
  console.log('Download Document File Probe:', fileProbe);
  if (errorText) {
    console.log('Download Document Non-File Body:', errorText);
  }
  console.log('Download Document Full Response:', fullResponse);

  if (!fullResponse.ok || isApiFailure(errorData)) {
    const error = new Error(errorData?.message || 'Document download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (!isFileResponse) {
    const error = new Error('Document API did not return a file.');
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
