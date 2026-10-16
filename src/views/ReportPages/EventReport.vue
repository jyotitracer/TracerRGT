<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Event Report</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <!-- Corresponds to layoutShare. Visibility is toggled by a ref -->
     

      <div class="form-container">
        <!-- Site Selector -->
        <div class="form-row">
          <span class="form-label">Site</span>
          <span class="form-colon">:</span>
          <div class="form-value-box" @click="openSiteSelector">
            <span class="box-text">{{ displaySiteText }}</span>
            <ion-icon :icon="chevronForwardOutline" class="box-arrow"></ion-icon>
          </div>
        </div>

        <!-- Generator Selector -->
        <div class="form-row">
          <span class="form-label">Generator</span>
          <span class="form-colon">:</span>
          <div class="form-value-box" @click="openGeneratorSelector">
            <span class="box-text">{{ displayGeneratorText }}</span>
            <ion-icon :icon="chevronForwardOutline" class="box-arrow"></ion-icon>
          </div>
        </div>

        <!-- Event Selector -->
        <div class="form-row">
          <span class="form-label">Event</span>
          <span class="form-colon">:</span>
          <div class="form-value-box" @click="openEventSelector">
            <span class="box-text">{{ displayEventText }}</span>
            <ion-icon :icon="chevronForwardOutline" class="box-arrow"></ion-icon>
          </div>
        </div>
        
        <!-- Period Selector (Dropdown matching HistoryLog.vue) -->
        <div class="form-row">
          <span class="form-label">Period</span>
          <span class="form-colon">:</span>
          <select v-model="selectedPeriod" class="custom-select">
            <option v-for="period in periodOptions" :key="period.value" :value="period.value">
              {{ period.text }}
            </option>
          </select>
        </div>

        <!-- Custom Date Range Selection -->
        <div v-if="selectedPeriod === 'custom'" class="form-row custom-date-row">
          <span class="form-label">From Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customFromDate" class="custom-select custom-date-input" />
        </div>

        <div v-if="selectedPeriod === 'custom'" class="form-row custom-date-row">
          <span class="form-label">To Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customToDate" class="custom-select custom-date-input" />
        </div>
        
        <!-- Submit Button -->
        <div class="submit-button-container">
          <ion-button @click="handleSubmit" :disabled="isLoading">
            Submit
          </ion-button>
        </div>
      </div>

      <!-- Loading Spinner and No Data Message -->
      <div class="status-container">
        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
        <div v-if="!isLoading && reportData.length === 0 && hasSubmitted" class="no-data-text">
          Data not available
        </div>
      </div>

      <!-- Results List -->
      <div v-if="!isLoading && reportData.length > 0" class="report-list">
        <template v-for="(item, index) in reportData" :key="index">
          <!-- Site Name Header -->
          <div v-if="item.type === 'site_header'" class="report-site-header">
            <ion-icon :icon="businessOutline" class="site-header-icon"></ion-icon>
            <span class="site-header-title">{{ item.siteName }}</span>
          </div>

          <!-- Date Header -->
          <div v-if="item.type === 'date_header'" class="report-date-header">
            <ion-icon :icon="calendarOutline" class="date-header-icon"></ion-icon>
            <span>{{ item.date }}</span>
          </div>

          <!-- Content Card -->
          <div v-if="item.type === 'content'" class="event-card" :class="getEventSeverityClass(item.eventName)">
            <div class="event-card-top">
              <div class="event-title-row">
                <span class="event-name">{{ item.eventName }}</span>
              </div>
              <div class="event-duration-pill" v-if="item.duration">
                <ion-icon :icon="timeOutline" class="pill-icon"></ion-icon>
                <span>{{ item.duration }}</span>
              </div>
            </div>

            <div class="event-card-mid">
              <div class="event-gen-info">
                <ion-icon :icon="serverOutline" class="mid-icon"></ion-icon>
                <span class="gen-name">{{ item.generatorName }}</span>
              </div>
              <div class="event-detail-chip" v-if="item.otherDetails">
                {{ item.otherDetails }}
              </div>
            </div>

            <div class="event-card-bottom" v-if="item.dateRange">
              <ion-icon :icon="hourglassOutline" class="time-range-icon"></ion-icon>
              <span class="time-range-text">{{ item.dateRange }}</span>
            </div>
          </div>
        </template>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonItemDivider,
  alertController,
} from '@ionic/vue';
import { 
  mapOutline, 
  shareSocialOutline,
  chevronForwardOutline,
  chevronDownOutline,
  businessOutline,
  calendarOutline,
  timeOutline,
  serverOutline,
  hourglassOutline,
  alertCircleOutline
} from 'ionicons/icons';
import router from '@/router/index'; // Assuming your router file is named router.js

// --- STATE MANAGEMENT (Replaces Java member variables) ---

const isLoading = ref(false);
const isShareBarVisible = ref(false); // Controls the top share/tour bar
const hasSubmitted = ref(false); // To know when to show "No Data" message

