import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const PAYROLL_LIST_API_URL = 'https://api.apphrms.com/employee/payroll/list.php';
const PAYROLL_DETAILS_API_URL = 'https://api.apphrms.com/employee/payroll/details.php';
const DOWNLOAD_PAYSLIP_API_URL =
  'https://api.apphrms.com/employee/payroll/download-payslip.php';

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
  const fileName = `payslip-${month || 'salary'}.pdf`;
  const downloadDir =
    Platform.OS === 'android'
      ? RNBlobUtil.fs.dirs.DownloadDir
      : RNBlobUtil.fs.dirs.DocumentDir;
  const filePath = `${downloadDir}/${fileName}`;
  const config =
    Platform.OS === 'android'
      ? {
          addAndroidDownloads: {
            description: 'Employee payslip PDF',
            mediaScannable: true,
            mime: 'application/pdf',
            notification: true,
            path: filePath,
            title: fileName,
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
  const status = Number(responseInfo.status || 0);
  const isJsonResponse = contentType.includes('application/json');
  const errorData = isJsonResponse ? await parseDownloadedError(response.path()) : null;
  const data = {
    fileName,
    filePath: response.path(),
    month,
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
