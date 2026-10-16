<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/event-report"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Events</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <!-- Equivalent to the top-level ProgressBar -->
      <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>

      <!-- Pull-to-refresh container, equivalent to SwipeRefreshLayout -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Main content card -->
      <div class="content-card">

        <!-- Filter bar with search and the "All" toggle -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search..."
            :disabled="isLoading"
          ></ion-searchbar>
          <ion-toggle
            v-model="areAllEventsSelected"
            :checked="areAllEventsSelected"
            :disabled="isLoading"
            mode="ios"
          ></ion-toggle>
        </div>

        <!-- The list of events, equivalent to RecyclerView -->
        <ion-list v-if="!isLoading && filteredEvents.length > 0" class="event-list">
          <ion-item v-for="event in filteredEvents" :key="event.id" lines="full">
            <ion-label>{{ event.name }}</ion-label>
            <ion-toggle
              slot="end"
              v-model="event.isSelected"
              @ionChange="saveEventStatus(event)"
              mode="ios"
            ></ion-toggle>
          </ion-item>
        </ion-list>
        
        <!-- "No Data" message, equivalent to txt_noDataSite -->
        <div v-if="!isLoading && filteredEvents.length === 0" class="status-container no-data-message">
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
  IonRefresher,
  IonRefresherContent,
  IonProgressBar,
} from '@ionic/vue';

// Define the structure for a single event
interface Event {
  id: string;
  name: string;
  isSelected: boolean;
}

// --- STATE MANAGEMENT ---

const isLoading = ref(false);
const searchQuery = ref('');

// Master list of all events, fetched from an "API"
const allEvents = ref<Event[]>([]);

// --- COMPUTED PROPERTIES ---

// Reactively filters the list based on the search query
const filteredEvents = computed(() => {
  if (!searchQuery.value) {
    return allEvents.value;
  }
  return allEvents.value.filter(event =>
    event.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// A two-way computed property for the "Select All" toggle
const areAllEventsSelected = computed({
  // `get` determines the toggle's state
  get() {
    if (filteredEvents.value.length === 0) return false;
    return filteredEvents.value.every(event => event.isSelected);
  },
  // `set` is called when the user clicks the "All" toggle
  set(newValue: boolean) {
    filteredEvents.value.forEach(event => {
      event.isSelected = newValue;
    });
  },
});


import { getEventList, updateEventStatus } from '@/services/ApiService';

// --- METHODS ---

// Fetches configured event master list from API
const fetchEvents = async () => {
  isLoading.value = true;
  console.log('Fetching event master list (action: 1)...');
  
  try {
    const res = await getEventList(1);
    if (res.status === 200 && res.data) {
      const list = res.data.arr_data || res.data.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        allEvents.value = list.map((item: any) => ({
          id: String(item.evnt_id || item.id),
          name: item.evnt_name || item.name || `Event ${item.evnt_id || item.id}`,
          isSelected: Boolean(item.sts === 1 || item.status === 1 || item.isSelected)
        }));
        isLoading.value = false;
        return;
      }
    }
  } catch (error) {
    console.error('Error fetching event list from API:', error);
  }

  // Fallback if network or empty response
  allEvents.value = [
    { id: '1', name: 'Low Fuel Level', isSelected: true },
    { id: '2', name: 'High Coolant Temperature', isSelected: true },
    { id: '5', name: 'Engine Over-speed', isSelected: false },
    { id: '6', name: 'Low Oil Pressure', isSelected: true },
    { id: '7', name: 'Battery Under-voltage', isSelected: false },
    { id: '8', name: 'Emergency Stop', isSelected: false },
    { id: '9', name: 'Generator Overload', isSelected: true },
  ];
  isLoading.value = false;
};

// Update event status on API
const saveEventStatus = async (eventItem: Event) => {
  try {
    const payload = [{
      evnt_id: Number(eventItem.id),
      sts: eventItem.isSelected ? 1 : 0
    }];
    await updateEventStatus(payload, 2);
    console.log(`Saved event status for event #${eventItem.id}:`, eventItem.isSelected);
  } catch (error) {
    console.error('Failed to update event status on API:', error);
  }
};

// Handler for the "pull-to-refresh" action
const handleRefresh = async (event: CustomEvent) => {
  await fetchEvents();
  (event.target as HTMLIonRefresherElement).complete();
};

// Fetch initial data when the component is first mounted
onMounted(() => {
  fetchEvents();
});

</script>

<style scoped>
/* Corresponds to the root layout's background color */
.page-background {
  --background: #33312e; /* purplishGrey */
}

ion-progress-bar {
  --progress-background: #f0ad4e; /* paleSalmon */
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
  min-height: calc(100% - 30px);
  display: flex;
  flex-direction: column;
}

/* Corresponds to the horizontal layout with search and switch */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px 10px;
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
  flex-grow: 1;
}

/* Style for the ON/OFF toggle */
ion-toggle {
  --handle-background: #fff;
  --handle-background-checked: #fff;
  --background: #888;
  --background-checked: #72b87c;
  height: 25px; /* XML was 20dp, this is a better fit for web */
  width: 45px;
}

.event-list {
  background: transparent;
  padding: 5px;
}

ion-item {
  --background: transparent;
  --color: #d3c8b4; /* pinkishGrey text color */
  --border-color: #5a5650;
}

/* Container for status messages like "No Data" */
.status-container {
  flex-grow: 1; /* Takes up remaining vertical space */
  display: flex;
  justify-content: center;
  align-items: center;
}
.no-data-message p {
  color: #f0ad4e; /* paleSalmon */
  font-size: 18px;
  font-family: 'Roboto', sans-serif;
}
</style>