// --- Filter State ---
// These refs represent the currently selected items
const selectedSites = ref<{ id: number; name: string }[]>([
  { id: 1, name: 'Site Alpha' },
]);
const selectedGenerator = ref<{ id: string; name: string } | null>({ id: 'gen_123', name: 'G-Force 1' });
const selectedEvents = ref<{ id: string; name: string }[]>([
  { id: 'e_1', name: 'Low Fuel' }, { id: 'e_2', name: 'Over-speed' }, { id: 'e_3', name: 'High Temp' }
]);
const allEventsCount = ref(5); // Mock total number of possible events
const allSitesCount = ref(3); // Mock total number of possible sites

const selectedPeriod = ref('today');

// Default custom dates (YYYY-MM-DD)
const todayStr = new Date().toISOString().split('T')[0];
const oneMonthAgo = new Date();
oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

const customFromDate = ref(oneMonthAgoStr);
const customToDate = ref(todayStr);

const periodOptions = ref([
  { value: 'today', text: 'Today' },
  { value: 'yesterday', text: 'Yesterday' },
  { value: 'last_week', text: 'Last Week' },
  { value: 'custom', text: 'Custom Interval' },
]);

// --- Data State ---
// This will hold the structured data for the list, equivalent to List<ModelEventReportList>
const reportData = ref<any[]>([]);


// --- COMPUTED PROPERTIES (Replaces `setDataToGroupButton`, `setEventToButton` etc.) ---

// This reactively calculates the text for the Site button
const displaySiteText = computed(() => {
  if (selectedSites.value.length === 0) return 'No Site Selected';
  if (selectedSites.value.length === allSitesCount.value) return 'All Sites';
  if (selectedSites.value.length > 1) {
    return `${selectedSites.value[0].name} +${selectedSites.value.length - 1}`;
  }
  return selectedSites.value[0].name;
});

// This reactively calculates the text for the Generator button
const displayGeneratorText = computed(() => {
  return selectedGenerator.value?.name || 'All Generators';
});

// This reactively calculates the text for the Event button
const displayEventText = computed(() => {
  if (selectedEvents.value.length === 0) return 'No event selected';
  if (selectedEvents.value.length === allEventsCount.value) return 'All Event';
  if (selectedEvents.value.length > 1) {
    return `${selectedEvents.value[0].name} +${selectedEvents.value.length - 1}`;
  }
  return selectedEvents.value[0].name;
});


// --- METHODS (Replaces onClick listeners and other functions) ---

const handleSubmit = async () => {
  let fdate = customFromDate.value;
  let tdate = customToDate.value;
  const now = new Date();

  if (selectedPeriod.value === 'today') {
    fdate = now.toISOString().split('T')[0];
    tdate = fdate;
  } else if (selectedPeriod.value === 'yesterday') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    fdate = yest.toISOString().split('T')[0];
    tdate = fdate;
  } else if (selectedPeriod.value === 'last_week') {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    fdate = lastWeek.toISOString().split('T')[0];
    tdate = now.toISOString().split('T')[0];
  } else {
    fdate = customFromDate.value || oneMonthAgoStr;
    tdate = customToDate.value || todayStr;
  }

  console.log('Submitting with filters:', {
    sites: selectedSites.value.map(s => s.id),
    generator: selectedGenerator.value?.id,
    events: selectedEvents.value.map(e => e.id),
    period: selectedPeriod.value,
    fdate,
    tdate
  });

  isLoading.value = true;
  hasSubmitted.value = true;
  reportData.value = []; // Clear previous results

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock API response, similar to what EventJsonParse would process
  const mockApiResponse = {
    arr_data: {
      site_arr: {
        "Site Alpha": {
          "30 Jul 2023": [
            { e_name: "Low Fuel Level", gen_name: "G-Force 1", eotherdet: "Fuel at 15%", sdt: "10:30 AM", edt: "10:35 AM", dur: "5 min" },
            { e_name: "Engine Over-speed", gen_name: "G-Force 1", eotherdet: "RPM reached 2200", sdt: "11:00 AM", edt: "11:01 AM", dur: "1 min" },
          ],
          "29 Jul 2023": [
            { e_name: "High Coolant Temp", gen_name: "G-Force 1", eotherdet: "Temp at 98C", sdt: "02:15 PM", edt: "02:20 PM", dur: "5 min" },
          ]
        },
        "Site Bravo": {
          "30 Jul 2023": [
            { e_name: "Low Fuel Level", gen_name: "G-Bravo 2", eotherdet: "Fuel at 18%", sdt: "09:00 AM", edt: "09:02 AM", dur: "2 min" },
          ]
        }
      }
    }
  };

  // This function replaces the Java `EventJsonParse` method
  const parseApiResponse = (response: any) => {
    const parsedList: any[] = [];
    const siteArr = response.arr_data.site_arr;
    for (const siteName in siteArr) {
      parsedList.push({ type: 'site_header', siteName: siteName });
      const dateArr = siteArr[siteName];
      for (const date in dateArr) {
        parsedList.push({ type: 'date_header', date: date });
        const events = dateArr[date];
        events.forEach((event: any) => {
          parsedList.push({
            type: 'content',
            eventName: event.e_name,
            generatorName: event.gen_name,
            otherDetails: event.eotherdet,
            dateRange: `${event.sdt} to ${event.edt}`,
            duration: event.dur
          });
        });
      }
    }
    return parsedList;
  };
  
  reportData.value = parseApiResponse(mockApiResponse);
  isLoading.value = false;
};

