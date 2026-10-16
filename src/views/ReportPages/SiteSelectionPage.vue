<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/event-report"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Sites</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <!-- Pull-to-refresh container, equivalent to SwipeRefreshLayout -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Main content card, equivalent to the outer-most brownishGrey LinearLayout -->
      <div class="content-card">

        <!-- Filter bar with search and the "All" toggle -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search..."
          ></ion-searchbar>
          <ion-toggle
            v-model="areAllSitesSelected"
            :checked="areAllSitesSelected"
            mode="ios"
          ></ion-toggle>
        </div>

        <!-- The list of sites, equivalent to RecyclerView -->
        <!-- It's only shown if not loading and if there are sites to show -->
        <ion-list v-if="!isLoading && filteredSites.length > 0" class="site-list">
          <ion-item v-for="site in filteredSites" :key="site.id" lines="full">
            <ion-label>{{ site.name }}</ion-label>
            <ion-toggle
              slot="end"
              v-model="site.isSelected"
              mode="ios"
            ></ion-toggle>
          </ion-item>
        </ion-list>

        <!-- Loading spinner -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- "No Data" message, equivalent to txt_noDataSite -->
        <div v-if="!isLoading && filteredSites.length === 0" class="status-container no-data-message">
          <p>Data not available</p>
        </div>

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
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonToggle,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';

// Define the structure for a single site
interface Site {
  id: number;
  name: string;
  isSelected: boolean;
}

// --- STATE MANAGEMENT ---

const isLoading = ref(false);
const searchQuery = ref('');

// Master list of all sites, fetched from an "API"
const allSites = ref<Site[]>([]);

// --- COMPUTED PROPERTIES ---

// This computed property reactively filters the list based on the search query.
// This is the Vue equivalent of implementing a search filter on a RecyclerView adapter.
const filteredSites = computed(() => {
  if (!searchQuery.value) {
    return allSites.value;
  }
  return allSites.value.filter(site =>
    site.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// A two-way computed property to manage the "Select All" toggle.
const areAllSitesSelected = computed({
  // `get` determines the toggle's state: true if all filtered sites are selected.
  get() {
    if (filteredSites.value.length === 0) return false;
    return filteredSites.value.every(site => site.isSelected);
  },
  // `set` is called when the user clicks the "All" toggle.
  // It updates the `isSelected` state of all currently visible (filtered) sites.
  set(newValue: boolean) {
    filteredSites.value.forEach(site => {
      site.isSelected = newValue;
    });
  },
});


// --- METHODS ---

// Fetches sites from real dashboard API or cached site_arr
const fetchSites = async () => {
  isLoading.value = true;
  try {
    const { getDashboardDetail } = await import('@/services/ApiService');
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      const siteArr = d.site_arr || d.arr_site || d.data?.site_arr;
      if (Array.isArray(siteArr) && siteArr.length > 0) {
        allSites.value = siteArr.map((s: any) => ({
          id: s.id,
          name: s.name,
          isSelected: true,
        }));
        isLoading.value = false;
        return;
      }
    }
  } catch (e) {
    console.warn('API error in SiteSelectionPage:', e);
  }

  // Fallback to cached dashboard detail
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      const d = JSON.parse(cached);
      const siteArr = d?.site_arr;
      if (Array.isArray(siteArr) && siteArr.length > 0) {
        allSites.value = siteArr.map((s: any) => ({
          id: s.id,
          name: s.name,
          isSelected: true,
        }));
        isLoading.value = false;
        return;
      }
    }
  } catch (e) {}

  allSites.value = [
    { id: 8, name: 'PMVE', isSelected: true },
    { id: 25, name: 'J#327', isSelected: true },
  ];
  isLoading.value = false;
};

// This is the handler for the "pull-to-refresh" action
const handleRefresh = async (event: CustomEvent) => {
  await fetchSites();
  // Let the refresher know that the fetching is complete
  (event.target as HTMLIonRefresherElement).complete();
};

// --- LIFECYCLE HOOK ---

// Fetch initial data when the component is first mounted
onMounted(() => {
  fetchSites();
});

</script>

<style scoped>
/* Corresponds to the root layout's background color */
.page-background {
  --background: #33312e; /* purplishGrey */
}

.custom-toolbar {
  --background: #43403a;
  --color: #f0ad4e; /* paleSalmon */
}

/* Corresponds to the main container with margins and background */
.content-card {
  background-color: #43403a; /* brownishGrey */
  margin: 15px;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

/* Corresponds to the horizontal layout with search and switch */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 10px 10px 10px;
}

.custom-searchbar {
  --background: #5a5650; /* map_filter_search_bg */
  --color: #f0ad4e; /* paleSalmon text color */
  --placeholder-color: #a0998e;
  --icon-color: #f0ad4e;
  --border-radius: 8px;
  --box-shadow: none;
  padding: 0;
  height: 40px;
  flex-grow: 1; /* Search bar takes available space */
}

/* Style for the ON/OFF toggle */
ion-toggle {
  --handle-background: #fff;
  --handle-background-checked: #fff;
  --background: #888;
  --background-checked: #72b87c; /* A nice green for ON state */
  height: 25px;
  width: 45px;
}

.site-list {
  background: transparent;
  padding: 5px;
}

ion-item {
  --background: transparent;
  --color: #d3c8b4; /* pinkishGrey text color */
  --border-color: #5a5650;
}

/* Container for status messages like spinner or "No Data" */
.status-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}
.no-data-message p {
  color: #f0ad4e; /* paleSalmon */
  font-size: 18px;
  font-family: 'Roboto', sans-serif;
}
</style>