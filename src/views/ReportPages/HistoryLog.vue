<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="history-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>History Log</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="history-log-content">
      <!-- Form for dynamic selection -->
      <div class="form-container">
        <!-- 1. Site Selector (Navigates to /select-sites) -->
        <div class="form-row">
          <span class="form-label">Site</span>
          <span class="form-colon">:</span>
          <div class="form-value-box" @click="openSiteSelector">
            <span class="box-text">{{ displaySiteText }}</span>
            <ion-icon :icon="chevronForwardOutline" class="box-arrow"></ion-icon>
          </div>
        </div>

        <!-- 2. Generator Selector (Navigates to /select-generator) -->
        <div class="form-row">
          <span class="form-label">Generator</span>
          <span class="form-colon">:</span>
          <div class="form-value-box" @click="openGeneratorSelector">
            <span class="box-text">{{ displayGeneratorText }}</span>
            <ion-icon :icon="chevronForwardOutline" class="box-arrow"></ion-icon>
          </div>
        </div>

        <!-- 3. Parameter Dropdown -->
        <div class="form-row">
          <span class="form-label">Parameter</span>
          <span class="form-colon">:</span>
          <select v-model="selectedParamId" class="custom-select">
            <option v-for="param in parameterOptions" :key="param.id" :value="param.id">
              {{ param.name }} {{ param.unit ? `(${param.unit})` : '' }}
            </option>
          </select>
        </div>

        <!-- 4. Sampling Dropdown -->
        <div class="form-row">
          <span class="form-label">Sampling</span>
          <span class="form-colon">:</span>
          <select v-model="selectedSamplingId" class="custom-select">
            <option v-for="sample in samplingOptions" :key="sample.id" :value="sample.id">
              {{ sample.name }}
            </option>
          </select>
        </div>

        <!-- Custom Date Range Selection -->
        <div v-if="selectedSamplingId === 5" class="form-row custom-date-row">
          <span class="form-label">From Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customFromDate" class="custom-select custom-date-input" />
        </div>

        <div v-if="selectedSamplingId === 5" class="form-row custom-date-row">
          <span class="form-label">To Date</span>
          <span class="form-colon">:</span>
          <input type="date" v-model="customToDate" class="custom-select custom-date-input" />
        </div>

        <!-- View Chart Button -->
        <div class="button-container">
          <ion-button class="chart-button" expand="block" @click="viewChart">
            View Chart
          </ion-button>
        </div>
      </div>

      <!-- Chart Display -->
      <div v-if="chartData && chartData.length > 0">
        <!-- Parameter label above chart -->
        <div class="chart-param-label">
          {{ currentParamLabel }}
        </div>
        <div class="chart-card">
          <canvas id="chart"></canvas>
        </div>
      </div>

          <!-- Maximum and Minimum Values -->
      <div v-if="chartData && chartData.length > 0" class="min-max">
        <div class="max-value">
          <div class="stat-number">{{ formattedMaxValue }} {{ apiParUnit || currentUnit }}</div>
          <div class="separator"></div>
          <label class="stat-label">Maximum</label>
        </div>
        <div class="min-value">
          <div class="stat-number">{{ formattedMinValue }} {{ apiParUnit || currentUnit }}</div>
          <div class="separator"></div>
          <label class="stat-label">Minimum</label>
        </div>
      </div>


      <!-- No Data Available Message -->
      <div v-else-if="chartData && chartData.length === 0" class="no-chart-data">
        <p>No data available for the selected parameter and period</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonBackButton,
  IonButtons,
  IonIcon,
  loadingController,
  onIonViewWillEnter,
} from '@ionic/vue';
import { chevronForwardOutline } from 'ionicons/icons';
import { Chart, registerables } from "chart.js";
import router from '@/router/index';
import { getParameterList, getHistoryMapData, getDashboardDetail } from '@/services/ApiService';

Chart.register(...registerables);

interface SiteOption {
  id: string | number;
  name: string;
}

interface GenOption {
  id: string | number;
  siteId: string | number;
  name: string;
  capacity?: string;
  displayName: string;
}

