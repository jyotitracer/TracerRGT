<template>
  <div class="offline-overlay">
    <div class="offline-card">
      <div class="icon-wrapper">
        <ion-icon :icon="cloudOfflineOutline" class="offline-icon" />
      </div>
      <h2 class="offline-title">No Internet Connection</h2>
      <p class="offline-message">
        Please check your network settings and try again.
      </p>
      <ion-button class="retry-btn" @click="handleRetry" :disabled="isRetrying">
        <ion-spinner v-if="isRetrying" name="crescent" class="btn-spinner"></ion-spinner>
        <ion-icon v-else slot="start" :icon="refreshOutline"></ion-icon>
        <span>{{ isRetrying ? 'Checking...' : 'Retry' }}</span>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonIcon, IonSpinner } from '@ionic/vue';
import { cloudOfflineOutline, refreshOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';

const isRetrying = ref(false);

const handleRetry = async () => {
  isRetrying.value = true;
  try {
    await Network.getStatus();
  } catch (error) {
    console.error('Failed to check network status:', error);
  } finally {
    setTimeout(() => {
      isRetrying.value = false;
    }, 1000);
  }
};
</script>

<style scoped>
.offline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--ion-color-greyishBrown, #433b3b);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 24px;
}

.offline-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 32px 24px;
  background: var(--ion-color-purplishGrey, #5b575b);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(245, 156, 32, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.offline-icon {
  font-size: 44px;
  color: var(--ion-color-primary, #f59c20);
}

.offline-title {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.offline-message {
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ion-color-pinkishGrey, #c4c4c4);
}

.retry-btn {
  --background: var(--ion-color-primary, #f59c20);
  --color: #ffffff;
  --border-radius: 10px;
  width: 100%;
  height: 44px;
  font-weight: 600;
}

.btn-spinner {
  width: 20px;
  height: 20px;
}
</style>
