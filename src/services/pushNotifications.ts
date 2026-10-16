import { PushNotifications, Token } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import router from '@/router';

export let deviceToken: string | null = null;

/**
 * Create Android notification channel (iOS does not need this)
 */
export async function createNotificationChannel() {
  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: 'default',
      name: 'General Notifications',
      importance: 5,
      visibility: 1,
      description: 'General Notifications from the app',
      sound: 'default',
    });
  }
}

/**
 * Schedule a test notification (Android only)
 */
async function scheduleNotification() {
  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Custom Notification',
          body: 'This notification uses a custom notification.',
          id: 1,
          schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 seconds later
          channelId: 'default',
        },
      ],
    });
  }
}

/**
 * Register push notifications (APNS on iOS, native push on Android)
 */

export async function registerPushNotifications() {

  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== 'granted') {
    return null;
  }

  await PushNotifications.register();

  if (Capacitor.getPlatform() === 'android') {

    PushNotifications.addListener('registration', (token) => {

      deviceToken = token.value;

      console.log("Android FCM Token:", deviceToken);

      localStorage.setItem("deviceToken", deviceToken);
    });

  } else {

    const result = await FirebaseMessaging.getToken();

    deviceToken = result.token;

    console.log("iOS FCM Token:", deviceToken);

    localStorage.setItem("deviceToken", deviceToken);
  }

  return deviceToken;
}






// export async function registerPushNotifications(): Promise<string | null> {

//   if (Capacitor.getPlatform() === 'web') {
//     console.warn('Push Notifications not supported on Web.');
//     return null;
//   }

//   // Request permissions
//   const perm = await PushNotifications.requestPermissions();
//   if (perm.receive !== 'granted') {
//     console.error('Push notifications permission not granted.');
//     return null;
//   }

//   // Register device for push notifications
//   await PushNotifications.register();

//   // Listen for registration (token)
//   PushNotifications.addListener('registration', (token: Token) => {
//     console.log('📲 Device Token:', token.value);
//     deviceToken = token.value; // Use this token in login API

//     // ⚠️ On iOS, this is the APNS token
//     // You can send deviceToken to your backend at login
//   });

//   // Handle notification received while app is running (foreground)
//   PushNotifications.addListener('pushNotificationReceived', async (notification) => {
//     console.log('📩 Notification received:', notification);

//     // Optional: show local notification in foreground
//     await LocalNotifications.schedule({
//       notifications: [{
//         title: notification.title || 'New Notification',
//         body: notification.body || '',
//         id: Date.now(),
//         channelId: 'default',
//         extra: notification.data
//       }]
//     });
//   });

//   // Handle notification when user taps it
//   PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
//     console.log('🖱 Notification action performed:', notification);
//     const data = notification.notification.data;
//     if (data?.detailsId) {
//       router.push(`/mainpage`);
//     }
//   });

//   // Wait until token is collected
//   await new Promise<void>((resolve) => {
//     if (deviceToken) return resolve();
//     const interval = setInterval(() => {
//       if (deviceToken) {
//         clearInterval(interval);
//         resolve();
//       }
//     }, 100);
//   });

//   return deviceToken;
// }