interface ParamOption {
  id: number;
  name: string;
  unit?: string;
   par_unit?: string;
}

const siteOptions = ref<SiteOption[]>([]);
const allGenerators = ref<GenOption[]>([]);
const generatorOptions = ref<GenOption[]>([]);

// Single-site selection for history log
const selectedSite = ref<any | null>(null);
const selectedGenerator = ref<any | null>(null);

const displaySiteText = computed(() => {
  if (selectedSite.value?.name) return selectedSite.value.name;
  return 'Select Site';
});

const displayGeneratorText = computed(() => {
  if (selectedGenerator.value?.name) {
    return selectedGenerator.value.name;
  }
  const current = generatorOptions.value.find(g => String(g.id) === String(selectedGenId.value));
  return current ? current.displayName : 'Select Generator';
});

// History log uses single-site selector (not multi-site like event/fuel reports)
const openSiteSelector = () => router.push('/select-site-single');
const openGeneratorSelector = () => router.push('/select-generator-single');

const syncSelections = () => {
  // Single site selection
  try {
    const savedSite = localStorage.getItem('selected_history_site');
    if (savedSite) {
      const parsed = JSON.parse(savedSite);
      if (parsed && parsed.id !== undefined) {
        selectedSite.value = parsed;
        selectedSiteId.value = parsed.id;
      }
    }
  } catch (e) {}

  // Single generator selection
  try {
    const savedGen = localStorage.getItem('selected_history_generator');
    if (savedGen) {
      const parsed = JSON.parse(savedGen);
      if (parsed && parsed.id !== undefined) {
        selectedGenerator.value = parsed;
        selectedGenId.value = parsed.id;
      }
    }
  } catch (e) {}
};

onIonViewWillEnter(() => {
  syncSelections();
  filterGenerators();
});

// Pre-configured rich parameter catalog so dropdown always has complete details
const parameterOptions = ref<ParamOption[]>([
  { id: 43, name: 'Active Power - Total', unit: 'kW' },
  { id: 44, name: 'Active Power - L1', unit: 'kW' },
  { id: 45, name: 'Active Power - L2', unit: 'kW' },
  { id: 46, name: 'Active Power - L3', unit: 'kW' },
  { id: 27, name: 'Fuel Level', unit: 'L' },
  { id: 47, name: 'Apparent Power', unit: 'kVA' },
  { id: 48, name: 'Reactive Power', unit: 'kVAR' },
  { id: 49, name: 'Power Factor', unit: 'PF' },
  { id: 50, name: 'Battery Voltage', unit: 'V' },
  { id: 51, name: 'Engine Oil Pressure', unit: 'kPa' },
  { id: 52, name: 'Coolant Temperature', unit: '°C' },
  { id: 53, name: 'Engine Speed', unit: 'RPM' },
  { id: 54, name: 'Frequency', unit: 'Hz' },
  { id: 55, name: 'Avg Line Voltage', unit: 'V' },
]);

const samplingOptions = ref([
  { id: 1, name: '1 Hour' },
  { id: 3, name: 'Today' },
  { id: 4, name: 'Yesterday' },
  { id: 6, name: 'Last Week' },
  { id: 5, name: 'Custom Interval' },
]);

const selectedSiteId = ref<string | number>('all');
const selectedGenId = ref<string | number>('');
const selectedParamId = ref<number>(43);
const selectedSamplingId = ref<number>(3);

// Dates (YYYY-MM-DD)
const todayStr = new Date().toISOString().split('T')[0];
const tenDaysAgo = new Date();
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0];

const customFromDate = ref(tenDaysAgoStr);
const customToDate = ref(todayStr);

const chartData = ref<number[] | null>(null);
const maxValue = ref(0);
const minValue = ref(0);
const apiParUnit = ref('');
let chartInstance: any = null;

// Check if selected sampling period is 1 Hour (1), Today (3), or Yesterday (4)
const isTimeOnlyPeriod = computed(() => {
  return selectedSamplingId.value === 1 || selectedSamplingId.value === 3 || selectedSamplingId.value === 4;
});


