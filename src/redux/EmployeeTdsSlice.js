import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { Config } from '../Config';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const TAX_BASE_URL = `${Config.apiBaseUrl}/employee/tax`;

export const TAX_API_URLS = {
  financialYears: `${TAX_BASE_URL}/financial-years.php`,
  hraList: `${TAX_BASE_URL}/hra.php`,
  saveHra: `${TAX_BASE_URL}/hra.php`,
  saveHraBulk: `${TAX_BASE_URL}/hra-bulk.php`,
  declarationList: `${TAX_BASE_URL}/declarations.php`,
  saveDeclaration: `${TAX_BASE_URL}/declarations.php`,
  saveDeclarationBulk: `${TAX_BASE_URL}/declarations-bulk.php`,
  preview: `${TAX_BASE_URL}/preview.php`,
  submit: `${TAX_BASE_URL}/submit.php`,
  downloadPdf: `${TAX_BASE_URL}/download-pdf.php`,
  previewUrl: `${TAX_BASE_URL}/preview-url.php`,
};

let latestFinancialYearsResponse = null;
let latestHraListResponse = null;
let latestSaveHraResponse = null;
let latestSaveHraBulkResponse = null;
let latestDeclarationListResponse = null;
let latestSaveDeclarationResponse = null;
let latestSaveDeclarationBulkResponse = null;
let latestPreviewResponse = null;
let latestSubmitResponse = null;
let latestDownloadPdfResponse = null;
let latestPreviewUrlResponse = null;

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

const buildFullResponse = ({ config, data, response, url }) => ({
  config,
  data,
  headers: getResponseHeaders(response.headers),
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  url: response.url || url,
});

const throwIfTaxError = ({ data, fullResponse, message, response }) => {
  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || message);
    error.response = fullResponse;
    throw error;
  }
};

const appendQuery = (url, params = {}) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `${url}?${query}` : url;
};

const requestTaxApi = async ({
  body,
  cache,
  label,
  method = 'GET',
  params,
  token,
  url,
}) => {
  const requestUrl = method === 'GET' ? appendQuery(url, params) : url;
  const requestBody = body || {};
  const config = {
    method,
    headers: {
      ...buildAuthHeaders(token),
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(method === 'POST' ? { body: JSON.stringify(requestBody) } : {}),
  };

  const response = await fetch(requestUrl, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: method === 'POST' ? { ...config, body: requestBody } : config,
    data,
    response,
    url: requestUrl,
  });

  console.log(`${label} Full Response:`, fullResponse);

  throwIfTaxError({
    data,
    fullResponse,
    message: `${label} failed.`,
    response,
  });

  cache(fullResponse);
  return fullResponse;
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

const getTaxPdfFileName = (financialYear) =>
  `tax-preview-${String(financialYear || 'financial-year').replace(/[\\/:*?"<>|]/g, '_')}.pdf`;

const publishTaxPdfToDownloads = async ({ fileName, filePath }) => {
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

    return {
      publicPath: 'Downloads',
      publicUri,
      visibleInDownloads: true,
    };
  } catch (error) {
    return {
      publicPath: filePath,
      publicUri: filePath,
      publishError: error?.message || String(error),
      visibleInDownloads: false,
    };
  }
};

const notifyAndroidDownloadComplete = async ({ fileName, filePath }) => {
  if (Platform.OS !== 'android' || !RNBlobUtil.android?.addCompleteDownload) {
    return false;
  }

  try {
    await RNBlobUtil.android.addCompleteDownload({
      description: 'Employee tax PDF downloaded successfully.',
      mime: 'application/pdf',
      path: filePath,
      showNotification: true,
      title: fileName,
    });
    return true;
  } catch (error) {
    console.log('Tax PDF Download Notification Error:', error?.message || error);
    return false;
  }
};

export const taxFinancialYearsApi = async ({ token } = {}) =>
  requestTaxApi({
    cache: (response) => {
      latestFinancialYearsResponse = response;
    },
    label: 'Tax Financial Years',
    token,
    url: TAX_API_URLS.financialYears,
  });

