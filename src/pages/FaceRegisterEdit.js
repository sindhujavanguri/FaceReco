import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FaceDetection from 'react-native-face-detection';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import {
  faceAttendanceEditApi,
  faceAttendanceTodayStatusApi,
  faceAttendanceViewApi,
  getDeviceId,
} from '../redux/faceAttendanceSlice';
import {
  FACE_MODEL_NAME,
  createImageFormFile,
  faceDetectionOptions,
  parseFaceEmbeddingPayload,
  validateSingleFaceCapture,
} from '../utils/faceEmbedding';
import {getFaceAttendanceLocationPayload} from '../utils/locationPayload';
import {getFaceProfileImageUrl} from '../utils/mediaUrl';

const parseEmbeddingText = (value) => {
  return parseFaceEmbeddingPayload(value);
};

const stringifyEmbedding = (profile = {}) => {
  if (Array.isArray(profile.face_embedding)) {
    return JSON.stringify(profile.face_embedding);
  }
  return profile.embedding_json || '[]';
};

function FaceRegisterEdit({navigate, routeParams}) {
  const cameraRef = useRef(null);
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();
  const {hasPermission, requestPermission} = useCameraPermission();
  const initialProfile = routeParams?.faceProfile || {};

  const [profile, setProfile] = useState(initialProfile);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [embeddingText, setEmbeddingText] = useState(stringifyEmbedding(initialProfile));
  const [modelName, setModelName] = useState(
    initialProfile.model_name || FACE_MODEL_NAME,
  );
  const [deviceId, setDeviceId] = useState(
    initialProfile.registered_device_id || getDeviceId(),
  );
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState('Loading face profile...');
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const imageUri = selectedImage?.uri || getFaceProfileImageUrl(profile);
  const showCamera = cameraEnabled && hasPermission && device;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUri]);

  const loadProfile = useCallback(async () => {
    try {
      setStatusText('Fetching current face profile...');
      const locationPayload = await getFaceAttendanceLocationPayload();
      const response = await faceAttendanceViewApi({
        action: 'login',
        ...locationPayload,
      });
      const nextProfile = response?.data?.data?.face_profile || {};
      setProfile(nextProfile);
      setEmbeddingText(stringifyEmbedding(nextProfile));
      setModelName(nextProfile.model_name || FACE_MODEL_NAME);
      setDeviceId(nextProfile.registered_device_id || getDeviceId());
      setStatusText(response?.data?.message || 'Face profile loaded.');
    } catch (error) {
      console.log('Face Register Edit Load Error:', error?.response || error);
      setStatusText(error.message || 'Unable to load face profile.');
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openCamera = async () => {
    if (!device) {
      setStatusText('No front camera found on this device.');
      return false;
    }

    if (!hasPermission) {
      setStatusText('Requesting camera permission...');
      const granted = await requestPermission();
      if (!granted) {
        setStatusText('Camera permission denied.');
        return false;
      }
    }

    setCameraEnabled(true);
    setStatusText('Camera ready. Capture the updated face image.');
    return true;
  };

  const captureFace = async () => {
    if (!showCamera) {
      await openCamera();
      return;
    }

    try {
      setCapturing(true);
      setStatusText('Capturing updated face image...');
      const photo = await photoOutput.capturePhotoToFile(
        {enableShutterSound: true, flashMode: 'off'},
        {},
      );

      if (!photo?.filePath) {
        setStatusText('Unable to save captured photo.');
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

      setSelectedImage({
        file: createImageFormFile(uri, 'face-profile-edit.jpg'),
        uri,
      });
      setImageLoadFailed(false);
      setEmbeddingText(JSON.stringify(faceEmbedding));
      setStatusText('Updated image and embedding ready.');
    } catch (error) {
      console.log('Face Register Edit Capture Error:', error);
      setStatusText('Unable to capture face. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleSave = async () => {
    const faceEmbedding = parseEmbeddingText(embeddingText);
    if (!faceEmbedding.length) {
      setStatusText('Face embedding is required.');
      return;
    }

    try {
      setSaving(true);
      setStatusText('Updating face profile...');
      await faceAttendanceEditApi({
        deviceId: deviceId.trim(),
        faceEmbedding,
        faceImage: selectedImage?.file,
        modelName: modelName.trim(),
      });
      try {
        await faceAttendanceTodayStatusApi();
      } catch (statusError) {
        console.log('Face Register Edit Today Status Error:', statusError?.response || statusError);
      }
      setStatusText('Face profile updated successfully.');
      navigate?.('faceProfileView', {refreshFaceProfile: Date.now()});
    } catch (error) {
      console.log('Face Register Edit Save Error:', error?.response || error);
      setStatusText(error.message || 'Face profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Edit Face Register</Text>
          <Text style={styles.subtitle}>Update face image, embedding, model and device data.</Text>

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
            ) : imageUri && !imageLoadFailed ? (
              <Image
                onError={() => setImageLoadFailed(true)}
                source={{uri: imageUri}}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imageFallback}>
                <Text style={styles.imageFallbackText}>No image</Text>
              </View>
            )}
            <View style={styles.faceGuide} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture updated face"
            disabled={capturing || saving}
            onPress={showCamera ? captureFace : openCamera}
            style={({pressed}) => [
              styles.secondaryButton,
              (capturing || saving) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {capturing ? 'Capturing...' : showCamera ? 'Capture New Face' : 'Open Camera'}
            </Text>
          </Pressable>

          <Text style={styles.inputLabel}>Model Name</Text>
          <TextInput
            accessibilityLabel="Face model name"
            onChangeText={setModelName}
            placeholder="mobilefacenet"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={modelName}
          />

          <Text style={styles.inputLabel}>Device ID</Text>
          <TextInput
            accessibilityLabel="Face registered device id"
            onChangeText={setDeviceId}
            placeholder="android-device-id-001"
            placeholderTextColor="#93aac2"
            style={styles.input}
            value={deviceId}
          />

          <Text style={styles.inputLabel}>Face Embedding</Text>
          <TextInput
            accessibilityLabel="Face embedding"
            multiline
            onChangeText={setEmbeddingText}
            placeholder="[0.123, -0.456]"
            placeholderTextColor="#93aac2"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={embeddingText}
          />

          <Text style={styles.statusText}>{statusText}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save edited face profile"
            disabled={saving}
            onPress={handleSave}
            style={({pressed}) => [
              styles.primaryButton,
              saving && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Done'}</Text>
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
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
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
    lineHeight: 17,
    marginTop: 4,
  },
  previewBox: {
    alignItems: 'center',
    aspectRatio: 3 / 4,
    backgroundColor: '#dce8f2',
    borderColor: '#bfd3e6',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 14,
    overflow: 'hidden',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#3d5a75',
    fontSize: 13,
    fontWeight: '800',
  },
  faceGuide: {
    borderColor: 'rgba(38,100,180,0.65)',
    borderRadius: 150,
    borderWidth: 2,
    height: 280,
    position: 'absolute',
    width: 210,
  },
  inputLabel: {
    color: '#6b7f99',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#113a70',
    fontSize: 13,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 132,
    paddingTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
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
    marginTop: 12,
    minHeight: 46,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 14,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default FaceRegisterEdit;
