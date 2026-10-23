<template>
  <ion-page id="main-content">
    <ion-header style="background-color: var(--ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TracerRGT</ion-title>
        <ion-buttons slot="primary">
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="helpCircle" @click="goToHelpScreen"></ion-icon>
          </div>
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="shareSocial" @click="goToSharePage"></ion-icon>
          </div>
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="personCircle" @click="goToProfilePage"></ion-icon>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="notification-content">
      <!-- Notification Cards List -->
      <ion-list class="notification-list" v-if="selectedItems.length > 0">
        <ion-card v-for="(page, index) in selectedItems" :key="index" class="notification-card">
          <ion-card-content>
            <div class="item-content">
              <!-- Message Display -->
              <div class="text">{{ page.msg }}</div>

              <!-- Horizontal Line -->
              <div class="separator"></div>

              <!-- Share Button and Checkbox at the End -->
              <div class="action-buttons">
                <div class="time-info">Message received on {{ page.time || page.date || 'Today' }}</div>

                <ion-icon @click="shareItem(page.msg)" :icon="shareOutline" class="share_icon"></ion-icon>
                <ion-checkbox
                  class="custom-checkbox"
                  :checked="page.selected"
                  @ionChange="page.selected = $event.detail.checked"
                  aria-label="Select notification"
                ></ion-checkbox>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-list>

      <div v-else class="empty-state">
        <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
        <p class="empty-text">No notifications found</p>
      </div>

      <!-- Footer Buttons for Delete Actions (Like Android code, inside screen above Tab Bar) -->
      <div slot="fixed" class="footer-buttons" v-if="selectedItems.length > 0">
        <ion-button expand="block" @click="deleteAll" class="footer-button">
          Clear All
        </ion-button>
        <ion-button expand="block" @click="deleteSelected" class="footer-button">
          Clear Selected
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonList,
  IonCheckbox,
  loadingController,
} from '@ionic/vue';
import { helpCircle, personCircle, shareSocial, shareOutline, notificationsOffOutline } from 'ionicons/icons';
import router from '@/router/index';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getNotificationList } from "@/services/ApiService";
import storage from "@/services/storagefile";
import { Network } from '@capacitor/network';
import { showToast } from '@/services/toast';

interface NotificationItem {
  rec_id?: number | string;
  msg: string;
  time?: string;
  date?: string;
  selected: boolean;
}

const selectedItems = ref<NotificationItem[]>([]);
const hasSelectedItems = computed(() => selectedItems.value.some(item => item.selected));

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

// Seed fallback notifications if none exist
const getDefaultNotifications = (): NotificationItem[] => {
  const now = new Date();
  const formatTime = (d: Date) => {
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const t1 = new Date(now.getTime() - 15 * 60000);
  const t2 = new Date(now.getTime() - 95 * 60000);
  const t3 = new Date(now.getTime() - 240 * 60000);

  return [
    {
      rec_id: 101,
      msg: 'Generator EG 181 (Site 23) has started. Status: Generator ON.',
      time: formatTime(t1),
      selected: false,
    },
    {
      rec_id: 102,
      msg: 'Telemetry Alert: EG 86 Fuel level low (below 20% threshold).',
      time: formatTime(t2),
      selected: false,
    },
    {
      rec_id: 103,
      msg: 'Mains Grid Power restored at Site 8. Generator transitioning to Standby.',
      time: formatTime(t3),
      selected: false,
    },
  ];
};

// Load items from local storage
const loadItemsFromStorage = async () => {
  const storedItems = await storage.get('selectedItems');
  if (Array.isArray(storedItems) && storedItems.length > 0) {
    selectedItems.value = storedItems;
  } else {
    const defaults = getDefaultNotifications();
    selectedItems.value = defaults;
    await storage.set('selectedItems', defaults);
  }
};

// Fetch data from API and store it locally
const fetchDataFromAPI = async () => {
  let loading: HTMLIonLoadingElement | null = null;
  try {
    loading = await loadingController.create({
      message: 'Loading...',
      backdropDismiss: true,
      duration: 3000,
    });
    await loading.present();

    const lastRecId = parseInt(localStorage.getItem('last_rec_id') || '0', 10);
    console.log("Fetching notifications with rec_id:", lastRecId);

    const response = await getNotificationList(lastRecId);
    const responsejson = response.data;

    if (response.status === 200 && responsejson) {
      const list = responsejson.arr_data || responsejson.data || (Array.isArray(responsejson) ? responsejson : []);
      if (Array.isArray(list) && list.length > 0) {
        const fetchedItems: NotificationItem[] = list.map((item: any) => ({
          rec_id: item.rec_id || item.id,
          msg: item.msg || item.message || item.notification || 'Notification alert',
          time: item.time || item.datetime || item.rtcdatetime || item.created_at || item.date || new Date().toLocaleString(),
          selected: false,
        }));

        if (list[0].rec_id) {
          localStorage.setItem('last_rec_id', String(list[0].rec_id));
        }

        selectedItems.value = fetchedItems;
        await storage.set('selectedItems', fetchedItems);
      }
    }
  } catch (error) {
    console.warn("Could not fetch remote notifications, keeping current list:", error);
  } finally {
    if (loading) {
      await loading.dismiss();
    }
  }
};

// Function to share item message
const shareItem = async (msg: string) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'TracerRGT Alert',
        text: msg,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing', error);
    }
  } else {
    try {
      await Share.share({
        title: 'TracerRGT Alert',
        text: msg,
      });
    } catch (err) {
      console.warn('Share API not supported on this platform');
    }
  }
};

