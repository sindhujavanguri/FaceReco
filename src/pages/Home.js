import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const logo = require('../../assets/images/Faceicon.png');

function ActionCard({title, text, icon, onPress}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIconBox}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionText}>{text}</Text>
      </View>
      <Text style={styles.actionArrow}>{'›'}</Text>
    </Pressable>
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

        {/* Workspace section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workspace</Text>
          <Text style={styles.sectionHint}>Quick access</Text>
        </View>

        <View style={styles.actionList}>
          <ActionCard
            icon="ID"
            title="Profile details"
            text="Name, role, and access status"
            onPress={() => navigate('profile')}
          />
          <ActionCard
            icon="LOC"
            title="Location"
            text="Bengaluru HQ and entry zone"
            onPress={() => navigate('location')}
          />
          <ActionCard
            icon="SEC"
            title="Account security"
            text="Device trust and face profile"
            onPress={() => navigate('account')}
          />
        </View>

      </View>
    </ScrollView>
  );
}

// ─── Blue Frost Palette ───────────────────────────────────────────────────────
// Header bg:    #DDE8F5   border: #C5D6EE   eyebrow: #5A7BA8   title: #0C2D5A
// Page bg:      #F0F5FB
// Cards bg:     #FFFFFF   border: #C5D6EE
// Profile av:   #DDE8F5
// Scan card:    #0D2E4E   meta bg: rgba(255,255,255,0.07)
// Scan ready:   #38BDF8   button bg: #38BDF8  button text: #082F49
// Icon box:     #DDE8F5   icon text: #1A3A6B
// Arrow:        #1A3A6B
// Verified:     bg #EDFAF3  border #BBF0D4  text #027A48  dot #12B76A
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Scroll & layout ──────────────────────────────────────────────────────
  scrollView: {
    backgroundColor: '#F0F5FB',
  },
  content: {
    paddingBottom: 28,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#DDE8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#C5D6EE',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerEyebrow: {
    color: '#5A7BA8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  headerTitle: {
    color: '#0C2D5A',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.1,
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

  // ── Workspace section ────────────────────────────────────────────────────
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0C2D5A',
    fontSize: 17,
    fontWeight: '900',
  },
  sectionHint: {
    color: '#5A7BA8',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Action cards ─────────────────────────────────────────────────────────
  actionList: {
    gap: 10,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#C5D6EE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  actionIconBox: {
    alignItems: 'center',
    backgroundColor: '#DDE8F5',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 48,
  },
  actionIcon: {
    color: '#1A3A6B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: '#0C2D5A',
    fontSize: 15,
    fontWeight: '900',
  },
  actionText: {
    color: '#5A7BA8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 3,
  },
  actionArrow: {
    color: '#1A3A6B',
    fontSize: 26,
    fontWeight: '900',
  },
});

export default Home;