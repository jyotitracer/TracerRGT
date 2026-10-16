<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="#"></ion-back-button>
        </ion-buttons>
        <ion-title>Filling and Dropping</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      
      <!-- Segment Buttons for Filtering -->
      <ion-segment v-model="selectedLabel" class="filter-segment">
        <ion-segment-button value="Both">
          <ion-label>Both</ion-label>
        </ion-segment-button>
        <ion-segment-button value="Filling">
          <ion-label>Filling</ion-label>
        </ion-segment-button>
        <ion-segment-button value="Dropping">
          <ion-label>Dropping</ion-label>
        </ion-segment-button>
      </ion-segment>
      
      <!-- List Content -->
      <div class="list-container">
        <!-- Generator Header -->
        <div class="generator-header">EG 134 (350 KVA)</div>

        <!-- Data Not Available Message -->
        <div v-if="filteredItems.length === 0" class="no-data-message">
          Data not available
        </div>

        <!-- Report Items List -->
        <ion-list v-else class="report-list">
          <ion-item v-for="(item, index) in filteredItems" :key="index" class="report-item" lines="none">
            <div class="item-content">
              <!-- Column 1: Fuel Info -->
              <div class="column-fuel">
                <ion-icon 
                  :icon="batteryChargingOutline" 
                  :class="item.type === 'filling' ? 'icon-fill' : 'icon-drop'"
                ></ion-icon>
                <div class="fuel-details">
                  <span class="fuel-liters">{{ item.liters }} ltrs</span>
                  <span class="fuel-range">{{ item.literRange }}</span>
                </div>
              </div>

              <!-- Column 2: Time Info -->
              <div class="column-time">
                <ion-icon :icon="timeOutline"></ion-icon>
                <div class="time-details">
                  <span class="time-duration">{{ item.duration }}</span>
                  <span class="time-range">{{ item.dateTimeRange }}</span>
                </div>
              </div>

              <!-- Column 3: Chart Icon -->
              <div class="column-chart"  @click="navigateToChart(item)">
                <ion-icon :icon="statsChartOutline" ></ion-icon>
              </div>
            </div>
          </ion-item>
        </ion-list>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonIcon, IonList, IonItem,
  IonSegment, IonSegmentButton, IonLabel, loadingController
} from '@ionic/vue';
import { timeOutline, statsChartOutline, batteryChargingOutline } from 'ionicons/icons';
import router from '@/router/index';
import { getFillingAndDropping } from '@/services/ApiService';

const route = useRoute();
const vehId = (route.params.vehid as string) || '4';

// Report items
const reportItems = ref([
  {
    type: 'filling',
    liters: '306.00',
    literRange: '325.00 ltrs to 631.00 ltrs',
    duration: '0 hr 13 min 31 sec',
    dateTimeRange: '29/10/2026 07:37 AM to 29/10/2026 07:51 AM'
  },
  {
    type: 'filling',
    liters: '308.00',
    literRange: '340.00 ltrs to 648.00 ltrs',
    duration: '0 hr 11 min 32 sec',
    dateTimeRange: '30/10/2026 06:39 AM to 30/10/2026 06:51 AM'
  },
  {
    type: 'dropping',
    liters: '23.00',
    literRange: '638.00 ltrs to 615.00 ltrs',
    duration: '0 hr 1 min 31 sec',
    dateTimeRange: '15/10/2026 10:32 AM to 15/10/2026 10:34 AM'
  }
]);

