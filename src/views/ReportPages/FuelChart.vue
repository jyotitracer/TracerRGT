<template>
  <ion-page class="page-background">
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="#" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Fuel Chart</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- This wrapper creates the container effect with the top border -->
      <div class="chart-wrapper">
        <div v-if="chartData.length > 0" class="chart-container">
          <LineChart 
            :labels="chartLabels" 
            :data="chartData" 
            :min-fuel="jsonObjectminfuel" 
            :max-fuel="jsonObjectmaxfuel" 
            :fuel-unit="jsonObjectfuelunit" 
          />
        </div>
        <p v-else class="no-data-message">Data not available</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonButtons, IonBackButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { defineComponent, ref, onMounted } from 'vue';
import LineChart from '@/components/LineChart.vue'; // We will create this next

export default defineComponent({
  name: 'FuelChart',
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    LineChart,
  },

  setup() {
    // --- Refs for chart data ---
    const chartLabels = ref<string[]>([]);
    const chartData = ref<number[]>([]);
    const jsonObjectminfuel = ref<string>('0');
    const jsonObjectmaxfuel = ref<string>('800');
    const jsonObjectfuelunit = ref<string>('Liters');

    onMounted(async () => {
      const now = new Date();
      const tdate = now.toISOString().split('T')[0];
      const past = new Date();
      past.setDate(past.getDate() - 7);
      const fdate = past.toISOString().split('T')[0];

      try {
        const { getFuelChart } = await import('@/services/ApiService');
        const res = await getFuelChart({
          gen_id: 4,
          par_id: 27,
          intrvl_id: 5,
          fdate: fdate,
          tdate: tdate
        });

        if (res.status === 200 && res.data) {
          const list = res.data.arr_data || res.data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            chartLabels.value = list.map((item: any) => item.time || item.date || item.label || '');
            chartData.value = list.map((item: any) => Number(item.val || item.value || 0));
            if (res.data.min_fuel) jsonObjectminfuel.value = String(res.data.min_fuel);
            if (res.data.max_fuel) jsonObjectmaxfuel.value = String(res.data.max_fuel);
            if (res.data.unit) jsonObjectfuelunit.value = String(res.data.unit);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching fuel chart data:', err);
      }

      // Fallback demo curve
      jsonObjectminfuel.value = '0';
      jsonObjectmaxfuel.value = '800';
      jsonObjectfuelunit.value = 'Liters';
      chartLabels.value = [
        '01/10 01:30', '02/10 02:49', '04/10 04:09', '06/10 05:29',
        '08/10 06:45', '10/10 08:08', '12/10 09:24'
      ];
      chartData.value = [640, 638, 635, 632, 630, 628, 625];
    });

    return {
      chartLabels,
      chartData,
      jsonObjectminfuel,
      jsonObjectmaxfuel,
      jsonObjectfuelunit,
    };
  },

  methods: {
    goBack() {
      this.$router.back();
    },
  },
});
</script>

<style scoped>
.page-background {
  --background: #474542; /* Main dark background from screenshot */
}

.custom-toolbar {
  --background: #3a3835; /* Header background from screenshot */
  --color: #d8d4cf;
}

/* This is the main container for the chart area */
.chart-wrapper {
  margin: 15px;
  background-color: #53514e; /* Chart area background */
  border-top: 2px solid #6e6b68; /* Light top border from screenshot */
  padding: 15px;
  border-radius: 4px;
}

.no-data-message {
  text-align: center;
  margin-top: 50px;
  color: #a09c97;
}
</style>