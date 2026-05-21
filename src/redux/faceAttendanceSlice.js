import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import { Config } from '../Config';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';
import { FACE_MODEL_NAME } from '../utils/faceEmbedding';

const FACE_ATTENDANCE_REGISTER_API_URL =
  `${Config.apiBaseUrl}/employee/face-attendance/register.php`;
const FACE_ATTENDANCE_EDIT_API_URL =
  `${Config.apiBaseUrl}/employee/face-attendance/edit.php`;
const FACE_ATTENDANCE_VIEW_API_URL =
  `${Config.apiBaseUrl}/employee/face-attendance/view.php`;
const FACE_ATTENDANCE_PUNCH_API_URL =
  `${Config.apiBaseUrl}/employee/face-attendance/punch.php`;
const FACE_ATTENDANCE_TODAY_API_URL =
  `${Config.apiBaseUrl}/employee/face-attendance/today.php`;

let latestRegisterResponse = null;
let latestEditResponse = null;
let latestViewResponse = null;
let latestLoginPunchResponse = null;
let latestLogoutPunchResponse = null;
let latestTodayStatusResponse = null;

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

const appendIfValue = (formData, key, value) => {
  if (value !== null && value !== undefined && value !== '') {
    formData.append(key, value);
  }
};

const createBaseHeaders = (token) => ({
  Accept: 'application/json',
  'X-Client-Code': CLIENT_CODE,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const createFullResponse = ({config, data, response, url}) => ({
  config,
  data,
  headers: getResponseHeaders(response.headers),
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  url: response.url || url,
});

export const getDeviceId = () => `${Platform.OS}-face-attendance`;

export const faceAttendanceRegisterApi = async ({
  accuracy,
  action = 'login',
  addressText,
  faceEmbedding,
  faceImage,
  latitude,
  longitude,
  modelName = FACE_MODEL_NAME,
  deviceId = getDeviceId(),
  token = getCurrentAuthToken(),
}) => {
  const formData = new FormData();
  formData.append('face_image', faceImage);
  appendIfValue(formData, 'selfie', faceImage);
  appendIfValue(formData, 'action', action);
  formData.append('face_embedding', JSON.stringify(faceEmbedding || []));
  appendIfValue(formData, 'latitude', latitude);
  appendIfValue(formData, 'longitude', longitude);
  appendIfValue(formData, 'accuracy', accuracy);
  appendIfValue(formData, 'address_text', addressText);
  formData.append('model_name', modelName);
  formData.append('device_id', deviceId);

  const config = {
    method: 'POST',
    headers: createBaseHeaders(token),
    body: formData,
  };

  const response = await fetch(FACE_ATTENDANCE_REGISTER_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = createFullResponse({
    config: {
      ...config,
      body: {
        accuracy,
        action,
        address_text: addressText,
        device_id: deviceId,
        face_embedding: faceEmbedding,
        face_image: faceImage,
        latitude,
        longitude,
        model_name: modelName,
        selfie: faceImage,
      },
    },
    data,
    response,
    url: FACE_ATTENDANCE_REGISTER_API_URL,
  });

  console.log('Face Attendance Register Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Face registration failed.');
    error.response = fullResponse;
    console.log('Face Attendance Register Error:', error);
    throw error;
  }

  latestRegisterResponse = fullResponse;
  return fullResponse;
};

export const faceAttendanceEditApi = async ({
  faceEmbedding,
  faceImage,
  modelName = FACE_MODEL_NAME,
  deviceId = getDeviceId(),
  token = getCurrentAuthToken(),
}) => {
  const formData = new FormData();
  appendIfValue(formData, 'face_image', faceImage);
  formData.append('face_embedding', JSON.stringify(faceEmbedding || []));
  formData.append('model_name', modelName);
  formData.append('device_id', deviceId);

  const config = {
    method: 'POST',
    headers: createBaseHeaders(token),
    body: formData,
  };

  const response = await fetch(FACE_ATTENDANCE_EDIT_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = createFullResponse({
    config: {
      ...config,
      body: {
        device_id: deviceId,
        face_embedding: faceEmbedding,
        face_image: faceImage,
        model_name: modelName,
      },
    },
    data,
    response,
    url: FACE_ATTENDANCE_EDIT_API_URL,
  });

  console.log('Face Attendance Edit Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Face profile update failed.');
    error.response = fullResponse;
    console.log('Face Attendance Edit Error:', error);
    throw error;
  }

  latestEditResponse = fullResponse;
  return fullResponse;
};

export const faceAttendanceViewApi = async ({
  accuracy,
  action = 'login',
  addressText,
  deviceId = getDeviceId(),
  faceEmbedding,
  latitude,
  longitude,
  selfie,
  token = getCurrentAuthToken(),
} = {}) => {
  const formData = new FormData();
  appendIfValue(formData, 'selfie', selfie);
  appendIfValue(formData, 'action', action);
  appendIfValue(
    formData,
    'face_embedding',
    Array.isArray(faceEmbedding) ? JSON.stringify(faceEmbedding) : faceEmbedding,
  );
  appendIfValue(formData, 'latitude', latitude);
  appendIfValue(formData, 'longitude', longitude);
  appendIfValue(formData, 'accuracy', accuracy);
  appendIfValue(formData, 'address_text', addressText);
  appendIfValue(formData, 'device_id', deviceId);

  const config = {
    method: 'POST',
    headers: createBaseHeaders(token),
    body: formData,
  };

  const response = await fetch(FACE_ATTENDANCE_VIEW_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = createFullResponse({
    config: {
      ...config,
      body: {
        accuracy,
        action,
        address_text: addressText,
        device_id: deviceId,
        face_embedding: faceEmbedding,
        latitude,
        longitude,
        selfie,
      },
    },
    data,
    response,
    url: FACE_ATTENDANCE_VIEW_API_URL,
  });

  console.log('Face Attendance View Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Face profile fetch failed.');
    error.response = fullResponse;
    console.log('Face Attendance View Error:', error);
    throw error;
  }

  latestViewResponse = fullResponse;
  return fullResponse;
};

export const faceAttendancePunchApi = async ({
  accuracy,
  action,
  addressText,
  deviceId = getDeviceId(),
  faceEmbedding,
  latitude,
  longitude,
  selfie,
  token = getCurrentAuthToken(),
}) => {
  const normalizedAction = action === 'logout' ? 'logout' : 'login';
  const formData = new FormData();
  formData.append('selfie', selfie);
  formData.append('action', normalizedAction);
  formData.append('face_embedding', JSON.stringify(faceEmbedding || []));
  appendIfValue(formData, 'latitude', latitude);
  appendIfValue(formData, 'longitude', longitude);
  appendIfValue(formData, 'accuracy', accuracy);
  appendIfValue(formData, 'address_text', addressText);
  appendIfValue(formData, 'device_id', deviceId);

  const config = {
    method: 'POST',
    headers: createBaseHeaders(token),
    body: formData,
  };

  const response = await fetch(FACE_ATTENDANCE_PUNCH_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = createFullResponse({
    config: {
      ...config,
      body: {
        accuracy,
        action: normalizedAction,
        address_text: addressText,
        device_id: deviceId,
        face_embedding: faceEmbedding,
        latitude,
        longitude,
        selfie,
      },
    },
    data,
    response,
    url: FACE_ATTENDANCE_PUNCH_API_URL,
  });
  const label = normalizedAction === 'logout' ? 'Logout' : 'Login';

  console.log(`Face Attendance ${label} Punch Full Response:`, fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || `Face ${normalizedAction} punch failed.`);
    error.response = fullResponse;
    console.log(`Face Attendance ${label} Punch Error:`, error);
    throw error;
  }

  if (normalizedAction === 'logout') {
    latestLogoutPunchResponse = fullResponse;
  } else {
    latestLoginPunchResponse = fullResponse;
  }

  return fullResponse;
};

export const faceAttendanceTodayStatusApi = async (token = getCurrentAuthToken()) => {
  const config = {
    method: 'GET',
    headers: createBaseHeaders(token),
  };

  const response = await fetch(FACE_ATTENDANCE_TODAY_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = createFullResponse({
    config,
    data,
    response,
    url: FACE_ATTENDANCE_TODAY_API_URL,
  });

  console.log('Face Attendance Today Status Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Face attendance today status failed.');
    error.response = fullResponse;
    console.log('Face Attendance Today Status Error:', error);
    throw error;
  }

  latestTodayStatusResponse = fullResponse;
  return fullResponse;
};

export const getCurrentFaceAttendanceTodayStatusResponse = () =>
  latestTodayStatusResponse;

export const getCurrentFaceAttendanceRegisterResponse = () =>
  latestRegisterResponse;
export const getCurrentFaceAttendanceEditResponse = () =>
  latestEditResponse;
export const getCurrentFaceAttendanceViewResponse = () =>
  latestViewResponse;
export const getCurrentFaceAttendanceLoginPunchResponse = () =>
  latestLoginPunchResponse;
export const getCurrentFaceAttendanceLogoutPunchResponse = () =>
  latestLogoutPunchResponse;

export const faceAttendanceRegisterThunk = createAsyncThunk(
  'faceAttendance/register',
  async (payload, {rejectWithValue}) => {
    try {
      return await faceAttendanceRegisterApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const faceAttendanceEditThunk = createAsyncThunk(
  'faceAttendance/edit',
  async (payload, {rejectWithValue}) => {
    try {
      return await faceAttendanceEditApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const faceAttendanceViewThunk = createAsyncThunk(
  'faceAttendance/view',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await faceAttendanceViewApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const faceAttendancePunchThunk = createAsyncThunk(
  'faceAttendance/punch',
  async (payload, {rejectWithValue}) => {
    try {
      return await faceAttendancePunchApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const faceAttendanceTodayStatusThunk = createAsyncThunk(
  'faceAttendance/todayStatus',
  async (_, {rejectWithValue}) => {
    try {
      return await faceAttendanceTodayStatusApi();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const faceAttendanceSlice = createSlice({
  name: 'faceAttendance',
  initialState: {
    error: '',
    latestAction: '',
    loading: false,
    editFullResponse: null,
    loginPunchFullResponse: null,
    logoutPunchFullResponse: null,
    registerFullResponse: null,
    todayStatus: null,
    todayStatusFullResponse: null,
    viewFullResponse: null,
  },
  reducers: {
    clearFaceAttendance(state) {
      state.error = '';
      state.latestAction = '';
      state.loading = false;
      state.editFullResponse = null;
      state.loginPunchFullResponse = null;
      state.logoutPunchFullResponse = null;
      state.registerFullResponse = null;
      state.todayStatus = null;
      state.todayStatusFullResponse = null;
      state.viewFullResponse = null;
      latestRegisterResponse = null;
      latestEditResponse = null;
      latestViewResponse = null;
      latestLoginPunchResponse = null;
      latestLogoutPunchResponse = null;
      latestTodayStatusResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(faceAttendanceRegisterThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.latestAction = 'register';
      })
      .addCase(faceAttendanceRegisterThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.registerFullResponse = action.payload;
      })
      .addCase(faceAttendanceEditThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.latestAction = 'edit';
      })
      .addCase(faceAttendanceEditThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.editFullResponse = action.payload;
      })
      .addCase(faceAttendanceViewThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.latestAction = 'view';
      })
      .addCase(faceAttendanceViewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.viewFullResponse = action.payload;
      })
      .addCase(faceAttendancePunchThunk.pending, (state, action) => {
        state.loading = true;
        state.error = '';
        state.latestAction = action.meta.arg?.action || 'login';
      })
      .addCase(faceAttendancePunchThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg?.action === 'logout') {
          state.logoutPunchFullResponse = action.payload;
        } else {
          state.loginPunchFullResponse = action.payload;
        }
      })
      .addCase(faceAttendanceTodayStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.latestAction = 'today';
      })
      .addCase(faceAttendanceTodayStatusThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.todayStatusFullResponse = action.payload;
        state.todayStatus = action.payload?.data?.data || action.payload?.data || null;
      })
      .addMatcher(
        (action) => action.type.startsWith('faceAttendance/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'Face attendance request failed.';
        },
      );
  },
});

export const { clearFaceAttendance } = faceAttendanceSlice.actions;
export default faceAttendanceSlice.reducer;
