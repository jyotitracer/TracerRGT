<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Fuel Report</ion-title>
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

        <!-- Report Selector (Dropdown matching HistoryLog.vue) -->
        <div class="form-row">
          <span class="form-label">Report</span>
          <span class="form-colon">:</span>
          <select v-model="selectedReportType" class="custom-select">
            <option v-for="report in ReportOptions" :key="report.value" :value="report.value">
              {{ report.text }}
            </option>
          </select>
        </div>

        <!-- Period Selector (Dropdown matching HistoryLog.vue) -->
        <div class="form-row">
          <span class="form-label">Period</span>
          <span class="form-colon">:</span>
          <select v-model="selectedPeriodValue" class="custom-select" @change="onPeriodChange">
            <option v-for="period in periodOptions" :key="period.value" :value="period.value">
              {{ period.text }}
            </option>
          </select>
        </div>

        <!-- Custom Date Range Selection -->
        <div v-if="selectedPeriodValue === 'custom'" class="form-row custom-date-row">
          <span class="form-label">From Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customFromDate" class="custom-select custom-date-input" />
        </div>

        <div v-if="selectedPeriodValue === 'custom'" class="form-row custom-date-row">
          <span class="form-label">To Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customToDate" class="custom-select custom-date-input" />
        </div>

        <!-- Submit Button -->
        <div class="submit-button-container">
          <ion-button @click="handleSubmit" :disabled="isLoading">Submit</ion-button>
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
      <ion-list v-if="!isLoading && reportData.length > 0" class="report-list">
        <template v-for="(item, index) in reportData" :key="index">

          <!-- Site Name Header WITH Legend -->
          <ion-item-divider v-if="item.type === 'site_header'" class="site-header-divider">
            <ion-label class="site-header-label">{{ item.siteName }}</ion-label>
            
            <!-- Efficiency Legend -->
            <div v-if="selectedReportType === 'efficiency'" class="legend-box-efficiency">
              <div class="legend-row">
                <div class="legend-item"><ion-icon :icon="hourglassOutline" />Run Hour</div>
                <div class="legend-item"><ion-icon :icon="sunnyOutline" />Energy</div>
                <div class="legend-item"><ion-icon :icon="beakerOutline" />Fuel Consumed</div>
              </div>
              <div class="legend-row">
                <div class="legend-item"><ion-icon :icon="leafOutline" />Efficiency ( Energy in KWH / Fuel on Ltrs )</div>
              </div>
            </div>

            <!-- Fuel Filling Legend -->
            <div v-if="selectedReportType === 'fuelfilling'" class="legend-box-filling">
              <div class="legend-item"><ion-icon :icon="colorFillOutline" />Filling</div>
              <div class="legend-item"><ion-icon :icon="trendingDownOutline" />Dropping</div>
            </div>
          </ion-item-divider>

          <!-- 2. Efficiency Report Content Row -->
          <ion-item v-if="item.type === 'efficiency_content'" class="report-item efficiency-item" lines="none">
            <div class="item-details">
              <div class="generator-name">
                {{ item.generatorName }} <span class="generator-capacity">({{ item.capacity }})</span>
              </div>
              <div class="data-grid">
                <div class="data-point">
                  <div class="value-row"><ion-icon :icon="hourglassOutline" /> {{ item.runHour }}</div>
                  <div class="unit-row">Hr</div>
                </div>
                <div class="data-point">
                  <div class="value-row"><ion-icon :icon="sunnyOutline" /> {{ item.energy }}</div>
                  <div class="unit-row">KWH</div>
                </div>
                <div class="data-point">
                  <div class="value-row"><ion-icon :icon="beakerOutline" /> {{ item.fuelConsumed }}</div>
                  <div class="unit-row">ltrs</div>
                </div>
                <div class="data-point efficiency-value">
                  <div class="value-row"><ion-icon :icon="leafOutline" /> {{ item.efficiency }}</div>
                </div>
              </div>
            </div>
          </ion-item>

          <!-- 3. Fuel Filling Report Content Row -->
          <ion-item v-if="item.type === 'fuelfilling_content'" class="report-item fuelfilling-item" lines="none">
            <div class="item-details">
              <div class="generator-name">
                {{ item.generatorName }} <span class="generator-capacity">({{ item.capacity }})</span>
              </div>
              <div class="data-row">
                <div class="data-point">
                  <ion-icon :icon="colorFillOutline" />
                  <span>{{ item.filling }} ltrs</span>
                </div>
                <div class="data-point">
                  <ion-icon :icon="trendingDownOutline" />
                  <span>{{ item.dropping }} ltrs</span>
                </div>
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="right-arrow" @click="navigateToDetails(item)"></ion-icon>
          </ion-item>

        </template>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon,
  IonSelect, IonSelectOption, IonButton, IonSpinner, IonList, IonItem, IonLabel, IonItemDivider,
} from '@ionic/vue';
import { 
  hourglassOutline, sunnyOutline, beakerOutline, leafOutline, colorFillOutline, 
  trendingDownOutline, chevronForwardOutline, chevronDownOutline 
} from 'ionicons/icons';
import router from '@/router/index';

