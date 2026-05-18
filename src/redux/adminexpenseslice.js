import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {CLIENT_CODE, getCurrentAuthToken} from './loginSlice';

const ADMIN_EXPENSE_LIST_API_URL =
  'https://api.apphrms.com/admin/expenses/list.php';
const ADMIN_EXPENSE_SAVE_API_URL =
  'https://api.apphrms.com/admin/expenses/save.php';
const ADMIN_EXPENSE_ATTACHMENT_API_URL =
  'https://api.apphrms.com/admin/expenses/attachment.php';
const ADMIN_EXPENSE_DELETE_API_URL =
  'https://api.apphrms.com/admin/expenses/delete.php';

let latestAdminExpenseListResponse = null;
let latestAdminExpenseByMonthResponse = null;
let latestAdminExpenseSearchResponse = null;
let latestAddAdminExpenseResponse = null;
let latestEditAdminExpenseResponse = null;
let latestDownloadAdminExpenseAttachmentResponse = null;
let latestDeleteAdminExpenseResponse = null;

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

  if (contentType.includes('application/json') || contentType.includes('text/')) {
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

const appendIfValue = (formData, key, value) => {
  if (value !== null && value !== undefined && value !== '') {
    formData.append(key, value);
  }
};

const buildListUrl = ({
  emp_code = '',
  from = '',
  limit = 20,
  month = '',
  page = 1,
  search = '',
  to = '',
} = {}) => {
  const params = new URLSearchParams();

  if (month) params.append('month', month);
  if (emp_code) params.append('emp_code', emp_code);
  if (search) params.append('search', search);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  const query = params.toString();
  return query ? `${ADMIN_EXPENSE_LIST_API_URL}?${query}` : ADMIN_EXPENSE_LIST_API_URL;
};

const cacheListResponse = ({month, search, emp_code}, fullResponse) => {
  latestAdminExpenseListResponse = fullResponse;
  if (month) {
    latestAdminExpenseByMonthResponse = fullResponse;
  }
  if (search || emp_code) {
    latestAdminExpenseSearchResponse = fullResponse;
  }
};

export const adminExpenseListApi = async ({
  emp_code = '',
  from = '',
  limit = 20,
  month = '',
  page = 1,
  search = '',
  to = '',
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildListUrl({emp_code, from, limit, month, page, search, to});
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({config, data, response, url});

  console.log('Admin Expense List Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin expenses fetch failed.');
    error.response = fullResponse;
    console.log('Admin Expense List Error:', error);
    throw error;
  }

  cacheListResponse({month, search, emp_code}, fullResponse);
  return fullResponse;
};

export const addAdminExpenseApi = async ({
  amount,
  attachment,
  date,
  emp_code,
  narration,
  token = getCurrentAuthToken(),
} = {}) => {
  const formData = new FormData();
  appendIfValue(formData, 'emp_code', emp_code);
  appendIfValue(formData, 'date', date);
  appendIfValue(formData, 'amount', amount);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'attachment', attachment);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(ADMIN_EXPENSE_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {...config, body: {amount, attachment, date, emp_code, narration}},
    data,
    response,
    url: ADMIN_EXPENSE_SAVE_API_URL,
  });

  console.log('Admin Add Expense Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin add expense failed.');
    error.response = fullResponse;
    console.log('Admin Add Expense Error:', error);
    throw error;
  }

  latestAddAdminExpenseResponse = fullResponse;
  return fullResponse;
};

export const editAdminExpenseApi = async ({
  amount,
  attachment,
  date,
  emp_code,
  expenseId,
  id,
  narration,
  token = getCurrentAuthToken(),
} = {}) => {
  const resolvedId = expenseId || id;
  const formData = new FormData();
  appendIfValue(formData, 'id', resolvedId);
  appendIfValue(formData, 'expense_id', resolvedId);
  appendIfValue(formData, 'emp_code', emp_code);
  appendIfValue(formData, 'date', date);
  appendIfValue(formData, 'amount', amount);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'attachment', attachment);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(ADMIN_EXPENSE_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: {
        amount,
        attachment,
        date,
        emp_code,
        expense_id: resolvedId,
        id: resolvedId,
        narration,
      },
    },
    data,
    response,
    url: ADMIN_EXPENSE_SAVE_API_URL,
  });

  console.log('Admin Edit Expense Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin edit expense failed.');
    error.response = fullResponse;
    console.log('Admin Edit Expense Error:', error);
    throw error;
  }

  latestEditAdminExpenseResponse = fullResponse;
  return fullResponse;
};

export const downloadAdminExpenseAttachmentApi = async ({
  expenseId,
  id,
  token = getCurrentAuthToken(),
} = {}) => {
  const resolvedId = expenseId || id;
  const url = `${ADMIN_EXPENSE_ATTACHMENT_API_URL}?id=${encodeURIComponent(
    resolvedId,
  )}`;
  const config = {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(token),
      Accept: 'application/pdf,image/*,application/json',
    },
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({config, data, response, url});

  console.log('Admin Download Expense Attachment Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Expense attachment not found.');
    error.response = fullResponse;
    console.log('Admin Download Expense Attachment Error:', error);
    throw error;
  }

  latestDownloadAdminExpenseAttachmentResponse = fullResponse;
  return fullResponse;
};

