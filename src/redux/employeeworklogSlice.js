import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Config} from '../Config';
import {CLIENT_CODE, getCurrentAuthToken} from './loginSlice';

const WORK_LOG_OPTIONS_API_URL =
  `${Config.apiBaseUrl}/employee/worklogs/options.php`;
const WORK_LOG_LIST_API_URL =
  `${Config.apiBaseUrl}/employee/worklogs/list.php`;
const WORK_LOG_SAVE_API_URL =
  `${Config.apiBaseUrl}/employee/worklogs/save.php`;
const WORK_LOG_DELETE_API_URL =
  `${Config.apiBaseUrl}/employee/worklogs/delete.php`;

let latestWorkLogOptionsResponse = null;
let latestWorkLogListResponse = null;
let latestAddWorkLogResponse = null;
let latestEditWorkLogResponse = null;
let latestDeleteWorkLogResponse = null;

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

const appendQueryParam = (params, key, value) => {
  if (value !== null && value !== undefined && String(value).trim() !== '') {
    params.append(key, String(value).trim());
  }
};

export const employeeWorkLogOptionsApi = async ({
  token = getCurrentAuthToken(),
} = {}) => {
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(WORK_LOG_OPTIONS_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config,
    data,
    response,
    url: WORK_LOG_OPTIONS_API_URL,
  });

  console.log('Employee Work Log Options Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Work log options fetch failed.');
    error.response = fullResponse;
    console.log('Employee Work Log Options Error:', error);
    throw error;
  }

  latestWorkLogOptionsResponse = fullResponse;
  return fullResponse;
};

export const employeeWorkLogListApi = async ({
  date = '',
  from = '',
  limit = 50,
  month = '',
  page = 1,
  taskStatus = '',
  to = '',
  token = getCurrentAuthToken(),
  workType = '',
} = {}) => {
  const params = new URLSearchParams();
  appendQueryParam(params, 'month', month);
  appendQueryParam(params, 'date', date);
  appendQueryParam(params, 'from', from);
  appendQueryParam(params, 'to', to);
  appendQueryParam(params, 'work_type', workType);
  appendQueryParam(params, 'task_status', taskStatus);
  appendQueryParam(params, 'page', page);
  appendQueryParam(params, 'limit', limit);

  const queryString = params.toString();
  const url = queryString
    ? `${WORK_LOG_LIST_API_URL}?${queryString}`
    : WORK_LOG_LIST_API_URL;
  const config = {
    method: 'GET',
    headers: buildAuthHeaders(token),
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({config, data, response, url});

  console.log('Employee Work Log List Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Work logs fetch failed.');
    error.response = fullResponse;
    console.log('Employee Work Log List Error:', error);
    throw error;
  }

  latestWorkLogListResponse = fullResponse;
  return fullResponse;
};

export const addEmployeeWorkLogApi = async ({
  fromTime,
  narration,
  taskStatus,
  toTime,
  token = getCurrentAuthToken(),
  workDate,
  workType,
} = {}) => {
  const formData = new FormData();
  appendIfValue(formData, 'work_date', workDate);
  appendIfValue(formData, 'from_time', fromTime);
  appendIfValue(formData, 'to_time', toTime);
  appendIfValue(formData, 'work_type', workType);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'task_status', taskStatus);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(WORK_LOG_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: {from_time: fromTime, narration, task_status: taskStatus, to_time: toTime, work_date: workDate, work_type: workType},
    },
    data,
    response,
    url: WORK_LOG_SAVE_API_URL,
  });

  console.log('Add Employee Work Log Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Add work log failed.');
    error.response = fullResponse;
    console.log('Add Employee Work Log Error:', error);
    throw error;
  }

  latestAddWorkLogResponse = fullResponse;
  return fullResponse;
};

export const editEmployeeWorkLogApi = async ({
  fromTime,
  id,
  narration,
  taskStatus,
  toTime,
  token = getCurrentAuthToken(),
  workDate,
  workLogId,
  workType,
} = {}) => {
  const resolvedId = workLogId || id;
  const formData = new FormData();
  appendIfValue(formData, 'id', resolvedId);
  appendIfValue(formData, 'work_log_id', resolvedId);
  appendIfValue(formData, 'work_date', workDate);
  appendIfValue(formData, 'from_time', fromTime);
  appendIfValue(formData, 'to_time', toTime);
  appendIfValue(formData, 'work_type', workType);
  appendIfValue(formData, 'narration', narration);
  appendIfValue(formData, 'task_status', taskStatus);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(WORK_LOG_SAVE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {
      ...config,
      body: {
        from_time: fromTime,
        id: resolvedId,
        narration,
        task_status: taskStatus,
        to_time: toTime,
        work_date: workDate,
        work_log_id: resolvedId,
        work_type: workType,
      },
    },
    data,
    response,
    url: WORK_LOG_SAVE_API_URL,
  });

  console.log('Edit Employee Work Log Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Edit work log failed.');
    error.response = fullResponse;
    console.log('Edit Employee Work Log Error:', error);
    throw error;
  }

  latestEditWorkLogResponse = fullResponse;
  return fullResponse;
};

