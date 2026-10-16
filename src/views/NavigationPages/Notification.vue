<template>
  <ion-page id="main-content">
    <ion-header style="background-color: var( --ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TracerRGT</ion-title>
      <ion-buttons  slot="primary">
        <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="helpCircle" @click="goToHelpScreen"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="shareSocial" @click="goToSharePage"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="personCircle" @click="goToProfilePage"></ion-icon>
        </div>

    </ion-buttons>
   
  </ion-toolbar>

    </ion-header>
    
    <ion-content>
    <ion-list>
      <ion-card v-for="(page, index) in selectedItems" :key="index" class="notification-card">
        <ion-card-content>
          <div class="item-content">
            <!-- Message Display -->
            <div class="text">{{ page.msg }}</div>

            <!-- Horizontal Line -->
            <div class="separator"></div>

            <!-- Share Button and Checkbox at the End -->
            <div class="action-buttons" >
              <div class="time-info">Message received on {{ "page.time" }}</div>

                <ion-icon @click="shareItem(page.msg)"name="share-outline" class="share_icon"></ion-icon>
                <ion-checkbox class="custom-checkbox" v-model="page.selected"></ion-checkbox>

            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-list>
    
    <!-- Footer Buttons for Delete Actions (Stick to Bottom) -->
    <ion-footer class="footer-buttons">
      <ion-button expand="block" @click="deleteAll" class="footer-button">
        Clear All
      </ion-button>
      <ion-button expand="block" @click="deleteSelected" class="footer-button">
        Clear Selected
      </ion-button>
    </ion-footer>

  </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton,IonButtons,IonIcon } from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { helpCircle, personCircle, shareSocial, } from 'ionicons/icons';
import router from '@/router/index'; // Assuming your router file is named router.js
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { defineComponent, ref, onMounted } from 'vue';
import {
  
  IonItem,
  IonList,
  loadingController,
} from '@ionic/vue';
import Constants from "@/common/constants";
import { fetchData, getNotificationList } from "@/services/ApiService";
import storage from "@/services/storagefile";
import { Network } from '@capacitor/network';
import { showToast } from '@/services/toast'; // Import the toast utility function

const goToHelpScreen = () => {
  router.push('/helpscreen/2');
};

const goToSharePage = async () => {
  try {
        const ionPageElement = document.getElementById("main-content");
        if (!ionPageElement) {
          console.error("Main content area not found.");
          return;
        }

        const canvas = await html2canvas(ionPageElement);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const fileName = `screenshot_${new Date().getTime()}.jpg`;

        await Filesystem.writeFile({
          path: fileName,
          data: dataUrl.split(',')[1],
          directory: Directory.Cache,
        });

        const uri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Check this out!',
          text: 'Sharing a screenshot',
          url: uri.uri,
          dialogTitle: 'Share Screenshot',
        });
      } catch (error) {
        console.error('Error capturing and sharing screenshot', error);
      }

};

const goToProfilePage = () => {
  router.push('/profile');
};


const selectedItems = ref([]);

    // Load items from local storage
    const loadItemsFromStorage = async () => {
      const storedItems = await storage.get('selectedItems');
      if (storedItems) {
        selectedItems.value = storedItems;
      }
    };

    // Fetch data from API and store it locally
    const fetchDataFromAPI = () => {
      loadingController.create({
        message: 'Loading...',
        backdropDismiss: true
      })
      .then(loading => {
        loading.present();

        const lastRecId = parseInt(localStorage.getItem('last_rec_id') || '0', 10);
        console.log("Fetching notifications with rec_id:", lastRecId);

        return getNotificationList(lastRecId)
          .then(response => {
            const responsejson = response.data;

            if (response.status === 200 && responsejson) {
              const list = responsejson.arr_data || responsejson.data || [];
              const fetchedItems = list.map((item: any) => ({
                rec_id: item.rec_id || item.id,
                msg: item.msg || item.message || item.notification || '',
                selected: false,
              }));

              if (list.length > 0 && list[0].rec_id) {
                localStorage.setItem('last_rec_id', String(list[0].rec_id));
              }

              return storage.set('selectedItems', fetchedItems)
                .then(() => loadItemsFromStorage());
            } else if (response.status === 401) {
              console.error(responsejson?.message);
            } else {
              console.error("Empty response data");
            }
          })
          .catch(error => {
            console.error("Error fetching notifications:", error);
          })
          .finally(() => {
            loading.dismiss();
          });
      })
      .catch(error => {
        console.error("Error creating loading:", error);
      });
    };



    // Function to share item message
    const shareItem = async (msg: string) => {
      console.log(`Share ${msg}`);

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Share Event',
            text: `Check out this event: ${msg}`,
            url: window.location.href,
          });
        } catch (error) {
          console.error('Error sharing', error);
        }
      } else {
        console.error('Sharing is not supported in your browser.');
      }
    };

    // Delete all items
    const deleteAll = async () => {
      await storage.remove('selectedItems');
      selectedItems.value = [];
      loadItemsFromStorage();
    };

    // Delete selected items
    const deleteSelected = async () => {
      selectedItems.value = selectedItems.value.filter(item => !item.selected);
      await storage.set('selectedItems', selectedItems.value);
      loadItemsFromStorage();
    };

    // On component mount, check network and fetch data if connected
    onMounted(async () => {
      const status = await Network.getStatus();
      if (status.connected) {
        loadItemsFromStorage();
        fetchDataFromAPI();
      } else {
        showToast();
        loadItemsFromStorage();
      }
    });

</script>


<style scoped>
.custom_icon{
  margin-right: 10px;
}

ion-icon{
    height: 30px;
    width: 30px;
    color: #fdcf9f; /* Custom color for the icon */
  }

  ion-checkbox{
    
  }

  .share_icon{
    height: 25px;
    width: 25px;
    color: var(--ion-color-paleSalmon); /* Custom color for the icon */

  }

  .notification-card {
  margin: 5px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); /* Card shadow for better appearance */
  border-radius: 8px; /* Rounded corners */
}

.item-content {
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  width: 100%;
  position: relative;
}

.text {
  flex: 1;
  padding: 0 5px 5px;
  word-wrap: break-word;
  white-space: normal;
  color: var(--ion-text-color); /* Text color for time info */

}

.separator {
  width: 100%;
  height: 1px;
  background-color: var(--ion-text-color); /* Line color */
}

.action-buttons {
  display: flex;
  justify-content: flex-end; /* Align share and checkbox to the end */
  align-items: center;
  margin: 10px 0px;
  gap: 6%;

}

.time-info {
  font-size: 12px;
  color: var(--ion-text-color); /* Text color for time info */
  text-align: left; /* Ensure time-info starts at the left of the line */
  flex: 1; /* Make sure it takes up available space */

}

.custom-checkbox {
  --border-color: var(--ion-color-paleSalmon); /* Box border color */
  --background: transparent; /* Box background color when unchecked */
  --checkmark-color: var(--ion-color-paleSalmon); /* Checkmark color when checked */
  --color: var(--ion-color-paleSalmon);/* Box background color when checked */
}

.footer-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap:5%;

}

.footer-button {
  --background: var(--ion-color-greyishBrown);
  --color: var(--ion-color-paleSalmon);
  --ripple-color: var(--ion-color-paleSalmon);
  justify-items: center;
  text-transform: none;
}


.footer-label {
  color: var(--ion-color-paleSalmon); /* Color for the "swipe up" text */
  font-size: 14px;
}



</style>