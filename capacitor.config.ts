import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.shiftchef.app',
  appName: 'ShiftChef',
  webDir: 'dist',
  server: {
    // For production: remove androidScheme and use the built dist
    // For development: uncomment below to point to your live URL
    // url: 'https://shiftchef.co',
    // cleartext: false,
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
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A0A0A',
    },
  },
};

export default config;
