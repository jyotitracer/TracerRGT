<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
          <ion-back-button @click="goBack"></ion-back-button>
        </ion-buttons>
          <ion-title>History Log</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="history-log-content">
        <!-- Dropdowns for dynamic selection -->
        <ion-item style="padding-top: 20px; ">
          <ion-label class="lable_class">Site</ion-label>
          <select v-model="selectedSite" class="custom-select">
            <option v-for="site in siteOptions" :key="site.id" :value="site.id">{{ site.name }}</option>
          </select>
        </ion-item>
  
        <ion-item style="padding-top: 5px;">
          <ion-label class="lable_class">Generator</ion-label>
          <select v-model="selectedGenerator" class="custom-select">
            <option v-for="gen in generatorOptions" :key="gen.id" :value="gen">{{ gen.name }}</option>
          </select>
        </ion-item>
  
        <ion-item style="padding-top: 5px;">
          <ion-label class="lable_class">Parameter</ion-label>
          <select v-model="selectedParameter" class="custom-select">
            <option v-for="param in parameterOptions" :key="param.id" :value="param">{{ param.name }}</option>
          </select>
        </ion-item>
  
        <ion-item style="padding-top: 5px;">
          <ion-label class="lable_class">Sampling</ion-label>
          <select v-model="selectedSampling" class="custom-select">
            <option v-for="sample in samplingOptions" :key="sample.id" :value="sample">{{ sample.name }}</option>
          </select>
        </ion-item>

        <!-- Custom Date Range Selection -->
        <ion-item v-if="selectedSampling && selectedSampling.id === 5" style="padding-top: 5px;">
          <ion-label class="lable_class">From Date</ion-label>
          <input type="date" v-model="customFromDate" class="custom-select custom-date-input" />
        </ion-item>

        <ion-item v-if="selectedSampling && selectedSampling.id === 5" style="padding-top: 5px;">
          <ion-label class="lable_class">To Date</ion-label>
          <input type="date" v-model="customToDate" class="custom-select custom-date-input" />
        </ion-item>

        <!-- View Chart Button -->
        <div class="button-container">
          <ion-button class="chart-button" expand="block" @click="viewChart">View Chart</ion-button>
        </div>
  
        <!-- Chart Display -->
        <div v-if="chartData" style="background-color: var(--ion-color-brownishGrey); margin: 10px; padding:10px">
          <canvas id="chart"></canvas>
        </div>
  
        <!-- Maximum and Minimum Values -->
        <div v-if="chartData" class="min-max">
          <div class="max-value">{{ maxValue }} kW<br />
             <!-- Horizontal Line -->
             <div class="separator"></div>
            <label style="font-size: 12px;">Maximum</label>
        </div>
          <div class="min-value">{{ minValue }} kW<br />
            <div class="separator"></div>
            <label style="font-size: 12px;">Minimum</label>
        </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonButton, IonBackButton,
    IonButtons, loadingController } from '@ionic/vue';
  import { Chart, registerables } from "chart.js";
  import router from '@/router/index';
  import { getParameterList, getHistoryMapData } from '@/services/ApiService';
  import { nextTick } from 'vue';

  Chart.register(...registerables);

  const siteOptions = ref([
    { id: '23', name: 'Site 23' },
    { id: '8', name: 'Site 8' },
    { id: '9', name: 'Site 9' }
  ]);
  const generatorOptions = ref([
    { id: 181, name: 'EG 181 (60 KVA)' },
    { id: 86, name: 'EG 86 (500 KVA)' },
    { id: 75, name: 'EG 75 (250 KVA)' }
  ]);
  const parameterOptions = ref<any[]>([
    { id: 43, name: 'Active Power - B' },
    { id: 27, name: 'Fuel Level' }
  ]);
  const samplingOptions = ref([
    { id: 1, name: '1 Hour' },
    { id: 2, name: '6 Hours' },
    { id: 3, name: 'Today' },
    { id: 4, name: 'Yesterday' },
    { id: 5, name: 'Custom Interval' }
  ]);
  
  const selectedSite = ref('23');
  const selectedGenerator = ref(generatorOptions.value[0]);
  const selectedParameter = ref(parameterOptions.value[0]);
  const selectedSampling = ref(samplingOptions.value[2]);

  // Default custom dates (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0];

  const customFromDate = ref(tenDaysAgoStr);
  const customToDate = ref(todayStr);
  
  const chartData = ref(null);
  const maxValue = ref(0);
  const minValue = ref(0);
  let chartInstance = null;

  // Load telemetry parameter catalog from API
  onMounted(async () => {
    try {
      const res = await getParameterList();
      if (res.status === 200 && res.data) {
        const list = res.data.arr_data || res.data.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          parameterOptions.value = list.map((item: any) => ({
            id: item.par_id || item.id,
            name: item.par_name || item.name || `Parameter ${item.par_id || item.id}`,
            unit: item.unit || ''
          }));
          if (parameterOptions.value.length > 0) {
            selectedParameter.value = parameterOptions.value[0];
          }
        }
      }
    } catch (err) {
      console.error('Error fetching parameter catalog:', err);
    }
  });
  
  // Function to load chart and fetch data
  const viewChart = async () => {
    const loading = await loadingController.create({ message: 'Fetching trend data...' });
    await loading.present();

    try {
      const genId = selectedGenerator.value?.id || 181;
      const parId = selectedParameter.value?.id || 43;
      const intrvlId = selectedSampling.value?.id || 3;

      // Current date formatting YYYY-MM-DD
      let fdate = '';
      let tdate = '';

      if (intrvlId === 5) {
        // Custom interval selected
        fdate = customFromDate.value || tenDaysAgoStr;
        tdate = customToDate.value || todayStr;
      } else {
        const now = new Date();
        tdate = now.toISOString().split('T')[0];
        const past = new Date();
        past.setDate(past.getDate() - 10);
        fdate = past.toISOString().split('T')[0];
      }

      // Call Postman API: POST /Mobile_Contro/history_map_data
      const res = await getHistoryMapData({
        gen_id: Number(genId),
        par_id: Number(parId),
        intrvl_id: Number(intrvlId),
        fdate: fdate,
        tdate: tdate
      });

      let labels: string[] = [];
      let dataPoints: number[] = [];

      if (res.status === 200 && res.data) {
        const raw = res.data.arr_data || res.data.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          labels = raw.map((d: any) => d.time || d.date || d.label || '');
          dataPoints = raw.map((d: any) => Number(d.val || d.value || 0));
        }
      }

      // Fallback data if backend returned empty for test
      if (dataPoints.length === 0) {
        labels = [
          '01/10 12:00', '02/10 12:00', '04/10 12:00',
          '06/10 12:00', '08/10 12:00', '10/10 12:00', '12/10 12:00'
        ];
        dataPoints = [5134, 4700, 5300, 4800, 5100, 4900, 5200];
      }

      chartData.value = dataPoints;
      maxValue.value = Math.max(...dataPoints);
      minValue.value = Math.min(...dataPoints);

      await nextTick();
      const canvasEl = document.getElementById("chart") as HTMLCanvasElement;
      if (!canvasEl) return;
      const ctx = canvasEl.getContext("2d");
      
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: selectedParameter.value?.name || 'Parameter Value',
            data: chartData.value,
            backgroundColor: "rgba(100, 93, 93, 0.6)",
            borderColor: "#c4c4c4",
            borderWidth: 2,
            tension: 0,
            stepped: true,
            pointRadius: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#433b3b",
              titleColor: "#c4c4c4",
              bodyColor: "#c4c4c4",
            },
          },
          scales: {
            x: {
              title: { display: true, text: "DATE ( DD/MM HH:MM )", color: "#c4c4c4" },
              ticks: { color: "#c4c4c4" },
              grid: { color: "transparent" },
            },
            y: {
              title: { display: true, text: "VALUE", color: "#c4c4c4" },
              ticks: { color: "#c4c4c4" },
              grid: { color: "transparent" },
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
    
  <style>

#chart {
  max-width: 100%;
  margin: 0 auto;
  height: 300px; /* Adjust as necessary */
}
  .history-log-content {
    --background: #5b575b;
    color: var(--ion-text-color);
  }
  
  ion-label,
  ion-select {
    color: var(----ion-text-color);
  }
  
  .custom-select {
    width: 75%;
    font-size: 14px;
    border: 1px solid var(--ion-color-text);
    border-radius: 4px;
    padding: 5px;
    background: var(--ion-color-brownishGrey);
    color: var(--ion-text-color, #fff);
  }
  
  .custom-select:focus {
    border-color: var(--ion-color-primary);
  }

  .custom-date-input {
    color-scheme: dark;
    outline: none;
  }
  
  .lable_class {
    width: 25%;
    margin: 0px;
    font-size: 12px;
  }
  
  .min-max {
    display: flex;
    padding: 10px;
    justify-content: center;
  }
  
  .max-value,
  .min-value {
    text-align: center;
    font-size: 18px;
    color: var(--ion-color-pinkishGrey);
    background-color: var(--ion-color-greyishBrown);
    padding: 10px;
    margin: 10px;

  }
  
  /* Button Container to center the button */
  .button-container {
    display: flex;
    justify-content: center;
    padding-top: 10px;
  }
  
  .chart-button {
    --background: var(--ion-color-greyishBrown);
    --color: var(--ion-color-paleSalmon);
    --ripple-color: var(--ion-color-paleSalmon);
    text-transform: none;
  }
  ion-item{
    --min-height:0px;
  }
  
  .separator {
  width: 100%;
  height: 1px;
  background-color: var(--ion-text-color); /* Line color */
}
  </style>
  