// Mocks for opening selection pages (would use router or modals in a real app)
const openSiteSelector = async () => {
   router.push('/select-sites');

};

const openGeneratorSelector = async () => {
  router.push('/select-generator');

};

const openEventSelector = async () => {
    router.push('/select-events');

};

const handlePeriodChange = (event: CustomEvent) => {
  if (event.detail.value === 'custom') {
    // In a real app, you would open a calendar modal here.
    // Like UtilsDateRangeSelector.class
    alert('This would open a custom date range picker.');
  }
};

const getEventSeverityClass = (eventName: string) => {
  const name = (eventName || '').toLowerCase();
  if (name.includes('temp') || name.includes('speed') || name.includes('fault') || name.includes('emergency')) {
    return 'severity-high';
  }
  if (name.includes('fuel') || name.includes('warn') || name.includes('drop')) {
    return 'severity-medium';
  }
  return 'severity-low';
};

const takeTour = () => alert('Starting tour...');
const shareScreen = () => alert('Sharing screen...');

</script>

<style scoped>
/* Page & Toolbar */
.page-background {
  --background: #33312e; /* purplishGrey */
  --color: #d3c8b4; /* pinkishGrey for default text */
  font-family: 'Rajdhani', sans-serif;
}

.custom-toolbar {
  --background: #43403a;
  --color: #f0ad4e; /* paleSalmon */
  font-weight: 600;
}

.form-container {
  padding: 18px 16px 12px 16px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 15px;
}

.form-label {
  flex-basis: 80px;
  text-align: left;
  font-weight: 600;
  color: #d3c8b4;
}

.form-colon {
  margin: 0 8px;
  color: #d3c8b4;
}

/* Unified Form Input Boxes */
.form-value-box,
.form-select-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #43403a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0 12px;
  height: 42px;
  min-width: 0;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}

.form-value-box:hover,
.form-select-wrapper:hover {
  background-color: #4d4943;
  border-color: rgba(245, 156, 32, 0.4);
}

.box-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fdcf9f;
  font-size: 14px;
  font-weight: 500;
}

.box-arrow,
.box-dropdown-icon {
  font-size: 16px;
  color: var(--ion-color-primary, #f59c20);
  flex-shrink: 0;
  margin-left: 8px;
  pointer-events: none;
}

.custom-select {
  flex: 1;
  font-size: 14px;
  border: 1px solid var(--ion-color-text, #c4c4c4);
  border-radius: 4px;
  padding: 6px 10px;
  background: var(--ion-color-brownishGrey, #645d5d);
  color: var(--ion-text-color, #fff);
  height: 38px;
  outline: none;
  cursor: pointer;
}

.custom-select:focus {
  border-color: var(--ion-color-primary, #f59c20);
}

.custom-date-input {
  color-scheme: dark;
}

.custom-date-row {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.submit-button-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

ion-button {
  --background: #5a5650;
  --color: #f0ad4e;
  --border-radius: 20px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  text-transform: none;
  font-family: 'Roboto', sans-serif;
  font-weight: 600;
  height: 40px;
  min-width: 130px;
}

.status-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.no-data-text {
  color: #ffffff;
}

/* === Event Results Cards === */
.report-list {
  padding: 4px 6px 24px 6px;
}

.report-site-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #2b2825;
  border-left: 4px solid var(--ion-color-primary, #f59c20);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 14px 8px 6px 8px;
}
.site-header-icon {
  font-size: 18px;
  color: var(--ion-color-primary, #f59c20);
}
.site-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.report-date-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-top: 8px;
  color: #fdcf9f;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.date-header-icon {
  font-size: 14px;
  color: var(--ion-color-primary, #f59c20);
}

.event-card {
  background: #43403a;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 6px 8px 10px 8px;
  border-left: 3px solid #f59c20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}
.event-card:hover {
  transform: translateY(-1px);
}

.event-card.severity-high {
  border-left-color: #ff5252;
}
.event-card.severity-medium {
  border-left-color: #f59c20;
}
.event-card.severity-low {
  border-left-color: #2dd36f;
}

.event-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.event-title-row {
  display: flex;
  align-items: center;
}
.event-name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}
.event-duration-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 11px;
  color: #fdcf9f;
  font-style: italic;
  flex-shrink: 0;
}
.pill-icon {
  font-size: 12px;
}

.event-card-mid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.event-gen-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mid-icon {
  font-size: 14px;
  color: #fdcf9f;
}
.gen-name {
  font-size: 13px;
  font-weight: 600;
  color: #d3c8b4;
}
.event-detail-chip {
  background: rgba(245, 156, 32, 0.15);
  color: #fdcf9f;
  border: 1px solid rgba(245, 156, 32, 0.3);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
}

.event-card-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #a8a092;
  font-size: 11px;
}
.time-range-icon {
  font-size: 12px;
  color: #a8a092;
}
</style>