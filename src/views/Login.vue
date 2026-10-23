<template>
  <ion-page>

   

    <ion-content>
          <div v-if="!isConnected" class="network-status-bar">
          No Network Connection
        </div>
        <div v-if="isConnected && showReconnectedMessage" class="network-status-bar connected">
          Connected to Network
        </div>
        

      <form @submit.prevent="login" text-align="center" id="container">
      
        <!-- Logo -->
        <div class="img-container">
          <ion-img 
            src="/new_logo.png" 
            alt="Image" 
            style="height: 100px; width: 100px; margin-bottom: 10px;">
          </ion-img>
        </div>

        <!-- Login Title -->
        <strong>
          <ion-title 
            style="margin-bottom: 20px; font-size: 24px;">
            Login
          </ion-title>
        </strong>
     
        <!-- Username Input -->
        <ion-input 
          label="Username" 
          label-placement="floating" 
          v-model="username" 
          type="text" 
          required 
          class="custom-input">
        </ion-input>

        <!-- Password Input -->
        <ion-input 
          label="Password" 
          label-placement="floating" 
          v-model="password" 
          type="password" 
          required 
          style="margin-bottom: 30px;"
          class="custom-input" 
          >
          

        </ion-input>

        <!-- Login Button -->
        <div class="ion-text-center">
          <ion-button 
            class="lowercase-button" 
            type="submit" 
            style="margin-top: 20px;">
            Login
          </ion-button>
        </div>

        <!-- Toast Notification -->
        <ion-toast 
          :isOpen="showToast" 
          :message="toastMessage" />
        
      </form>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import { Device } from '@capacitor/device';
import { IonInput, IonContent, IonButton, IonPage, IonImg, IonTitle, IonToast, loadingController } from '@ionic/vue';
import { registerPushNotifications } from '@/services/pushNotifications';
import storage from '@/services/storagefile';
import Constants from '@/common/constants';
import { RequestForAPI, fetchData, loginApi, setAuthToken } from '@/services/ApiService';
import { Network } from '@capacitor/network';
import { showToast } from '@/services/toast'; 
import router from '@/router/index'; // Assuming your router file is named router.js
import useNetwork from '@/services/networkService'; // Import the network service

