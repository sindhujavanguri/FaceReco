import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCurrentAuthSession } from '../redux/loginSlice';

const logo = require('../../assets/images/mainlogo.png');
const accessIcon = require('../../assets/images/access.png');
const alertIcon = require('../../assets/images/alert.png');
const historyIcon = require('../../assets/images/history.png');
const reportIcon = require('../../assets/images/report.png');

function QuickActionCard({title, text, icon}) {
  return (
    <View style={styles.quickCard}>
      <View style={styles.quickIconBox}>
        <Image source={icon} style={styles.quickIcon} resizeMode="contain" />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickText}>{text}</Text>
    </View>
  );
}

function Home({navigate}) {
  const session = getCurrentAuthSession();
  const user = session?.user || {};
  const company = session?.company || {};
  const role = user.role || session?.mode || 'admin';
  const userName =
    user.admin_name ||
    user.emp_name ||
    user.emp_first_name ||
    user.admin_username ||
    user.emp_username ||
    'User';
  const locationName =
    user.location ||
    company.comp_city ||
    company.comp_state ||
    company.comp_country ||
    'Location not available';
  const accessLabel = role === 'admin' ? 'Admin access' : 'Employee access';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}>

     

      {/* ── Body ── */}
      <View style={styles.body}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>{userName}</Text>
              <Text style={styles.profile} numberOfLines={1}>{accessLabel}</Text>
              <Text style={styles.location} numberOfLines={1}>{locationName}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verified profile"
            style={({ pressed }) => [
              styles.verifiedPill,
              pressed && styles.verifiedPillPressed,
            ]}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedText}>Verify</Text>
          </Pressable>
        </View>

        {/* Scan card */}
        <View style={styles.scanCard}>
          <Text style={styles.scanEyebrow}>BIOMETRIC</Text>
          <Text style={styles.scanTitle}>Face Recognition</Text>

          <View style={styles.scanMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>CAMERA</Text>
              <Text style={styles.metaValue}>Front</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>MODE</Text>
              <Text style={styles.metaValue}>Live</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={[styles.metaValue, styles.metaValueReady]}>Ready</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start face scan"
            style={styles.scanButton}
            onPress={() => navigate('scan')}>
            <Text style={styles.scanButtonText}>Start Scan</Text>
          </Pressable>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickActionCard
            title="Scan History"
            text="Last 30 days"
            icon={historyIcon}
          />
          <QuickActionCard
            title="Access Log"
            text="View entries"
            icon={accessIcon}
          />
          <QuickActionCard
            title="Alerts"
            text="No new alerts"
            icon={alertIcon}
          />
          <QuickActionCard
            title="Reports"
            text="Download data"
            icon={reportIcon}
          />
        </View>

      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({

  // ── Scroll & layout ──────────────────────────────────────────────────────
  scrollView: {
    backgroundColor: '#F4F8FD',
  },
  content: {
    paddingBottom: 28,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#D2E1F4',
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingTop: 14,
  },
  headerLogo: {
    height: 36,
    width: 160,
  },

  // ── Body wrapper ─────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },

  // ── Profile card ─────────────────────────────────────────────────────────
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#D2E1F4',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#2664b4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  profileMain: {
    flex: 1,
  },
  identityText: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    color: '#113A70',
    fontSize: 22,
    fontWeight: '900',
  },
  profile: {
    color: '#2664b4',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  location: {
    color: '#6B7F99',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  verifiedPill: {
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderColor: '#BFD5F3',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedPillPressed: {
    opacity: 0.75,
  },
  verifiedDot: {
    backgroundColor: '#2664b4',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  verifiedText: {
    color: '#174F93',
    fontSize: 12,
    fontWeight: '900',
  },

  // ── Scan card ─────────────────────────────────────────────────────────────
  scanCard: {
    backgroundColor: '#113A70',
    borderRadius: 18,
    marginTop: 14,
    padding: 18,
  },
  scanEyebrow: {
    color: '#9FC2EC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  scanTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  scanMetaRow: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingVertical: 11,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    color: '#7AAABE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  metaValueReady: {
    color: '#7CC6FF',
  },
  metaDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 1,
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: '#2664b4',
    borderRadius: 10,
    paddingVertical: 14,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ── Quick Actions section ─────────────────────────────────────────────────
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Quick action card ─────────────────────────────────────────────────────
  quickCard: {
    backgroundColor: '#fff',
    borderColor: '#D2E1F4',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    width: '47.5%',
  },
  quickIconBox: {
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
    width: 40,
  },
  quickIcon: {
    height: 24,
    width: 24,
  },
  quickTitle: {
    color: '#0C2D5A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  quickText: {
    color: '#5A7BA8',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default Home;