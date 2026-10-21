<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Events</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="applyAndGoBack" class="done-btn">Done</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="content-card">
        <!-- Filter bar with search and the "All" toggle -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Events..."
            :disabled="isLoading"
          ></ion-searchbar>
          <div class="all-toggle-wrap">
            <span class="all-label">ALL</span>
            <ion-toggle
              :checked="areAllEventsSelected"
              @ionChange="handleToggleAllEvents($event)"
              :disabled="isLoading"
              mode="ios"
              class="header-toggle"
            ></ion-toggle>
          </div>
        </div>

        <!-- The list of events -->
        <ion-list v-if="!isLoading && filteredEvents.length > 0" class="event-list">
          <ion-item v-for="event in filteredEvents" :key="event.id" lines="full" class="event-item">
            <ion-label class="event-label">{{ event.name }}</ion-label>
            <ion-toggle
              slot="end"
              :checked="event.isSelected"
              @ionChange="handleToggleEvent(event, $event)"
              mode="ios"
              class="item-toggle"
            ></ion-toggle>
          </ion-item>
        </ion-list>
        
        <!-- No Data message -->
        <div v-if="!isLoading && filteredEvents.length === 0" class="status-container no-data-message">
          <p>No events available</p>
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
  IonButton,
  IonSearchbar,
  IonToggle,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonProgressBar,
} from '@ionic/vue';
import { getEventList, updateEventStatus } from '@/services/ApiService';

interface EventItem {
  id: string | number;
  name: string;
  isSelected: boolean;
}

const router = useRouter();
const isLoading = ref(false);
const searchQuery = ref('');
const allEvents = ref<EventItem[]>([]);

const filteredEvents = computed(() => {
  if (!searchQuery.value) {
    return allEvents.value;
  }
  return allEvents.value.filter(event =>
    event.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const areAllEventsSelected = computed(() => {
  if (filteredEvents.value.length === 0) return false;
  return filteredEvents.value.every(event => event.isSelected);
});

const saveSelectedEvents = () => {
  const selected = allEvents.value.filter(e => e.isSelected);
  try {
    localStorage.setItem('selected_report_events', JSON.stringify(selected));
  } catch (e) {
    console.error('Failed to save selected events:', e);
  }
};

const handleToggleAllEvents = (event: CustomEvent) => {
  const checked = Boolean(event.detail.checked);
  filteredEvents.value.forEach(item => {
    item.isSelected = checked;
  });
  saveSelectedEvents();
};

const handleToggleEvent = async (eventItem: EventItem, event: CustomEvent) => {
  eventItem.isSelected = Boolean(event.detail.checked);
  saveSelectedEvents();

  // Async push to server
  try {
    await updateEventStatus([{
      evnt_id: Number(eventItem.id),
      sts: eventItem.isSelected ? 1 : 0
    }], 2);
  } catch (err) {
    console.warn('API event status update failed:', err);
  }
};

const fetchEvents = async () => {
  isLoading.value = true;
  let rawList: any[] = [];

  let savedIds: (string | number)[] | null = null;
  try {
    const saved = localStorage.getItem('selected_report_events');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        savedIds = parsed.map((e: any) => e.id);
      }
    }
  } catch (e) {}

  try {
    const res = await getEventList(1);
    if (res.status === 200 && res.data) {
      const list = res.data.arr_data || res.data.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        rawList = list;
      }
    }
  } catch (error) {
    console.warn('Error fetching event list from API:', error);
  }

  if (rawList.length === 0) {
    rawList = [
      { id: '1', name: 'Low Fuel Level', sts: 1 },
      { id: '2', name: 'High Coolant Temperature', sts: 1 },
      { id: '5', name: 'Engine Over-speed', sts: 1 },
      { id: '6', name: 'Low Oil Pressure', sts: 1 },
      { id: '7', name: 'Battery Under-voltage', sts: 1 },
      { id: '8', name: 'Emergency Stop Pressed', sts: 1 },
      { id: '9', name: 'Generator Overload / Trip', sts: 1 },
      { id: '10', name: 'Generator Start Failure', sts: 1 },
      { id: '11', name: 'Generator Reverse Power', sts: 1 },
      { id: '12', name: 'Mains Power Failed', sts: 1 },
      { id: '13', name: 'Mains Power Restored', sts: 1 },
    ];
  }

  allEvents.value = rawList.map((item: any) => {
    const id = item.evnt_id || item.id;
    const name = item.evnt_name || item.name || `Event ${id}`;
    const isSelected = savedIds !== null ? savedIds.includes(id) : Boolean(item.sts === 1 || item.status === 1 || item.isSelected !== false);
    return { id, name, isSelected };
  });

  saveSelectedEvents();
  isLoading.value = false;
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchEvents();
  (event.target as HTMLIonRefresherElement).complete();
};

const applyAndGoBack = () => {
  saveSelectedEvents();
  router.back();
};

const goBack = () => {
  saveSelectedEvents();
  router.back();
};

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.page-background {
  --background: #3c3a37;
  color: #ffffff;
}

.custom-toolbar {
  --background: #32302e;
  --color: #fdcf9f;
  font-weight: 600;
}

.done-btn {
  --color: #f59c20;
  font-weight: 700;
  font-size: 14px;
}

.content-card {
  padding: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background-color: #2b2826;
  border-radius: 8px;
  padding: 4px 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.custom-searchbar {
  --background: transparent;
  --color: #ffffff;
  --placeholder-color: #a8a095;
  --icon-color: #fdcf9f;
  --clear-button-color: #fdcf9f;
  padding: 0;
  flex: 1;
}

.all-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.all-label {
  font-size: 13px;
  font-weight: 700;
  color: #fdcf9f;
  letter-spacing: 0.5px;
}

.header-toggle {
  --track-background: #484542;
  --track-background-checked: #f59c20;
  --handle-background-checked: #ffffff;
}

.event-list {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.event-item {
  --background: #343230;
  --color: #ffffff;
  --border-color: rgba(255, 255, 255, 0.08);
  --padding-start: 14px;
  --inner-padding-end: 14px;
}

.event-label {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
}

.item-toggle {
  --track-background: #484542;
  --track-background-checked: #2dd36f;
  --handle-background-checked: #ffffff;
}

.status-container {
  display: flex;
  justify-content: center;
  padding: 40px 10px;
}

.no-data-message p {
  color: #a8a095;
  font-size: 15px;
}
</style>