export const deleteEmployeeWorkLogApi = async ({
  id,
  token = getCurrentAuthToken(),
  workLogId,
} = {}) => {
  const resolvedId = workLogId || id;
  const formData = new FormData();
  appendIfValue(formData, 'id', resolvedId);
  appendIfValue(formData, 'work_log_id', resolvedId);

  const config = {
    method: 'POST',
    headers: buildAuthHeaders(token),
    body: formData,
  };

  const response = await fetch(WORK_LOG_DELETE_API_URL, config);
  const data = await parseResponse(response);
  const fullResponse = buildFullResponse({
    config: {...config, body: {id: resolvedId, work_log_id: resolvedId}},
    data,
    response,
    url: WORK_LOG_DELETE_API_URL,
  });

  console.log('Delete Employee Work Log Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(data?.message || 'Delete work log failed.');
    error.response = fullResponse;
    console.log('Delete Employee Work Log Error:', error);
    throw error;
  }

  latestDeleteWorkLogResponse = fullResponse;
  return fullResponse;
};

export const getCurrentEmployeeWorkLogOptionsResponse = () =>
  latestWorkLogOptionsResponse;
export const getCurrentEmployeeWorkLogListResponse = () =>
  latestWorkLogListResponse;
export const getCurrentAddEmployeeWorkLogResponse = () =>
  latestAddWorkLogResponse;
export const getCurrentEditEmployeeWorkLogResponse = () =>
  latestEditWorkLogResponse;
export const getCurrentDeleteEmployeeWorkLogResponse = () =>
  latestDeleteWorkLogResponse;

export const employeeWorkLogOptionsThunk = createAsyncThunk(
  'employeeWorkLogs/options',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await employeeWorkLogOptionsApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const employeeWorkLogListThunk = createAsyncThunk(
  'employeeWorkLogs/list',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await employeeWorkLogListApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addEmployeeWorkLogThunk = createAsyncThunk(
  'employeeWorkLogs/add',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await addEmployeeWorkLogApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const editEmployeeWorkLogThunk = createAsyncThunk(
  'employeeWorkLogs/edit',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await editEmployeeWorkLogApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteEmployeeWorkLogThunk = createAsyncThunk(
  'employeeWorkLogs/delete',
  async (payload = {}, {rejectWithValue}) => {
    try {
      return await deleteEmployeeWorkLogApi(payload);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const employeeWorkLogSlice = createSlice({
  name: 'employeeWorkLogs',
  initialState: {
    addFullResponse: null,
    deleteFullResponse: null,
    editFullResponse: null,
    error: '',
    listFullResponse: null,
    loading: false,
    logs: [],
    optionsFullResponse: null,
    saving: false,
  },
  reducers: {
    clearEmployeeWorkLogs(state) {
      state.addFullResponse = null;
      state.deleteFullResponse = null;
      state.editFullResponse = null;
      state.error = '';
      state.listFullResponse = null;
      state.loading = false;
      state.logs = [];
      state.optionsFullResponse = null;
      state.saving = false;
      latestWorkLogOptionsResponse = null;
      latestWorkLogListResponse = null;
      latestAddWorkLogResponse = null;
      latestEditWorkLogResponse = null;
      latestDeleteWorkLogResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeWorkLogOptionsThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(employeeWorkLogOptionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.optionsFullResponse = action.payload;
      })
      .addCase(employeeWorkLogListThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(employeeWorkLogListThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.listFullResponse = action.payload;
        state.logs = action.payload?.data?.data?.logs || [];
      })
      .addCase(addEmployeeWorkLogThunk.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(addEmployeeWorkLogThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.addFullResponse = action.payload;
      })
      .addCase(editEmployeeWorkLogThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.editFullResponse = action.payload;
      })
      .addCase(deleteEmployeeWorkLogThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.deleteFullResponse = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith('employeeWorkLogs/') &&
          action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.saving = false;
          state.error = action.payload || 'Work log request failed.';
        },
      );
  },
});

export const {clearEmployeeWorkLogs} = employeeWorkLogSlice.actions;
export default employeeWorkLogSlice.reducer;
