import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  NativeModules,
  Pressable,
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
import {
  faceAttendancePunchApi,
  faceAttendanceTodayStatusApi,
  faceAttendanceViewApi,
} from '../redux/faceAttendanceSlice';
import {
  FACE_MODEL_NAME,
  compareFaceEmbeddings,
  createImageFormFile,
  faceDetectionOptions,
  getProfileFaceEmbedding,
  validateSingleFaceCapture,
} from '../utils/faceEmbedding';
import {getFaceAttendanceLocationPayload} from '../utils/locationPayload';

function ScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {duration: 1600, toValue: 1, useNativeDriver: true}),
        Animated.timing(scanLineY, {duration: 1600, toValue: 0, useNativeDriver: true}),
      ]),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {duration: 1000, toValue: 1.04, useNativeDriver: true}),
        Animated.timing(pulseAnim, {duration: 1000, toValue: 1, useNativeDriver: true}),
      ]),
    );
    scanAnimation.start();
    pulseAnimation.start();
    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
    };
  }, [scanLineY, pulseAnim]);

  return (
    <Animated.View style={[styles.ovalWrapper, {transform: [{scale: pulseAnim}]}]}>
      <View style={styles.scanOval}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-135, 135],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <Text style={styles.instruction}>Center your face in the frame</Text>
    </Animated.View>
  );
}

function getDetectionStatus() {
  if (!FaceDetection || typeof FaceDetection.processImage !== 'function') {
    return {ok: false};
  }
  if (!NativeModules.FaceDetection) {
    return {ok: false};
  }
  return {ok: true};
}