const currentParamLabel = computed(() => {
  const p = parameterOptions.value.find(item => item.id === selectedParamId.value);
  return p ? `${p.name}${p.unit ? ' (' + p.unit + ')' : ''}` : 'Parameter Value';
});

const currentUnit = computed(() => {
  const p = parameterOptions.value.find(item => item.id === selectedParamId.value);
  if (!p) return '';
  // Prioritize par_unit from API
  if (p.par_unit) return p.par_unit;
  if (p.unit) return p.unit;

  const name = p.name || '';
  const start = name.indexOf('(');
  const end = name.indexOf(')', start);
  if (start !== -1 && end !== -1) {
    return name.slice(start + 1, end).trim();
  }
  return '';
});

const formattedMaxValue = computed(() => {
  if (maxValue.value === undefined || maxValue.value === null) return '0';
  return Number(maxValue.value).toLocaleString(undefined, { maximumFractionDigits: 2 });
});

const formattedMinValue = computed(() => {
  if (minValue.value === undefined || minValue.value === null) return '0';
  return Number(minValue.value).toLocaleString(undefined, { maximumFractionDigits: 2 });
});

// Format timestamp: "HH:MM" for 1 Hour / Today / Yesterday; "DD/MM HH:MM" for Last Week / Custom
const formatChartLabel = (raw: string, timeOnly: boolean): string => {
  if (!raw) return '';
  const str = String(raw).trim().replace('T', ' ');

  // Match YYYY-MM-DD HH:MM
  const m = str.match(/\d{4}-(\d{2})-(\d{2})[\s]+(\d{2}):(\d{2})/);
  if (m) {
    const [, mm, dd, hh, min] = m;
    return timeOnly ? `${hh}:${min}` : `${dd}/${mm} ${hh}:${min}`;
  }

  // Match DD/MM/YYYY HH:MM or DD-MM-YYYY HH:MM
  const m2 = str.match(/(\d{2})[\/\-](\d{2})(?:[\/\-]\d+)?[\s,]+(\d{2}):(\d{2})/);
  if (m2) {
    const [, dd, mm, hh, min] = m2;
    return timeOnly ? `${hh}:${min}` : `${dd}/${mm} ${hh}:${min}`;
  }

  // Match already HH:MM
  const m3 = str.match(/^(\d{2}):(\d{2})/);
  if (m3) return `${m3[1]}:${m3[2]}`;

  return str.length > (timeOnly ? 5 : 11) ? str.slice(0, timeOnly ? 5 : 11) : str;
};


// Y-axis abbreviation: 12400 → "12.4k", 1500000 → "1.5M"
const formatYTick = (val: number | string): string => {
  const v = Number(val);
  if (isNaN(v)) return String(val);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return v.toFixed(v % 1 === 0 ? 0 : 1);
};

// Load sites and generators from dashboard detail API & local cache
const loadSitesAndGenerators = async () => {
  let siteArr: any[] = [];

  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed?.site_arr) && parsed.site_arr.length > 0) {
        siteArr = parsed.site_arr;
      }
    }
  } catch (e) {
    console.warn('Error reading cached dashboard_detail:', e);
  }

  // Also query API for latest list
  try {
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      const apiSites = d.site_arr || d.arr_site || d.data?.site_arr;
      if (Array.isArray(apiSites) && apiSites.length > 0) {
        siteArr = apiSites;
      }
    }
  } catch (err) {
    console.warn('Could not query fresh sites, using fallback:', err);
  }



  // Populate siteOptions
  const sites: SiteOption[] = [{ id: 'all', name: 'All Sites' }];
  const gens: GenOption[] = [];

  siteArr.forEach((s: any) => {
    const siteId = s.id || s.site_id;
    const sName = s.name || s.site_name || `Site ${siteId}`;
    sites.push({ id: siteId, name: sName });

    if (Array.isArray(s.gen_arr)) {
      s.gen_arr.forEach((g: any) => {
        const gId = g.id || g.gen_id;
        const gName = g.name || g.gen_name || `EG ${gId}`;
        const cap = g.capacity || g.model || '';
        gens.push({
          id: gId,
          siteId: siteId,
          name: gName,
          capacity: cap,
          displayName: cap ? `${gName} (${cap}) — ${sName}` : `${gName} — ${sName}`,
        });
      });
    }
  });

  siteOptions.value = sites;
  allGenerators.value = gens;

  // Auto-select first real site if none selected
  if (sites.length > 1 && !selectedSite.value) {
    const firstSite = sites[1];
    selectedSite.value = firstSite;
    selectedSiteId.value = firstSite.id;
    try { localStorage.setItem('selected_history_site', JSON.stringify(firstSite)); } catch (e) {}
  }
  syncSelections();
  filterGenerators();
};

