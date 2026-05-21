import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Config} from '../Config';
import {CLIENT_CODE, getCurrentAuthToken} from './loginSlice';

const EMPLOYEE_EXPENSE_LIST_API_URL =
  `${Config.apiBaseUrl}/employee/expenses/list.php`;
const EMPLOYEE_EXPENSE_SAVE_API_URL =
  `${Config.apiBaseUrl}/employee/expenses/save.php`;
const EMPLOYEE_EXPENSE_ATTACHMENT_API_URL =
  `${Config.apiBaseUrl}/employee/expenses/attachment.php`;

let latestExpenseListResponse = null;
let latestExpenseByMonthResponse = null;
let latestAddExpenseResponse = null;
let latestEditExpenseResponse = null;
let latestDownloadExpenseAttachmentResponse = null;

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

export const employeeExpenseListApi = async ({
  month = '',
  token = getCurrentAuthToken(),
} = {}) => {
  const url = month
    ? `${EMPLOYEE_EXPENSE_LIST_API_URL}?month=${encodeURIComponent(month)}`
    : EMPLOYEE_EXPENSE_LIST_API_URL;
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({config, data, response, url});

  console.log(
    month
      ? 'Employee Expense List By Month Full Response:'
      : 'Employee Expense List Full Response:',
    fullResponse,
  );

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Employee expenses fetch failed.');
    error.response = fullResponse;
    console.log('Employee Expense List Error:', error);
    throw error;
  }

  if (month) {
    latestExpenseByMonthResponse = fullResponse;
  } else {
    latestExpenseListResponse = fullResponse;
  }

  return fullResponse;
};

export const addEmployeeExpenseApi = async ({
  amount,
  attachment,
  date,
  narration,
  token = getCurrentAuthToken(),
} = {}) => {
  const formData = new FormData();
  appendIfValue(formData, 'date', date);
  appendIfValue(formData, 'amount', amount);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'attachment', attachment);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(EMPLOYEE_EXPENSE_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {...config, body: {amount, attachment, date, narration}},
    data,
    response,
    url: EMPLOYEE_EXPENSE_SAVE_API_URL,
  });

  console.log('Add Employee Expense Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Add expense failed.');
    error.response = fullResponse;
    console.log('Add Employee Expense Error:', error);
    throw error;
  }

  latestAddExpenseResponse = fullResponse;
  return fullResponse;
};

export const editEmployeeExpenseApi = async ({
  amount,
  attachment,
  date,
  expenseId,
  id,
  narration,
  token = getCurrentAuthToken(),
} = {}) => {
  const resolvedId = expenseId || id;
  const formData = new FormData();
  appendIfValue(formData, 'id', resolvedId);
  appendIfValue(formData, 'expense_id', resolvedId);
  appendIfValue(formData, 'date', date);
  appendIfValue(formData, 'amount', amount);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'attachment', attachment);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(EMPLOYEE_EXPENSE_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: {amount, attachment, date, expense_id: resolvedId, id: resolvedId, narration},
    },
    data,
    response,
    url: EMPLOYEE_EXPENSE_SAVE_API_URL,
  });

  console.log('Edit Employee Expense Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Edit expense failed.');
    error.response = fullResponse;
    console.log('Edit Employee Expense Error:', error);
    throw error;
  }

  latestEditExpenseResponse = fullResponse;
  return fullResponse;
};