export const taxHraListApi = async ({ financial_year, token } = {}) =>
  requestTaxApi({
    cache: (response) => {
      latestHraListResponse = response;
    },
    label: 'Tax HRA List',
    params: { financial_year },
    token,
    url: TAX_API_URLS.hraList,
  });

export const taxSaveHraApi = async ({ payload = {}, token } = {}) =>
  requestTaxApi({
    body: payload,
    cache: (response) => {
      latestSaveHraResponse = response;
    },
    label: 'Tax Save HRA',
    method: 'POST',
    token,
    url: TAX_API_URLS.saveHra,
  });

export const taxSaveHraBulkApi = async ({ payload = {}, token } = {}) =>
  requestTaxApi({
    body: payload,
    cache: (response) => {
      latestSaveHraBulkResponse = response;
    },
    label: 'Tax Save Multiple HRA Months',
    method: 'POST',
    token,
    url: TAX_API_URLS.saveHraBulk,
  });

export const taxDeclarationListApi = async ({ financial_year, token } = {}) =>
  requestTaxApi({
    cache: (response) => {
      latestDeclarationListResponse = response;
    },
    label: 'Tax Declaration List',
    params: { financial_year },
    token,
    url: TAX_API_URLS.declarationList,
  });

export const taxSaveDeclarationApi = async ({ payload = {}, token } = {}) =>
  requestTaxApi({
    body: payload,
    cache: (response) => {
      latestSaveDeclarationResponse = response;
    },
    label: 'Tax Save Declaration',
    method: 'POST',
    token,
    url: TAX_API_URLS.saveDeclaration,
  });

export const taxSaveDeclarationBulkApi = async ({ payload = {}, token } = {}) =>
  requestTaxApi({
    body: payload,
    cache: (response) => {
      latestSaveDeclarationBulkResponse = response;
    },
    label: 'Tax Save Multiple Declarations',
    method: 'POST',
    token,
    url: TAX_API_URLS.saveDeclarationBulk,
  });

export const taxPreviewApi = async ({ financial_year, token } = {}) =>
  requestTaxApi({
    cache: (response) => {
      latestPreviewResponse = response;
    },
    label: 'Tax Preview Data',
    params: { financial_year },
    token,
    url: TAX_API_URLS.preview,
  });

export const taxSubmitApi = async ({ payload = {}, token } = {}) =>
  requestTaxApi({
    body: payload,
    cache: (response) => {
      latestSubmitResponse = response;
    },
    label: 'Tax Submit Declarations',
    method: 'POST',
    token,
    url: TAX_API_URLS.submit,
  });

export const taxPreviewUrlApi = async ({ financial_year, token } = {}) =>
  requestTaxApi({
    cache: (response) => {
      latestPreviewUrlResponse = response;
    },
    label: 'Tax Web Preview URL',
    params: { financial_year },
    token,
    url: TAX_API_URLS.previewUrl,
  });

export const taxDownloadPdfApi = async ({ financial_year, token } = {}) => {
  const url = appendQuery(TAX_API_URLS.downloadPdf, { financial_year });
  const headers = buildAuthHeaders(token, 'application/pdf, application/json');
  const fileName = getTaxPdfFileName(financial_year);
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

  const response = await RNBlobUtil.config(saveConfig).fetch('GET', url, headers);
  const responseInfo = response.info();
  const responseHeaders = normalizeBlobHeaders(responseInfo.headers);
  const contentType = responseHeaders['content-type'] || '';
  const base64Data = await RNBlobUtil.fs.readFile(response.path(), 'base64');
  const isPdfResponse = base64Data?.startsWith('JVBER') || contentType.includes('application/pdf');
  const errorText = isPdfResponse ? '' : await readDownloadedText(response.path());
  const errorData = contentType.includes('application/json')
    ? await parseDownloadedError(response.path())
    : null;
  const publishResult = isPdfResponse
    ? await publishTaxPdfToDownloads({ fileName, filePath: response.path() })
    : null;
  const notificationShown =
    isPdfResponse && Platform.OS === 'android'
      ? await notifyAndroidDownloadComplete({
          fileName,
          filePath: response.path(),
        })
      : false;
  const data = errorData || {
    fileName,
    filePath: publishResult?.publicPath || response.path(),
    financial_year,
    isPdf: isPdfResponse,
    notificationShown,
    publicUri: publishResult?.publicUri || response.path(),
    size: Number(base64Data?.length || 0),
    visibleInDownloads: publishResult?.visibleInDownloads || false,
  };
  const status = Number(responseInfo.status || 0);
  const fullResponse = {
    config: {
      headers,
      method: 'GET',
      saveConfig,
    },
    data,
    headers: responseInfo.headers || {},
    ok: (status >= 200 && status < 300 && isPdfResponse) || (status === 0 && isPdfResponse),
    status,
    statusText: '',
    url,
  };

  if (errorText) {
    console.log('Tax PDF Non-PDF Body:', errorText);
  }
  console.log('Tax PDF Download Full Response:', fullResponse);

  if (!fullResponse.ok || isApiFailure(errorData)) {
    const error = new Error(errorData?.message || 'Tax PDF download failed.');
    error.response = fullResponse;
    throw error;
  }

  if (Platform.OS === 'ios') {
    RNBlobUtil.ios.openDocument(response.path());
  }

  latestDownloadPdfResponse = fullResponse;
  return fullResponse;
};

