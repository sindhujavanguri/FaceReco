import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  employeeProfileApi,
  getCurrentEmployeeProfileResponse,
} from '../redux/employeeSlice';
import {
  clearStoredAuthSession,
  getCurrentAuthSession,
  logoutApi,
} from '../redux/loginSlice';

const ORANGE = '#F08C3C';
const NAVY = '#113A70';

const getInitials = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'U';
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
};

const getUserImage = (user) =>
  user.emp_image || user.admin_image || user.profile_image || user.image || '';

function Settings({ navigate }) {
  const [imageFailed, setImageFailed] = useState(false);
  const session = getCurrentAuthSession();
  const profileData = getCurrentEmployeeProfileResponse()?.data?.data;
  const employee = profileData?.employee || {};
  const sessionUser = session?.user || {};
  const company = session?.company || {};
  const displayUser =
    session?.mode === 'employee' ? { ...sessionUser, ...employee } : sessionUser;

  const userName =
    displayUser.emp_name || displayUser.admin_name || displayUser.name ||
    displayUser.emp_username || displayUser.admin_username || 'User';
  const userRole =
    displayUser.designation_name || displayUser.role ||
    (session?.mode === 'employee' ? 'Employee' : 'Admin');
  const userEmpCode = displayUser.emp_code || displayUser.admin_code || '';
  const locationName =
    displayUser.location || company.comp_city ||
    company.comp_state || company.comp_country || 'Location not available';
  const userImage = getUserImage(displayUser);

  useEffect(() => { setImageFailed(false); }, [userImage]);

  const handleSignOut = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.log('Logout error:', e);
    } finally {
      await clearStoredAuthSession();
      navigate('login');
    }
  };

  const handleOpenProfile = async () => {
    if (session?.mode !== 'employee') { navigate('profile'); return; }
    try {
      await employeeProfileApi();
    } catch (e) {
      console.log('Profile error:', e);
    } finally {
      navigate('profile');
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Profile Card ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}
        onPress={handleOpenProfile}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {userImage && !imageFailed ? (
            <Image
              source={{ uri: userImage }}
              style={styles.avatarImage}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
          )}
        </View>

        {/* Identity */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.profileRole} numberOfLines={1}>{userRole}</Text>

          <View style={styles.profileMeta}>
            {!!userEmpCode && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{userEmpCode}</Text>
              </View>
            )}
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{locationName}</Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* ── Settings Card ── */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeading}>Preferences</Text>
        <Text style={styles.cardSubheading}>Face scan & display</Text>

        <SettingRow
          label="Front camera first"
          hint="Open scan with front mode"
          value={true}
        />
        <SettingRow
          label="Secure prompts"
          hint="Show clear access messages"
          value={true}
        />
        <SettingRow
          label="Location tag"
          hint="Attach branch to scans"
          value={false}
        />
      </View>

      {/* ── Sign Out ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

    </View>
  );
}

function SettingRow({ label, hint, value }) {
  const [enabled, setEnabled] = useState(value);
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{hint}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: '#E0E0E0', true: '#F8C89A' }}
        thumbColor={enabled ? ORANGE : '#ffffff'}
        ios_backgroundColor="#E0E0E0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── Profile Card ─────────────────────────────────────────
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  profileCardPressed: {
    opacity: 0.85,
  },
  avatarWrap: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: NAVY,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  profileRole: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  profileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  metaBadge: {
    borderColor: '#E0E0E0',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metaBadgeText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    color: '#C0C0C0',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },

  // ── Settings Card ─────────────────────────────────────────
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeading: {
    color: NAVY,
    fontSize: 18,
    fontWeight: '900',
  },
  cardSubheading: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 3,
  },
  settingRow: {
    alignItems: 'center',
    borderTopColor: '#F4F4F4',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '800',
  },
  settingHint: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  // ── Sign Out ──────────────────────────────────────────────
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#FFDDCC',
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 52,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutPressed: {
    opacity: 0.75,
  },
  signOutText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});

export default Settings;
