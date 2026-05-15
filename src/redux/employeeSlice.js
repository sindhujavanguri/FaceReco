import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const EMPLOYEE_PROFILE_API_URL = 'https://api.apphrms.com/employee/profile.php';
const EMPLOYEE_DASHBOARD_API_URL = 'https://api.apphrms.com/employee/dashboard.php';
const EMPLOYEE_NAVIGATION_API_URL = 'https://api.apphrms.com/employee/navigation.php';
const EMPLOYEE_PROFILE_UPDATE_STATUS_API_URL =
  'https://api.apphrms.com/employee/profile-update-status.php';

let latestEmployeeProfileResponse = null;
let latestEmployeeDashboardResponse = null;
let latestEmployeeNavigationResponse = null;
let latestEmployeeProfileUpdateStatusResponse = null;

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

export const employeeProfileApi = async (token = getCurrentAuthToken()) => {
  const config = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(EMPLOYEE_PROFILE_API_URL, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config,
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || EMPLOYEE_PROFILE_API_URL,
  };

  console.log(fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Employee profile fetch failed.');
    error.response = fullResponse;
    console.log('Employee Profile Error:', error);
    throw error;
  }

  latestEmployeeProfileResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeProfileResponse = () => latestEmployeeProfileResponse;

export const employeeDashboardApi = async (token = getCurrentAuthToken()) => {
  const config = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(EMPLOYEE_DASHBOARD_API_URL, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config,
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || EMPLOYEE_DASHBOARD_API_URL,
  };

  console.log('Employee Dashboard Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Employee dashboard fetch failed.');
    error.response = fullResponse;
    console.log('Employee Dashboard Error:', error);
    throw error;
  }

  latestEmployeeDashboardResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeDashboardResponse = () =>
  latestEmployeeDashboardResponse;

export const employeeNavigationApi = async (token = getCurrentAuthToken()) => {
  const config = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(EMPLOYEE_NAVIGATION_API_URL, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config,
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || EMPLOYEE_NAVIGATION_API_URL,
  };

  console.log('Employee Navigation Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Employee navigation fetch failed.');
    error.response = fullResponse;
    console.log('Employee Navigation Error:', error);
    throw error;
  }

  latestEmployeeNavigationResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeNavigationResponse = () =>
  latestEmployeeNavigationResponse;

export const employeeProfileUpdateStatusApi = async (
  token = getCurrentAuthToken()
) => {
  const config = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(EMPLOYEE_PROFILE_UPDATE_STATUS_API_URL, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config,
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || EMPLOYEE_PROFILE_UPDATE_STATUS_API_URL,
  };

  console.log('Employee Profile Update Status Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(
      data?.message || 'Employee profile update status fetch failed.'
    );
    error.response = fullResponse;
    console.log('Employee Profile Update Status Error:', error);
    throw error;
  }

  latestEmployeeProfileUpdateStatusResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeProfileUpdateStatusResponse = () =>
  latestEmployeeProfileUpdateStatusResponse;

export const employeeProfileThunk = createAsyncThunk(
  'employee/employeeProfileThunk',
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeProfileApi(token);
      console.log('Employee Profile Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Profile Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeDashboardThunk = createAsyncThunk(
  'employee/employeeDashboardThunk',
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeDashboardApi(token);
      console.log('Employee Dashboard Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Dashboard Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeNavigationThunk = createAsyncThunk(
  'employee/employeeNavigationThunk',
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeNavigationApi(token);
      console.log('Employee Navigation Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Navigation Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const employeeProfileUpdateStatusThunk = createAsyncThunk(
  'employee/employeeProfileUpdateStatusThunk',
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeProfileUpdateStatusApi(token);
      console.log('Employee Profile Update Status Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Profile Update Status Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    profile: null,
    dashboard: null,
    navigation: null,
    profileUpdateStatus: null,
    fullResponse: null,
    dashboardFullResponse: null,
    navigationFullResponse: null,
    profileUpdateStatusFullResponse: null,
    loading: false,
    dashboardLoading: false,
    navigationLoading: false,
    profileUpdateStatusLoading: false,
    error: '',
    dashboardError: '',
    navigationError: '',
    profileUpdateStatusError: '',
  },
  reducers: {
    clearEmployeeProfile(state) {
      state.profile = null;
      state.dashboard = null;
      state.navigation = null;
      state.profileUpdateStatus = null;
      state.fullResponse = null;
      state.dashboardFullResponse = null;
      state.navigationFullResponse = null;
      state.profileUpdateStatusFullResponse = null;
      state.loading = false;
      state.dashboardLoading = false;
      state.navigationLoading = false;
      state.profileUpdateStatusLoading = false;
      state.error = '';
      state.dashboardError = '';
      state.navigationError = '';
      state.profileUpdateStatusError = '';
      latestEmployeeProfileResponse = null;
      latestEmployeeDashboardResponse = null;
      latestEmployeeNavigationResponse = null;
      latestEmployeeProfileUpdateStatusResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(employeeProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.fullResponse = action.payload;
        state.profile = action.payload?.data?.data || null;
      })
      .addCase(employeeProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Employee profile fetch failed.';
      })
      .addCase(employeeDashboardThunk.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = '';
      })
      .addCase(employeeDashboardThunk.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardFullResponse = action.payload;
        state.dashboard = action.payload?.data?.data || null;
      })
      .addCase(employeeDashboardThunk.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError =
          action.payload || 'Employee dashboard fetch failed.';
      })
      .addCase(employeeNavigationThunk.pending, (state) => {
        state.navigationLoading = true;
        state.navigationError = '';
      })
      .addCase(employeeNavigationThunk.fulfilled, (state, action) => {
        state.navigationLoading = false;
        state.navigationFullResponse = action.payload;
        state.navigation = action.payload?.data?.data || null;
      })
      .addCase(employeeNavigationThunk.rejected, (state, action) => {
        state.navigationLoading = false;
        state.navigationError =
          action.payload || 'Employee navigation fetch failed.';
      })
      .addCase(employeeProfileUpdateStatusThunk.pending, (state) => {
        state.profileUpdateStatusLoading = true;
        state.profileUpdateStatusError = '';
      })
      .addCase(employeeProfileUpdateStatusThunk.fulfilled, (state, action) => {
        state.profileUpdateStatusLoading = false;
        state.profileUpdateStatusFullResponse = action.payload;
        state.profileUpdateStatus = action.payload?.data?.data || null;
      })
      .addCase(employeeProfileUpdateStatusThunk.rejected, (state, action) => {
        state.profileUpdateStatusLoading = false;
        state.profileUpdateStatusError =
          action.payload || 'Employee profile update status fetch failed.';
      });
  },
});

export const { clearEmployeeProfile } = employeeSlice.actions;
export default employeeSlice.reducer;
