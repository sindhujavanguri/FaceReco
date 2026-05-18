import {
  FaceDetectorClassificationMode,
  FaceDetectorContourMode,
  FaceDetectorLandmarkMode,
  FaceDetectorPerformanceMode,
} from 'react-native-face-detection';

export const FACE_MODEL_NAME = 'mlkit-face-descriptor-v1';

export const faceDetectionOptions = {
  classificationMode: FaceDetectorClassificationMode.ALL,
  contourMode: FaceDetectorContourMode.ALL,
  landmarkMode: FaceDetectorLandmarkMode.ALL,
  minFaceSize: 0.15,
  performanceMode: FaceDetectorPerformanceMode.ACCURATE,
};

const normalizeNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Number(numberValue.toFixed(6)) : fallback;
};

const flattenPoint = (point = {}) => [
  normalizeNumber(point.x),
  normalizeNumber(point.y),
];

export const buildFaceDescriptorVector = (face = {}) => {
  const boundingBox = Array.isArray(face.boundingBox) ? face.boundingBox : [];
  const landmarks = Array.isArray(face.landmarks) ? face.landmarks : [];
  const contours = Array.isArray(face.faceContours) ? face.faceContours : [];

  return [
    ...boundingBox.slice(0, 4).map((value) => normalizeNumber(value)),
    normalizeNumber(face.headEulerAngleX),
    normalizeNumber(face.headEulerAngleY),
    normalizeNumber(face.headEulerAngleZ),
    normalizeNumber(face.leftEyeOpenProbability, -1),
    normalizeNumber(face.rightEyeOpenProbability, -1),
    normalizeNumber(face.smilingProbability, -1),
    ...landmarks.flatMap((landmark) => flattenPoint(landmark.position)),
    ...contours.flatMap((contour) =>
      (contour.points || []).flatMap((point) => flattenPoint(point)),
    ),
  ];
};

export const createFaceEmbeddingPayload = ({face}) =>
  buildFaceDescriptorVector(face);

export const createRegistrationEmbeddingPayload = (captures = []) => {
  const validCaptures = captures.filter(
    (capture) => Array.isArray(capture?.faceEmbedding) && capture.faceEmbedding.length,
  );
  const vectors = validCaptures.map((capture) => capture.faceEmbedding);

  if (!vectors.length) {
    return [];
  }

  const vectorLength = Math.min(...vectors.map((vector) => vector.length));
  const averagedVector = Array.from({length: vectorLength}, (_, index) =>
    normalizeNumber(
      vectors.reduce((sum, vector) => sum + Number(vector[index] || 0), 0) / vectors.length,
    ),
  );

  return averagedVector;
};

export const createImageFormFile = (uri, name = 'face.jpg') => ({
  name,
  type: 'image/jpeg',
  uri,
});
