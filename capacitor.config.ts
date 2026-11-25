import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'control-electoral',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      backgroundColor: '#FAF6EE',
      launchAutoHide: false,
      launchFadeOutDuration: 180,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FAF6EE',
      overlaysWebView: false,
    },
    SystemBars: {
      style: 'LIGHT',
    },
  },
};

export default config;