function Scan({navigate, routeParams}) {
  const cameraRef = useRef(null);
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput();
  const {hasPermission, requestPermission} = useCameraPermission();
  const action = routeParams?.mode === 'logout' ? 'logout' : 'login';
  const actionLabel = action === 'logout' ? 'Logout' : 'Login';

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionState, setPermissionState] = useState(
    'Camera permission required to begin scanning.',
  );
  const [detectionState] = useState(getDetectionStatus);

  const openFrontCamera = async () => {
    if (!device) {
      setPermissionState('No front camera found on this device.');
      return false;
    }
    if (!hasPermission) {
      setPermissionState('Requesting permission...');
      const granted = await requestPermission();
      if (!granted) {
        setCameraEnabled(false);
        setPermissionState('Camera permission denied.');
        return false;
      }
    }
    setCameraEnabled(true);
    setPermissionState('Live camera active.');
    return true;
  };

  const captureAndPunch = async () => {
    if (!cameraEnabled || !hasPermission || !device) {
      await openFrontCamera();
      return;
    }

    try {
      setIsSubmitting(true);
      setPermissionState(`${actionLabel} face scan in progress...`);

      const photo = await photoOutput.capturePhotoToFile(
        {enableShutterSound: true, flashMode: 'off'},
        {},
      );

      if (!photo?.filePath) {
        setPermissionState('Unable to save selfie. Please try again.');
        return;
      }

      const uri = photo.filePath.startsWith('file://')
        ? photo.filePath
        : `file://${photo.filePath}`;
      const faces = await FaceDetection.processImage(photo.filePath, faceDetectionOptions);

      const faceCapture = validateSingleFaceCapture(faces);
      if (faceCapture.error) {
        setPermissionState(faceCapture.error);
        return;
      }

      const faceEmbedding = faceCapture.faceEmbedding;
      const locationPayload = await getFaceAttendanceLocationPayload();
      const profileResponse = await faceAttendanceViewApi({
        action,
        faceEmbedding,
        ...locationPayload,
      });
      const profile = profileResponse?.data?.data?.face_profile || {};
      if (profile.model_name && profile.model_name !== FACE_MODEL_NAME) {
        setPermissionState('Face profile needs re-registration for accurate verification.');
        return;
      }

      const registeredEmbedding = getProfileFaceEmbedding(profile);
      const faceMatch = compareFaceEmbeddings(faceEmbedding, registeredEmbedding);

      if (!faceMatch.isMatch) {
        setPermissionState(
          `${faceMatch.reason} Similarity ${faceMatch.similarity.toFixed(3)}.`,
        );
        return;
      }

      await faceAttendancePunchApi({
        action,
        faceEmbedding,
        ...locationPayload,
        selfie: createImageFormFile(uri, `${action}-selfie.jpg`),
      });
      try {
        await faceAttendanceTodayStatusApi();
      } catch (statusError) {
        console.log(`Face ${actionLabel} Today Status Refresh Error:`, statusError?.response || statusError);
      }

      setPermissionState(`${actionLabel} successful.`);
      navigate?.('home', {
        faceActionCompleted: action,
        faceRegistered: true,
        lastScanLocation: locationPayload,
        refreshFaceAttendance: Date.now(),
      });
    } catch (error) {
      console.log(`Face ${actionLabel} Scan Error:`, error?.response || error);
      setPermissionState(error.message || `${actionLabel} failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCamera = cameraEnabled && hasPermission && device;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.liveDot, showCamera && styles.liveDotActive]} />
              <Text style={styles.cameraLabel}>
                {showCamera ? `${actionLabel} Scan` : 'Front Camera'}
              </Text>
            </View>
            <View style={[styles.modeBadge, showCamera && styles.modeBadgeActive]}>
              <Text style={[styles.modeBadgeText, showCamera && styles.modeBadgeTextActive]}>
                {showCamera ? 'SCANNING' : 'STANDBY'}
              </Text>
            </View>
          </View>

          <View style={styles.previewBox}>
            {showCamera && (
              <Camera
                ref={cameraRef}
                device={device}
                isActive={true}
                outputs={[photoOutput]}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.overlayCenter}>
              <ScanOverlay />
            </View>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>PERMISSION</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {hasPermission ? 'Granted' : 'Required'}
            </Text>
          </View>
          <View style={styles.statusSep} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>DETECTION</Text>
            <Text style={[styles.statusValue, detectionState.ok && styles.statusValueOk]} numberOfLines={1}>
              {detectionState.ok ? 'Ready' : 'Unavailable'}
            </Text>
          </View>
          <View style={styles.statusSep} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>MODE</Text>
            <Text style={[styles.statusValue, showCamera && styles.statusValueOk]} numberOfLines={1}>
              {actionLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.infoText}>{permissionState}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} face scan`}
          disabled={isSubmitting}
          style={({pressed}) => [
            styles.primaryButton,
            isSubmitting && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={captureAndPunch}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting
              ? `${actionLabel}...`
              : showCamera
                ? `Scan Face for ${actionLabel}`
                : 'Enable Camera'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fb',
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
  },
  cameraCard: {
    backgroundColor: '#dce8f2',
    borderColor: '#c5d6e8',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cameraHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  liveDot: {
    backgroundColor: '#93aac2',
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  liveDotActive: {
    backgroundColor: '#12b76a',
  },
  cameraLabel: {
    color: '#0d1f35',
    fontSize: 14,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: 'rgba(11,107,203,0.08)',
    borderColor: 'rgba(11,107,203,0.18)',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeActive: {
    backgroundColor: 'rgba(18,183,106,0.12)',
    borderColor: 'rgba(18,183,106,0.28)',
  },
  modeBadgeText: {
    color: '#3d5a75',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeBadgeTextActive: {
    color: '#027a48',
  },
  previewBox: {
    backgroundColor: '#eaf2f9',
    borderColor: '#b8d0e8',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ovalWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  scanOval: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,107,203,0.05)',
    borderColor: 'rgba(11,107,203,0.25)',
    borderRadius: 165,
    borderWidth: 1.5,
    height: 315,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 235,
  },
  corner: {
    borderColor: '#0b6bcb',
    height: 22,
    position: 'absolute',
    width: 22,
  },
  cornerTL: {borderLeftWidth: 2, borderTopWidth: 2, left: 14, top: 14},
  cornerTR: {borderRightWidth: 2, borderTopWidth: 2, right: 14, top: 14},
  cornerBL: {borderBottomWidth: 2, borderLeftWidth: 2, bottom: 14, left: 14},
  cornerBR: {borderBottomWidth: 2, borderRightWidth: 2, bottom: 14, right: 14},
  scanLine: {
    backgroundColor: '#0b6bcb',
    height: 1.5,
    opacity: 0.6,
    position: 'absolute',
    width: '80%',
  },
  instruction: {
    color: '#3d5a75',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 18,
    textAlign: 'center',
  },
  statusRow: {
    backgroundColor: '#ffffff',
    borderColor: '#dce8f2',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    paddingVertical: 13,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusSep: {
    backgroundColor: '#dce8f2',
    width: 1,
  },
  statusLabel: {
    color: '#93aac2',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statusValue: {
    color: '#0d1f35',
    fontSize: 13,
    fontWeight: '700',
  },
  statusValueOk: {
    color: '#0b6bcb',
  },
  infoText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#f5f8fb',
    borderTopColor: '#e8eef5',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 10,
    paddingVertical: 15,
  },
  primaryButtonPressed: {
    backgroundColor: '#0959a8',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default Scan;
