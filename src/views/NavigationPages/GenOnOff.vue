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
    <ion-content :fullscreen="true">
     

  <ion-content :fullscreen="true" class="ion-padding page-background">

      <!-- Search Bars -->
      <div class="search-container">
        <ion-searchbar
          class="custom-searchbar"
          placeholder="Site"
          v-model="siteSearchQuery"
        ></ion-searchbar>
        <ion-searchbar
          class="custom-searchbar"
          placeholder="Generator"
          v-model="geneSearchQuery"
        ></ion-searchbar>
      </div>

      <!-- Generator List Container -->
      <div class="list-container">
        <!-- List Header -->
        <div class="list-header">
          <span class="header-sno">S.No</span>
          <span class="header-name">Generator Name</span>
          <div class="header-switch-control">
            <span class="switch-label">OFF</span>
            <ion-toggle
              :checked="areAllOn"
              :disabled="true"
              mode="ios"
              class="small-toggle"
            ></ion-toggle>
            <span class="switch-label">ON</span>
          </div>
          <span class="header-cancel">Cancel</span>
        </div>

        <hr class="divider" />

        <!-- List of Generators (Replaces RecyclerView) -->
        <ion-list v-if="filteredGenerators.length > 0" class="generator-list">
          <div v-for="(gen, index) in filteredGenerators" :key="gen.id" class="list-item-wrapper">
            <div class="list-item">
              <span class="item-sno">{{ index + 1 }}</span>
              <div class="item-name-block">
                <span class="item-name">{{ gen.name }}</span>
                <span class="item-site" v-if="gen.siteName">{{ gen.siteName }}</span>
              </div>
              <div class="item-switch-control">
                <ion-toggle
                  v-model="gen.isOn"
                  @ionChange="toggleGenerator(gen)"
                  mode="ios"
                  class="small-toggle"
                ></ion-toggle>
              </div>
              <span class="item-cancel" @click="cancelAction(gen.id)">Cancel</span>
            </div>
          </div>
        </ion-list>
        
        <!-- No Data Message -->
        <div v-else class="no-data-message">
          <p>{{ noDataText }}</p>
        </div>

      </div>

    </ion-content>    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton,IonButtons,IonIcon,  
  IonSearchbar,
  IonList,
  IonToggle, } from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { helpCircle, personCircle, shareSocial, } from 'ionicons/icons';
import router from '@/router/index'; // Assuming your router file is named router.js
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { computed, ref, onMounted } from 'vue';
import { loadingController, alertController } from '@ionic/vue';
import { getGeneratorOnOffList, updateGenOnOff } from '@/services/ApiService';

const siteSearchQuery = ref('');
const geneSearchQuery = ref('');

interface GenItem {
  id: number | string;
  name: string;
  isOn: boolean;
  siteName?: string;
}

const generators = ref<GenItem[]>([]);
const isLoading = ref(false);

// Text for the "no data" message
const noDataText = ref('Data not available');

