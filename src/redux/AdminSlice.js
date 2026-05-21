import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Config } from '../Config';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const ADMIN_LEAVES_API_URL = `${Config.apiBaseUrl}/admin/leaves.php`;

let latestAdminLeaveListResponse = null;
let latestAdminLeavePendingResponse = null;
let latestAdminLeaveApprovedResponse = null;
let latestAdminLeaveRejectedResponse = null;
let latestAdminLeaveActionResponse = null;

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

const buildQuery = ({ status, search, from, to, page, limit } = {}) => {
  const params = new URLSearchParams();

  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  const query = params.toString();
  return query ? `${ADMIN_LEAVES_API_URL}?${query}` : ADMIN_LEAVES_API_URL;
};

const cacheLeaveResponse = (status, fullResponse) => {
  if (status === 'pending') {
    latestAdminLeavePendingResponse = fullResponse;
    return;
  }
  if (status === 'approved') {
    latestAdminLeaveApprovedResponse = fullResponse;
    return;
  }
  if (status === 'rejected') {
    latestAdminLeaveRejectedResponse = fullResponse;
    return;
  }
  latestAdminLeaveListResponse = fullResponse;
};

export const adminLeaveListApi = async ({
  status = 'all',
  search = '',
  from = '',
  to = '',
  page = 1,
  limit = 20,
  token = getCurrentAuthToken(),
} = {}) => {
  const url = buildQuery({ status, search, from, to, page, limit });
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({ config, data, response, url });

  console.log('Admin Leave List Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin leave list fetch failed.');
    error.response = fullResponse;
    console.log('Admin Leave List Error:', error);
    throw error;
  }

  cacheLeaveResponse(status, fullResponse);
  return fullResponse;
};

export const adminLeaveActionApi = async ({
  leave_apply_id,
  action,
  leave_remarks = '',
  token = getCurrentAuthToken(),
} = {}) => {
  const normalizedAction = action === 'reject' ? 'reject' : 'approve';
  const requestBody = {
    action: normalizedAction,
    leave_apply_id,
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

  const response = await fetch(ADMIN_LEAVES_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: requestBody,
    },
    data,
    response,
    url: ADMIN_LEAVES_API_URL,
  });

  console.log('Admin Leave Action Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Admin leave action failed.');
    error.response = fullResponse;
    console.log('Admin Leave Action Error:', error);
    throw error;
  }

  latestAdminLeaveActionResponse = fullResponse;
  return fullResponse;
};

export const getCurrentAdminLeaveListResponse = () =>
  latestAdminLeaveListResponse;
export const getCurrentAdminLeavePendingResponse = () =>
  latestAdminLeavePendingResponse;
export const getCurrentAdminLeaveApprovedResponse = () =>
  latestAdminLeaveApprovedResponse;
export const getCurrentAdminLeaveRejectedResponse = () =>
  latestAdminLeaveRejectedResponse;
export const getCurrentAdminLeaveActionResponse = () =>
  latestAdminLeaveActionResponse;

export const adminLeaveListThunk = createAsyncThunk(
  'admin/adminLeaveListThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const data = await adminLeaveListApi(payload);
      return { response: data, status: payload.status || 'all' };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const adminLeaveActionThunk = createAsyncThunk(
  'admin/adminLeaveActionThunk',
  async (payload = {}, { rejectWithValue }) => {
    try {
      return await adminLeaveActionApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    leaves: null,
    leavesFullResponse: null,
    pendingLeaves: null,
    pendingFullResponse: null,
    approvedLeaves: null,
    approvedFullResponse: null,
    rejectedLeaves: null,
    rejectedFullResponse: null,
    actionResult: null,
    actionFullResponse: null,
    leavesLoading: false,
    pendingLoading: false,
    approvedLoading: false,
    rejectedLoading: false,
    actionLoading: false,
    leavesError: '',
    pendingError: '',
    approvedError: '',
    rejectedError: '',
    actionError: '',
  },
  reducers: {
    clearAdminLeaveData(state) {
      state.leaves = null;
      state.leavesFullResponse = null;
      state.pendingLeaves = null;
      state.pendingFullResponse = null;
      state.approvedLeaves = null;
      state.approvedFullResponse = null;
      state.rejectedLeaves = null;
      state.rejectedFullResponse = null;
      state.actionResult = null;
      state.actionFullResponse = null;
      state.leavesLoading = false;
      state.pendingLoading = false;
      state.approvedLoading = false;
      state.rejectedLoading = false;
      state.actionLoading = false;
      state.leavesError = '';
      state.pendingError = '';
      state.approvedError = '';
      state.rejectedError = '';
      state.actionError = '';
      latestAdminLeaveListResponse = null;
      latestAdminLeavePendingResponse = null;
      latestAdminLeaveApprovedResponse = null;
      latestAdminLeaveRejectedResponse = null;
      latestAdminLeaveActionResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLeaveListThunk.pending, (state, action) => {
        const status = action.meta.arg?.status || 'all';
        if (status === 'pending') state.pendingLoading = true;
        else if (status === 'approved') state.approvedLoading = true;
        else if (status === 'rejected') state.rejectedLoading = true;
        else state.leavesLoading = true;
      })
      .addCase(adminLeaveListThunk.fulfilled, (state, action) => {
        const status = action.payload?.status || 'all';
        const data = action.payload?.response?.data?.data || null;
        if (status === 'pending') {
          state.pendingLoading = false;
          state.pendingFullResponse = action.payload.response;
          state.pendingLeaves = data;
        } else if (status === 'approved') {
          state.approvedLoading = false;
          state.approvedFullResponse = action.payload.response;
          state.approvedLeaves = data;
        } else if (status === 'rejected') {
          state.rejectedLoading = false;
          state.rejectedFullResponse = action.payload.response;
          state.rejectedLeaves = data;
        } else {
          state.leavesLoading = false;
          state.leavesFullResponse = action.payload.response;
          state.leaves = data;
        }
      })
      .addCase(adminLeaveListThunk.rejected, (state, action) => {
        const status = action.meta.arg?.status || 'all';
        if (status === 'pending') {
          state.pendingLoading = false;
          state.pendingError = action.payload || 'Pending leaves fetch failed.';
        } else if (status === 'approved') {
          state.approvedLoading = false;
          state.approvedError = action.payload || 'Approved leaves fetch failed.';
        } else if (status === 'rejected') {
          state.rejectedLoading = false;
          state.rejectedError = action.payload || 'Rejected leaves fetch failed.';
        } else {
          state.leavesLoading = false;
          state.leavesError = action.payload || 'Admin leaves fetch failed.';
        }
      })
      .addCase(adminLeaveActionThunk.pending, (state) => {
        state.actionLoading = true;
        state.actionError = '';
      })
      .addCase(adminLeaveActionThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionFullResponse = action.payload;
        state.actionResult = action.payload?.data || null;
      })
      .addCase(adminLeaveActionThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || 'Admin leave action failed.';
      });
  },
});

export const { clearAdminLeaveData } = adminSlice.actions;
export default adminSlice.reducer;