export const downloadEmployeeExpenseAttachmentApi = async ({
  expenseId,
  id,
  token = getCurrentAuthToken(),
} = {}) => {
  const resolvedId = expenseId || id;
  const url = `${EMPLOYEE_EXPENSE_ATTACHMENT_API_URL}?id=${encodeURIComponent(
    resolvedId,
  )}`;
  const config = {
    method: 'GET',
    headers: {
      ...buildAuthHeaders(token),
      Accept: 'application/pdf,application/json',
    },
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({config, data, response, url});

  console.log('Download Employee Expense Attachment Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Expense attachment download failed.');
    error.response = fullResponse;
    console.log('Download Employee Expense Attachment Error:', error);
    throw error;
  }

  latestDownloadExpenseAttachmentResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeExpenseListResponse = () =>
  latestExpenseListResponse;
export const getCurrentEmployeeExpenseByMonthResponse = () =>
  latestExpenseByMonthResponse;
export const getCurrentAddEmployeeExpenseResponse = () =>
  latestAddExpenseResponse;
export const getCurrentEditEmployeeExpenseResponse = () =>
  latestEditExpenseResponse;
export const getCurrentDownloadEmployeeExpenseAttachmentResponse = () =>
  latestDownloadExpenseAttachmentResponse;

export const employeeExpenseListThunk = createAsyncThunk(
  'employeeExpenses/employeeExpenseListThunk',
  async ({month, token} = {}, {rejectWithValue}) => {
    try {
      const data = await employeeExpenseListApi({month, token});
      console.log('Employee Expense List Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Expense List Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const addEmployeeExpenseThunk = createAsyncThunk(
  'employeeExpenses/addEmployeeExpenseThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      const data = await addEmployeeExpenseApi(payload);
      console.log('Add Employee Expense Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Add Employee Expense Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const editEmployeeExpenseThunk = createAsyncThunk(
  'employeeExpenses/editEmployeeExpenseThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      const data = await editEmployeeExpenseApi(payload);
      console.log('Edit Employee Expense Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Edit Employee Expense Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const downloadEmployeeExpenseAttachmentThunk = createAsyncThunk(
  'employeeExpenses/downloadEmployeeExpenseAttachmentThunk',
  async (payload = {}, {rejectWithValue}) => {
    try {
      const data = await downloadEmployeeExpenseAttachmentApi(payload);
      console.log('Download Employee Expense Attachment Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Download Employee Expense Attachment Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  },
);

const employeeExpensesSlice = createSlice({
  name: 'employeeExpenses',
  initialState: {
    addFullResponse: null,
    addResult: null,
    downloadFullResponse: null,
    editFullResponse: null,
    editResult: null,
    error: '',
    expenses: [],
    fullResponse: null,
    loading: false,
    month: '',
    saving: false,
  },
  reducers: {
    clearEmployeeExpenses(state) {
      state.addFullResponse = null;
      state.addResult = null;
      state.downloadFullResponse = null;
      state.editFullResponse = null;
      state.editResult = null;
      state.error = '';
      state.expenses = [];
      state.fullResponse = null;
      state.loading = false;
      state.month = '';
      state.saving = false;
      latestExpenseListResponse = null;
      latestExpenseByMonthResponse = null;
      latestAddExpenseResponse = null;
      latestEditExpenseResponse = null;
      latestDownloadExpenseAttachmentResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeExpenseListThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(employeeExpenseListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.fullResponse = action.payload;
        state.month = action.payload?.data?.data?.month || '';
        state.expenses = action.payload?.data?.data?.expenses || [];
      })
      .addCase(employeeExpenseListThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Employee expenses fetch failed.';
      })
      .addCase(addEmployeeExpenseThunk.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(addEmployeeExpenseThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.addFullResponse = action.payload;
        state.addResult = action.payload?.data?.data || null;
      })
      .addCase(addEmployeeExpenseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || 'Add expense failed.';
      })
      .addCase(editEmployeeExpenseThunk.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(editEmployeeExpenseThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.editFullResponse = action.payload;
        state.editResult = action.payload?.data?.data || null;
      })
      .addCase(editEmployeeExpenseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || 'Edit expense failed.';
      })
      .addCase(downloadEmployeeExpenseAttachmentThunk.fulfilled, (state, action) => {
        state.downloadFullResponse = action.payload;
      });
  },
});

export const {clearEmployeeExpenses} = employeeExpensesSlice.actions;
export default employeeExpensesSlice.reducer;
