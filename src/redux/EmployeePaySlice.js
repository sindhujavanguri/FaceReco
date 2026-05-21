import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { Config } from '../Config';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const PAYROLL_LIST_API_URL = `${Config.apiBaseUrl}/employee/payroll/list.php`;
const PAYROLL_DETAILS_API_URL = `${Config.apiBaseUrl}/employee/payroll/details.php`;
const DOWNLOAD_PAYSLIP_API_URL =
  `${Config.apiBaseUrl}/employee/payroll/download-payslip.php`;

let latestPayrollListResponse = null;
let latestPayrollDetailsResponse = null;
let latestDownloadPayslipResponse = null;

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

const parseJsonResponse = async (response) => {
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

const buildFullResponse = ({ config, data, response, url }) => ({
  config,
  data,
  headers: getResponseHeaders(response.headers),
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  url: response.url || url,
});

const throwIfPayrollError = ({ data, fullResponse, message, response }) => {
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

const getPayslipFileName = (month) =>
  `payslip-${String(month || 'salary').replace(/[\\/:*?"<>|]/g, '_')}.pdf`;

const publishPayslipToDownloads = async ({ fileName, filePath }) => {
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
        mimeType: 'application/pdf',
        name: fileName,
        parentFolder: '',
      },
      'Download',
      filePath
    );

    console.log('Download Payslip Published To Downloads:', {
      fileName,
      publicUri,
    });

    return {
      publicPath: 'Downloads',
      publicUri,
      visibleInDownloads: true,
    };
  } catch (error) {
    console.log('Download Payslip Publish Error:', {
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

const showPayslipDownloadNotification = async ({ fileName, filePath }) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.android.addCompleteDownload({
      description: 'Employee payslip PDF downloaded',
      mime: 'application/pdf',
      path: filePath,
      showNotification: true,
      title: fileName,
    });

    console.log('Download Payslip Notification Added:', {
      fileName,
      filePath,
    });

    return true;
  } catch (error) {
    console.log('Download Payslip Notification Error:', {
      fileName,
      filePath,
      message: error?.message || String(error),
      stack: error?.stack,
    });

    return false;
  }
};

const deleteTempPayslipFile = async (filePath) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.fs.unlink(filePath);
    console.log('Download Payslip Temp File Deleted:', filePath);
    return true;
  } catch (error) {
    console.log('Download Payslip Temp Delete Error:', {
      filePath,
      message: error?.message || String(error),
    });
    return false;
  }
};

export const getCurrentPayrollListResponse = () => latestPayrollListResponse;
export const getCurrentPayrollDetailsResponse = () => latestPayrollDetailsResponse;
export const getCurrentDownloadPayslipResponse = () => latestDownloadPayslipResponse;

export const employeePayrollListApi = async ({ token } = {}) => {
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(PAYROLL_LIST_API_URL, config);
  const data = await parseJsonResponse(response);
  const fullResponse = buildFullResponse({
    config,
    data,
    response,
    url: PAYROLL_LIST_API_URL,
  });

  console.log('Payroll List Full Response:', fullResponse);

  throwIfPayrollError({
    data,
    fullResponse,
    message: 'Payroll list fetch failed.',
    response,
  });

  latestPayrollListResponse = fullResponse;
  return fullResponse;
};

export const employeePayrollDetailsApi = async ({ month, token } = {}) => {
  const url = `${PAYROLL_DETAILS_API_URL}?month=${encodeURIComponent(month || '')}`;
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseJsonResponse(response);
  const fullResponse = buildFullResponse({ config, data, response, url });

  console.log('Payroll Details Full Response:', fullResponse);

  throwIfPayrollError({
    data,
    fullResponse,
    message: 'Payroll details fetch failed.',
    response,
  });

  latestPayrollDetailsResponse = fullResponse;
  return fullResponse;
};

