import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const ADMIN_LOGIN_API_URL = 'https://api.apphrms.com/admin/login.php';
const ADMIN_LOGOUT_API_URL = 'https://api.apphrms.com/admin/logout.php';
const EMPLOYEE_LOGIN_API_URL = 'https://api.apphrms.com/employee/login.php';
const EMPLOYEE_LOGOUT_API_URL = 'https://api.apphrms.com/employee/logout.php';
const CLIENT_CODE = 'qa2';

let latestAuthToken = null;
let latestLoginMode = 'admin';
let latestAuthSession = null;

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

const encodeFormBody = (body) =>
  Object.entries(body)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`
    )
    .join('&');

const normalizeMode = (mode) => (mode === 'employee' ? 'employee' : 'admin');
const getModeLabel = (mode) => (mode === 'employee' ? 'Employee' : 'Admin');

const getAuthConfig = (mode) => {
  const normalizedMode = normalizeMode(mode);

  return {
    loginUrl:
      normalizedMode === 'employee'
        ? EMPLOYEE_LOGIN_API_URL
        : ADMIN_LOGIN_API_URL,
    logoutUrl:
      normalizedMode === 'employee'
        ? EMPLOYEE_LOGOUT_API_URL
        : ADMIN_LOGOUT_API_URL,
    mode: normalizedMode,
    contentType:
      normalizedMode === 'employee'
        ? 'application/json'
        : 'application/x-www-form-urlencoded',
  };
};

const buildRequestBody = (body, contentType) =>
  contentType === 'application/json' ? JSON.stringify(body) : encodeFormBody(body);

export const loginApi = async ({ email, password, mode = 'admin' }) => {
  const authConfig = getAuthConfig(mode);
  const requestBody = {
    client_code: CLIENT_CODE,
    username: email.trim(),
    password,
  };

  const config = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': authConfig.contentType,
      'X-Client-Code': CLIENT_CODE,
    },
    body: buildRequestBody(requestBody, authConfig.contentType),
  };

  const response = await fetch(authConfig.loginUrl, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config: {
      ...config,
      body: requestBody,
    },
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || authConfig.loginUrl,
  };

  console.log(`${getModeLabel(authConfig.mode)} Login Full Response:`, fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || `${authConfig.mode} login failed.`);
    error.response = fullResponse;
    console.log(`${getModeLabel(authConfig.mode)} Login Error:`, error);
    throw error;
  }

  latestAuthToken = data?.data?.auth?.token || null;
  latestLoginMode = authConfig.mode;
  latestAuthSession = {
    company: data?.data?.company || null,
    mode: authConfig.mode,
    user: data?.data?.user || null,
  };

  return fullResponse;
};

export const getCurrentAuthSession = () => latestAuthSession;

export const logoutApi = async (token = latestAuthToken, mode = latestLoginMode) => {
  const authConfig = getAuthConfig(mode);
  const requestBody = {
    client_code: CLIENT_CODE,
  };

  const config = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': authConfig.contentType,
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: buildRequestBody(requestBody, authConfig.contentType),
  };

  const response = await fetch(authConfig.logoutUrl, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config: {
      ...config,
      body: requestBody,
    },
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || authConfig.logoutUrl,
  };

  console.log(`${getModeLabel(authConfig.mode)} Logout Full Response:`, fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || `${authConfig.mode} logout failed.`);
    error.response = fullResponse;
    console.log(`${getModeLabel(authConfig.mode)} Logout Error:`, error);
    throw error;
  }

  latestAuthToken = null;
  latestAuthSession = null;

  return fullResponse;
};

export const loginThunk = createAsyncThunk(
  'login/loginThunk',
  async ({ email, password, mode }, { rejectWithValue }) => {
    try {
      const data = await loginApi({ email, password, mode });
      console.log('Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'login/logoutThunk',
  async ({ token, mode } = {}, { getState, rejectWithValue }) => {
    try {
      const authToken = token || getState()?.login?.token || latestAuthToken;
      const authMode = mode || getState()?.login?.mode || latestLoginMode;
      const data = await logoutApi(authToken, authMode);
      console.log('Logout Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Logout Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const loginSlice = createSlice({
  name: 'login',
  initialState: {
    user: null,
    token: null,
    mode: 'admin',
    loading: false,
    error: '',
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.mode = 'admin';
      state.loading = false;
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user =
          action.payload?.data?.data?.user ||
          action.payload?.data?.user ||
          action.payload?.data?.admin ||
          action.payload?.data?.data ||
          action.payload?.data ||
          action.payload;
        state.token =
          action.payload?.data?.data?.auth?.token ||
          action.payload?.data?.auth?.token ||
          action.payload?.data?.token ||
          action.payload?.data?.data?.token ||
          null;
        state.mode = normalizeMode(action.meta.arg?.mode);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.mode = 'admin';
        state.loading = false;
        state.error = '';
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = loginSlice.actions;
export default loginSlice.reducer;