const filterGenerators = () => {
  // History log always filters by the single selected site
  if (selectedSite.value && selectedSite.value.id !== 'all') {
    generatorOptions.value = allGenerators.value.filter(
      g => String(g.siteId) === String(selectedSite.value.id)
    );
  } else {
    generatorOptions.value = allGenerators.value;
  }

  if (generatorOptions.value.length > 0) {
    const exists = generatorOptions.value.some(g => String(g.id) === String(selectedGenId.value));
    if (!exists) {
      const first = generatorOptions.value[0];
      selectedGenId.value = first.id;
      selectedGenerator.value = { id: first.id, name: first.displayName };
      try { localStorage.setItem('selected_history_generator', JSON.stringify({ id: first.id, name: first.displayName })); } catch (e) {}
    }
  } else {
    selectedGenId.value = '';
  }
};

const onSiteChange = () => {
  filterGenerators();
};

// Load telemetry parameter catalog from API
onMounted(async () => {
  syncSelections();
  await loadSitesAndGenerators();

  try {
    const res = await getParameterList();
    if (res.status === 200 && res.data) {
      const list = res.data.arr_data || res.data.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        // Merge with existing pre-configured parameter catalogue
              const apiParams: ParamOption[] = list.map((item: any) => ({
          id: Number(item.par_id || item.id),
          name: item.par_name || item.name || `Parameter ${item.par_id || item.id}`,
          unit: item.par_unit || item.unit || item.param_unit || '',
          par_unit: item.par_unit || item.unit || item.param_unit || '',
        }));

        const existingIds = new Set(apiParams.map(p => p.id));
        parameterOptions.value.forEach(p => {
          if (!existingIds.has(p.id)) {
            apiParams.push(p);
          }
        });
        parameterOptions.value = apiParams;
      }
    }
  } catch (err) {
    console.warn('Parameter API unavailable, using comprehensive catalog:', err);
  }
});

