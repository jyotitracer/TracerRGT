<template>
  <div class="chart-container">
    <!-- The canvas element that Chart.js will draw on -->
    <canvas ref="lineChartRef"></canvas>
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import { Chart, registerables } from 'chart.js';

// Register necessary Chart.js components
Chart.register(...registerables);

export default {
  name: 'LineChart',
  props: {
    labels: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    minFuel: {
      type: String,
      required: true,
    },
    maxFuel: {
      type: String,
      required: true,
    },
    fuelUnit: {
      type: String,
      required: true,
    },
    FromDate:{ // This prop is no longer used in the template but kept for consistency
      type:String,
      required:true,
    },
  },
  setup(props) {
    const chart = ref(null);
    const lineChartRef = ref(null);

    // --- Define Colors for a Consistent Look ---
    const fontColor = '#d8d4cf';
    const gridColor = '#6e6b68';
    const lineAndPointColor = '#d8d4cf';
    const tooltipBgColor = '#2a2927';

    const createChart = () => {
      const canvas = lineChartRef.value;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Destroy the existing chart before creating a new one
      if (chart.value) {
        chart.value.destroy();
      }

      // Create a new chart instance with detailed styling options
      chart.value = new Chart(ctx, {
        type: 'line',
        data: {
          labels: props.labels,
          datasets: [
            {
              label: props.fuelUnit, // Used in tooltips by default
              data: props.data,
              borderColor: lineAndPointColor,
              tension: 0.1, // Gives the line a slight curve
              fill: false,  // No background fill under the line
              borderWidth: 2,
              // --- Point Styling ---
              pointRadius: 1,
              pointBackgroundColor: lineAndPointColor,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: 'white',
              pointHoverBorderColor: 'white',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: parseInt(props.minFuel, 10),
              max: parseInt(props.maxFuel, 10),
              title: {
                display: true,
                text: 'VALUE',
                color: fontColor,
                font: { size: 14, weight: 'bold' },
                padding: { bottom: 10 },
              },
              grid: {
                color: gridColor,
              },
              ticks: {
                color: fontColor,
                font: { size: 12, weight: 'bold' },
              },
            },
            x: {
              title: {
                display: true,
                text: 'DATE ( DD/MM HH:MM )',
                color: fontColor,
                font: { size: 14, weight: 'bold' },
                padding: { top: 10 },
              },
              grid: {
                display: false, // Hide vertical grid lines
              },
              ticks: {
                color: fontColor,
                maxRotation: 60,
                minRotation: 60,
                autoSkip: true,
                maxTicksLimit: 8,
                font: { size: 12, weight: 'bold' },
              },
            },
          },
          plugins: {
            legend: {
              display: false, // Hide the legend
            },
            tooltip: {
              enabled: true,
              backgroundColor: tooltipBgColor,
              titleColor: fontColor,
              bodyColor: fontColor,
              padding: 10,
              cornerRadius: 4,
              displayColors: false, // Hide the little color box in tooltip
              // Customizing the tooltip content to match the screenshot
              callbacks: {
                title: (context) => `Date : ${context[0].label}`,
                label: (context) => `Value : ${context.raw}`,
              },
            },
          },
        },
      });
    };

    onMounted(() => {
      // Give the canvas a moment to be in the DOM before creating the chart
      setTimeout(createChart, 0);
    });

    onUnmounted(() => {
      if (chart.value) {
        chart.value.destroy();
      }
    });

    // Watch for prop changes to update the chart dynamically
    watch(() => [props.labels, props.data], () => {
        if (chart.value) {
          chart.value.data.labels = props.labels;
          chart.value.data.datasets[0].data = props.data;
          chart.value.update();
        }
      },
      { deep: true } // Use deep watch for arrays
    );

    return {
      lineChartRef,
    };
  },
};
</script>

<style scoped>
.chart-container {
  position: relative;
  /* Let the container in FuelChart.vue control the padding */
  height: 50vh; /* Make it tall, adjust as needed */
  width: 100%;
}
</style>