import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Platform} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import {Config} from '../Config';
import {CLIENT_CODE, getCurrentAuthToken} from './loginSlice';

const ADMIN_TAX_BASE_URL = `${Config.apiBaseUrl}/admin/tax`;
const ADMIN_TAX_FINANCIAL_YEARS_API_URL = `${ADMIN_TAX_BASE_URL}/financial-years.php`;
const ADMIN_TAX_SUBMISSIONS_API_URL = `${ADMIN_TAX_BASE_URL}/submissions.php`;
const ADMIN_TAX_EMPLOYEE_API_URL = `${ADMIN_TAX_BASE_URL}/employee.php`;
const ADMIN_TAX_ACTION_API_URL = `${ADMIN_TAX_BASE_URL}/action.php`;
const ADMIN_TAX_DOWNLOAD_PDF_API_URL = `${ADMIN_TAX_BASE_URL}/download-pdf.php`;
const ADMIN_TAX_PREVIEW_URL_API_URL = `${ADMIN_TAX_BASE_URL}/preview-url.php`;

let latestAdminTaxFinancialYearsResponse = null;
let latestAdminTaxSubmissionsResponse = null;
let latestAdminTaxSubmittedResponse = null;
let latestAdminTaxEmployeeResponse = null;
let latestAdminTaxApproveHraResponse = null;
let latestAdminTaxRejectHraResponse = null;
let latestAdminTaxApproveDeclarationResponse = null;
let latestAdminTaxRejectDeclarationResponse = null;
let latestAdminTaxDownloadPdfResponse = null;
let latestAdminTaxPreviewUrlResponse = null;

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
  const contentType = response.headers?.get?.('content-type') || '';

  if (
    contentType.includes('application/json') ||
    contentType.includes('text/') ||
    contentType === ''
  ) {
    const responseText = await response.text();
    try {
      return responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      return responseText;
    }
  }

  return null;
};

const isApiFailure = (data) =>
  data?.status === false ||
  data?.success === false ||
  data?.status === 'false' ||
  data?.success === 'false';

const buildAuthHeaders = (token) => ({
  Accept: 'application/json',
  'X-Client-Code': CLIENT_CODE,
  ...(token ? {Authorization: `Bearer ${token}`} : {}),
});

const buildFullResponse = ({config, data, response, url}) => ({
  config,
  data,
  headers: getResponseHeaders(response.headers),
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  url: response.url || url,
});

const normalizeBlobHeaders = (headers = {}) => {
  const normalizedHeaders = {};
  Object.entries(headers || {}).forEach(([key, value]) => {
    normalizedHeaders[String(key).toLowerCase()] = value;
  });
  return normalizedHeaders;
};

const readDownloadedText = async (path) => {
  try {
    return await RNBlobUtil.fs.readFile(path, 'utf8');
  } catch (error) {
    return '';
  }
};

const parseDownloadedError = async (path) => {
  try {
    const fileText = await RNBlobUtil.fs.readFile(path, 'utf8');
    return fileText ? JSON.parse(fileText) : null;
  } catch (error) {
    return null;
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
      exists: false,
      firstBytesBase64: '',
      isPdf: false,
      size: 0,
    };
  }
};

const sanitizeFileName = (fileName) =>
  String(fileName || 'admin-tax.pdf').replace(/[\\/:*?"<>|]/g, '_');

const getTaxPdfFileName = ({emp_code, financial_year}) =>
  sanitizeFileName(`admin-tax-${emp_code || 'employee'}-${financial_year || 'year'}.pdf`);

const publishTaxPdfToDownloads = async ({fileName, filePath}) => {
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
      filePath,
    );

    console.log('Admin Tax PDF Published To Downloads:', {
      fileName,
      publicUri,
    });

    return {
      publicPath: 'Downloads',
      publicUri,
      visibleInDownloads: true,
    };
  } catch (error) {
    console.log('Admin Tax PDF Publish Error:', {
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

const showTaxPdfDownloadNotification = async ({fileName, filePath}) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.android.addCompleteDownload({
      description: 'Admin tax PDF downloaded',
      mime: 'application/pdf',
      path: filePath,
      showNotification: true,
      title: fileName,
    });

    console.log('Admin Tax PDF Download Notification Added:', {
      fileName,
      filePath,
    });

    return true;
  } catch (error) {
    console.log('Admin Tax PDF Download Notification Error:', {
      fileName,
      filePath,
      message: error?.message || String(error),
      stack: error?.stack,
    });

    return false;
  }
};

const deleteTempTaxPdfFile = async (filePath) => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await RNBlobUtil.fs.unlink(filePath);
    console.log('Admin Tax PDF Temp File Deleted:', filePath);
    return true;
  } catch (error) {
    console.log('Admin Tax PDF Temp Delete Error:', {
      filePath,
      message: error?.message || String(error),
    });
    return false;
  }
};

