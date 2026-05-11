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
} from 'react-native-vision-camera';

function ScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          duration: 1400,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          duration: 1400,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [scanLineY]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.scanGlass}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-72, 72],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <Text style={styles.instruction}>Keep your face centered in the frame</Text>
    </View>
  );
}

function PlaceholderFrame() {
  return (
    <View style={styles.placeholderFrame}>
      <ScanOverlay />
    </View>
  );
}

function getDetectionStatus() {
  if (!FaceDetection || typeof FaceDetection.processImage !== 'function') {
    return 'Face detection package is not available.';
  }

  if (!NativeModules.FaceDetection) {
    return 'Face detection package installed. Rebuild Android to link native module.';
  }

  return 'Face detection module ready.';
}

function Scan({navigate}) {
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState(
    'Tap Allow Front Camera to open the live front camera.',
  );
  const [detectionState] = useState(getDetectionStatus);

  const openFrontCamera = async () => {
    if (!device) {
      setPermissionState('No front camera was found on this device.');
      return;
    }

    if (!hasPermission) {
      setPermissionState('Requesting front camera permission...');
      const granted = await requestPermission();

      if (!granted) {
        setCameraEnabled(false);
        setPermissionState('Camera permission was not granted.');
        return;
      }
    }

    setCameraEnabled(true);
    setPermissionState('Live front camera is open.');
  };

  const showCamera = cameraEnabled && hasPermission && device;

  return (
    <View style={styles.container}>
      <View style={styles.cameraPanel}>
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraLabel}>Front Camera</Text>
          <Text style={styles.cameraStatus}>
            {showCamera ? 'Live' : hasPermission ? 'Allowed' : 'Permission'}
          </Text>
        </View>

        <View style={styles.previewBox}>
          {showCamera ? (
            <>
              <Camera
                device={device}
                isActive={true}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
              <ScanOverlay />
            </>
          ) : (
            <PlaceholderFrame />
          )}
        </View>
      </View>

      <Text style={styles.permissionText}>{permissionState}</Text>
      <Text style={styles.detectionText}>{detectionState}</Text>

      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open front camera"
          style={styles.primaryButton}
          onPress={openFrontCamera}>
          <Text style={styles.primaryButtonText}>Allow Front Camera</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return home"
          style={styles.secondaryButton}
          onPress={() => navigate('home')}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  cameraPanel: {
    backgroundColor: '#071626',
    borderRadius: 8,
    minHeight: 390,
    overflow: 'hidden',
    padding: 16,
  },
  cameraHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cameraLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  cameraStatus: {
    backgroundColor: '#d1fadf',
    borderRadius: 16,
    color: '#05603a',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBox: {
    alignSelf: 'center',
    backgroundColor: '#04111f',
    borderRadius: 8,
    height: 300,
    marginTop: 18,
    overflow: 'hidden',
    width: '100%',
  },
  placeholderFrame: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGlass: {
    alignItems: 'center',
    backgroundColor: 'rgba(208, 231, 247, 0.08)',
    borderColor: 'rgba(208, 231, 247, 0.16)',
    borderRadius: 8,
    borderWidth: 1,
    height: 190,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 220,
  },
  corner: {
    borderColor: '#38bdf8',
    height: 42,
    position: 'absolute',
    width: 42,
  },
  topLeft: {
    borderLeftWidth: 4,
    borderTopWidth: 4,
    left: 0,
    top: 0,
  },
  topRight: {
    borderRightWidth: 4,
    borderTopWidth: 4,
    right: 0,
    top: 0,
  },
  bottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: 0,
    right: 0,
  },
  scanLine: {
    backgroundColor: '#38bdf8',
    height: 3,
    opacity: 0.85,
    position: 'absolute',
    width: 158,
  },
  instruction: {
    bottom: 24,
    color: '#d0e7f7',
    fontSize: 14,
    fontWeight: '800',
    position: 'absolute',
    textAlign: 'center',
  },
  permissionText: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  detectionText: {
    color: '#0b6bcb',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 5,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b6bcb',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#102a43',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default Scan;
