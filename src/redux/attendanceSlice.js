import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CLIENT_CODE, getCurrentAuthToken } from './loginSlice';

const EMPLOYEE_MONTHLY_ATTENDANCE_API_URL =
  'https://api.apphrms.com/employee/attendance/monthly.php';

let latestMonthlyAttendanceResponse = null;

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

export const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
};

export const employeeMonthlyAttendanceApi = async ({
  month = getCurrentMonth(),
  token = getCurrentAuthToken(),
} = {}) => {
  const url = `${EMPLOYEE_MONTHLY_ATTENDANCE_API_URL}?month=${encodeURIComponent(
    month
  )}`;
  const config = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Client-Code': CLIENT_CODE,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(url, config);
  const data = await parseResponse(response);

  const fullResponse = {
    config,
    data,
    headers: getResponseHeaders(response.headers),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || url,
  };

  console.log('Employee Monthly Attendance Full Response:', fullResponse);

  if (!response.ok || isApiFailure(data)) {
    const error = new Error(
      data?.message || 'Employee monthly attendance fetch failed.'
    );
    error.response = fullResponse;
    console.log('Employee Monthly Attendance Error:', error);
    throw error;
  }

  latestMonthlyAttendanceResponse = fullResponse;
  return fullResponse;
};

export const getCurrentMonthlyAttendanceResponse = () =>
  latestMonthlyAttendanceResponse;

export const employeeMonthlyAttendanceThunk = createAsyncThunk(
  'attendance/employeeMonthlyAttendanceThunk',
  async ({ month, token } = {}, { rejectWithValue }) => {
    try {
      const data = await employeeMonthlyAttendanceApi({ month, token });
      console.log('Employee Monthly Attendance Thunk Success:', data);
      return data;
    } catch (error) {
      console.log('Employee Monthly Attendance Thunk Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    monthly: null,
    monthlyFullResponse: null,
    loading: false,
    error: '',
  },
  reducers: {
    clearMonthlyAttendance(state) {
      state.monthly = null;
      state.monthlyFullResponse = null;
      state.loading = false;
      state.error = '';
      latestMonthlyAttendanceResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(employeeMonthlyAttendanceThunk.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(employeeMonthlyAttendanceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyFullResponse = action.payload;
        state.monthly = action.payload?.data?.data || null;
      })
      .addCase(employeeMonthlyAttendanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Employee monthly attendance fetch failed.';
      });
  },
});

export const { clearMonthlyAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
