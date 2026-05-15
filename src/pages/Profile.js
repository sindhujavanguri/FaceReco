import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  employeeProfileApi,
  employeeProfileUpdateStatusApi,
  getCurrentEmployeeProfileResponse,
} from '../redux/employeeSlice';
import { getCurrentAuthSession } from '../redux/loginSlice';

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not available';
  return String(value);
};

const getInitials = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'U';
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
};

const getUserImage = (user) =>
  user.emp_image || user.admin_image || user.profile_image || user.image || '';

const buildRows = (details) =>
  Object.entries(details || {}).map(([key, value]) => ({
    label: key
      .replace(/^emp_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    value: formatValue(value),
  }));

const buildSelectedRows = (fields, details) =>
  fields.map(({ label, key, value }) => ({
    label,
    value: formatValue(value ?? details?.[key]),
  }));

function SectionCard({ title, rows }) {
  if (!rows?.length) return null;

  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push([rows[i], rows[i + 1] || null]);
  }

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {pairs.map((pair, pairIndex) => (
          <View
            key={pairIndex}
            style={[
              styles.pairRow,
              pairIndex < pairs.length - 1 && styles.pairRowBorder,
            ]}
          >
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{pair[0].label}</Text>
              <Text style={styles.fieldValue}>{pair[0].value}</Text>
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              {pair[1] ? (
                <>
                  <Text style={styles.fieldLabel}>{pair[1].label}</Text>
                  <Text style={styles.fieldValue}>{pair[1].value}</Text>
                </>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Profile() {
  const session = getCurrentAuthSession();
  const isEmployee = session?.mode === 'employee';
  const [profileResponse, setProfileResponse] = useState(
    getCurrentEmployeeProfileResponse()
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(
    isEmployee && !getCurrentEmployeeProfileResponse()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(
    async ({ refresh = false } = {}) => {
      if (!isEmployee) { setLoading(false); return; }
      if (!refresh && getCurrentEmployeeProfileResponse()) {
        setProfileResponse(getCurrentEmployeeProfileResponse());
        setLoading(false);
        return;
      }
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const [response] = await Promise.all([
          employeeProfileApi(),
          employeeProfileUpdateStatusApi(),
        ]);
        setProfileResponse(response);
        setError('');
      } catch (profileError) {
        setError(profileError.message || 'Unable to load employee profile.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isEmployee]
  );

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const apiData = profileResponse?.data;
  const profileData = apiData?.data || {};
  const employee = profileData.employee || {};
  const personalDetails = profileData.personal_details || {};
  const bankDetails = profileData.bank_details || {};
  const sessionUser = session?.user || {};
  const company = session?.company || {};

  const displayUser = isEmployee ? employee : sessionUser;
  const displayName =
    displayUser.emp_name || displayUser.admin_name || displayUser.name ||
    displayUser.emp_username || displayUser.admin_username || 'User';
  const displayRole =
    displayUser.designation_name || displayUser.role ||
    (isEmployee ? 'Employee' : 'Admin');
  const displayDept = displayUser.department_name || displayUser.dept_name || '';
  const displayLocation =
    displayUser.location || company.comp_city ||
    company.comp_state || company.comp_country || '';
  const displayEmpCode = displayUser.emp_code || displayUser.admin_code || '';
  const displayImage = getUserImage(displayUser);

  useEffect(() => { setImageFailed(false); }, [displayImage]);

  const adminRows = buildRows({ ...sessionUser, ...company });
  const employeeRows = buildSelectedRows(
    [
      { label: 'Employee ID', key: 'emp_id' },
      { label: 'Code', key: 'emp_code' },
      { label: 'First Name', key: 'emp_first_name' },
      { label: 'Last Name', key: 'emp_last_name' },
      { label: 'Email', key: 'emp_email' },
      { label: 'Phone', key: 'emp_phone' },
      { label: 'Date Of Birth', key: 'date_of_birth' },
      { label: 'Date Of Joining', key: 'date_of_joining' },
      { label: 'Gender', key: 'emp_gender' },
      { label: 'Shift', key: 'office_shift' },
      { label: 'Location', key: 'location' },
      { label: 'Aadhaar', key: 'emp_aadhar_masked' },
      { label: 'PAN', key: 'emp_pan_masked' },
      { label: 'UAN', key: 'emp_uan' },
    ],
    employee
  );
  const personalRows = buildSelectedRows(
    [
      { label: 'Father Name', key: 'emp_father_name' },
      { label: 'Blood Group', key: 'blood_group' },
      {
        label: 'Address',
        value: [personalDetails.address1, personalDetails.address2]
          .filter((p) => p && p !== '.')
          .join(', '),
      },
    ],
    personalDetails
  );

  return (
    <ScrollView
      refreshControl={
        isEmployee ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile({ refresh: true })}
            tintColor="#F08C3C"
          />
        ) : undefined
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      {/* Identity Block */}
      <View style={styles.identityBlock}>
        <View style={styles.avatarWrap}>
          {displayImage && !imageFailed ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.avatarImage}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.heroName}>{displayName}</Text>
        {!!displayRole && <Text style={styles.heroRole}>{displayRole}</Text>}

        <View style={styles.pillRow}>
          {!!displayEmpCode && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{displayEmpCode}</Text>
            </View>
          )}
          {!!displayDept && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{displayDept}</Text>
            </View>
          )}
          {!!displayLocation && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{displayLocation}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to load profile</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadProfile()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <SectionCard
        title={isEmployee ? 'Employee Details' : 'Account Details'}
        rows={isEmployee ? employeeRows : adminRows}
      />
      <SectionCard title="Personal Details" rows={personalRows} />
      <SectionCard title="Bank Details" rows={buildRows(bankDetails)} />
    </ScrollView>
  );
}

const ORANGE = '#F08C3C';
const NAVY = '#113A70';

const styles = StyleSheet.create({
  scrollView: { backgroundColor: '#ffffff' },
  content: { paddingBottom: 40 },

  // Identity Block
  identityBlock: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  avatarWrap: {
    marginBottom: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarImage: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: NAVY,
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
  },
  heroName: {
    color: ORANGE,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  heroRole: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  pill: {
    borderColor: '#E2E2E2',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pillText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
  },

  // Divider
  divider: {
    backgroundColor: '#F2F2F2',
    height: 6,
  },

  // Error
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffd6d4',
    borderRadius: 10,
    borderWidth: 1,
    margin: 16,
    padding: 14,
  },
  errorTitle: { color: '#b42318', fontSize: 14, fontWeight: '900' },
  errorText: { color: '#c92a2a', fontSize: 13, fontWeight: '600', marginTop: 4 },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#b42318',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  // Section
  sectionWrap: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#EBEBEB',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pairRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pairRowBorder: {
    borderBottomColor: '#F4F4F4',
    borderBottomWidth: 1,
  },
  col: {
    flex: 1,
    paddingHorizontal: 2,
  },
  colDivider: {
    backgroundColor: '#EFEFEF',
    width: 1,
    marginHorizontal: 10,
  },
  fieldLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  fieldValue: {
    color: '#1A1A2E',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});

export default Profile;
