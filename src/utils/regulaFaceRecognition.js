import ReactNativeBlobUtil from 'react-native-blob-util';
import {NativeModules} from 'react-native';
import {
  FaceSDK,
  ImageType,
  MatchFacesImage,
  MatchFacesRequest,
} from '@regulaforensics/face-sdk';
import {getCurrentAuthToken} from '../redux/loginSlice';

export const REGULA_FACE_MATCH_THRESHOLD = 0.95;
export const REGULA_FACE_MODEL_NAME = 'regula-face-sdk-match-v1';

let initializePromise = null;

const getReadableError = (error) =>
  error?.message || error?.underlyingError?.message || String(error || '');

export const getRegulaFaceRecognitionStatus = () => ({
  ok: !!NativeModules.RNFaceSDK,
});

export const ensureRegulaFaceSdkInitialized = async () => {
  if (!getRegulaFaceRecognitionStatus().ok) {
    throw new Error('Face recognition SDK is unavailable on this device build.');
  }

  if (!initializePromise) {
    initializePromise = FaceSDK.instance.initialize({}).then(([success, error]) => {
      if (!success || error) {
        throw new Error(error?.message || 'Face recognition SDK initialization failed.');
      }
      return true;
    });
  }

  return initializePromise;
};

const createAuthorizedHeaders = () => {
  const token = getCurrentAuthToken();

  return {
    Accept: 'image/*,*/*',
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  };
};

const normalizeLocalPath = (uri = '') =>
  uri.startsWith('file://') ? uri.replace('file://', '') : uri;

const getMimeType = (uri = '') => {
  const normalizedUri = uri.toLowerCase();

  if (normalizedUri.includes('.png')) {
    return 'image/png';
  }

  if (normalizedUri.includes('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const asDataUrl = (base64, uri) => `data:${getMimeType(uri)};base64,${base64}`;

const readImageAsDataUrl = async (uri) => {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Registered face image is missing.');
  }

  if (uri.startsWith('data:')) {
    return uri;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await ReactNativeBlobUtil.config({fileCache: false}).fetch(
      'GET',
      uri,
      createAuthorizedHeaders(),
    );
    return asDataUrl(response.base64(), uri);
  }

  const base64 = await ReactNativeBlobUtil.fs.readFile(normalizeLocalPath(uri), 'base64');
  return asDataUrl(base64, uri);
};

export const verifyRegulaFaceMatch = async ({liveImageUri, registeredImageUri}) => {
  try {
    await ensureRegulaFaceSdkInitialized();

    const [liveImage, registeredImage] = await Promise.all([
      readImageAsDataUrl(liveImageUri),
      readImageAsDataUrl(registeredImageUri),
    ]);
    const request = new MatchFacesRequest([
      new MatchFacesImage(liveImage, ImageType.LIVE),
      new MatchFacesImage(registeredImage, ImageType.LIVE),
    ]);
    const response = await FaceSDK.instance.matchFaces(request);

    if (response?.error) {
      throw new Error(getReadableError(response.error));
    }

    const split = await FaceSDK.instance.splitComparedFaces(
      response?.results || [],
      REGULA_FACE_MATCH_THRESHOLD,
    );
    const bestMatch = split?.matchedFaces?.[0];
    const similarity = Number(bestMatch?.similarity || 0);
    const isMatch = similarity >= REGULA_FACE_MATCH_THRESHOLD;

    return {
      isMatch,
      reason: isMatch ? '' : 'Face does not match the registered employee face.',
      similarity,
    };
  } catch (error) {
    console.log('Regula Face Match Error:', error);
    return {
      error,
      isMatch: false,
      reason:
        getReadableError(error) ||
        'Face recognition failed. Please re-register the employee face.',
      similarity: 0,
    };
  }
};
