import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const LEAVE_CATEGORY_API_URL =
  'https://api.apphrms.com/employee/leaves/categories.php';
const EMPLOYEE_LEAVE_LIST_API_URL =
  'https://api.apphrms.com/employee/leaves/list.php';
const APPLY_LEAVE_API_URL = 'https://api.apphrms.com/employee/leaves/apply.php';

let latestLeaveCategoriesResponse = null;
let latestEmployeeLeaveListResponse = null;
let latestEmployeeLeavePendingResponse = null;
let latestApplyLeaveResponse = null;

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

const buildAuthHeaders = (token) => ({
  Accept: 'application/json',
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

export const leaveCategoriesApi = async (token = getCurrentAuthToken()) => {
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(LEAVE_CATEGORY_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config,
    data,
    response,
    url: LEAVE_CATEGORY_API_URL,
  });

  console.log('Leave Categories Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Leave categories fetch failed.');
    error.response = fullResponse;
    console.log('Leave Categories Error:', error);
    throw error;
  }

  latestLeaveCategoriesResponse = fullResponse;
  return fullResponse;
};

export const employeeLeaveListApi = async ({
  status = 'all',
  token = getCurrentAuthToken(),
} = {}) => {
  const url =
    status === 'pending'
      ? `${EMPLOYEE_LEAVE_LIST_API_URL}?status=pending`
      : EMPLOYEE_LEAVE_LIST_API_URL;
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({ config, data, response, url });

  console.log(
    status === 'pending'
      ? 'Employee Leave Pending Full Response:'
      : 'Employee Leave List Full Response:',
    fullResponse
  );

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Employee leave list fetch failed.');
    error.response = fullResponse;
    console.log('Employee Leave List Error:', error);
    throw error;
  }

  if (status === 'pending') {
    latestEmployeeLeavePendingResponse = fullResponse;
  } else {
    latestEmployeeLeaveListResponse = fullResponse;
  }

  return fullResponse;
};

export const applyLeaveApi = async ({
  leave_cat_id,
  start_date,
  end_date,
  leave_reason,
  leave_remarks = '',
  token = getCurrentAuthToken(),
} = {}) => {
  const requestBody = {
    leave_cat_id,
    start_date,
    end_date,
    leave_reason,
    leave_remarks,
  };
  const config = {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  const response = await fetch(APPLY_LEAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: requestBody,
    },
    data,
    response,
    url: APPLY_LEAVE_API_URL,
  });

  console.log('Apply Leave Full Response:', fullResponse);

  if (!response.ok) {
    const error = new Error(data?.message || 'Apply leave request failed.');
    error.response = fullResponse;
    console.log('Apply Leave Error:', error);
    throw error;
  }

  latestApplyLeaveResponse = fullResponse;
  return fullResponse;
};

export const getCurrentLeaveCategoriesResponse = () =>
  latestLeaveCategoriesResponse;
export const getCurrentEmployeeLeaveListResponse = () =>
  latestEmployeeLeaveListResponse;
export const getCurrentEmployeeLeavePendingResponse = () =>
  latestEmployeeLeavePendingResponse;
export const getCurrentApplyLeaveResponse = () => latestApplyLeaveResponse;

export const leaveCategoriesThunk = createAsyncThunk(
  'leave/leaveCategoriesThunk',
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const data = await leaveCategoriesApi(token);
      console.log('Leave Categories Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Leave Categories Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeLeaveListThunk = createAsyncThunk(
  'leave/employeeLeaveListThunk',
  async ({ status, token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeLeaveListApi({ status, token });
      console.log('Employee Leave List Thunk Success:', data);
      return { response: data, status: status || 'all' };
    } catch (error) {
      console.log('Employee Leave List Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const applyLeaveThunk = createAsyncThunk(
  'leave/applyLeaveThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const data = await applyLeaveApi(payload);
      console.log('Apply Leave Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Apply Leave Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    categories: null,
    categoriesFullResponse: null,
    list: null,
    listFullResponse: null,
    pending: null,
    pendingFullResponse: null,
    applyResult: null,
    applyFullResponse: null,
    categoriesLoading: false,
    listLoading: false,
    pendingLoading: false,
    applyLoading: false,
    categoriesError: '',
    listError: '',
    pendingError: '',
    applyError: '',
  },
  reducers: {
    clearLeaveData(state) {
      state.categories = null;
      state.categoriesFullResponse = null;
      state.list = null;
      state.listFullResponse = null;
      state.pending = null;
      state.pendingFullResponse = null;
      state.applyResult = null;
      state.applyFullResponse = null;
      state.categoriesLoading = false;
      state.listLoading = false;
      state.pendingLoading = false;
      state.applyLoading = false;
      state.categoriesError = '';
      state.listError = '';
      state.pendingError = '';
      state.applyError = '';
      latestLeaveCategoriesResponse = null;
      latestEmployeeLeaveListResponse = null;
      latestEmployeeLeavePendingResponse = null;
      latestApplyLeaveResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(leaveCategoriesThunk.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = '';
      })
      .addCase(leaveCategoriesThunk.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesFullResponse = action.payload;
        state.categories = action.payload?.data?.data?.categories || [];
      })
      .addCase(leaveCategoriesThunk.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload || 'Leave categories fetch failed.';
      })
      .addCase(employeeLeaveListThunk.pending, (state, action) => {
        const status = action.meta.arg?.status;
        if (status === 'pending') {
          state.pendingLoading = true;
          state.pendingError = '';
        } else {
          state.listLoading = true;
          state.listError = '';
        }
      })
      .addCase(employeeLeaveListThunk.fulfilled, (state, action) => {
        if (action.payload?.status === 'pending') {
          state.pendingLoading = false;
          state.pendingFullResponse = action.payload.response;
          state.pending = action.payload.response?.data?.data || null;
        } else {
          state.listLoading = false;
          state.listFullResponse = action.payload.response;
          state.list = action.payload.response?.data?.data || null;
        }
      })
      .addCase(employeeLeaveListThunk.rejected, (state, action) => {
        const status = action.meta.arg?.status;
        if (status === 'pending') {
          state.pendingLoading = false;
          state.pendingError =
            action.payload || 'Pending leave list fetch failed.';
        } else {
          state.listLoading = false;
          state.listError = action.payload || 'Employee leave list fetch failed.';
        }
      })
      .addCase(applyLeaveThunk.pending, (state) => {
        state.applyLoading = true;
        state.applyError = '';
      })
      .addCase(applyLeaveThunk.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.applyFullResponse = action.payload;
        state.applyResult = action.payload?.data || null;
      })
      .addCase(applyLeaveThunk.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload || 'Apply leave request failed.';
      });
  },
});

export const { clearLeaveData } = leaveSlice.actions;
export default leaveSlice.reducer;