export const getCurrentTaxFinancialYearsResponse = () => latestFinancialYearsResponse;
export const getCurrentTaxHraListResponse = () => latestHraListResponse;
export const getCurrentTaxSaveHraResponse = () => latestSaveHraResponse;
export const getCurrentTaxSaveHraBulkResponse = () => latestSaveHraBulkResponse;
export const getCurrentTaxDeclarationListResponse = () => latestDeclarationListResponse;
export const getCurrentTaxSaveDeclarationResponse = () => latestSaveDeclarationResponse;
export const getCurrentTaxSaveDeclarationBulkResponse = () => latestSaveDeclarationBulkResponse;
export const getCurrentTaxPreviewResponse = () => latestPreviewResponse;
export const getCurrentTaxSubmitResponse = () => latestSubmitResponse;
export const getCurrentTaxDownloadPdfResponse = () => latestDownloadPdfResponse;
export const getCurrentTaxPreviewUrlResponse = () => latestPreviewUrlResponse;

export const taxFinancialYearsThunk = createAsyncThunk(
  'employeeTds/taxFinancialYearsThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxFinancialYearsApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxHraListThunk = createAsyncThunk(
  'employeeTds/taxHraListThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxHraListApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxSaveHraThunk = createAsyncThunk(
  'employeeTds/taxSaveHraThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxSaveHraApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxSaveHraBulkThunk = createAsyncThunk(
  'employeeTds/taxSaveHraBulkThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxSaveHraBulkApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxDeclarationListThunk = createAsyncThunk(
  'employeeTds/taxDeclarationListThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxDeclarationListApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxSaveDeclarationThunk = createAsyncThunk(
  'employeeTds/taxSaveDeclarationThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxSaveDeclarationApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxSaveDeclarationBulkThunk = createAsyncThunk(
  'employeeTds/taxSaveDeclarationBulkThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxSaveDeclarationBulkApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxPreviewThunk = createAsyncThunk(
  'employeeTds/taxPreviewThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxPreviewApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxSubmitThunk = createAsyncThunk(
  'employeeTds/taxSubmitThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxSubmitApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxDownloadPdfThunk = createAsyncThunk(
  'employeeTds/taxDownloadPdfThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxDownloadPdfApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const taxPreviewUrlThunk = createAsyncThunk(
  'employeeTds/taxPreviewUrlThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await taxPreviewUrlApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const employeeTdsSlice = createSlice({
  name: 'employeeTds',
  initialState: {
    financialYears: [],
    financialYearsFullResponse: null,
    hraList: null,
    hraListFullResponse: null,
    declarationList: null,
    declarationListFullResponse: null,
    preview: null,
    previewFullResponse: null,
    previewUrl: '',
    previewUrlFullResponse: null,
    submitFullResponse: null,
    downloadPdfFullResponse: null,
    saveHraFullResponse: null,
    saveHraBulkFullResponse: null,
    saveDeclarationFullResponse: null,
    saveDeclarationBulkFullResponse: null,
    loading: false,
    actionLoading: false,
    error: '',
    actionError: '',
  },
  reducers: {
    clearEmployeeTdsData(state) {
      Object.assign(state, employeeTdsSlice.getInitialState());
      latestFinancialYearsResponse = null;
      latestHraListResponse = null;
      latestSaveHraResponse = null;
      latestSaveHraBulkResponse = null;
      latestDeclarationListResponse = null;
      latestSaveDeclarationResponse = null;
      latestSaveDeclarationBulkResponse = null;
      latestPreviewResponse = null;
      latestSubmitResponse = null;
      latestDownloadPdfResponse = null;
      latestPreviewUrlResponse = null;
    },
  },
  extraReducers: (builder) => {
    const setPending = (state) => {
      state.loading = true;
      state.error = '';
    };
    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Tax API request failed.';
    };
    const setActionPending = (state) => {
      state.actionLoading = true;
      state.actionError = '';
    };
    const setActionRejected = (state, action) => {
      state.actionLoading = false;
      state.actionError = action.payload || 'Tax API action failed.';
    };

    builder
      .addCase(taxFinancialYearsThunk.pending, setPending)
      .addCase(taxFinancialYearsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.financialYearsFullResponse = action.payload;
        state.financialYears = action.payload?.data?.data?.financial_years || [];
      })
      .addCase(taxFinancialYearsThunk.rejected, setRejected)
      .addCase(taxHraListThunk.pending, setPending)
      .addCase(taxHraListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.hraListFullResponse = action.payload;
        state.hraList = action.payload?.data?.data || null;
      })
      .addCase(taxHraListThunk.rejected, setRejected)
      .addCase(taxDeclarationListThunk.pending, setPending)
      .addCase(taxDeclarationListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.declarationListFullResponse = action.payload;
        state.declarationList = action.payload?.data?.data || null;
      })
      .addCase(taxDeclarationListThunk.rejected, setRejected)
      .addCase(taxPreviewThunk.pending, setPending)
      .addCase(taxPreviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.previewFullResponse = action.payload;
        state.preview = action.payload?.data?.data || null;
      })
      .addCase(taxPreviewThunk.rejected, setRejected)
      .addCase(taxPreviewUrlThunk.pending, setActionPending)
      .addCase(taxPreviewUrlThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.previewUrlFullResponse = action.payload;
        state.previewUrl =
          action.payload?.data?.data?.url ||
          action.payload?.data?.data?.preview_url ||
          action.payload?.data?.url ||
          '';
      })
      .addCase(taxPreviewUrlThunk.rejected, setActionRejected)
      .addCase(taxSaveHraThunk.pending, setActionPending)
      .addCase(taxSaveHraThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.saveHraFullResponse = action.payload;
      })
      .addCase(taxSaveHraThunk.rejected, setActionRejected)
      .addCase(taxSaveHraBulkThunk.pending, setActionPending)
      .addCase(taxSaveHraBulkThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.saveHraBulkFullResponse = action.payload;
      })
      .addCase(taxSaveHraBulkThunk.rejected, setActionRejected)
      .addCase(taxSaveDeclarationThunk.pending, setActionPending)
      .addCase(taxSaveDeclarationThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.saveDeclarationFullResponse = action.payload;
      })
      .addCase(taxSaveDeclarationThunk.rejected, setActionRejected)
      .addCase(taxSaveDeclarationBulkThunk.pending, setActionPending)
      .addCase(taxSaveDeclarationBulkThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.saveDeclarationBulkFullResponse = action.payload;
      })
      .addCase(taxSaveDeclarationBulkThunk.rejected, setActionRejected)
      .addCase(taxSubmitThunk.pending, setActionPending)
      .addCase(taxSubmitThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.submitFullResponse = action.payload;
      })
      .addCase(taxSubmitThunk.rejected, setActionRejected)
      .addCase(taxDownloadPdfThunk.pending, setActionPending)
      .addCase(taxDownloadPdfThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.downloadPdfFullResponse = action.payload;
      })
      .addCase(taxDownloadPdfThunk.rejected, setActionRejected);
  },
});

export const { clearEmployeeTdsData } = employeeTdsSlice.actions;
export default employeeTdsSlice.reducer;
