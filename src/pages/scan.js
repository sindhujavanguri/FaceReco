import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  NativeModules,
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
  faceAttendanceViewApi,
  getCurrentEmployeeFaceIdentity,
  getCurrentFaceAttendanceSession,
} from '../redux/faceAttendanceSlice';
import {getCurrentAuthSession} from '../redux/loginSlice';
import {
  createImageFormFile,
  faceDetectionOptions,
  validateSingleFaceCapture,
} from '../utils/faceEmbedding';
import {getFaceAttendanceLocationPayload} from '../utils/locationPayload';
import {getFaceProfileImageUrl} from '../utils/mediaUrl';
import {
  ensureRegulaFaceSdkInitialized,
  getRegulaFaceRecognitionStatus,
  verifyRegulaFaceMatch,
} from '../utils/regulaFaceRecognition';

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

const getApiMessage = (error) =>
  String(error?.response?.data?.message || error?.message || '').toLowerCase();

const isAlreadyCompletedResponse = (error, action) => {
  const message = getApiMessage(error);
  if (action === 'logout') {
    return message.includes('already') && message.includes('logout');
  }

  return message.includes('already') && message.includes('log') && message.includes('in');
};

const normalizeIdentifier = (value) =>
  value === null || value === undefined || value === ''
    ? ''
    : String(value).trim().toLowerCase();

const getSessionEmployeeIdentifiers = () => {
  const currentEmployee = getCurrentEmployeeFaceIdentity();
  const session = getCurrentAuthSession();
  const user = session?.user || {};

  return {
    code: normalizeIdentifier(
      currentEmployee.employeeCode ||
        user.emp_code ||
        user.employee_code ||
        user.emp_username ||
        user.username,
    ),
    id: normalizeIdentifier(currentEmployee.employeeId || user.emp_id || user.employee_id || user.id),
  };
};

const getProfileEmployeeIdentifiers = ({employee = {}, profile = {}} = {}) => ({
  code: normalizeIdentifier(
    employee.emp_code ||
      employee.employee_code ||
      profile.emp_code ||
      profile.employee_code,
  ),
  id: normalizeIdentifier(
    employee.emp_id ||
      employee.employee_id ||
      employee.id ||
      profile.emp_id ||
      profile.employee_id ||
      profile.id,
  ),
});

const isCurrentEmployeeFaceProfile = ({employee, profile}) => {
  const sessionIds = getSessionEmployeeIdentifiers();
  const profileIds = getProfileEmployeeIdentifiers({employee, profile});

  if (sessionIds.id && profileIds.id) {
    return sessionIds.id === profileIds.id;
  }

  if (sessionIds.code && profileIds.code) {
    return sessionIds.code === profileIds.code;
  }

  return false;
};

const getFaceBounds = (face = {}) => {
  const box = face.boundingBox;

  if (Array.isArray(box)) {
    const [left = 0, top = 0, right = 0, bottom = 0] = box;
    return {
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
      height: Math.abs(bottom - top),
      width: Math.abs(right - left),
    };
  }

  const x = box?.x ?? box?.left ?? box?.origin?.x ?? 0;
  const y = box?.y ?? box?.top ?? box?.origin?.y ?? 0;
  const width = box?.width ?? box?.size?.width ?? Math.abs((box?.right ?? 0) - x);
  const height = box?.height ?? box?.size?.height ?? Math.abs((box?.bottom ?? 0) - y);

  return {
    centerX: x + width / 2,
    centerY: y + height / 2,
    height,
    width,
  };
};

const isFaceCentered = (face = {}) => {
  const bounds = getFaceBounds(face);
  const imageWidth = face.imageWidth || face.frameWidth || face.sourceWidth || 0;
  const imageHeight = face.imageHeight || face.frameHeight || face.sourceHeight || 0;

  if (!bounds.width || !bounds.height || !imageWidth || !imageHeight) {
    return {isCentered: true, bounds};
  }

  const xRatio = bounds.centerX / imageWidth;
  const yRatio = bounds.centerY / imageHeight;
  const widthRatio = bounds.width / imageWidth;
  const heightRatio = bounds.height / imageHeight;

  return {
    bounds,
    isCentered:
      xRatio >= 0.28 &&
      xRatio <= 0.72 &&
      yRatio >= 0.22 &&
      yRatio <= 0.72 &&
      widthRatio >= 0.18 &&
      heightRatio >= 0.18,
  };
};

const isStableFace = (firstFace = {}, secondFace = {}) => {
  const first = getFaceBounds(firstFace);
  const second = getFaceBounds(secondFace);
  const maxWidth = Math.max(first.width, second.width, 1);
  const maxHeight = Math.max(first.height, second.height, 1);
  const centerShiftX = Math.abs(first.centerX - second.centerX) / maxWidth;
  const centerShiftY = Math.abs(first.centerY - second.centerY) / maxHeight;
  const sizeShift =
    Math.abs(first.width - second.width) / maxWidth +
    Math.abs(first.height - second.height) / maxHeight;

  return centerShiftX <= 0.18 && centerShiftY <= 0.18 && sizeShift <= 0.35;
};

const delay = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