export const employeeDownloadPayslipApi = async ({ month, token } = {}) => {
  const url = `${DOWNLOAD_PAYSLIP_API_URL}?month=${encodeURIComponent(month || '')}`;
  const headers = buildAuthHeaders(token, 'application/pdf, application/json');
  const fileName = getPayslipFileName(month);
  const tempDir =
    Platform.OS === 'android'
      ? RNBlobUtil.fs.dirs.CacheDir
      : RNBlobUtil.fs.dirs.DocumentDir;
  const filePath = `${tempDir}/${fileName}`;
  const config = {
    appendExt: 'pdf',
    fileCache: true,
    path: filePath,
  };

  console.log('Download Payslip Request:', {
    headers,
    method: 'GET',
    month,
    saveConfig: config,
    url,
  });

  let response;

  try {
    response = await RNBlobUtil.config(config).fetch('GET', url, headers);
  } catch (error) {
    console.log('Download Payslip Fetch Error:', {
      message: error?.message,
      month,
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
  const fileProbe = await getDownloadedFileProbe(response.path());
  const headerLooksLikePdf =
    contentType.includes('application/pdf') || contentDisposition.includes('.pdf');
  const isPdfResponse = fileProbe.isPdf || headerLooksLikePdf;
  const isJsonResponse = contentType.includes('application/json') && !isPdfResponse;
  const errorText = isJsonResponse || !isPdfResponse ? await readDownloadedText(response.path()) : '';
  const errorData = isJsonResponse ? await parseDownloadedError(response.path()) : null;
  const publishResult = isPdfResponse
    ? await publishPayslipToDownloads({ fileName, filePath: response.path() })
    : null;
  const notificationShown = publishResult?.visibleInDownloads
    ? await showPayslipDownloadNotification({
        fileName,
        filePath: publishResult.publicUri,
      })
    : false;
  const tempDeleted = publishResult?.visibleInDownloads
    ? await deleteTempPayslipFile(response.path())
    : false;
  const data = {
    fileName,
    filePath: publishResult?.publicPath || response.path(),
    isPdf: isPdfResponse,
    month,
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
    ok: (status >= 200 && status < 300 && isPdfResponse) || (status === 0 && isPdfResponse),
    status,
    statusText: '',
    url,
  };

  console.log('Download Payslip Raw Response Info:', responseInfo);
  console.log('Download Payslip File Probe:', fileProbe);
  if (errorText) {
    console.log('Download Payslip Non-PDF Body:', errorText);
  }
  console.log('Download Payslip Full Response:', fullResponse);

  throwIfPayrollError({
    data: errorData,
    fullResponse,
    message: 'Payslip download failed.',
    response: fullResponse,
  });

  if (isJsonResponse) {
    const error = new Error(errorData?.message || 'Payslip download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (!isPdfResponse) {
    const error = new Error('Payslip API did not return a PDF file.');
    error.response = fullResponse;
    throw error;
  }

  if (Platform.OS === 'ios') {
    RNBlobUtil.ios.openDocument(response.path());
  }

  latestDownloadPayslipResponse = fullResponse;
  return fullResponse;
};

export const employeePayrollListThunk = createAsyncThunk(
  'employeePay/employeePayrollListThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeePayrollListApi(payload);
    } catch (error) {
      console.log('Payroll List Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeePayrollDetailsThunk = createAsyncThunk(
  'employeePay/employeePayrollDetailsThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeePayrollDetailsApi(payload);
    } catch (error) {
      console.log('Payroll Details Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeDownloadPayslipThunk = createAsyncThunk(
  'employeePay/employeeDownloadPayslipThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await employeeDownloadPayslipApi(payload);
    } catch (error) {
      console.log('Download Payslip Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const employeePaySlice = createSlice({
  name: 'employeePay',
  initialState: {
    employee: null,
    payslips: [],
    selectedMonth: '',
    payrollListFullResponse: null,
    payrollDetails: null,
    payrollDetailsFullResponse: null,
    downloadPayslipFullResponse: null,
    listLoading: false,
    detailsLoading: false,
    downloadLoading: false,
    listError: '',
    detailsError: '',
    downloadError: '',
  },
  reducers: {
    clearEmployeePayData(state) {
      state.employee = null;
      state.payslips = [];
      state.selectedMonth = '';
      state.payrollListFullResponse = null;
      state.payrollDetails = null;
      state.payrollDetailsFullResponse = null;
      state.downloadPayslipFullResponse = null;
      state.listLoading = false;
      state.detailsLoading = false;
      state.downloadLoading = false;
      state.listError = '';
      state.detailsError = '';
      state.downloadError = '';
      latestPayrollListResponse = null;
      latestPayrollDetailsResponse = null;
      latestDownloadPayslipResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeePayrollListThunk.pending, (state) => {
        state.listLoading = true;
        state.listError = '';
      })
      .addCase(employeePayrollListThunk.fulfilled, (state, action) => {
        const payrollData = action.payload?.data?.data || {};
        state.listLoading = false;
        state.payrollListFullResponse = action.payload;
        state.employee = payrollData.employee || null;
        state.payslips = payrollData.payslips || [];
        state.selectedMonth = payrollData.payslips?.[0]?.month || '';
      })
      .addCase(employeePayrollListThunk.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || 'Payroll list fetch failed.';
      })
      .addCase(employeePayrollDetailsThunk.pending, (state, action) => {
        state.detailsLoading = true;
        state.detailsError = '';
        state.selectedMonth = action.meta.arg?.month || state.selectedMonth;
      })
      .addCase(employeePayrollDetailsThunk.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.payrollDetailsFullResponse = action.payload;
        state.payrollDetails = action.payload?.data?.data || null;
      })
      .addCase(employeePayrollDetailsThunk.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload || 'Payroll details fetch failed.';
      })
      .addCase(employeeDownloadPayslipThunk.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = '';
      })
      .addCase(employeeDownloadPayslipThunk.fulfilled, (state, action) => {
        state.downloadLoading = false;
        state.downloadPayslipFullResponse = action.payload;
      })
      .addCase(employeeDownloadPayslipThunk.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload || 'Payslip download failed.';
      });
  },
});

export const { clearEmployeePayData } = employeePaySlice.actions;
export default employeePaySlice.reducer;
