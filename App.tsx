import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = require('./src/pages/Home').default;
const LoginScreen = require('./src/pages/login').default;
const SignupScreen = require('./src/pages/signup').default;
const ForgotScreen = require('./src/pages/forgot').default;
const ScanScreen = require('./src/pages/scan').default;
const SettingsScreen = require('./src/pages/Settings').default;
const MenuScreen = require('./src/pages/Menu').default;
const ProfileScreen = require('./src/pages/Profile').default;

const backIcon = require('./assets/images/back.png');
const mainLogo = require('./assets/images/mainlogo.png');

type RouteName =
  | 'login'
  | 'signup'
  | 'forgot'
  | 'home'
  | 'scan'
  | 'settings'
  | 'menu'
  | 'profile';

type AppPageProps = {
  navigate: (route: RouteName) => void;
  onSignIn?: () => void;
};

const routes: Record<RouteName, React.ComponentType<AppPageProps>> = {
  login: LoginScreen,
  signup: SignupScreen,
  forgot: ForgotScreen,
  home: HomeScreen,
  scan: ScanScreen,
  settings: SettingsScreen,
  menu: MenuScreen,
  profile: ProfileScreen,
};

const routeTitles: Record<RouteName, string> = {
  login: 'Login',
  signup: 'Create Account',
  forgot: 'Forgot Password',
  home: 'Dashboard',
  scan: 'Scan Face',
  settings: 'Settings',
  menu: 'Menu',
  profile: 'Profile',
};

const backIconRoutes: RouteName[] = ['scan', 'settings', 'menu', 'profile'];

function App() {
  const [route, setRoute] = useState<RouteName>('login');
  const ActiveScreen = routes[route];
  const isAuthRoute =
    route === 'login' || route === 'signup' || route === 'forgot';
  const isHomeRoute = route === 'home';
  const showBackIcon = backIconRoutes.includes(route);

  const handleSignIn = () => {
    setRoute('home');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fb" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>
          {!isAuthRoute && (
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isHomeRoute ? 'Open menu' : 'Go back'}
                style={styles.topIconButton}
                onPress={() => setRoute(isHomeRoute ? 'menu' : 'home')}
              >
                {isHomeRoute ? (
                  <View style={styles.menuIcon}>
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                  </View>
                ) : showBackIcon ? (
                  <Image
                    source={backIcon}
                    style={styles.backIcon}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.backGlyph}>{'<'}</Text>
                )}
              </Pressable>

              {/* ── Center: logo on home, title text on other routes ── */}
              {isHomeRoute ? (
                <Image
                  source={mainLogo}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              ) : (
                <View>
                  <Text style={styles.eyebrow}>Secure identity</Text>
                  <Text style={styles.title}>{routeTitles[route]}</Text>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                style={styles.avatarButton}
                onPress={() => setRoute('profile')}
              >
                <Text style={styles.avatarText}>S</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.page, isAuthRoute && styles.authPage]}>
            <ActiveScreen navigate={setRoute} onSignIn={handleSignIn} />
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
  menuIcon: {
    gap: 4,
    width: 20,
  },
  menuLine: {
    backgroundColor: '#102a43',
    borderRadius: 2,
    height: 3,
    width: 20,
  },
  backIcon: {
    height: 20,
    width: 20,
    tintColor: '#102a43',
  },
  backGlyph: {
    color: '#102a43',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
  },
  // ── Logo in header ──
  headerLogo: {
    height: 40,
    width: 150,
  },
  eyebrow: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
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
  authPage: {
    backgroundColor: '#eef5fb',
  },
});

export default App;