// Function to load chart and fetch data
const viewChart = async () => {
  const loading = await loadingController.create({
    message: 'Fetching trend data...',
    duration: 3500,
  });
  await loading.present();

  try {
    let genId = selectedGenId.value;
    if (selectedGenerator.value && selectedGenerator.value.id && selectedGenerator.value.id !== 'all') {
      genId = selectedGenerator.value.id;
    }
    if (!genId || genId === 'all') {
      genId = generatorOptions.value[0]?.id || allGenerators.value[0]?.id || 181;
    }
    const parId = selectedParamId.value || 43;
    const intrvlId = selectedSamplingId.value || 3;

    let fdate = '';
    let tdate = '';
    const now = new Date();

    if (intrvlId === 5) {
      // Custom interval — use user-picked dates
      fdate = customFromDate.value || tenDaysAgoStr;
      tdate = customToDate.value || todayStr;
    } else if (intrvlId === 6) {
      // Last Week — 7 days ending today
      tdate = now.toISOString().split('T')[0];
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      fdate = past.toISOString().split('T')[0];
    } else if (intrvlId === 4) {
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      fdate = yesterday.toISOString().split('T')[0];
      tdate = yesterday.toISOString().split('T')[0];
    } else if (intrvlId === 3) {
      // Today
      fdate = now.toISOString().split('T')[0];
      tdate = now.toISOString().split('T')[0];
    } else {
      // 1 Hour — use today as date range; intrvl_id drives the actual bucket size on server
      fdate = now.toISOString().split('T')[0];
      tdate = now.toISOString().split('T')[0];
    }

    let labels: string[] = [];
    let dataPoints: number[] = [];

    try {
      const res = await getHistoryMapData({
        gen_id: Number(genId),
        par_id: Number(parId),
        intrvl_id: Number(intrvlId),
        fdate: fdate,
        tdate: tdate,
      });

      if (res && res.status === 200 && res.data) {
        // Extract par_unit from response: check p.par_unit, par_unit, or unit
        const resData = res.data;
        const resP = resData.p ?? resData.P ?? resData.data?.p ?? {};
        const unitFromApi = resP.par_unit ?? resData.par_unit ?? resData.unit ?? '';
        if (unitFromApi) apiParUnit.value = String(unitFromApi);

        const raw = resData.arr_data || resData.data || (Array.isArray(resData) ? resData : []);
        if (Array.isArray(raw) && raw.length > 0) {
          labels = raw.map((d: any) => d.epoch_time ?? d.time ?? d.date ?? d.label ?? d.rtcdatetime ?? '');
          dataPoints = raw.map((d: any) => Number(d.val !== undefined ? d.val : (d.value !== undefined ? d.value : 0)));
        }
      }
    } catch (apiErr) {
      console.warn('Live history_map_data API call failed:', apiErr);
    }

    if (dataPoints.length === 0) {
      chartData.value = [];
      maxValue.value = 0;
      minValue.value = 0;
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    chartData.value = dataPoints;
    maxValue.value = Math.max(...dataPoints);
    minValue.value = Math.min(...dataPoints);

    await nextTick();
    const canvasEl = document.getElementById("chart") as HTMLCanvasElement;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    // --- Epoch → formatted label (HH:MM or DD/MM HH:MM) -----------------------
    const timeOnly = isTimeOnlyPeriod.value;
    const toLabel = (raw: any): string => {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        const d = new Date(n < 1e12 ? n * 1000 : n);
        if (!Number.isNaN(d.getTime())) {
          const hh  = String(d.getHours()).padStart(2, '0');
          const mn  = String(d.getMinutes()).padStart(2, '0');
          if (timeOnly) return `${hh}:${mn}`;
          const dd  = String(d.getDate()).padStart(2, '0');
          const mo  = String(d.getMonth() + 1).padStart(2, '0');
          return `${dd}/${mo} ${hh}:${mn}`;
        }
      }
      return formatChartLabel(String(raw ?? ''), timeOnly);
    };

     // --- Filter consecutive same values: keep FIRST entry, skip repeating, display next entry when value changes ---
    const rawPairs: { label: string; value: number }[] = labels.map((l, i) => ({
      label: toLabel(l),
      value: dataPoints[i],
    }));

    const dedupedPairs: { label: string; value: number }[] = [];
    for (let i = 0; i < rawPairs.length; i++) {
      // 1. Always keep the first entry (i === 0)
      // 2. If the current value is different from previous value, keep it (next entry)
      // 3. If value is repeating, skip it so only the first occurrence is kept
      if (i === 0 || rawPairs[i].value !== rawPairs[i - 1].value) {
        dedupedPairs.push(rawPairs[i]);
      }
    }

    const chartLabels = dedupedPairs.map(p => p.label);
    const chartValues = dedupedPairs.map(p => p.value);

    // --- Y-axis: 0 → max with 3 equal divisions (4 ticks) ---------------------
    const yMax = Math.max(...chartValues, 0) || 10;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: currentParamLabel.value,
          data: chartValues,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: '#ffffff',
          borderWidth: 2,
          tension: 0.25,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ffffff',
          pointRadius: 3.5,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#ffffff',
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1e1c1a',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items: any[]) => {
                if (!items.length) return '';
                const lbl = items[0].label;
                return timeOnly ? `Time : ${lbl}` : `Date : ${lbl}`;
              },
              label: (item: any) => {
                const raw = Number(item.raw);
                const display = raw.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                });
                return `Value : ${display} ${apiParUnit.value || currentUnit.value}`.trim();
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: timeOnly ? 'Time (HH:MM)' : 'Date (DD/MM HH:MM)',
              color: '#c4b9a9',
              font: { size: 10 },
            },
            ticks: {
              color: '#c4b9a9',
              font: { size: 9 },
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
            },
            grid: { 
                    display: false, // NO grid lines in Android
                    color: 'rgba(255, 255, 255, 0.05)' },
          }, 
     
          y: {  
            beginAtZero: true,
            min: 0,
            max: yMax,
            afterBuildTicks: (scale: any) => {
              // 4 ticks → 3 equal divisions: 0, max/3, 2*max/3, max
              scale.ticks = [
                { value: 0 },
                { value: Math.round((yMax / 3) * 10) / 10 },
                { value: Math.round((yMax / 3 * 2) * 10) / 10 },
                { value: yMax },
              ];
            },
            title: {
              display: true,
              text: apiParUnit.value || currentUnit.value,
              color: '#c4b9a9',
              font: { size: 10 },
            },
            ticks: {
              color: '#c4b9a9',
              font: { size: 10 },
              callback: (value: any) => formatYTick(value),
            },
            grid: {
                    display: false, // NO grid lines
 color: 'rgba(255, 255, 255, 0.06)' },
          },
        },
      }
    });

  } catch (error) {
    console.error('Error generating chart:', error);
  } finally {
    await loading.dismiss();
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.history-toolbar {
  --background: #32302e;
  --color: #fdcf9f;
  font-weight: 600;
}

.history-log-content {
  --background: #3c3a37;
  color: var(--ion-text-color, #ffffff);
  font-family: 'Rajdhani', sans-serif;
}

.form-container {
  padding: 16px 14px 10px 14px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
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
  transition: border-color 0.2s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.custom-select:focus {
  border-color: #f59c20;
}

.custom-select option {
  background-color: #262422 !important;
  color: #ffffff !important;
  padding: 8px;
  font-size: 13px;
}

.custom-date-row {
  margin-top: 4px;
}

.custom-date-input {
  color-scheme: dark;
}

.button-container {
  display: flex;
  justify-content: center;
  padding: 14px 0 6px 0;
}

.chart-button {
  --background: #343230;
  --color: #fdcf9f;
  --border-radius: 6px;
  --border-color: rgba(245, 156, 32, 0.5);
  --border-style: solid;
  --border-width: 1px;
  font-weight: 600;
  text-transform: none;
  width: 100%;
  height: 42px;
}

.chart-param-label {
  margin: 12px 12px 0 12px;
  padding: 7px 12px;
  background-color: #2b2826;
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(245, 156, 32, 0.35);
  border-bottom: none;
  font-size: 13px;
  font-weight: 700;
  color: #fdcf9f;
  letter-spacing: 0.3px;
  text-align: center;
}

.chart-card {
  background-color: #343230;
  margin: 0 12px 12px 12px;
  padding: 14px 10px;
  border-radius: 0 0 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: 300px;
}

.no-chart-data {
  text-align: center;
  color: #fdcf9f;
  padding: 30px 16px;
  font-size: 15px;
  background: rgba(0, 0, 0, 0.2);
  margin: 16px;
  border-radius: 8px;
  border: 1px dashed rgba(245, 156, 32, 0.3);
}

#chart {
  width: 100% !important;
  height: 100% !important;
}

.min-max {
  display: flex;
  padding: 6px 12px 24px 12px;
  justify-content: center;
  gap: 16px;
}

.max-value,
.min-value {
  flex: 1;
  text-align: center;
  background-color: #343230;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 8px;
}

.stat-number {
  font-size: 17px;
  font-weight: 700;
  color: #fdcf9f;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 11px;
  color: #c4b9a9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.separator {
  width: 80%;
  margin: 4px auto 6px auto;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
}
</style>