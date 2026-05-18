import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  faceAttendanceViewApi,
  getCurrentFaceAttendanceViewResponse,
} from '../redux/faceAttendanceSlice';

const getFaceData = (response) => response?.data?.data || {};

const formatValue = (value, fallback = '-') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const formatEmbedding = (profile = {}) => {
  const embedding = profile.face_embedding;
  if (Array.isArray(embedding) && embedding.length) {
    return `[${embedding.slice(0, 24).join(', ')}${embedding.length > 24 ? ', ...' : ''}]`;
  }
  return profile.embedding_json || 'Embedding not available';
};

function DetailRow({label, value}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{formatValue(value)}</Text>
    </View>
  );
}

function FaceProfileView({navigate}) {
  const [profileResponse, setProfileResponse] = useState(
    getCurrentFaceAttendanceViewResponse(),
  );
  const [loading, setLoading] = useState(!getCurrentFaceAttendanceViewResponse());
  const [statusText, setStatusText] = useState('Loading face profile...');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setStatusText('Fetching face profile...');
      const response = await faceAttendanceViewApi({action: 'login'});
      setProfileResponse(response);
      setStatusText(response?.data?.message || 'Face profile fetched successfully.');
    } catch (error) {
      console.log('Face Profile View Error:', error?.response || error);
      setStatusText(error.message || 'Unable to fetch face profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const data = getFaceData(profileResponse);
  const employee = data.employee || {};
  const profile = data.face_profile || {};
  const imageUrl = profile.face_image_path;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.eyebrow}>FACE PROFILE</Text>
            <Text style={styles.title}>{formatValue(employee.emp_name, 'Employee')}</Text>
            <Text style={styles.subtitle}>{formatValue(employee.emp_code)}</Text>
          </View>
          <View style={[styles.statusPill, data.face_registered && styles.statusPillActive]}>
            <Text style={[styles.statusPillText, data.face_registered && styles.statusPillTextActive]}>
              {data.face_registered ? 'REGISTERED' : 'NOT FOUND'}
            </Text>
          </View>
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#2664b4" />
            <Text style={styles.stateText}>Loading face profile...</Text>
          </View>
        )}

        <Text style={styles.statusText}>{statusText}</Text>

        <View style={styles.imageCard}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.faceImage} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>No image</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Face Profile ID" value={profile.face_profile_id} />
          <DetailRow label="Employee ID" value={profile.emp_id} />
          <DetailRow label="Model" value={profile.model_name} />
          <DetailRow label="Embedding Size" value={profile.embedding_size} />
          <DetailRow label="Registered From" value={profile.registered_from} />
          <DetailRow label="Device ID" value={profile.registered_device_id} />
          <DetailRow label="Status" value={profile.status} />
          <DetailRow label="Created At" value={profile.created_at} />
          <DetailRow label="Updated At" value={profile.updated_at} />
        </View>

        <View style={styles.embeddingCard}>
          <Text style={styles.embeddingLabel}>FACE EMBEDDING</Text>
          <Text style={styles.embeddingText}>{formatEmbedding(profile)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit face profile"
          onPress={() => navigate?.('faceRegisterEdit', {faceProfile: profile, employee})}
          style={({pressed}) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Edit Face</Text>
        </Pressable>
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
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#113a70',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  eyebrow: {
    color: '#9fc2ec',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  subtitle: {
    color: '#d8e7fa',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  statusPill: {
    backgroundColor: '#fff8e8',
    borderColor: '#fad991',
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusPillActive: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  statusPillText: {
    color: '#b76e00',
    fontSize: 10,
    fontWeight: '900',
  },
  statusPillTextActive: {
    color: '#027a48',
  },
  stateBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  stateText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  statusText: {
    color: '#5b7289',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 12,
    textAlign: 'center',
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faceImage: {
    aspectRatio: 1,
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#6b7f99',
    fontSize: 14,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  detailRow: {
    borderTopColor: '#eef2f6',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  detailLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  embeddingCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d2e1f4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  embeddingLabel: {
    color: '#6b7f99',
    fontSize: 10,
    fontWeight: '900',
  },
  embeddingText: {
    color: '#113a70',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});

export default FaceProfileView;
