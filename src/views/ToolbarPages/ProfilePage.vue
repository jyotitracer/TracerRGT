

<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
           
            <div class="img">
            <ion-icon class="custom-icon" :icon="close"  @click="goBack"/>

            <ion-title class="title">Account</ion-title>
         </div>
      </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <ion-card class="custom-card">
          <ion-card-content>
            <ion-label class="welcome-text">Welcome {{ userName }}</ion-label>
          </ion-card-content>
        </ion-card>
  
        <ion-card class="custom-card" button @click="goToEventSettings">
          <ion-card-content>
            <ion-label class="privacy-policy">Event Settings</ion-label>
          </ion-card-content>
        </ion-card>
  
        <ion-card class="custom-card">
          <ion-card-content>
            <ion-label class="about-title">About</ion-label>
            
            <div class="info-row">
            <ion-label>Version Number</ion-label>
            <ion-label class="info-text">1.0.0</ion-label> <!-- Replace with your version number -->
          </div>
          <div class="info-row">
            <ion-label>Build Date</ion-label>
            <ion-label class="info-text">2026-10-12</ion-label> <!-- Replace with your build date -->
          </div>


            <div class="privacy-policy">

            <ion-label>Privacy Policy</ion-label>
            </div>
            <div class="company-website">

            <ion-label>For more details visit our website</ion-label>
            </div>
          </ion-card-content>
        </ion-card>
  
        <ion-card class="custom-card" button @click="handleLogout">
          <ion-card-content>
            <ion-label class="logout_text">Logout</ion-label>
          </ion-card-content>
        </ion-card>
      </ion-content>
    </ion-page>
  </template>
  


  <script setup lang="ts">
import { ref, onMounted } from 'vue';
import { close } from 'ionicons/icons';
import { IonIcon, IonTitle, IonHeader, IonToolbar, IonLabel, IonCardContent, IonPage, IonCard, IonContent, loadingController } from '@ionic/vue';
import router from '@/router/index';
import storage from '@/services/storagefile';
import { logoutApi, setAuthToken } from '@/services/ApiService';

const userName = ref('User');

onMounted(async () => {
  try {
    const loginData = await storage.get('login_data');
    if (loginData) {
      userName.value = loginData.username || loginData.user_name || loginData.name || (loginData.data && loginData.data.username) || 'User';
    }
  } catch (e) {
    console.error('Error reading user info', e);
  }
});

const goBack = () => {
  router.back();
};

const goToEventSettings = () => {
  router.push('/select-events');
};

const handleLogout = async () => {
  const loading = await loadingController.create({
    message: 'Logging out...',
  });
  await loading.present();

  try {
    // Call Postman Logout endpoint: POST /login/logout
    await logoutApi({});
  } catch (error) {
    console.warn('Logout API warning (clearing local session anyway):', error);
  } finally {
    setAuthToken('');
    // Reset tab state to tab1 before clearing storage so the
    // Ionic tabs component doesn't cache the previously active tab
    await router.replace('/tabs/tab1');
    await storage.clear();
    try {
      const deviceToken = localStorage.getItem('deviceToken');
      const hasSeenPrivacyPolicy = localStorage.getItem('RhasSeenPrivacyPolicy');
      localStorage.clear();
      sessionStorage.clear();
      if (deviceToken) localStorage.setItem('deviceToken', deviceToken);
      if (hasSeenPrivacyPolicy) localStorage.setItem('RhasSeenPrivacyPolicy', hasSeenPrivacyPolicy);
    } catch (e) {
      console.error('Error clearing localStorage on logout:', e);
    }
    await loading.dismiss();
    router.replace('/login');
  }
};
</script>
  
  <style scoped>
  .custom-icon {
  color: var(--ion-color-paleSalmon);
}
  .custom-card {
    margin: 10px; /* Space between cards */
    background: var(--ion-color-brownishGrey); /* Replace with your color */
  }
  
  .welcome-text {
    font-family: 'Rajdhani Medium', sans-serif; /* Use your font */
    color: var(--ion-color-pinkishGrey);
    font-size: 14px; /* Use appropriate size */

  }
  
  .about-title {
    font-size: 16px; /* Use appropriate size */
    color: var(--ion-color-pinkishGrey);
  }
  
   


  
  .privacy-policy, .company-website {
    margin-top: 10px;
    color: var(--ion-color-paleSalmon);
    font-size: 14px; /* Use appropriate size */

  }

  .logout_text {
    color: var(--ion-color-paleSalmon);
    font-size: 14px; /* Use appropriate size */

  }

  .img{
    display: flex; /* Use flexbox for alignment */
  justify-content: space-between; /* Align items to the ends */
  align-items: center;
  margin-left: 20px;

  }

  ion-icon{
    height: 25px;
    width: 25px;
  }
  .title{
    padding: 0px;
    margin: 5px;
  }

  .info-row {
  display: flex; /* Use flexbox for alignment */
  justify-content: space-between; /* Align items to the ends */
  margin-top: 10px; /* Add margin for spacing */
    color: var(--ion-color-pinkishGrey);
    font-size: 13px; /* Use appropriate size */}
  </style>
  