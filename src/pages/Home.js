import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const logo = require('../../assets/images/Faceicon.webp');
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
            <View style={styles.profileAvatarBox}>
              <Image source={logo} style={styles.logo} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name}>Sindhu FaceID</Text>
              <Text style={styles.profile}>Staff access profile</Text>
            </View>
          </View>
          <View style={styles.verifiedPill}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
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
    backgroundColor: '#F0F5FB',
  },
  content: {
    paddingBottom: 28,
  },

  // ── Body wrapper ─────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },

  // ── Profile card ─────────────────────────────────────────────────────────
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#C5D6EE',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  profileMain: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  profileAvatarBox: {
    backgroundColor: '#DDE8F5',
    borderRadius: 12,
    padding: 4,
  },
  logo: {
    borderRadius: 10,
    height: 46,
    width: 46,
  },
  identityText: {
    flex: 1,
  },
  name: {
    color: '#0C2D5A',
    fontSize: 17,
    fontWeight: '900',
  },
  profile: {
    color: '#5A7BA8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  verifiedPill: {
    alignItems: 'center',
    backgroundColor: '#EDFAF3',
    borderColor: '#BBF0D4',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedDot: {
    backgroundColor: '#12B76A',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  verifiedText: {
    color: '#027A48',
    fontSize: 12,
    fontWeight: '900',
  },

  // ── Scan card ─────────────────────────────────────────────────────────────
  scanCard: {
    backgroundColor: '#0D2E4E',
    borderRadius: 14,
    marginTop: 14,
    padding: 18,
  },
  scanEyebrow: {
    color: '#5A8BAA',
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.10)',
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
    color: '#38BDF8',
  },
  metaDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 1,
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 14,
  },
  scanButtonText: {
    color: '#082F49',
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
    color: '#5A7BA8',
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
    backgroundColor: '#ffffff',
    borderColor: '#C5D6EE',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    // Each card takes ~half width minus gap
    width: '47.5%',
  },
  quickIconBox: {
    alignItems: 'center',
    backgroundColor: '#DDE8F5',
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