const buildUrl = (baseUrl, paramsObject = {}) => {
  const params = new URLSearchParams();

  Object.entries(paramsObject).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

const requestJson = async ({config, errorMessage, logConfig, logLabel, url}) => {
  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: logConfig || config,
    data,
    response,
    url,
  });

  console.log(`${logLabel} Full Response:`, fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || errorMessage);
    error.response = fullResponse;
    console.log(`${logLabel} Error:`, error);
    throw error;
  }

  return fullResponse;
};

export const adminTaxFinancialYearsApi = async ({
  token = getCurrentAuthToken(),
} = {}) => {
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const fullResponse = await requestJson({
    config,
    errorMessage: 'Admin tax financial years fetch failed.',
    logLabel: 'Admin Tax Financial Years',
    url: ADMIN_TAX_FINANCIAL_YEARS_API_URL,
  });

  latestAdminTaxFinancialYearsResponse = fullResponse;
  return fullResponse;
};

export const adminTaxSubmissionsApi = async ({
  financial_year,
  limit = 20,
  page = 1,
  search = '',
  status = 'all',
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildUrl(ADMIN_TAX_SUBMISSIONS_API_URL, {
    financial_year,
    status: status && status !== 'all' ? status : '',
    search,
    page,
    limit,
  });
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const fullResponse = await requestJson({
    config,
    errorMessage: 'Admin tax submissions fetch failed.',
    logLabel:
      status === 'submitted'
        ? 'Admin Tax Submissions Submitted'
        : 'Admin Tax Submissions List',
    url,
  });

  latestAdminTaxSubmissionsResponse = fullResponse;
  if (status === 'submitted') {
    latestAdminTaxSubmittedResponse = fullResponse;
  }
  return fullResponse;
};

export const adminTaxEmployeeDetailsApi = async ({
  emp_code,
  financial_year,
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildUrl(ADMIN_TAX_EMPLOYEE_API_URL, {
    financial_year,
    emp_code,
  });
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const fullResponse = await requestJson({
    config,
    errorMessage: 'Admin employee tax details fetch failed.',
    logLabel: 'Admin Employee Tax Details',
    url,
  });

  latestAdminTaxEmployeeResponse = fullResponse;
  return fullResponse;
};

export const adminTaxActionApi = async ({
  action = 'approve',
  eligible_amount,
  emp_code,
  financial_year,
  id,
  item_type = 'hra',
  reject_reason = '',
  section_key = '',
  token = getCurrentAuthToken(),
} = {}) => {
  const normalizedAction = action === 'reject' ? 'reject' : 'approve';
  const normalizedStatus = normalizedAction === 'reject' ? 'rejected' : 'approved';
  const normalizedItemType = item_type === 'declaration' ? 'declaration' : 'hra';
  const requestBody = {
    id,
    item_type: normalizedItemType,
    action: normalizedAction,
    ...(eligible_amount !== null && eligible_amount !== undefined && eligible_amount !== ''
      ? {eligible_amount: Number(eligible_amount) || eligible_amount}
      : {}),
    ...(normalizedAction === 'reject' ? {reject_reason} : {}),
    ...(emp_code ? {emp_code} : {}),
    ...(financial_year ? {financial_year} : {}),
    ...(section_key ? {section_key} : {}),
  };
  const logBody = {
    action: normalizedAction,
    eligible_amount,
    emp_code,
    financial_year,
    id,
    item_type: normalizedItemType,
    reject_reason,
    section_key,
    status: normalizedStatus,
  };
  const config = {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };
  const logLabel = `Admin ${
    normalizedAction === 'reject' ? 'Reject' : 'Approve'
  } ${normalizedItemType === 'declaration' ? 'Declaration' : 'HRA'}`;

  const fullResponse = await requestJson({
    config,
    errorMessage: `${logLabel} failed.`,
    logConfig: {...config, body: logBody},
    logLabel,
    url: ADMIN_TAX_ACTION_API_URL,
  });

  if (normalizedItemType === 'declaration' && normalizedAction === 'reject') {
    latestAdminTaxRejectDeclarationResponse = fullResponse;
  } else if (normalizedItemType === 'declaration') {
    latestAdminTaxApproveDeclarationResponse = fullResponse;
  } else if (normalizedAction === 'reject') {
    latestAdminTaxRejectHraResponse = fullResponse;
  } else {
    latestAdminTaxApproveHraResponse = fullResponse;
  }

  return fullResponse;
};

export const adminTaxDownloadPdfApi = async ({
  emp_code,
  financial_year,
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildUrl(ADMIN_TAX_DOWNLOAD_PDF_API_URL, {
    financial_year,
    emp_code,
  });
  const headers = {
    ...buildAuthHeaders(token),
    Accept: 'application/pdf,application/json',
  };
  const fileName = getTaxPdfFileName({emp_code, financial_year});
  const tempDir =
    Platform.OS === 'android'
      ? RNBlobUtil.fs.dirs.CacheDir
      : RNBlobUtil.fs.dirs.DocumentDir;
  const filePath = `${tempDir}/${fileName}`;
  const saveConfig = {
    appendExt: 'pdf',
    fileCache: true,
    path: filePath,
  };

  console.log('Admin Direct Tax PDF Download Request:', {
    headers,
    method: 'GET',
    saveConfig,
    url,
  });

  let response;

  try {
    response = await RNBlobUtil.config(saveConfig).fetch('GET', url, headers);
  } catch (error) {
    console.log('Admin Direct Tax PDF Download Fetch Error:', {
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
  const fileProbe = await getDownloadedFileProbe(response.path());
  const headerLooksLikePdf =
    contentType.includes('application/pdf') || contentDisposition.includes('.pdf');
  const isPdfResponse = fileProbe.isPdf || headerLooksLikePdf;
  const isJsonResponse = contentType.includes('application/json') && !isPdfResponse;
  const errorText = isJsonResponse || !isPdfResponse ? await readDownloadedText(response.path()) : '';
  const errorData = isJsonResponse ? await parseDownloadedError(response.path()) : null;
  const publishResult = isPdfResponse
    ? await publishTaxPdfToDownloads({fileName, filePath: response.path()})
    : null;
  const notificationShown = publishResult?.visibleInDownloads
    ? await showTaxPdfDownloadNotification({
        fileName,
        filePath: publishResult.publicUri,
      })
    : false;
  const tempDeleted = publishResult?.visibleInDownloads
    ? await deleteTempTaxPdfFile(response.path())
    : false;
  const data = {
    fileName,
    filePath: publishResult?.publicPath || response.path(),
    isPdf: isPdfResponse,
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
      saveConfig,
    },
    data: errorData || data,
    headers: responseHeaders,
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    url,
  };

  console.log('Admin Direct Tax PDF Download Raw Response Info:', responseInfo);
  console.log('Admin Direct Tax PDF Download File Probe:', fileProbe);
  if (errorText) {
    console.log('Admin Direct Tax PDF Download Non-PDF Body:', errorText);
  }
  console.log('Admin Direct Tax PDF Download Full Response:', fullResponse);

  if (!fullResponse.ok || isApiFailure(errorData)) {
    const error = new Error(errorData?.message || 'Admin direct tax PDF download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (isJsonResponse) {
    const error = new Error(errorData?.message || 'Admin direct tax PDF download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (!isPdfResponse) {
    const error = new Error('Admin direct tax PDF API did not return a PDF file.');
    error.response = fullResponse;
    throw error;
  }

  if (Platform.OS === 'ios') {
    RNBlobUtil.ios.openDocument(response.path());
  }

  latestAdminTaxDownloadPdfResponse = fullResponse;
  return fullResponse;
};

export const adminTaxPreviewUrlApi = async ({
  emp_code,
  financial_year,
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildUrl(ADMIN_TAX_PREVIEW_URL_API_URL, {
    financial_year,
    emp_code,
  });
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const fullResponse = await requestJson({
    config,
    errorMessage: 'Admin web-style tax preview URL fetch failed.',
    logLabel: 'Admin Web-Style Tax Preview URL',
    url,
  });

  latestAdminTaxPreviewUrlResponse = fullResponse;
  return fullResponse;
};

export const getCurrentAdminTaxFinancialYearsResponse = () =>
  latestAdminTaxFinancialYearsResponse;
export const getCurrentAdminTaxSubmissionsResponse = () =>
  latestAdminTaxSubmissionsResponse;
export const getCurrentAdminTaxSubmittedResponse = () =>
  latestAdminTaxSubmittedResponse;
export const getCurrentAdminTaxEmployeeResponse = () =>
  latestAdminTaxEmployeeResponse;
export const getCurrentAdminTaxApproveHraResponse = () =>
  latestAdminTaxApproveHraResponse;
export const getCurrentAdminTaxRejectHraResponse = () =>
  latestAdminTaxRejectHraResponse;
export const getCurrentAdminTaxApproveDeclarationResponse = () =>
  latestAdminTaxApproveDeclarationResponse;
export const getCurrentAdminTaxRejectDeclarationResponse = () =>
  latestAdminTaxRejectDeclarationResponse;
export const getCurrentAdminTaxDownloadPdfResponse = () =>
  latestAdminTaxDownloadPdfResponse;
export const getCurrentAdminTaxPreviewUrlResponse = () =>
  latestAdminTaxPreviewUrlResponse;

export const adminTaxFinancialYearsThunk = createAsyncThunk(
  'adminTax/adminTaxFinancialYearsThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await adminTaxFinancialYearsApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const adminTaxSubmissionsThunk = createAsyncThunk(
  'adminTax/adminTaxSubmissionsThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await adminTaxSubmissionsApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const adminTaxEmployeeDetailsThunk = createAsyncThunk(
  'adminTax/adminTaxEmployeeDetailsThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await adminTaxEmployeeDetailsApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const adminTaxActionThunk = createAsyncThunk(
  'adminTax/adminTaxActionThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await adminTaxActionApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const adminTaxSlice = createSlice({
  name: 'adminTax',
  initialState: {
    actionFullResponse: null,
    employee: null,
    employeeFullResponse: null,
    error: '',
    financialYears: [],
    financialYearsFullResponse: null,
    loading: false,
    submissions: [],
    submissionsFullResponse: null,
    total: 0,
  },
  reducers: {
    clearAdminTaxData(state) {
      state.actionFullResponse = null;
      state.employee = null;
      state.employeeFullResponse = null;
      state.error = '';
      state.financialYears = [];
      state.financialYearsFullResponse = null;
      state.loading = false;
      state.submissions = [];
      state.submissionsFullResponse = null;
      state.total = 0;
      latestAdminTaxFinancialYearsResponse = null;
      latestAdminTaxSubmissionsResponse = null;
      latestAdminTaxSubmittedResponse = null;
      latestAdminTaxEmployeeResponse = null;
      latestAdminTaxApproveHraResponse = null;
      latestAdminTaxRejectHraResponse = null;
      latestAdminTaxApproveDeclarationResponse = null;
      latestAdminTaxRejectDeclarationResponse = null;
      latestAdminTaxDownloadPdfResponse = null;
      latestAdminTaxPreviewUrlResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminTaxFinancialYearsThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(adminTaxFinancialYearsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.financialYearsFullResponse = action.payload;
        state.financialYears =
          action.payload?.data?.data?.financial_years || [];
      })
      .addCase(adminTaxFinancialYearsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Financial years fetch failed.';
      })
      .addCase(adminTaxSubmissionsThunk.fulfilled, (state, action) => {
        const data = action.payload?.data?.data || {};
        state.submissionsFullResponse = action.payload;
        state.submissions = data.employees || [];
        state.total = data.total || 0;
      })
      .addCase(adminTaxEmployeeDetailsThunk.fulfilled, (state, action) => {
        state.employeeFullResponse = action.payload;
        state.employee = action.payload?.data?.data || null;
      })
      .addCase(adminTaxActionThunk.fulfilled, (state, action) => {
        state.actionFullResponse = action.payload;
      });
  },
});

export const {clearAdminTaxData} = adminTaxSlice.actions;
export default adminTaxSlice.reducer;
