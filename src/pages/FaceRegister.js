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
  createFaceEmbeddingPayload,
  createImageFormFile,
  faceDetectionOptions,
} from '../utils/faceEmbedding';

function FaceRegister({navigate}) {
  const cameraRef = useRef(null);
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();
  const {hasPermission, requestPermission} = useCameraPermission();

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Open camera and capture your face.');

  const showCamera = cameraEnabled && hasPermission && device;

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

      if (!faces?.length) {
        setStatusText('No face detected. Please retake the photo.');
        return;
      }

      if (faces.length > 1) {
        setStatusText('Multiple faces detected. Please capture only one face.');
        return;
      }

      const faceEmbedding = createFaceEmbeddingPayload({
        face: faces[0],
        filePath: photo.filePath,
        uri,
      });

      setCapturedFace({
        faceEmbedding,
        file: createImageFormFile(uri, 'face-register.jpg'),
        uri,
      });
      setStatusText('Face embedding is ready. Tap Register Face.');
    } catch (error) {
      console.log('Face Register Capture Error:', error);
      setStatusText('Unable to capture face. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRegister = async () => {
    if (!capturedFace) {
      setStatusText('Capture your face before registering.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusText('Registering face...');
      await faceAttendanceRegisterApi({
        faceEmbedding: capturedFace.faceEmbedding,
        faceImage: capturedFace.file,
      });
      await faceAttendanceTodayStatusApi();
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
            ) : capturedFace?.uri ? (
              <Image source={{uri: capturedFace.uri}} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewIcon}>+</Text>
                <Text style={styles.previewText}>Camera preview</Text>
              </View>
            )}
            <View style={styles.faceGuide} />
          </View>

          <Text style={styles.statusText}>{statusText}</Text>

          <View style={styles.embeddingBox}>
            <Text style={styles.embeddingLabel}>FACE EMBEDDING</Text>
            <Text style={styles.embeddingValue} numberOfLines={3}>
              {capturedFace
                ? JSON.stringify(capturedFace.faceEmbedding)
                : 'Not captured yet'}
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
              {isCapturing ? 'Capturing...' : showCamera ? 'Capture Face' : 'Open Camera'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Register face"
            disabled={isSubmitting}
            onPress={handleRegister}
            style={({pressed}) => [
              styles.primaryButton,
              isSubmitting && styles.buttonDisabled,
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
    borderRadius: 120,
    borderWidth: 2,
    height: 220,
    position: 'absolute',
    width: 160,
  },
  statusText: {
    color: '#5b7289',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  embeddingBox: {
    backgroundColor: '#f4f8fd',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  embeddingLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 5,
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
