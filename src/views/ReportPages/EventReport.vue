<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3"></ion-back-button>
        </ion-buttons>
        <ion-title>Event Report</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
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
        
        <!-- Period Selector -->
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
          <ion-button @click="handleSubmit" :disabled="isLoading" class="submit-btn" expand="block">
            Submit
          </ion-button>
        </div>
      </div>

      <!-- Loading Spinner and Status -->
      <div class="status-container" v-if="isLoading">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-if="!isLoading && reportData.length === 0 && hasSubmitted" class="no-data-text">
        <ion-icon :icon="alertCircleOutline" class="no-data-icon"></ion-icon>
        <p>Data not available for selected criteria</p>
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
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonSpinner,
  onIonViewWillEnter,
} from '@ionic/vue';
import { 
  chevronForwardOutline,
  businessOutline,
  calendarOutline,
  timeOutline,
  serverOutline,
  hourglassOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import router from '@/router/index';
import { getEventReport, getDashboardDetail } from '@/services/ApiService';

interface SiteItem {
  id: number | string;
  name: string;
}

interface GenItem {
  id: string | number;
  name: string;
  siteName?: string;
}

interface EventItem {
  id: string | number;
  name: string;
}

const isLoading = ref(false);
const hasSubmitted = ref(false);

const selectedSites = ref<SiteItem[]>([]);
const selectedGenerator = ref<GenItem | null>(null);
const selectedEvents = ref<EventItem[]>([]);

const totalSitesCount = ref(3);
const totalEventsCount = ref(7);

const selectedPeriod = ref('today');

// Default dates
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

const reportData = ref<any[]>([]);

// Refresh selections from storage and dashboard data
const syncSelections = async () => {
  // 1. Read Sites
  try {
    const savedSites = localStorage.getItem('event_selected_sites');
    if (savedSites) {
      const parsed = JSON.parse(savedSites);
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedSites.value = parsed;
      }
    }
  } catch (e) {}

  // 2. Read Generator
  try {
    const savedGen = localStorage.getItem('event_selected_generator');
    if (savedGen) {
      const parsed = JSON.parse(savedGen);
      if (parsed && parsed.id !== undefined) {
        selectedGenerator.value = parsed;
      }
    }
  } catch (e) {}

  // 3. Read Events
  try {
    const savedEvents = localStorage.getItem('selected_report_events');
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents);
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedEvents.value = parsed;
      }
    }
  } catch (e) {}

  // If still uninitialized, load from cached or fresh dashboard data
  if (selectedSites.value.length === 0 || !selectedGenerator.value) {
    try {
      let siteArr: any[] = [];
      const cached = localStorage.getItem('dashboard_detail');
      if (cached) {
        siteArr = JSON.parse(cached)?.site_arr || [];
      }
      if (!siteArr || siteArr.length === 0) {
        const res = await getDashboardDetail();
        if (res.status === 200 && res.data) {
          siteArr = res.data.site_arr || [];
        }
      }

      if (Array.isArray(siteArr) && siteArr.length > 0) {
        totalSitesCount.value = siteArr.length;
        if (selectedSites.value.length === 0) {
          selectedSites.value = siteArr.map((s: any) => ({
            id: s.id || s.site_id,
            name: s.name || s.site_name || `Site ${s.id}`,
          }));
        }

        if (!selectedGenerator.value) {
          const firstSite = siteArr[0];
          if (Array.isArray(firstSite?.gen_arr) && firstSite.gen_arr.length > 0) {
            const g = firstSite.gen_arr[0];
            selectedGenerator.value = {
              id: g.id || g.gen_id,
              name: g.capacity ? `${g.name || 'EG'} (${g.capacity})` : (g.name || 'EG 181'),
              siteName: firstSite.name,
            };
          } else {
            selectedGenerator.value = { id: 'all', name: 'All Generators' };
          }
        }
      }
    } catch (e) {
      console.warn('Error reading dashboard detail for event report:', e);
    }
  }

  if (!selectedGenerator.value) {
    selectedGenerator.value = { id: 'all', name: 'All Generators' };
  }
};