const isLoading = ref(false);
const hasSubmitted = ref(false);

// Filter State
const selectedSites = ref<{ id: number; name: string }[]>([{ id: 0, name: 'All Site' }]);
const selectedGenerator = ref<{ id: string; name: string } | null>({ id: 'all', name: 'All Generator' });
const allSitesCount = ref(3);

const selectedPeriodValue = ref('custom');

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

const onPeriodChange = () => {
  // When period changes, if not custom, can auto-sync dates or keep ready
};

const selectedPeriod = computed(() => {
  if (selectedPeriodValue.value === 'custom') {
    return {
      value: 'custom',
      text: `${customFromDate.value} to ${customToDate.value}`
    };
  }
  return periodOptions.value.find(p => p.value === selectedPeriodValue.value) || { value: selectedPeriodValue.value, text: selectedPeriodValue.value };
});

const selectedReportType = ref('efficiency');
const ReportOptions = ref([
  { value: 'efficiency', text: 'Efficiency Report' },
  { value: 'fuelfilling', text: 'Fill Drop Report' },
]);

const reportData = ref<any[]>([]);

// Computed Properties
const displaySiteText = computed(() => selectedSites.value[0]?.name || 'Select Site');
const displayGeneratorText = computed(() => selectedGenerator.value?.name || 'Select Generator');

// --- METHODS ---
const handleSubmit = async () => {
  isLoading.value = true;
  hasSubmitted.value = true;
  reportData.value = [];

  // Determine date range based on selected period
  let fdate = customFromDate.value;
  let tdate = customToDate.value;
  const now = new Date();

  if (selectedPeriodValue.value === 'today') {
    fdate = now.toISOString().split('T')[0];
    tdate = fdate;
  } else if (selectedPeriodValue.value === 'yesterday') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    fdate = yest.toISOString().split('T')[0];
    tdate = fdate;
  } else if (selectedPeriodValue.value === 'last_week') {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    fdate = lastWeek.toISOString().split('T')[0];
    tdate = now.toISOString().split('T')[0];
  } else {
    // Custom Interval
    fdate = customFromDate.value || oneMonthAgoStr;
    tdate = customToDate.value || todayStr;
  }

  console.log('Fetching fuel report with period:', selectedPeriodValue.value, 'fdate:', fdate, 'tdate:', tdate);
  await new Promise(resolve => setTimeout(resolve, 800));

  let parsedList: any[] = [];
  
  if (selectedReportType.value === 'efficiency') {
    parsedList.push({ type: 'site_header', siteName: 'J#310' });
    parsedList.push({ type: 'efficiency_content', generatorName: 'EG 04', capacity: '500 KVA', runHour: '0.0', energy: '0.00', fuelConsumed: '57.00', efficiency: '0.0' });
    parsedList.push({ type: 'efficiency_content', generatorName: 'EG 08', capacity: '500 KVA', runHour: '182.9', energy: '19019.90', fuelConsumed: '2134.00', efficiency: '8.9' });
    parsedList.push({ type: 'efficiency_content', generatorName: 'EG 113', capacity: '150 KVA', runHour: '342.6', energy: '14377.40', fuelConsumed: '4738.00', efficiency: '3.0' });
    parsedList.push({ type: 'efficiency_content', generatorName: 'EG 115', capacity: '60 KVA', runHour: '5.4', energy: '0.00', fuelConsumed: '0.00', efficiency: '0.0' });
    parsedList.push({ type: 'efficiency_content', generatorName: 'EG 116', capacity: '60 KVA', runHour: '0.0', energy: '0.00', fuelConsumed: '0.00', efficiency: '0.0' });

  } else if (selectedReportType.value === 'fuelfilling') {
    parsedList.push({ type: 'site_header', siteName: 'PMVE' });
    parsedList.push({ type: 'fuelfilling_content', generatorName: 'EG 04', capacity: '500 KVA', filling: '71.00', dropping: '0.00' });
    parsedList.push({ type: 'fuelfilling_content', generatorName: 'EG 145', capacity: '250 KVA', filling: '215.00', dropping: '0.00' });
    parsedList.push({ type: 'site_header', siteName: 'J#310' });
    parsedList.push({ type: 'fuelfilling_content', generatorName: 'EG 129', capacity: '250 KVA', filling: '705.00', dropping: '0.00' });
    parsedList.push({ type: 'fuelfilling_content', generatorName: 'EG 137', capacity: '250 KVA', filling: '9685.00', dropping: '0.00' });
    parsedList.push({ type: 'site_header', siteName: 'J#315' });
    parsedList.push({ type: 'fuelfilling_content', generatorName: 'EG 159', capacity: '400 KVA', filling: '7335.00', dropping: '0.00' });
  }

  reportData.value = parsedList;
  isLoading.value = false;
};