export default {
  components: {
    IonInput, IonContent, IonButton, IonPage, IonImg, IonTitle, IonToast
  },
  setup() {

    const { isConnected, showReconnectedMessage, initNetworkListener } = useNetwork(); // Use network service

    const username = ref('');
    const password = ref('');
    const showToast = ref(false);
    const toastMessage = ref('');
    const deviceName = ref('');
    const deviceModel = ref('');
    const devicePlatform = ref('');
    const deviceUUID = ref('');
    const firebaseTok = ref('');

    const getDeviceInfo = async () => {
      try {
        console.log("Fetching device information...");
        
        const info = await Device.getInfo();
        const deviceId = await Device.getId();

        deviceName.value = info.manufacturer;
        deviceModel.value = info.model;
        devicePlatform.value = info.platform;
        deviceUUID.value = deviceId.identifier;

        firebaseTok.value = await registerPushNotifications();



        if (firebaseTok.value) {
          console.log(`Firebase Token: ${firebaseTok.value}`);
        } else {
          console.warn('Firebase token not available.');
        }

        console.log(
          `Device Info: ${deviceName.value}, ${deviceModel.value}, ${devicePlatform.value}, ${deviceUUID.value}`
        );
      } catch (error) {
        console.error("Error fetching device info: ", error);
      }
    };

    const storeData = async (keyname, valuedata) => {
      await storage.set(keyname, valuedata);
    };

    const retrieveData = async (keyname) => {
      const data = await storage.get(keyname);
      console.log("Retrieved data:", data);
    };

    const login = () => {
      // Blur active element to avoid "Blocked aria-hidden on an element because its descendant retained focus"
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      loadingController.create({ message: 'Authenticating...' })
        .then((loading) => {
          loading.present();

          const params = {
            username: username.value,
            password: password.value,
            mob_mdl: deviceModel.value ,
            mob_name: deviceName.value ,
            dev_id: firebaseTok.value ,
            mob_pfm: devicePlatform.value ,
            mob_uuid: deviceUUID.value,
            mob_sw_ver: '1',
            app_ver: '1',
            app_type: '1'
          };

          console.log("Submitting login credentials", params);

          return loginApi(params)
            .then(async (response) => {
              const responseJson = response.data;

              if (response.status === 200) {
                toastMessage.value = responseJson.message || 'Login successful';
                showToast.value = true;

                const token = responseJson.token || responseJson.bearer_token || (responseJson.data && responseJson.data.token);
                if (token) {
                  setAuthToken(token);
                }

                // Clear any stale cached data from previous account logins
                try {
                  localStorage.removeItem('dashboard_detail');
                  localStorage.removeItem('selected_report_sites');
                  localStorage.removeItem('selected_report_generator');
                  localStorage.removeItem('selected_report_events');
                  localStorage.removeItem('selectedVeh');
                  localStorage.removeItem('last_rec_id');
                } catch (e) {}

                await Promise.all([
                  storeData('login_data', responseJson),
                  storeData('token', token),
                  storeData('IsLoginAlready', true),
                  storeData('RIsLoginAlready', true),
                  storage.set('selectedItem', '/tabs/tab1'),
                  storage.set('RselectedItem', '/tabs/tab1'),
                  storage.set('pagename', 'Dashboard'),
                  storage.set('pageid', '1')
                ]);

                router.replace('/tabs/tab1');
              } else {
                toastMessage.value = responseJson.message || 'Authentication failed';
                showToast.value = true;
              }
            })
            .catch((error) => {
              console.error('Error during login:', error);
              const errMsg = error.response?.data?.message || 'Login failed. Please check credentials or network.';
              toastMessage.value = errMsg;
              showToast.value = true;
            })
            .finally(() => {
              loading.dismiss();
                              showToast.value = false;

            });
        })
        .catch((error) => {
          console.error('Error creating loading spinner:', error);
        });
    };

    const requestVehicleStatusColor = () => {
      loadingController.create({ message: 'Loading...' })
        .then((loading) => {
          loading.present(); // Show loading spinner

          fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.Req_Color, {})
            .then((response) => {
              if (response.status === 200) {
                        const updatedData = response.data.arr_data.map(item => ({
                ...item,  // Spread the original properties
                isEnabled: true  // Add isEnabled key with value true
              }));

              // Store the updated data
              storeData('VehicleStatusColor', updatedData);

                router.push('/today');

                return Promise.all([
                  storage.set("selectedItem", '/today'),
                  storage.set("pagename", 'Dashboard'),
                  storage.set("pageid", "1")
                ]);
              } else if (response.status === 401) {
                toastMessage.value = response.data.message;
              }
            })
            .catch((error) => {
              console.error('Error fetching vehicle status color:', error);
            })
            .finally(() => {
              loading.dismiss();
            });
        })
        .catch((error) => {
          console.error('Error creating loading spinner:', error);
        });
    };

    onMounted(async () => {
      // Check if user already has an active session
      try {
        const isLoginAlready = (await storage.get('IsLoginAlready')) || (await storage.get('RIsLoginAlready'));
        const token = (await storage.get('token')) || (await storage.get('login_data'))?.token;
        if (isLoginAlready && token) {
          console.log("User already logged in, redirecting to dashboard");
          router.replace('/tabs/tab1');
          return;
        }
      } catch (err) {
        console.error("Error checking existing session on login mount:", err);
      }

      getDeviceInfo();
      initNetworkListener();
    });

    return {
      username,
      password,
      showToast,
      toastMessage,
      login,
      isConnected,
      initNetworkListener, // Expose the initNetworkListener function
      showReconnectedMessage
    };
  }
};
</script>

<style scoped>


.custom-input {
  --color: #fae8d5; /* Text color inside the input field */
  --highlight-color-focused: #FDCF9F; /* Label color when input is focused */
  --label-color-focused: #FDCF9F; /* Label color when focused */
  --label-color-invalid: #FDCF9F; /* Label color when input is invalid */
  --icon-color: #FDCF9F; /* Password visibility toggle icon color */

}



  ion-button {
    --background: #433b3b;
    --background-hover: #433b3b;
    --background-activated: #433b3b;
    --background-focused: #433b3b;
    --border-radius: 20px;
    --border-color: #433b3b;
    --border-style: solid;
    --border-width: 1px;
    color: #fdcf9f;
    --box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.25);
  }

  .lowercase-button {
    text-transform: none;
    color: #fdcb97;
  }

  #container {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    padding-left: 5%;
    transform: translateY(-50%);
  }

  .img-container {
    display: flex;
    justify-content: center;
  }

  #container strong {
    text-align: center;
    font-size: 20px;
    line-height: 26px;
  }

  .network-status-bar {
  background-color: 5b575b;
  color: white;
  text-align: center;
  padding: 5px;
  font-size: 14px;
}


.network-status-bar.connected {
  background-color: green;
}

</style>
