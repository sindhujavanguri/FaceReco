import {
  FaceDetectorClassificationMode,
  FaceDetectorContourMode,
  FaceDetectorLandmarkMode,
  FaceDetectorPerformanceMode,
} from 'react-native-face-detection';

export const FACE_MODEL_NAME = 'mlkit-face-descriptor-v2';
export const FACE_MATCH_COSINE_THRESHOLD = 0.9;
export const FACE_MATCH_DISTANCE_THRESHOLD = 0.18;
export const MIN_FACE_VECTOR_VALUES = 24;

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

const getFaceBounds = (face = {}) => {
  const box = face.boundingBox;

  if (Array.isArray(box)) {
    const [left = 0, top = 0, right = 0, bottom = 0] = box;
    return {
      height: normalizeNumber(Math.abs(bottom - top)),
      width: normalizeNumber(Math.abs(right - left)),
      x: normalizeNumber(Math.min(left, right)),
      y: normalizeNumber(Math.min(top, bottom)),
    };
  }

  if (box && typeof box === 'object') {
    const x = box.x ?? box.left ?? box.origin?.x ?? 0;
    const y = box.y ?? box.top ?? box.origin?.y ?? 0;
    const width = box.width ?? box.size?.width ?? Math.abs((box.right ?? 0) - x);
    const height = box.height ?? box.size?.height ?? Math.abs((box.bottom ?? 0) - y);

    return {
      height: normalizeNumber(height),
      width: normalizeNumber(width),
      x: normalizeNumber(x),
      y: normalizeNumber(y),
    };
  }

  return {height: 0, width: 0, x: 0, y: 0};
};

const normalizePointToFace = (point = {}, bounds = {}) => {
  const width = Math.max(Math.abs(bounds.width || 0), 1);
  const height = Math.max(Math.abs(bounds.height || 0), 1);
  const centerX = (bounds.x || 0) + width / 2;
  const centerY = (bounds.y || 0) + height / 2;
  const pointX = Array.isArray(point) ? point[0] : point.x;
  const pointY = Array.isArray(point) ? point[1] : point.y;

  return [
    normalizeNumber((Number(pointX) - centerX) / width),
    normalizeNumber((Number(pointY) - centerY) / height),
  ];
};

const normalizePose = (value) =>
  normalizeNumber(Math.max(-1, Math.min(1, Number(value || 0) / 45)));

const normalizeProbability = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? normalizeNumber(numberValue) : -1;
};

export const buildFaceDescriptorVector = (face = {}) => {
  const landmarks = Array.isArray(face.landmarks) ? face.landmarks : [];
  const contours = Array.isArray(face.faceContours) ? face.faceContours : [];
  const bounds = getFaceBounds(face);
  const width = Math.max(Math.abs(bounds.width), 1);
  const height = Math.max(Math.abs(bounds.height), 1);

  return [
    normalizeNumber(width / height),
    normalizePose(face.headEulerAngleX),
    normalizePose(face.headEulerAngleY),
    normalizePose(face.headEulerAngleZ),
    normalizeProbability(face.leftEyeOpenProbability),
    normalizeProbability(face.rightEyeOpenProbability),
    normalizeProbability(face.smilingProbability),
    ...landmarks.flatMap((landmark) =>
      normalizePointToFace(landmark.position, bounds),
    ),
    ...contours.flatMap((contour) =>
      (contour.points || []).flatMap((point) =>
        normalizePointToFace(point, bounds),
      ),
    ),
  ];
};

export const createFaceEmbeddingPayload = ({face}) =>
  buildFaceDescriptorVector(face);

export const parseFaceEmbeddingPayload = (value) => {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch (error) {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter(Number.isFinite);
  }
};

export const getProfileFaceEmbedding = (profile = {}) =>
  parseFaceEmbeddingPayload(
    profile.face_embedding ||
      profile.embedding ||
      profile.embedding_json ||
      profile.faceEmbedding,
  );

const cosineSimilarity = (left, right, length) => {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = Number(left[index] || 0);
    const rightValue = Number(right[index] || 0);
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const meanAbsoluteDistance = (left, right, length) => {
  let total = 0;

  for (let index = 0; index < length; index += 1) {
    total += Math.abs(Number(left[index] || 0) - Number(right[index] || 0));
  }

  return total / length;
};

export const compareFaceEmbeddings = (
  liveEmbedding = [],
  registeredEmbedding = [],
) => {
  const length = Math.min(liveEmbedding.length, registeredEmbedding.length);

  if (length < MIN_FACE_VECTOR_VALUES) {
    return {
      distance: 1,
      isMatch: false,
      reason: 'Face embedding is incomplete. Please re-register the face.',
      similarity: 0,
    };
  }

  const similarity = cosineSimilarity(liveEmbedding, registeredEmbedding, length);
  const distance = meanAbsoluteDistance(liveEmbedding, registeredEmbedding, length);
  const isMatch =
    similarity >= FACE_MATCH_COSINE_THRESHOLD &&
    distance <= FACE_MATCH_DISTANCE_THRESHOLD;

  return {
    distance: normalizeNumber(distance),
    isMatch,
    reason: isMatch ? '' : 'This face does not match the registered employee face.',
    similarity: normalizeNumber(similarity),
  };
};

export const validateSingleFaceCapture = (faces = []) => {
  if (!faces?.length) {
    return {error: 'No face detected. Please scan again.'};
  }

  if (faces.length > 1) {
    return {error: 'Multiple faces detected. Please scan only the registered employee face.'};
  }

  const face = faces[0];
  const bounds = getFaceBounds(face);

  if (bounds.width < 40 || bounds.height < 40) {
    return {error: 'Face is too small. Move closer and keep only your face in the guide.'};
  }

  const faceEmbedding = createFaceEmbeddingPayload({face});

  if (faceEmbedding.length < MIN_FACE_VECTOR_VALUES) {
    return {error: 'Face detail is not clear. Retake with your full face visible.'};
  }

  return {face, faceEmbedding};
};

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
