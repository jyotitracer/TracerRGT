<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <!-- This button takes the user back to the previous page -->
          <ion-back-button default-href="/event-report"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Generator</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <!-- Main content card, equivalent to the brownishGrey LinearLayout -->
      <div class="content-card">

        <!-- Filter bar with just the search input -->
        <!-- The Switch is gone, so the ion-toggle is omitted -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Generator..."
            :disabled="isLoading"
          ></ion-searchbar>
        </div>

        <!-- The list of generators, equivalent to RecyclerView -->
        <!-- This list is single-selection. Each item is a button. -->
        <ion-list v-if="!isLoading && filteredGenerators.length > 0" class="generator-list">
          <ion-item
            v-for="generator in filteredGenerators"
            :key="generator.id"
            button
            lines="full"
            @click="handleSelection(generator)"
          >
            <ion-label>{{ generator.name }}</ion-label>
            <!-- A subtle indicator for the currently selected item -->
            <ion-icon
              v-if="selectedGeneratorId === generator.id"
              :icon="checkmark"
              color="success"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>
        
        <!-- Loading Spinner -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
        
        <!-- "No Data" message, equivalent to txt_noDataSite -->
        <div v-if="!isLoading && filteredGenerators.length === 0" class="status-container no-data-message">
          <p>Data not available</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
} from '@ionic/vue';
import { checkmark } from 'ionicons/icons';

// In a real app, you would use a state management solution (like Pinia)
// to share the selected generator between pages.
// For this example, we'll just log it and navigate back.
const selectedGeneratorId = ref('gen_102'); // Mock pre-selected ID

// Define the structure for a single generator
interface Generator {
  id: string;
  name: string;
}

// --- STATE MANAGEMENT ---

const router = useRouter();
const isLoading = ref(false);
const searchQuery = ref('');

// Master list of all generators
const allGenerators = ref<Generator[]>([]);

// --- COMPUTED PROPERTIES ---

// Reactively filters the list based on the search query
const filteredGenerators = computed(() => {
  if (!searchQuery.value) {
    return allGenerators.value;
  }
  return allGenerators.value.filter(gen =>
    gen.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});


// --- METHODS ---

// Fetches real generator data from dashboard API or cached site_arr
const fetchGenerators = async () => {
  isLoading.value = true;
  try {
    const { getDashboardDetail } = await import('@/services/ApiService');
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      const siteArr = d.site_arr || d.arr_site || d.data?.site_arr;
      if (Array.isArray(siteArr) && siteArr.length > 0) {
        const list: Generator[] = [];
        siteArr.forEach((s: any) => {
          if (Array.isArray(s.gen_arr)) {
            s.gen_arr.forEach((g: any) => {
              list.push({
                id: String(g.id),
                name: `${g.name} (${s.name})`,
              });
            });
          }
        });
        if (list.length > 0) {
          allGenerators.value = list;
          isLoading.value = false;
          return;
        }
      }
    }
  } catch (e) {
    console.warn('API error in GeneratorSelectionPage:', e);
  }

  // Fallback to cached dashboard detail
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      const d = JSON.parse(cached);
      const siteArr = d?.site_arr;
      if (Array.isArray(siteArr) && siteArr.length > 0) {
        const list: Generator[] = [];
        siteArr.forEach((s: any) => {
          if (Array.isArray(s.gen_arr)) {
            s.gen_arr.forEach((g: any) => {
              list.push({
                id: String(g.id),
                name: `${g.name} (${s.name})`,
              });
            });
          }
        });
        if (list.length > 0) {
          allGenerators.value = list;
          isLoading.value = false;
          return;
        }
      }
    }
  } catch (e) {}

  allGenerators.value = [
    { id: '63', name: 'EG 01 (30 KVA) (PMVE)' },
    { id: '68', name: 'EG 105 (150 KVA) (PMVE)' },
    { id: '18', name: 'EG 147 (60 KVA) (PMVE)' },
    { id: '135', name: 'EG 172 (150 KVA) (PMVE)' },
    { id: '199', name: 'EG 197 (200 KVA) (J#327)' },
    { id: '173', name: 'EG 262 (20 KVA) (J#327)' },
  ];
  isLoading.value = false;
};

// Handles the user's selection
const handleSelection = (generator: Generator) => {
  console.log('Selected Generator:', generator);
  
  // In a real app, you'd update your central state store here.
  // For example: `store.setSelectedGenerator(generator);`
  selectedGeneratorId.value = generator.id;

  // Navigate back to the previous page after selection
  router.back();
};

// --- LIFECYCLE HOOK ---

onMounted(() => {
  fetchGenerators();
});

</script>

<style scoped>
/* Basic page and toolbar styling */
.page-background {
  --background: #33312e; /* purplishGrey */
}

.custom-toolbar {
  --background: #43403a;
  --color: #f0ad4e; /* paleSalmon */
}

/* Main content card styling */
.content-card {
  background-color: #43403a; /* brownishGrey */
  margin: 15px;
  border-radius: 8px;
  min-height: calc(100% - 30px);
  display: flex;
  flex-direction: column;
}

/* Filter bar styling */
.filter-bar {
  padding: 15px 10px;
}

.custom-searchbar {
  --background: #5a5650; /* map_filter_search_bg */
  --color: #f0ad4e;
  --placeholder-color: #a0998e;
  --icon-color: #f0ad4e;
  --border-radius: 8px;
  --box-shadow: none;
  padding: 0;
  height: 40px;
}

/* List and item styling */
.generator-list {
  background: transparent;
  padding: 5px;
}

ion-item {
  --background: transparent;
  --color: #d3c8b4;
  --border-color: #5a5650;
  --detail-icon-color: #d3c8b4; /* Color for the button arrow */
  --ripple-color: #5a5650;
}

ion-item::part(native) {
  cursor: pointer;
}

/* Status messages (loading/no data) styling */
.status-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.no-data-message p {
  color: #f0ad4e;
  font-size: 18px;
  font-family: 'Roboto', sans-serif;
}

ion-spinner {
  width: 32px;
  height: 32px;
}
</style>