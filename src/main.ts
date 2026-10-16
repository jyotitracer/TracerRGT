import { createApp } from 'vue'
import App from './App.vue'
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

import { App as CapacitorApp } from '@capacitor/app';
import { registerPushNotifications, createNotificationChannel } from './services/pushNotifications'; // Import your push notifications setup function


import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";



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

const firebaseToken = registerPushNotifications();

console.log("firebaseToken", firebaseToken);

createNotificationChannel();


router.isReady().then(() => {

  // if (Capacitor.isNativePlatform()) {
  //   StatusBar.setStyle({ style: Style.Default }); // Or Style.Light, Style.Dark
  //   StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparent
  //   StatusBar.setOverlaysWebView({ overlay: true });
  // }
  app.mount('#app');

  // 🚫 Remove system theme detection
  document.body.classList.remove('dark'); // or 'light', depending on what you want
  document.body.classList.add('light');   // 👈 Force light theme always

  // Optional: prevent it from flipping again
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.removeEventListener?.('change', () => { });

});

//for saved file open

import { FileOpener } from "@capacitor-community/file-opener";

LocalNotifications.addListener(
  "localNotificationActionPerformed",
  async (notification) => {
    const fileUri = notification.notification.extra?.fileUri;

    if (!fileUri) {
      console.log("No file URI in notification");
      return;
    }

    console.log("Opening saved report:", fileUri);

    try {
      await FileOpener.open({
        filePath: fileUri,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (err) {
      console.log("OPEN FILE ERROR:", err);
    }
  }
);