// Mocks for opening selection pages
const openSiteSelector = () => router.push('/select-sites');
const openGeneratorSelector = () => router.push('/select-generator');
const handlePeriodChange = () => { /* Logic to open date picker */ };

const navigateToDetails = (item: any) => {
  console.log("Navigating for item:", item);
  
  // This would be the vehicle/generator ID for the current context.
  // For this static example, we'll hard-code it.
  const vehicleId = 'EG 134';


  // Use the router to push to the named route with parameters
  router.push({
    name: 'FuelFillingDropping', // Make sure this name matches your route definition
    params: {
      vehid: vehicleId,
    
    },
  });
};
</script>

<style scoped>
/* === GENERAL & FORM STYLES === */
.page-background {
  --background: #4e4c49;
  --color: #d1ccc1;
  font-family: 'Rajdhani', sans-serif;
}
.custom-toolbar {
  --background: #3c3a37;
  --color: #d1ccc1;
  font-weight: 500;
}
.form-container {
  padding: 18px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form-row {
  display: flex;
  align-items: center;
  font-size: 15px;
}
.form-label {
  flex-basis: 80px;
  text-align: left;
  font-weight: 600;
  color: #d1ccc1;
}
.form-colon {
  margin: 0 8px;
  color: #d1ccc1;
}

.form-value-box,
.form-select-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #403e3b;
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
  background-color: #484542;
  border-color: rgba(245, 156, 32, 0.4);
}

.box-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #d1ccc1;
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
  margin-top: 15px;
}
ion-button {
  --background: #393734;
  --color: #d1ccc1;
  --border-radius: 20px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  font-weight: 600;
  text-transform: none;
  height: 40px;
  min-width: 130px;
}

/* === STATUS INDICATORS === */
.status-container { display: flex; justify-content: center; margin-top: 20px; }
.no-data-text { color: #ffffff; }

/* === REPORT LIST STYLES === */
.report-list {
  background: transparent;
  padding: 0 15px;
  margin-top: 10px;
}

/* --- Site Header & Legend --- */
.site-header-divider {
  --background: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 20px;
  --padding-bottom: 5px;
  min-height: auto;
  align-items: flex-end; /* Aligns legend to bottom */
  font-family: 'Rajdhani', sans-serif;
}
.site-header-label {
  font-size: 18px;
  font-weight: 600;
  color: #d1ccc1;
  flex-grow: 1;
}
.legend-box-efficiency, .legend-box-filling {
  display: flex;
  flex-shrink: 0;
  color: #aaa7a2;
  font-size: 10px;
}
.legend-box-efficiency {
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.legend-box-filling {
  gap: 15px;
}
.legend-row {
  display: flex;
  gap: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.legend-item ion-icon {
  font-size: 11px;
}

/* --- Base Report Item Styles --- */
.report-item {
  --background: #3c3a37;
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-top: 12px;
  --inner-padding-bottom: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
}
.item-details {
  flex: 1; /* Make this take all available space */
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.generator-name {
  color: #d1ccc1;
  font-size: 16px;
  font-weight: 600;
}
.generator-capacity {
  font-weight: 500;
  color: #b0aca4;
}

/* --- Efficiency Item Specifics --- */
.data-grid {
  display: flex;
}
.efficiency-item .data-point {
  flex: 1; /* This gives equal weight to the first 3 */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: #d1ccc1;
  font-size: 15px;
}
.efficiency-item .data-point.efficiency-value {
  flex-grow: 0; /* Last item does not grow */
  flex-basis: 40px;
  align-items: flex-end;
}
.value-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.unit-row {
  font-size: 12px;
  color: #b0aca4;
  padding-left: 21px; /* Align with number above */
}
.efficiency-item .data-point.efficiency-value .value-row {
  width: 100%;
  justify-content: flex-end; /* Align the value itself to the right */
}
.efficiency-item ion-icon {
  font-size: 16px;
}


/* --- Fill-Drop Item Specifics --- */
.fuelfilling-item::part(native) {
  /* CRITICAL: Target the inner shadow part for flex layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fuelfilling-item .data-row {
  display: flex;
  gap: 20px; /* Space between filling and dropping */
}
.fuelfilling-item .data-point {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #d1ccc1;
}
.fuelfilling-item ion-icon {
  font-size: 20px;
}
.right-arrow {
  color: #8c8a86;
  font-size: 18px;
  flex-shrink: 0;
}
</style>