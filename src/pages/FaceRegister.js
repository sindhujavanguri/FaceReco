import React, {useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FaceDetection from 'react-native-face-detection';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import {faceAttendanceRegisterApi, faceAttendanceTodayStatusApi} from '../redux/faceAttendanceSlice';
import {
  createImageFormFile,
  createRegistrationEmbeddingPayload,
  faceDetectionOptions,
  validateSingleFaceCapture,
} from '../utils/faceEmbedding';
import {getFaceAttendanceLocationPayload} from '../utils/locationPayload';

const MIN_FACE_SAMPLES = 1;
const MAX_FACE_SAMPLES = 4;

const formatEmbeddingPreview = (embedding = []) => {
  if (!Array.isArray(embedding) || !embedding.length) {
    return 'Embedding not available';
  }

  const preview = embedding
    .slice(0, 6)
    .map((value) => Number(value).toFixed(3))
    .join(', ');

  return `[${preview}${embedding.length > 6 ? ', ...' : ''}]`;
};

const formatEmbeddingPattern = (embedding = []) => {
  if (!Array.isArray(embedding) || !embedding.length) {
    return '[]';
  }

  return `[${embedding.map((value) => Number(value).toFixed(3)).join(', ')}]`;
};

function FaceRegister({navigate}) {
  const cameraRef = useRef(null);
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();
  const {hasPermission, requestPermission} = useCameraPermission();

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturedFaces, setCapturedFaces] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState(
    `Open camera and capture 1 to ${MAX_FACE_SAMPLES} face images.`,
  );

  const showCamera = cameraEnabled && hasPermission && device;
  const capturedCount = capturedFaces.length;
  const registrationReady = capturedCount >= MIN_FACE_SAMPLES;
  const latestCapturedFace = capturedFaces[capturedCount - 1];
  const latestEmbeddingCount = latestCapturedFace?.faceEmbedding?.length || 0;

  const openCamera = async () => {
    if (!device) {
      setStatusText('No front camera found on this device.');
      return false;
    }

    if (!hasPermission) {
      setStatusText('Requesting camera permission...');
      const granted = await requestPermission();
      if (!granted) {
        setCameraEnabled(false);
        setStatusText('Camera permission denied.');
        return false;
      }
    }

    setCameraEnabled(true);
    setStatusText('Camera ready. Keep your face inside the guide.');
    return true;
  };

  const captureFace = async () => {
    if (!showCamera) {
      await openCamera();
      return;
    }

    try {
      setIsCapturing(true);
      setStatusText('Capturing and creating face embedding...');

      const photo = await photoOutput.capturePhotoToFile(
        {enableShutterSound: true, flashMode: 'off'},
        {},
      );

      if (!photo?.filePath) {
        setStatusText('Unable to save captured photo. Please try again.');
        return;
      }

      const uri = photo.filePath.startsWith('file://')
        ? photo.filePath
        : `file://${photo.filePath}`;
      const faces = await FaceDetection.processImage(photo.filePath, faceDetectionOptions);

      const faceCapture = validateSingleFaceCapture(faces);
      if (faceCapture.error) {
        setStatusText(faceCapture.error);
        return;
      }

      const faceEmbedding = faceCapture.faceEmbedding;
      const nextCaptureNumber = Math.min(capturedCount + 1, MAX_FACE_SAMPLES);
      const capturedImage = {
        faceEmbedding,
        file: createImageFormFile(uri, `face-register-${nextCaptureNumber}.jpg`),
        id: `${Date.now()}-${nextCaptureNumber}`,
        uri,
      };
      const nextCapturedFaces = [...capturedFaces, capturedImage].slice(-MAX_FACE_SAMPLES);

      setCapturedFaces(nextCapturedFaces);
      setStatusText(
        nextCapturedFaces.length >= MIN_FACE_SAMPLES
          ? 'Face embedding is ready. Tap Register Face.'
          : `Saved ${nextCapturedFaces.length}. Capture ${MIN_FACE_SAMPLES - nextCapturedFaces.length} more face image${MIN_FACE_SAMPLES - nextCapturedFaces.length === 1 ? '' : 's'}.`,
      );
    } catch (error) {
      console.log('Face Register Capture Error:', error);
      setStatusText('Unable to capture face. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRegister = async () => {
    if (!registrationReady) {
      setStatusText(`Capture at least ${MIN_FACE_SAMPLES} face images before registering.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusText('Registering face...');
      const registrationEmbedding = createRegistrationEmbeddingPayload(capturedFaces);
      const locationPayload = await getFaceAttendanceLocationPayload();
      await faceAttendanceRegisterApi({
        faceEmbedding: registrationEmbedding,
        faceImage: latestCapturedFace.file,
        ...locationPayload,
      });
      try {
        await faceAttendanceTodayStatusApi();
      } catch (statusError) {
        console.log('Face Register Today Status Refresh Error:', statusError?.response || statusError);
      }
      setStatusText('Face registered successfully.');
      navigate?.('home', {
        faceRegistered: true,
        refreshFaceAttendance: Date.now(),
      });
    } catch (error) {
      console.log('Face Register Submit Error:', error?.response || error);
      setStatusText(error.message || 'Face registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cameraPanel}>
          <View style={styles.cameraHeader}>
            <View>
              <Text style={styles.title}>Face Register</Text>
              <Text style={styles.subtitle}>Capture face image and embedding</Text>
            </View>
            <View style={[styles.liveBadge, showCamera && styles.liveBadgeActive]}>
              <Text style={[styles.liveBadgeText, showCamera && styles.liveBadgeTextActive]}>
                {showCamera ? 'LIVE' : 'READY'}
              </Text>
            </View>
          </View>

          <View style={styles.previewBox}>
            {showCamera ? (
              <Camera
                ref={cameraRef}
                device={device}
                isActive={true}
                outputs={[photoOutput]}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
            ) : latestCapturedFace?.uri ? (
              <Image source={{uri: latestCapturedFace.uri}} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewIcon}>+</Text>
                <Text style={styles.previewText}>Camera preview</Text>
              </View>
            )}
            <View style={styles.faceGuide} />
          </View>

          <Text style={styles.statusText}>{statusText}</Text>

          {latestCapturedFace && (
            <View style={styles.latestCapturePanel}>
              <Text style={styles.embeddingLabel}>CAPTURED IMAGE</Text>
              <Image source={{uri: latestCapturedFace.uri}} style={styles.latestCaptureImage} />
              <View style={styles.embeddingStatsRow}>
                <Text style={styles.embeddingStatsLabel}>FACE EMBEDDING COUNT</Text>
                <Text style={styles.embeddingStatsValue}>{latestEmbeddingCount}</Text>
              </View>
              <Text style={styles.embeddingStatsLabel}>FACE EMBEDDING</Text>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.embeddingPatternScroller}
              >
                <Text style={styles.embeddingPatternText}>
                  {formatEmbeddingPattern(latestCapturedFace.faceEmbedding)}
                </Text>
              </ScrollView>
            </View>
          )}

          <View style={styles.capturedPanel}>
            <View style={styles.captureSummaryRow}>
              <Text style={styles.embeddingLabel}>CAPTURED IMAGES</Text>
              <Text style={[styles.captureCount, registrationReady && styles.captureCountReady]}>
                {capturedCount}/{MAX_FACE_SAMPLES}
              </Text>
            </View>
            <View style={styles.thumbnailRow}>
              {Array.from({length: MAX_FACE_SAMPLES}).map((_, index) => {
                const capture = capturedFaces[index];
                return (
                  <View key={capture?.id || `empty-${index}`} style={styles.captureItem}>
                    <View style={styles.thumbnailSlot}>
                      {capture ? (
                        <Image source={{uri: capture.uri}} style={styles.thumbnailImage} />
                      ) : (
                        <Text style={styles.thumbnailEmpty}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={styles.embeddingPreview} numberOfLines={3}>
                      {capture ? formatEmbeddingPreview(capture.faceEmbedding) : 'No embedding'}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.embeddingValue}>
              {registrationReady
                ? `Numeric face vector ready from ${capturedCount} saved image${capturedCount === 1 ? '' : 's'}.`
                : 'Images will appear here after capture.'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture face"
            disabled={isCapturing || isSubmitting}
            onPress={showCamera ? captureFace : openCamera}
            style={({pressed}) => [
              styles.secondaryButton,
              (isCapturing || isSubmitting) && styles.buttonDisabled,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {isCapturing
                ? 'Capturing...'
                : showCamera
                  ? capturedCount >= MAX_FACE_SAMPLES
                    ? 'Replace Oldest Capture'
                    : 'Capture Face'
                  : 'Open Camera'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Register face"
            disabled={isSubmitting || !registrationReady}
            onPress={handleRegister}
            style={({pressed}) => [
              styles.primaryButton,
              (isSubmitting || !registrationReady) && styles.buttonDisabled,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Registering...' : 'Register Face'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f5f8fb',
    flex: 1,
  },
  scrollContent: {
    padding: 18,
  },
  cameraPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cameraHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#113a70',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#6b7f99',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  liveBadge: {
    backgroundColor: '#e9f2fb',
    borderColor: '#cfe0ef',
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveBadgeActive: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  liveBadgeText: {
    color: '#3d5a75',
    fontSize: 10,
    fontWeight: '900',
  },
  liveBadgeTextActive: {
    color: '#027a48',
  },
  previewBox: {
    alignItems: 'center',
    aspectRatio: 3 / 4,
    backgroundColor: '#dce8f2',
    borderColor: '#bfd3e6',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    color: '#2664b4',
    fontSize: 34,
    fontWeight: '300',
  },
  previewText: {
    color: '#3d5a75',
    fontSize: 13,
    fontWeight: '700',
  },
  faceGuide: {
    borderColor: 'rgba(38,100,180,0.65)',
    borderRadius: 150,
    borderWidth: 2,
    height: 280,
    position: 'absolute',
    width: 210,
  },
  statusText: {
    color: '#5b7289',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  capturedPanel: {
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  latestCapturePanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  latestCaptureImage: {
    aspectRatio: 1,
    backgroundColor: '#e8f0f8',
    borderColor: '#c9d9ea',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    width: '100%',
  },
  embeddingStatsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  embeddingStatsLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
  },
  embeddingStatsValue: {
    color: '#027a48',
    fontSize: 14,
    fontWeight: '900',
  },
  embeddingPatternScroller: {
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 7,
    maxHeight: 78,
  },
  embeddingPatternText: {
    color: '#113a70',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  captureSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  embeddingLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
  },
  captureCount: {
    color: '#8a99aa',
    fontSize: 12,
    fontWeight: '900',
  },
  captureCountReady: {
    color: '#027a48',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  captureItem: {
    flex: 1,
    minWidth: 0,
  },
  thumbnailSlot: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '#e8f0f8',
    borderColor: '#c9d9ea',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  embeddingPreview: {
    color: '#3d5a75',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: 5,
    minHeight: 36,
  },
  thumbnailEmpty: {
    color: '#93aac2',
    fontSize: 14,
    fontWeight: '900',
  },
  embeddingValue: {
    color: '#113a70',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
  },
  primaryButtonPressed: {
    backgroundColor: '#174f93',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 48,
  },
  secondaryButtonPressed: {
    backgroundColor: '#0d2d58',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

export default FaceRegister;
