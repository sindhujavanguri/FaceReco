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
                    outputRange: [-110, 110],
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

function PlaceholderFrame() {
  return (
    <View style={styles.placeholderFrame}>
      <ScanOverlay />
    </View>
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

function Scan({navigate}) {
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState(
    'Camera permission required to begin scanning.',
  );
  const [detectionState] = useState(getDetectionStatus);

  const openFrontCamera = async () => {
    if (!device) {
      setPermissionState('No front camera found on this device.');
      return;
    }
    if (!hasPermission) {
      setPermissionState('Requesting permission...');
      const granted = await requestPermission();
      if (!granted) {
        setCameraEnabled(false);
        setPermissionState('Camera permission denied.');
        return;
      }
    }
    setCameraEnabled(true);
    setPermissionState('Live camera active.');
  };

  const showCamera = cameraEnabled && hasPermission && device;

  return (
    <View style={styles.container}>

      {/* ── Body ── */}
      <View style={styles.body}>

        {/* Camera card — flex:1 grows to fill all available vertical space */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.liveDot, showCamera && styles.liveDotActive]} />
              <Text style={styles.cameraLabel}>
                {showCamera ? 'Live' : 'Front Camera'}
              </Text>
            </View>
            <View style={[styles.modeBadge, showCamera && styles.modeBadgeActive]}>
              <Text style={[styles.modeBadgeText, showCamera && styles.modeBadgeTextActive]}>
                {showCamera ? 'SCANNING' : 'STANDBY'}
              </Text>
            </View>
          </View>

          {/* Preview — flex:1 fills the card height */}
          <View style={styles.previewBox}>
            {showCamera && (
              <Camera
                device={device}
                isActive={true}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.overlayCenter}>
              <ScanOverlay />
            </View>
          </View>
        </View>

        {/* Status Row */}
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
            <Text style={styles.statusLabel}>CAMERA</Text>
            <Text style={[styles.statusValue, showCamera && styles.statusValueOk]} numberOfLines={1}>
              {showCamera ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Text style={styles.infoText}>{permissionState}</Text>
      </View>

      {/* ── Footer buttons ── */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open front camera"
          style={({pressed}) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={openFrontCamera}>
          <Text style={styles.primaryButtonText}>Enable Camera</Text>
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

  // ── Body fills space above footer ──────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
  },

  // ── Camera card — flex:1 makes it tall ────────────────────────────────────
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

  // ── Preview fills card ─────────────────────────────────────────────────────
  previewBox: {
    backgroundColor: '#eaf2f9',
    borderColor: '#b8d0e8',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  placeholderFrame: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // ── Scan overlay ───────────────────────────────────────────────────────────
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  overlayInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFill: {
    flex: 1,
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
    borderRadius: 140,
    borderWidth: 1.5,
    height: 260,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 195,
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

  // ── Status row ─────────────────────────────────────────────────────────────
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

  // ── Info text ──────────────────────────────────────────────────────────────
  infoText: {
    color: '#93aac2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#f5f8fb',
    borderTopColor: '#e8eef5',
    borderTopWidth: 1,
    gap: 10,
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
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce8f2',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
  },
  ghostButtonPressed: {
    backgroundColor: '#f5f9fd',
  },
  ghostButtonText: {
    color: '#3d5a75',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Scan;