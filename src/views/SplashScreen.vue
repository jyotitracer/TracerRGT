<template>
  <ion-page>
    
    <ion-alert
      :is-open="isPrivacyPolicyOpen"
      header="Privacy Policy"
      message="This app does not collect or share any user data. It will allow the user to initiate a phone call to predefined numbers on click of the call button inside the app.However the app does not access the phone book or contact list of the mobile."
      :buttons="alertButtons"
    >
    </ion-alert>
    <ion-img src="/new_logo.png" alt="Image" style="height: 100%; width: 100%; margin-bottom: 10px;"></ion-img>
  </ion-page>
</template>

<!-- This is page splash Screen. here checking is app having already login or not. 
and Based on that redirection of pages.  
-->
<script>
import { ref, onBeforeMount } from 'vue';
import storage from '@/services/storagefile';
import router from '@/router/index';
import { IonPage, IonImg, IonAlert } from '@ionic/vue';
import useNetwork from '@/services/networkService'; // Import the network service

export default {
  components: {
    IonImg, IonPage, IonAlert
  },
  data() {
    return {
      isPrivacyPolicyOpen: false,
      alertButtons: [
        {
          text: 'Accept',
          handler: () => this.handlePolicyAccepted()
        }
      ]
    };
  },
  methods: {

    // this function checking is already login or not
    async checkLoginAndRedirect() {
      try {
        const isLoginAlready = (await storage.get('IsLoginAlready')) || (await storage.get('RIsLoginAlready'));
        const token = (await storage.get('token')) || (await storage.get('login_data'))?.token;

        if (isLoginAlready || token) {
          const storedMenu = (await storage.get('selectedPage')) || (await storage.get('RselectedPage'));
          const targetRoute = storedMenu?.route || '/tabs/tab1';
          console.log("Active session found, navigating to:", targetRoute);
          router.replace(targetRoute);
        } else {
          console.log("No active session found, redirecting to login");
          router.replace('/login');
        }
      } catch (err) {
        console.error("Error during session check:", err);
        router.replace('/login');
      }
    },

    // this funtion handles when accept the policy 
    handlePolicyAccepted() {
      localStorage.setItem('RhasSeenPrivacyPolicy', 'true');
      this.isPrivacyPolicyOpen = false;
      this.checkLoginAndRedirect();
    },

     /**
         * If user open app for the first time then privacy policy popup will
         * be appear else not.
         * If  promptTutorial() returns true then popup will appear else not.
         */

    promptTutorial() {
      const hasSeenPrivacyPolicy = localStorage.getItem('RhasSeenPrivacyPolicy');
      return !hasSeenPrivacyPolicy;
    }
  },

  async mounted() {
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (this.promptTutorial()) {
      this.isPrivacyPolicyOpen = true;
    } else {
      this.checkLoginAndRedirect();
    }
  }

};
</script>

<style>
/* Add your custom styles here */
</style>
