import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { IonicVue } from '@ionic/vue';
import { register as registerSwiperElements } from 'swiper/element/bundle';

// Register Swiper custom elements (<swiper-container> and <swiper-slide>)
registerSwiperElements();

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import { initializeApp } from 'firebase/app';
import { FileOpener } from '@capacitor-community/file-opener';
import { registerPushNotifications, createNotificationChannel } from './services/pushNotifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyDnRHEVKOpdSF2zke2heMsVbcFhPHxUcMc",
  authDomain: "coolguard-855eb.firebaseapp.com",
  databaseURL: "https://coolguard-855eb.firebaseio.com",
  projectId: "coolguard-855eb",
  storageBucket: "coolguard-855eb.firebasestorage.app",
  messagingSenderId: "749616558514",
  appId: "1:749616558514:web:a3c0e4bd6095feb5bff4ab",
  measurementId: "G-MZLJM3JQHG"
};
export const firebaseApp = initializeApp(firebaseConfig);

const app = createApp(App)
  .use(IonicVue)
  .use(router);

if (Capacitor.isNativePlatform()) {
  try {
    registerPushNotifications().then((token) => {
      console.log('firebaseToken', token);
    }).catch((err) => {
      console.warn('Push registration error:', err);
    });
    createNotificationChannel();
  } catch (e) {
    console.warn('Native notification initialization error:', e);
  }
}

router.isReady().then(() => {
  app.mount('#app');

  // Remove system theme detection
  document.body.classList.remove('dark');
  document.body.classList.add('light'); // Force light theme always

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.removeEventListener?.('change', () => {});
});

// For saved file open
if (Capacitor.isNativePlatform()) {
  try {
    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      async (notification) => {
        const fileUri = notification.notification.extra?.fileUri;
        if (!fileUri) {
          console.log('No file URI in notification');
          return;
        }
        console.log('Opening saved report:', fileUri);
        try {
          await FileOpener.open({
            filePath: fileUri,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
        } catch (err) {
          console.log('OPEN FILE ERROR:', err);
        }
      }
    );
  } catch (err) {
    console.warn('LocalNotifications listener setup error:', err);
  }
}
