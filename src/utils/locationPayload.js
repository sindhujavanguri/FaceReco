import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';

let latestFaceAttendanceLocationPayload = null;

export const formatFaceAttendanceLocation = (locationPayload) => {
  if (locationPayload?.addressText) {
    return locationPayload.addressText;
  }

  return 'Location not available';
};

const requestAndroidLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const readPositionWithOptions = (options) =>
  new Promise((resolve, reject) => {
    if (!Geolocation?.getCurrentPosition) {
      reject(
        new Error(
          'Location service is not available in this app build. Please install geolocation and rebuild the app.',
        ),
      );
      return;
    }

    Geolocation.getCurrentPosition(resolve, reject, {
      maximumAge: 30000,
      timeout: 10000,
      ...options,
    });
  });

const withTimeout = (promise, timeout, timeoutMessage) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeout);
    }),
  ]);

const readCurrentPosition = async ({
  highAccuracy = true,
  highAccuracyTimeout = 8000,
  fallbackTimeout = 12000,
  maximumAge = 60000,
} = {}) => {
  if (!highAccuracy) {
    return readPositionWithOptions({
      enableHighAccuracy: false,
      maximumAge,
      timeout: fallbackTimeout,
    });
  }

  try {
    return await readPositionWithOptions({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: highAccuracyTimeout,
    });
  } catch (highAccuracyError) {
    console.log('Face Attendance High Accuracy Location Error:', highAccuracyError);
    return readPositionWithOptions({
      enableHighAccuracy: false,
      maximumAge,
      timeout: fallbackTimeout,
    });
  }
};

const readLocationText = async ({latitude, longitude, timeout = 3500}) => {
  try {
    const query = `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(
      longitude,
    )}&localityLanguage=en`;
    const response = await withTimeout(
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`),
      timeout,
      'Reverse geocode timed out.',
    );
    const data = await response.json();
    const locationParts = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ]
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index);

    return locationParts.join(', ');
  } catch (error) {
    console.log('Face Attendance Reverse Geocode Error:', error);
    return '';
  }
};

export const getFaceAttendanceLocationPayload = async ({
  highAccuracy = true,
  highAccuracyTimeout = 8000,
  fallbackTimeout = 12000,
  maximumAge = 60000,
  includeAddress = true,
  addressTimeout = 3500,
  fallbackToCoordinates = true,
} = {}) => {
  const hasPermission = await requestAndroidLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied. Please allow location access and try again.');
  }

  const position = await readCurrentPosition({
    highAccuracy,
    highAccuracyTimeout,
    fallbackTimeout,
    maximumAge,
  });
  const {accuracy, latitude, longitude} = position?.coords || {};

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Unable to read current location. Please enable GPS and try again.');
  }

  const coordinateText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  const addressText = includeAddress
    ? (await readLocationText({latitude, longitude, timeout: addressTimeout})) ||
      (fallbackToCoordinates ? coordinateText : '')
    : fallbackToCoordinates
      ? coordinateText
      : '';

  const locationPayload = {
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : '',
    addressText,
    latitude,
    longitude,
  };

  latestFaceAttendanceLocationPayload = locationPayload;
  return locationPayload;
};

export const getLatestFaceAttendanceLocationPayload = () =>
  latestFaceAttendanceLocationPayload;