export const deleteAdminExpenseApi = async ({
  emp_code,
  expenseId,
  id,
  token = getCurrentAuthToken(),
} = {}) => {
  const resolvedId = expenseId || id;
  const formData = new FormData();
  appendIfValue(formData, 'id', resolvedId);
  appendIfValue(formData, 'expense_id', resolvedId);
  appendIfValue(formData, 'emp_code', emp_code);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(ADMIN_EXPENSE_DELETE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: {emp_code, expense_id: resolvedId, id: resolvedId},
    },
    data,
    response,
    url: ADMIN_EXPENSE_DELETE_API_URL,
  });

  console.log('Admin Delete Expense Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin delete expense failed.');
    error.response = fullResponse;
    console.log('Admin Delete Expense Error:', error);
    throw error;
  }

  latestDeleteAdminExpenseResponse = fullResponse;
  return fullResponse;
};

export const getCurrentAdminExpenseListResponse = () =>
  latestAdminExpenseListResponse;
export const getCurrentAdminExpenseByMonthResponse = () =>
  latestAdminExpenseByMonthResponse;
export const getCurrentAdminExpenseSearchResponse = () =>
  latestAdminExpenseSearchResponse;
export const getCurrentAddAdminExpenseResponse = () =>
  latestAddAdminExpenseResponse;
export const getCurrentEditAdminExpenseResponse = () =>
  latestEditAdminExpenseResponse;
export const getCurrentDownloadAdminExpenseAttachmentResponse = () =>
  latestDownloadAdminExpenseAttachmentResponse;
export const getCurrentDeleteAdminExpenseResponse = () =>
  latestDeleteAdminExpenseResponse;

export const adminExpenseListThunk = createAsyncThunk(
  'adminExpenses/adminExpenseListThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await adminExpenseListApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addAdminExpenseThunk = createAsyncThunk(
  'adminExpenses/addAdminExpenseThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await addAdminExpenseApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const editAdminExpenseThunk = createAsyncThunk(
  'adminExpenses/editAdminExpenseThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await editAdminExpenseApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const downloadAdminExpenseAttachmentThunk = createAsyncThunk(
  'adminExpenses/downloadAdminExpenseAttachmentThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await downloadAdminExpenseAttachmentApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteAdminExpenseThunk = createAsyncThunk(
  'adminExpenses/deleteAdminExpenseThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await deleteAdminExpenseApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const adminExpenseSlice = createSlice({
  name: 'adminExpenses',
  initialState: {
    addFullResponse: null,
    deleteFullResponse: null,
    downloadFullResponse: null,
    editFullResponse: null,
    error: '',
    expenses: [],
    fullResponse: null,
    loading: false,
    saving: false,
    total: 0,
    totalAmount: 0,
  },
  reducers: {
    clearAdminExpenses(state) {
      state.addFullResponse = null;
      state.deleteFullResponse = null;
      state.downloadFullResponse = null;
      state.editFullResponse = null;
      state.error = '';
      state.expenses = [];
      state.fullResponse = null;
      state.loading = false;
      state.saving = false;
      state.total = 0;
      state.totalAmount = 0;
      latestAdminExpenseListResponse = null;
      latestAdminExpenseByMonthResponse = null;
      latestAdminExpenseSearchResponse = null;
      latestAddAdminExpenseResponse = null;
      latestEditAdminExpenseResponse = null;
      latestDownloadAdminExpenseAttachmentResponse = null;
      latestDeleteAdminExpenseResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminExpenseListThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(adminExpenseListThunk.fulfilled, (state, action) => {
        const data = action.payload?.data?.data || {};
        state.loading = false;
        state.fullResponse = action.payload;
        state.expenses = data.expenses || [];
        state.total = data.total || 0;
        state.totalAmount = data.total_amount || 0;
      })
      .addCase(adminExpenseListThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Admin expenses fetch failed.';
      })
      .addCase(addAdminExpenseThunk.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(addAdminExpenseThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.addFullResponse = action.payload;
      })
      .addCase(addAdminExpenseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || 'Admin add expense failed.';
      })
      .addCase(editAdminExpenseThunk.fulfilled, (state, action) => {
        state.editFullResponse = action.payload;
      })
      .addCase(downloadAdminExpenseAttachmentThunk.fulfilled, (state, action) => {
        state.downloadFullResponse = action.payload;
      })
      .addCase(deleteAdminExpenseThunk.fulfilled, (state, action) => {
        state.deleteFullResponse = action.payload;
      });
  },
});

export const {clearAdminExpenses} = adminExpenseSlice.actions;
export default adminExpenseSlice.reducer;