const createFastLocationPayload = async () => {
  try {
    return await getFaceAttendanceLocationPayload({
      highAccuracy: false,
      fallbackTimeout: 1200,
      maximumAge: 300000,
      includeAddress: false,
      fallbackToCoordinates: true,
    });
  } catch (error) {
    console.log('Fast Face Attendance Location Error:', error);
    return {};
  }
};

function Scan({navigate, routeParams}) {
  const cameraRef = useRef(null);
  const autoScanTimerRef = useRef(null);
  const hasAutoScannedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const profileRequestRef = useRef(null);
  const scanStartedAtRef = useRef(Date.now());
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
  const [recognitionState, setRecognitionState] = useState(
    getRegulaFaceRecognitionStatus,
  );
  const [scanRetryKey, setScanRetryKey] = useState(0);

  const loadEmployeeFaceProfile = useCallback(() => {
    if (!profileRequestRef.current) {
      profileRequestRef.current = faceAttendanceViewApi({
        action,
        employeeId: getCurrentEmployeeFaceIdentity().employeeId,
      });
    }
    return profileRequestRef.current;
  }, [action]);

  const setSafePermissionState = useCallback((message) => {
    if (isMountedRef.current) {
      setPermissionState(message);
    }
  }, []);

  const captureDetectedFace = useCallback(async () => {
    const photo = await photoOutput.capturePhotoToFile(
      {enableShutterSound: false, flashMode: 'off'},
      {},
    );

    if (!photo?.filePath) {
      return {error: 'Unable to save selfie. Please try again.'};
    }

    const faces = await FaceDetection.processImage(photo.filePath, faceDetectionOptions);
    const faceCapture = validateSingleFaceCapture(faces);
    if (faceCapture.error) {
      return {error: faceCapture.error, photo};
    }

    const centeredFace = isFaceCentered(faceCapture.face);
    if (!centeredFace.isCentered) {
      return {error: 'Center your face in the frame.', faceCapture, photo};
    }

    return {faceCapture, photo};
  }, [photoOutput]);

  const captureStableFace = useCallback(async () => {
    const firstCapture = await captureDetectedFace();
    if (firstCapture.error) {
      return firstCapture;
    }

    setSafePermissionState('Hold still. Checking face stability...');
    await delay(450);

    if (!isMountedRef.current) {
      return {error: 'Scan cancelled.'};
    }

    const secondCapture = await captureDetectedFace();
    if (secondCapture.error) {
      return secondCapture;
    }

    if (!isStableFace(firstCapture.faceCapture.face, secondCapture.faceCapture.face)) {
      return {error: 'Hold still and keep your face centered.'};
    }

    return secondCapture;
  }, [captureDetectedFace, setSafePermissionState]);

  const openFrontCamera = useCallback(async () => {
    if (!device) {
      setSafePermissionState('No front camera found on this device.');
      return false;
    }
    if (!recognitionState.ok) {
      setSafePermissionState('Face recognition is unavailable in this app build.');
      return false;
    }
    if (!hasPermission) {
      setSafePermissionState('Requesting permission...');
      const granted = await requestPermission();
      if (!granted) {
        if (isMountedRef.current) {
          setCameraEnabled(false);
        }
        setSafePermissionState('Camera permission denied.');
        return false;
      }
    }
    if (isMountedRef.current) {
      setCameraEnabled(true);
    }
    setSafePermissionState('Camera active. Scanning face automatically...');
    return true;
  }, [device, hasPermission, recognitionState.ok, requestPermission, setSafePermissionState]);

  const captureAndPunch = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    if (!cameraEnabled || !hasPermission || !device) {
      await openFrontCamera();
      return;
    }

    let locationPayload = null;

    try {
      isProcessingRef.current = true;
      if (isMountedRef.current) {
        setIsSubmitting(true);
      }
      setSafePermissionState('Center your face in the frame...');

      const profileRequest = loadEmployeeFaceProfile();
      const stableCapture = await captureStableFace();
      if (stableCapture.error) {
        if (Date.now() - scanStartedAtRef.current < 15000) {
          hasAutoScannedRef.current = false;
          setScanRetryKey((key) => key + 1);
        }
        setSafePermissionState(stableCapture.error);
        return;
      }

      setSafePermissionState('Verifying face against this employee account...');
      const profileResponse = await profileRequest;

      if (!isMountedRef.current) {
        return;
      }

      const photo = stableCapture.photo;
      const uri = photo.filePath.startsWith('file://')
        ? photo.filePath
        : `file://${photo.filePath}`;
      const faceCapture = stableCapture.faceCapture;
      const faceEmbedding = faceCapture.faceEmbedding;
      const profileData = profileResponse?.data?.data || {};
      const profile = profileData.face_profile || {};
      const employee = profileData.employee || {};
      const employeeIdentity = getCurrentEmployeeFaceIdentity();
      const activeFaceSession = getCurrentFaceAttendanceSession();

      if (!isCurrentEmployeeFaceProfile({employee, profile})) {
        setSafePermissionState(
          action === 'logout'
            ? 'Logout failed. Face does not match logged-in employee.'
            : 'Face does not belong to this employee account.',
        );
        return;
      }

      if (
        action === 'logout' &&
        activeFaceSession?.normalizedEmployeeId &&
        activeFaceSession.normalizedEmployeeId !== employeeIdentity.normalizedEmployeeId
      ) {
        setSafePermissionState('Logout failed. Face does not match logged-in employee.');
        return;
      }

      const registeredImageUri = getFaceProfileImageUrl(profile);
      const regulaFaceMatch = await verifyRegulaFaceMatch({
        liveImageUri: uri,
        registeredImageUri,
      });

      if (!regulaFaceMatch.isMatch) {
        setSafePermissionState(
          action === 'logout'
            ? 'Logout failed. Face does not match logged-in employee.'
            : 'Face does not belong to this employee account.',
        );
        return;
      }

      setSafePermissionState(`${actionLabel} verified. Saving attendance...`);
      locationPayload = await createFastLocationPayload();
      if (!isMountedRef.current) {
        return;
      }
      await faceAttendancePunchApi({
        action,
        employeeId: employeeIdentity.employeeId,
        employeeName: employeeIdentity.employeeName,
        faceEmbedding,
        ...locationPayload,
        selfie: createImageFormFile(uri, `${action}-selfie.jpg`),
      });
      if (!isMountedRef.current) {
        return;
      }

      setSafePermissionState(`${actionLabel} successful.`);
      if (isMountedRef.current) {
        setCameraEnabled(false);
      }
      navigate?.('home', {
        faceActionCompleted: action,
        faceRegistered: true,
        lastScanLocation: locationPayload,
        refreshFaceAttendance: Date.now(),
      });
    } catch (error) {
      console.log(`Face ${actionLabel} Scan Error:`, error?.response || error);
      if (isAlreadyCompletedResponse(error, action)) {
        navigate?.('home', {
          faceActionCompleted: action,
          faceRegistered: true,
          lastScanLocation: locationPayload,
          refreshFaceAttendance: Date.now(),
        });
        return;
      }
      setSafePermissionState(error.message || `${actionLabel} failed. Please try again.`);
    } finally {
      isProcessingRef.current = false;
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [
    action,
    actionLabel,
    cameraEnabled,
    captureStableFace,
    device,
    hasPermission,
    loadEmployeeFaceProfile,
    navigate,
    openFrontCamera,
    setSafePermissionState,
  ]);

  const showCamera = cameraEnabled && hasPermission && device;

  useEffect(() => {
    isMountedRef.current = true;
    hasAutoScannedRef.current = false;
    profileRequestRef.current = null;
    scanStartedAtRef.current = Date.now();

    return () => {
      isMountedRef.current = false;
    };
  }, [action]);

  useEffect(() => {
    ensureRegulaFaceSdkInitialized()
      .then(() => {
        if (isMountedRef.current) {
          setRecognitionState({ok: true});
        }
      })
      .catch((error) => {
        console.log('Face Recognition Init Error:', error);
        if (isMountedRef.current) {
          setRecognitionState({ok: false});
          setSafePermissionState(error.message || 'Face recognition is unavailable.');
        }
      });
  }, [setSafePermissionState]);

  useEffect(() => {
    loadEmployeeFaceProfile().catch((error) => {
      console.log('Preload Employee Face Profile Error:', error?.response || error);
      setSafePermissionState(error.message || 'Unable to load this employee face profile.');
    });
  }, [loadEmployeeFaceProfile, setSafePermissionState]);

  useEffect(() => {
    openFrontCamera().catch((error) => {
      console.log('Open Front Camera Error:', error);
      setSafePermissionState(error.message || 'Unable to open camera.');
    });
  }, [openFrontCamera, setSafePermissionState]);

  useEffect(() => {
    if (!showCamera || isSubmitting || hasAutoScannedRef.current) {
      return undefined;
    }

    hasAutoScannedRef.current = true;
    autoScanTimerRef.current = setTimeout(() => {
      captureAndPunch().catch((error) => {
        console.log('Auto Face Scan Error:', error);
        setSafePermissionState(error.message || `${actionLabel} failed. Please try again.`);
      });
    }, 1500);

    return () => {
      if (autoScanTimerRef.current) {
        clearTimeout(autoScanTimerRef.current);
      }
    };
  }, [actionLabel, captureAndPunch, isSubmitting, scanRetryKey, setSafePermissionState, showCamera]);

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
            <Text style={styles.statusLabel}>RECOGNITION</Text>
            <Text style={[styles.statusValue, recognitionState.ok && styles.statusValueOk]} numberOfLines={1}>
              {recognitionState.ok ? 'Ready' : 'Blocked'}
            </Text>
          </View>
        </View>

        <Text style={styles.infoText}>{permissionState}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.autoScanBox}>
          <Text style={styles.autoScanText}>
            {isSubmitting ? `${actionLabel} in progress...` : 'Scanning automatically'}
          </Text>
        </View>
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
  autoScanBox: {
    alignItems: 'center',
    backgroundColor: '#e9f2fb',
    borderColor: '#cfe0ef',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  autoScanText: {
    color: '#0b6bcb',
    fontSize: 14,
    fontWeight: '900',
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