const displaySiteText = computed(() => {
  if (selectedSites.value.length === 0) return 'Select Site';
  if (selectedSites.value.length > 2) {
    return `${selectedSites.value[0].name} +${selectedSites.value.length - 1} more`;
  }
  return selectedSites.value.map(s => s.name).join(', ');
});

const displayGeneratorText = computed(() => {
  return selectedGenerator.value?.name || 'All Generators';
});

const displayEventText = computed(() => {
  if (selectedEvents.value.length === 0) return 'No event selected';
  if (selectedEvents.value.length > 2) {
    return `${selectedEvents.value[0].name} +${selectedEvents.value.length - 1} more`;
  }
  return selectedEvents.value.map(e => e.name).join(', ');
});

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

  isLoading.value = true;
  hasSubmitted.value = true;
  reportData.value = [];

  const siteIds = selectedSites.value.map(s => Number(s.id));
  const rawGenId = selectedGenerator.value?.id;
  const genIdStr = (!rawGenId || rawGenId === 'all') ? 'all' : String(rawGenId);
  const eventIds = selectedEvents.value.map(e => Number(e.id));

  let parsedList: any[] = [];

  try {
    const res = await getEventReport({
      gen_id: genIdStr,
      site_arr: siteIds,
      evnt_arr: eventIds,
      intrvl_id: selectedPeriod.value === 'today' ? 3 : (selectedPeriod.value === 'yesterday' ? 4 : (selectedPeriod.value === 'last_week' ? 2 : 5)),
      fdate: fdate,
      tdate: tdate,
      rec_lmt: 50,
      last_rec_no: 0,
    });

    if (res && res.status === 200 && res.data) {
      const data = res.data;
      const siteArr = data.arr_data?.site_arr || data.data?.site_arr || data.site_arr;

      if (siteArr && typeof siteArr === 'object') {
        for (const sName in siteArr) {
          parsedList.push({ type: 'site_header', siteName: sName });
          const dateArr = siteArr[sName];
          if (dateArr && typeof dateArr === 'object') {
            for (const dStr in dateArr) {
              parsedList.push({ type: 'date_header', date: dStr });
              const evList = dateArr[dStr];
              if (Array.isArray(evList)) {
                evList.forEach((ev: any) => {
                  parsedList.push({
                    type: 'content',
                    eventName: ev.e_name || ev.event_name || 'System Event',
                    generatorName: ev.gen_name || ev.name || 'Generator',
                    otherDetails: ev.eotherdet || ev.details || '',
                    dateRange: ev.sdt && ev.edt ? `${ev.sdt} to ${ev.edt}` : (ev.sdt || ev.time || ''),
                    duration: ev.dur || ev.duration || '',
                  });
                });
              }
            }
          }
        }
      } else if (Array.isArray(data.arr_data) || Array.isArray(data.data)) {
        const rawList = data.arr_data || data.data;
        parsedList.push({ type: 'site_header', siteName: selectedSites.value[0]?.name || 'Site' });
        rawList.forEach((ev: any) => {
          parsedList.push({
            type: 'content',
            eventName: ev.e_name || ev.event_name || 'System Event',
            generatorName: ev.gen_name || selectedGenerator.value?.name || 'Generator',
            otherDetails: ev.eotherdet || ev.details || '',
            dateRange: ev.sdt && ev.edt ? `${ev.sdt} to ${ev.edt}` : (ev.sdt || ev.time || ''),
            duration: ev.dur || ev.duration || '',
          });
        });
      }
    }
  } catch (apiErr) {
    console.warn('Event report API call unavailable, synthesizing formatted report:', apiErr);
  }



  reportData.value = parsedList;
  isLoading.value = false;
};

const openSiteSelector = () => router.push('/event-select-sites');
const openGeneratorSelector = () => router.push('/event-select-generator');
const openEventSelector = () => router.push('/select-events');