// Fetch remote generators on mount
const loadGenerators = async () => {
  isLoading.value = true;
  try {
    const response = await getGeneratorOnOffList();
    if (response.status === 200 && response.data) {
      const list = response.data.arr_data || response.data.data || response.data || [];
      if (Array.isArray(list) && list.length > 0) {
        generators.value = list.map((item: any) => ({
          id: item.gen_id || item.id,
          name: item.gen_name || item.name || `GEN-${item.gen_id || item.id}`,
          isOn: Boolean(item.sts === 1 || item.isOn || item.status === '1'),
          siteName: item.site_name || item.site || ''
        }));
      }
    }
  } catch (error) {
    console.error('Failed to load generators from API, keeping default list:', error);
    // Keep fallback sample data if offline/empty
    if (generators.value.length === 0) {
      generators.value = [
        { id: 1, name: 'GEN-001 Alpha', isOn: true },
        { id: 2, name: 'GEN-002 Bravo', isOn: false },
        { id: 3, name: 'GEN-003 Charlie', isOn: true },
      ];
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadGenerators();
});

// Computed property to filter generators based on the search query
const filteredGenerators = computed(() => {
  const siteQuery = siteSearchQuery.value.toLowerCase();
  const geneQuery = geneSearchQuery.value.toLowerCase();
  
  if (!siteQuery && !geneQuery) {
    return generators.value;
  }
  
  return generators.value.filter(gen => {
    const siteLower = (gen.siteName || '').toLowerCase();
    const nameLower = gen.name.toLowerCase();
    // site search filters ONLY by site name; gene search filters ONLY by generator name
    const siteMatch = siteQuery ? siteLower.includes(siteQuery) : true;
    const geneMatch = geneQuery ? nameLower.includes(geneQuery) : true;
    return siteMatch && geneMatch;
  });
});

// Computed property for the main "All ON/OFF" toggle
const areAllOn = computed(() => {
  if (filteredGenerators.value.length === 0) return false;
  return filteredGenerators.value.every(gen => gen.isOn);
});

// Method to handle toggle change on a generator
const toggleGenerator = async (gen: GenItem) => {
  try {
    await updateGenOnOff([String(gen.id)]);
    console.log(`Updated generator ${gen.id} status to ${gen.isOn ? 'ON' : 'OFF'}`);
  } catch (err) {
    console.error(`Failed to update generator ${gen.id} status`, err);
  }
};

// Method for the "Cancel" action
const cancelAction = async (id: number | string) => {
  const alert = await alertController.create({
    header: 'Confirm Cancel',
    message: `Cancel operation for generator #${id}?`,
    buttons: ['Dismiss', 'OK']
  });
  await alert.present();
};



const goToHelpScreen = () => {
  router.push('/helpscreen');
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


/* Container for the two search bars */
.search-container {
  display: flex;
  gap: 14px; /* Space between search bars */
  margin-bottom: 10px;
}

/* Custom styling for ion-searchbar to match the XML */
.custom-searchbar {
  --background: var( --ion-color-brownishGrey); /* brownishGrey */
  --color: #fff; /* paleSalmon text color */
  --placeholder-color: #a0998e;
  --icon-color: #fff;
  --border-radius: 8px;
  --box-shadow: none;
  padding: 0;
  height: 40px;
  font-size: 10px;
  flex: 1; /* Each search bar takes equal space */
}

/* Main container for the list header and items */
.list-container {
  background-color: var( --ion-color-brownishGrey); /* brownishGrey */
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px); /* Adjust based on search bar height */
}

/* Header row styling */
.list-header {
  display: flex;
  align-items: center;
  color: var( --ion-color-pinkishGrey); ; /* pinkishGrey */
  font-family: 'Rajdhani', sans-serif; /* Assuming Rajdhani font is imported */
  font-weight: 500;
  padding: 0 5px;
  height: 40px;
}

.header-sno {
  width: 40px;
  text-align: center;
    font-size: 14px;

}
.header-name {
  flex: 1; /* Takes up remaining space */
  margin-left: 6px;
  font-size: 14px;
}
.header-switch-control {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  min-width: 95px;
}
.switch-label {
  font-size: 12px;
  margin: 0 4px;
  color: var(--ion-color-pinkishGrey, #c4c4c4);
}
.header-cancel {
  width: 60px;
  text-align: center;
  font-size: 14px;
  margin-left: 6px;
}

/* Divider line */
.divider {
  border: none;
  height: 1px;
  background-color:  var( --ion-color-pinkishGrey); /* pinkishGrey */
  margin: 5px 0;
}

/* List styles */
.generator-list {
  background: transparent;
  padding-top: 5px;
}

.list-item-wrapper {
  color:  var( --ion-color-pinkishGrey); /* pinkishGrey */
  font-family: 'Rajdhani', sans-serif;
}

/* A single item in the list */
.list-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 5px;
  font-size: 16px;
}

.item-sno {
  width: 40px;
  text-align: center;
}
.item-name-block {
  flex: 1;
  margin-left: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
}
.item-site {
  font-size: 11px;
  color: var(--ion-color-paleSalmon);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-switch-control {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 95px;
}
.item-cancel {
  width: 60px;
  text-align: center;
  font-size: 14px;
  color:  var( --ion-color-paleSalmon); /* paleSalmon, making it look clickable */
  cursor: pointer;
  margin-left: 6px;
}

/* Style for the ON/OFF toggle made small and clean like old */
ion-toggle.small-toggle {
  --background: var(--ion-color-purplishGrey, #5b575b);
  --background-checked: var(--ion-color-paleSalmon, #fdcf9f);
  --track-background: var(--ion-color-purplishGrey, #5b575b);
  --track-background-checked: var(--ion-color-paleSalmon, #fdcf9f);
  --handle-background: #ffffff;
  --handle-background-checked: #ffffff;
  transform: scale(0.7);
  transform-origin: center center;
  margin: 0;
  display: inline-block;
}

/* "No Data" message styling */
.no-data-message {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var( --ion-color-paleSalmon); /* paleSalmon */
  font-family: 'Rajdhani', sans-serif;
  font-size: 16px;
}
</style>