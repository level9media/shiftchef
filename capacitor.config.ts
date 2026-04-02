import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.shiftchef.app',
  appName: 'ShiftChef',
  webDir: 'dist/public',
  server: {
    url: 'https://shiftchef-production.up.railway.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A0A',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: false,
      backgroundColor: '#FF6B00',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A0A0A',
    },
  },
};

export default config;