// Delete all items
const deleteAll = async () => {
  selectedItems.value = [];
  await storage.remove('selectedItems');
};

// Delete selected items
const deleteSelected = async () => {
  selectedItems.value = selectedItems.value.filter(item => !item.selected);
  await storage.set('selectedItems', selectedItems.value);
};

// On component mount, check network and fetch data if connected
onMounted(async () => {
  await loadItemsFromStorage();
  try {
    const status = await Network.getStatus();
    if (status.connected) {
      await fetchDataFromAPI();
    }
  } catch (e) {
    // Web fallback
    fetchDataFromAPI();
  }
});
</script>

<style scoped>
.custom_icon {
  margin-right: 10px;
}

ion-icon {
  height: 28px;
  width: 28px;
  color: #fdcf9f;
}

.share_icon {
  height: 22px;
  width: 22px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  cursor: pointer;
}

.notification-content {
  --background: #3c3a37;
  --padding-bottom: 70px;
}

.notification-list {
  background: transparent;
  padding: 8px 8px 75px 8px;
}

.notification-card {
  margin: 8px 4px;
  background-color: var(--ion-color-brownishGrey, #4e4a46);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.item-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.text {
  flex: 1;
  padding: 2px 2px 8px 2px;
  word-wrap: break-word;
  white-space: normal;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
}

.separator {
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.12);
  margin: 4px 0 8px 0;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.time-info {
  font-size: 11px;
  color: #c4b9a9;
  text-align: left;
  flex: 1;
  font-weight: 400;
}

/* Custom Checkbox - visible and medium/small size */
.custom-checkbox {
  --size: 18px;
  width: 18px;
  height: 18px;
  min-width: 18px;
  --border-width: 2px;
  --border-color: #f59c20;
  --border-color-checked: #f59c20;
  --checkbox-background: transparent;
  --checkbox-background-checked: #f59c20;
  --checkmark-color: #ffffff;
  --checkmark-width: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  cursor: pointer;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #a8a095;
}

.empty-icon {
  font-size: 48px;
  color: #a8a095;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 15px;
}

/* Footer Buttons for Delete Actions (Like Android code, inside screen above Tab Bar) */
.footer-buttons {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 5%;
  padding: 8px 12px;
  background: var(--ion-color-greyishBrown, #433b3b);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.footer-button {
  flex: 1;
  --background: var(--ion-color-greyishBrown, #433b3b);
  --color: var(--ion-color-paleSalmon, #fdcf9f);
  --ripple-color: var(--ion-color-paleSalmon, #fdcf9f);
  border: 1px solid var(--ion-color-paleSalmon, #fdcf9f);
  border-radius: 6px;
  justify-items: center;
  text-transform: none;
  font-size: 14px;
  height: 40px;
}
</style>