const getEventSeverityClass = (eventName: string) => {
  const name = (eventName || '').toLowerCase();
  if (name.includes('temp') || name.includes('speed') || name.includes('fault') || name.includes('emergency') || name.includes('fail')) {
    return 'severity-high';
  }
  if (name.includes('fuel') || name.includes('warn') || name.includes('drop') || name.includes('trip')) {
    return 'severity-medium';
  }
  return 'severity-low';
};

onMounted(() => {
  syncSelections();
});

onIonViewWillEnter(() => {
  syncSelections();
});
</script>

<style scoped>
.page-background {
  --background: #3c3a37;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
}

.custom-toolbar {
  --background: #32302e;
  --color: #fdcf9f;
  font-weight: 600;
}

.form-container {
  padding: 16px 14px 10px 14px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14.5px;
}

.form-label {
  flex-basis: 80px;
  text-align: left;
  font-weight: 600;
  color: #fdcf9f;
}

.form-colon {
  margin: 0 8px;
  color: #fdcf9f;
}

.form-value-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #343230;
  border: 1px solid rgba(245, 156, 32, 0.4);
  border-radius: 6px;
  padding: 0 12px;
  height: 42px;
  min-width: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-value-box:hover {
  background-color: #3e3b38;
  border-color: #f59c20;
}

.box-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 500;
}

.box-arrow {
  font-size: 16px;
  color: #f59c20;
  flex-shrink: 0;
  margin-left: 8px;
}

.custom-select {
  flex: 1;
  height: 42px;
  font-size: 13.5px;
  font-weight: 500;
  border: 1px solid rgba(245, 156, 32, 0.4);
  border-radius: 6px;
  padding: 0 10px;
  background-color: #343230 !important;
  color: #ffffff !important;
  outline: none;
  cursor: pointer;
}

.custom-select:focus {
  border-color: #f59c20;
}

.custom-select option {
  background-color: #262422 !important;
  color: #ffffff !important;
  padding: 8px;
  font-size: 13.5px;
}

.custom-date-input {
  color-scheme: dark;
}

.submit-button-container {
  margin-top: 14px;
}

.submit-btn {
  --background: #343230;
  --color: #fdcf9f;
  --border-radius: 6px;
  --border-color: rgba(245, 156, 32, 0.5);
  --border-style: solid;
  --border-width: 1px;
  font-weight: 600;
  text-transform: none;
  margin: 0;
}

.status-container {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.no-data-text {
  text-align: center;
  padding: 30px 20px;
  color: #c4b9a9;
}

.no-data-icon {
  font-size: 36px;
  color: #f59c20;
  margin-bottom: 8px;
}

.report-list {
  padding: 8px 14px 30px 14px;
}

.report-site-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #2b2826;
  border-left: 4px solid #f59c20;
  padding: 10px 12px;
  border-radius: 4px;
  margin: 12px 0 8px 0;
}

.site-header-icon {
  font-size: 18px;
  color: #f59c20;
}

.site-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #fdcf9f;
}

.report-date-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #c4b9a9;
  margin: 8px 0 6px 4px;
}

.date-header-icon {
  font-size: 14px;
  color: #c4b9a9;
}

.event-card {
  background-color: #343230;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.event-card.severity-high {
  border-left: 4px solid #eb445a;
}

.event-card.severity-medium {
  border-left: 4px solid #f59c20;
}

.event-card.severity-low {
  border-left: 4px solid #2dd36f;
}

.event-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.event-name {
  font-size: 14.5px;
  font-weight: 700;
  color: #ffffff;
}

.event-duration-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(245, 156, 32, 0.15);
  color: #f59c20;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.pill-icon {
  font-size: 12px;
}

.event-card-mid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
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
  color: #fdcf9f;
}

.event-detail-chip {
  font-size: 12px;
  color: #c4b9a9;
  text-align: right;
  flex: 1;
}

.event-card-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11.5px;
  color: #a8a095;
}

.time-range-icon {
  font-size: 13px;
  color: #a8a095;
}
</style>