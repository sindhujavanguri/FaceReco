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

const readCurrentPosition = () =>
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
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  });

const readLocationText = async ({latitude, longitude}) => {
  try {
    const query = `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(
      longitude,
    )}&localityLanguage=en`;
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`,
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

export const getFaceAttendanceLocationPayload = async () => {
  const hasPermission = await requestAndroidLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied. Please allow location access and try again.');
  }

  const position = await readCurrentPosition();
  const {accuracy, latitude, longitude} = position?.coords || {};

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Unable to read current location. Please enable GPS and try again.');
  }

  const addressText = await readLocationText({latitude, longitude});
  if (!addressText) {
    throw new Error('Unable to detect location name. Please check internet and GPS.');
  }

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
