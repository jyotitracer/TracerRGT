<template>
  <ion-app>
    <!-- The Offline Indicator will overlay everything when not connected -->
    <OfflineIndicator v-if="!isConnected" />
    
    <!-- Your main app is always in the DOM, but will be hidden by the overlay.
         You could also use v-if/v-else, but this way the app state is preserved
         when the connection drops and returns. -->
    <ion-router-outlet :style="{ display: isConnected ? 'block' : 'none' }" />

    <!-- Toast message for when connection is restored -->
    <ion-toast
      :is-open="showReconnectedMessage"
      message="You are back online!"
      :duration="3000"
      position="top"
      color="success"
      @didDismiss="showReconnectedMessage = false"
    ></ion-toast>
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/vue';
import OfflineIndicator from './components/OfflineIndicator.vue'; // Adjust the path if needed
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';


// Import your network composable
import useNetwork from './services/networkService'; // Adjust the path if needed

const { isConnected, showReconnectedMessage, initNetworkListener, removeNetworkListener } = useNetwork();

onMounted(async () => {
  // Start listening for network changes when the app mounts
  initNetworkListener();
   
//ios edge to edge
  if (Capacitor.getPlatform() === 'ios') {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setStyle({ style: Style.Light }); // optional (white text)
  }

});

onUnmounted(() => {
  // Clean up the listener when the app is destroyed
  removeNetworkListener();
});
</script>