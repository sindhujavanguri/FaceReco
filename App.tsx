import React, {useState} from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

const HomeScreen = require('./src/pages/Home').default;
const ScanScreen = require('./src/pages/scan').default;
const AccountScreen = require('./src/pages/Account').default;
const SettingsScreen = require('./src/pages/Settings').default;
const MenuScreen = require('./src/pages/Menu').default;
const ProfileScreen = require('./src/pages/Profile').default;
const LocationScreen = require('./src/pages/Location').default;

type RouteName =
  | 'home'
  | 'scan'
  | 'account'
  | 'settings'
  | 'menu'
  | 'profile'
  | 'location';

type AppPageProps = {
  navigate: (route: RouteName) => void;
};

const routes: Record<RouteName, React.ComponentType<AppPageProps>> = {
  home: HomeScreen,
  scan: ScanScreen,
  account: AccountScreen,
  settings: SettingsScreen,
  menu: MenuScreen,
  profile: ProfileScreen,
  location: LocationScreen,
};

const routeTitles: Record<RouteName, string> = {
  home: 'Face ID Home',
  scan: 'Scan Face',
  account: 'Account',
  settings: 'Settings',
  menu: 'Menu',
  profile: 'Profile',
  location: 'Location',
};

function VectorIcon({name, active}: {name: string; active?: boolean}) {
  const color = active ? '#ffffff' : '#344054';
  const stroke = active ? '#ffffff' : '#0b6bcb';

  if (name === 'home') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.roof, {borderColor: stroke}]} />
        <View style={[styles.homeBody, {borderColor: stroke}]} />
      </View>
    );
  }

  if (name === 'scan') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.corner, styles.cornerTopLeft, {borderColor: stroke}]} />
        <View style={[styles.corner, styles.cornerTopRight, {borderColor: stroke}]} />
        <View style={[styles.corner, styles.cornerBottomLeft, {borderColor: stroke}]} />
        <View style={[styles.corner, styles.cornerBottomRight, {borderColor: stroke}]} />
        <View style={[styles.scanDot, {backgroundColor: stroke}]} />
      </View>
    );
  }

  if (name === 'account') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.personHead, {borderColor: stroke}]} />
        <View style={[styles.personBody, {borderColor: stroke}]} />
      </View>
    );
  }

  if (name === 'settings') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.gearRing, {borderColor: stroke}]} />
        <View style={[styles.gearDot, {backgroundColor: stroke}]} />
      </View>
    );
  }

  return <Text style={[styles.fallbackIcon, {color}]}>{name === 'menu' ? '=' : '^'}</Text>;
}

function App() {
  const [route, setRoute] = useState<RouteName>('home');
  const ActiveScreen = routes[route];

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fb" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              style={styles.topIconButton}
              onPress={() => setRoute('menu')}>
              <Text style={styles.menuGlyph}>☰</Text>
            </Pressable>

            <View>
              <Text style={styles.eyebrow}>Secure identity</Text>
              <Text style={styles.title}>{routeTitles[route]}</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open location"
                style={styles.locationPill}
                onPress={() => setRoute('location')}>
                <Text style={styles.locationIcon}>⌖</Text>
                <Text style={styles.locationText}>BLR</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                style={styles.avatarButton}
                onPress={() => setRoute('profile')}>
                <Text style={styles.avatarText}>S</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.page}>
            <ActiveScreen navigate={setRoute} />
          </View>

          <View style={styles.taskbar}>
            {[
              ['home', 'Home'],
              ['scan', 'Scan'],
              ['account', 'Account'],
              ['settings', 'Settings'],
            ].map(([itemRoute, label]) => {
              const active = itemRoute === route;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${label}`}
                  key={itemRoute}
                  onPress={() => setRoute(itemRoute as RouteName)}
                  style={[styles.tabItem, active && styles.tabItemActive]}>
                  <VectorIcon name={itemRoute} active={active} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8fb',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#f5f8fb',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  topIconButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderRadius: 16,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  menuGlyph: {
    color: '#102a43',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 25,
  },
  eyebrow: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: '#101828',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationPill: {
    alignItems: 'center',
    backgroundColor: '#eaf5ff',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 3,
    minHeight: 34,
    paddingHorizontal: 9,
  },
  locationIcon: {
    color: '#0b6bcb',
    fontSize: 15,
    fontWeight: '900',
  },
  locationText: {
    color: '#0b4f8f',
    fontSize: 11,
    fontWeight: '800',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#102a43',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  page: {
    flex: 1,
  },
  taskbar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e3ed',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 18,
    gap: 3,
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: '#0b6bcb',
  },
  tabLabel: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  iconBox: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 24,
  },
  roof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 12,
    position: 'absolute',
    top: 2,
    transform: [{rotate: '45deg'}],
    width: 12,
  },
  homeBody: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 2,
    height: 11,
    top: 8,
    width: 15,
  },
  corner: {
    height: 8,
    position: 'absolute',
    width: 8,
  },
  cornerTopLeft: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    left: 2,
    top: 2,
  },
  cornerTopRight: {
    borderRightWidth: 2,
    borderTopWidth: 2,
    right: 2,
    top: 2,
  },
  cornerBottomLeft: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    bottom: 2,
    left: 2,
  },
  cornerBottomRight: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    bottom: 2,
    right: 2,
  },
  scanDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  personHead: {
    borderRadius: 6,
    borderWidth: 2,
    height: 10,
    width: 10,
  },
  personBody: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    height: 9,
    marginTop: 2,
    width: 18,
  },
  gearRing: {
    borderRadius: 9,
    borderWidth: 3,
    height: 18,
    width: 18,
  },
  gearDot: {
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    width: 6,
  },
  fallbackIcon: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 21,
  },
});

export default App;