const loadAuditData = async () => {
  const now = new Date();
  const tdate = now.toISOString().split('T')[0];
  const past = new Date();
  past.setDate(past.getDate() - 7);
  const fdate = past.toISOString().split('T')[0];

  try {
    const res = await getFillingAndDropping({
      gen_id: String(vehId),
      intrvl_id: 5,
      fdate: fdate,
      tdate: tdate
    });

    if (res.status === 200 && res.data) {
      const list = res.data.arr_data || res.data.data || [];
      if (Array.isArray(list) && list.length > 0) {
        reportItems.value = list.map((item: any) => ({
          type: (item.type || item.action || '').toLowerCase().includes('drop') ? 'dropping' : 'filling',
          liters: String(item.liters || item.diff || '0.00'),
          literRange: item.literRange || `${item.init_lvl || 0} ltrs to ${item.final_lvl || 0} ltrs`,
          duration: item.duration || item.dur || '0 min',
          dateTimeRange: item.dateTimeRange || `${item.fdate || ''} to ${item.tdate || ''}`
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching filling & dropping audit:', err);
  }
};

onMounted(() => {
  loadAuditData();
});

// --- Filtering Logic ---
const selectedLabel = ref('Both');

const filteredItems = computed(() => {
  if (selectedLabel.value === 'Filling') {
    return reportItems.value.filter(item => item.type === 'filling');
  }
  if (selectedLabel.value === 'Dropping') {
    return reportItems.value.filter(item => item.type === 'dropping');
  }
  return reportItems.value;
});

const navigateToChart = (item: any) => {
  console.log("Navigating for item:", item);
  
  // This would be the vehicle/generator ID for the current context.
  // For this static example, we'll hard-code it.
  const vehicleId = 'EG 134';

  // The FuelChart page expects date parameters. We can pass a range or a single date.
  // Let's pass the full dateTimeRange for now.
  const dateRange = item.dateTimeRange;

  // Use the router to push to the named route with parameters
  router.push({
    name: 'fuelChart', // Make sure this name matches your route definition
    params: {
      vehid: vehicleId,
      // Pass the date range or a specific date as needed by the chart page
      fromdate: dateRange, 
      todate: dateRange
    },
  });
};


</script>

<style scoped>
/* --- Page & Header Styles --- */
.page-background {
  --background: #474542;
  --color: #d8d4cf;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.custom-toolbar {
  --background: #3a3835;
  --color: #d8d4cf;
  font-weight: 500;
}

/* --- Segment Button Styles --- */
.filter-segment {
  margin: 16px;
  --background: #3a3835;
  border-radius: 8px;
  border: 1px solid #5a5855;
}
ion-segment-button {
  --color: #c0bcb6;
  --indicator-color: #f0ad4e; /* The orange background for selected */
  --indicator-height: 100%;
  --border-radius: 7px;
  text-transform: none;
  font-weight: 500;
}
/* This removes the small line under the selected button */
ion-segment-button::part(indicator-background) {
  border-bottom: none;
}

/* --- List & Item Styles --- */
.list-container {
  padding: 0 16px;
}
.generator-header {
  font-size: 16px;
  font-weight: 600;
  color: #d8d4cf;
  margin-bottom: 12px;
}
.report-list {
  background: transparent;
  padding: 0;
}
.report-item {
  --background: #3a3835;
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-top: 16px;
  --inner-padding-bottom: 16px;
  margin-bottom: 8px;
  border-radius: 8px;
}
.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}
.no-data-message {
  text-align: center;
  margin-top: 30px;
  color: #a09c97;
}

/* --- Column Layout & Styling --- */
.column-fuel, .column-time, .column-chart {
  display: flex;
  align-items: center;
  gap: 10px;
}
.column-time {
  flex-grow: 1; /* Allows this column to take up remaining space */
}
.fuel-details, .time-details {
  display: flex;
  flex-direction: column;
}

/* --- Specific Element Styles --- */
.fuel-liters {
  font-size: 16px;
  font-weight: 600;
  color: #d8d4cf;
}
.fuel-range, .time-range {
  font-size: 12px;
  color: #a09c97;
}
.time-duration {
  font-size: 14px;
  font-weight: 500;
  color: #d8d4cf;
}

/* --- Icon Styles --- */
.column-fuel ion-icon {
  font-size: 40px;
}
.column-time ion-icon {
  font-size: 32px;
  color: #a09c97;
}
.column-chart ion-icon {
  font-size: 36px;
  color: #f0ad4e;
}

/* Colors for the fuel icon based on type */
.icon-fill {
  color: #8bc34a; /* Green for Filling */
}
.icon-drop {
  color: #f44336; /* Red for Dropping */
}
</style>