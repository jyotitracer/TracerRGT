<template>
  <ion-content>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </ion-content>
</template>

<script>
import { onMounted, ref } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  setup() {
    const chart = ref(null);

    onMounted(() => {
      const ctx = document.getElementById("chart").getContext("2d");

      const data = {
        labels: [
          "21/09 16:46", "21/09 17:00", "21/09 17:15", 
          "21/09 17:30", "21/09 17:45", "21/09 18:00"
        ],
        datasets: [
          {
            label: "active power - b",
            data: [2000, 5000, 3000, 7000, 4000, 10000],
            fill: true, // Fill area under line
            backgroundColor: "rgba(100, 93, 93, 0.6)", // Area fill color
            borderColor: "#c4c4c4", // Line color
            borderWidth: 2,
            tension: 0, // No curve, straight lines
            stepped: true, // Stepped lines to mimic area from 0
            pointRadius: 0, // Hide data points
          },
        ],
      };

      const options = {
        responsive: true,
        plugins: {
          legend: {
            display: false, // Hide legend
          },
          tooltip: {
            backgroundColor: "#433b3b",
            titleColor: "#c4c4c4",
            bodyColor: "#c4c4c4",
            callbacks: {
              label: function (tooltipItem) {
                return `Value: ${tooltipItem.formattedValue}`;
              },
              title: function (tooltipItems) {
                return `Date: ${tooltipItems[0].label}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "DATE ( DD/MM HH:MM )",
              color: "#c4c4c4",
            },
            ticks: {
              color: "#c4c4c4", // X-axis label color
            },
            grid: {
              color: "transparent", // Hide grid lines
            },
          },
          y: {
            title: {
              display: true,
              text: "VALUE",
              color: "#c4c4c4",
            },
            ticks: {
              color: "#c4c4c4", // Y-axis label color
              stepSize: 5000, // Increment in steps of 5000
              callback: function (value) {
                return value >= 1000 ? value / 1000 + "kW" : value + "kW";
              },
            },
            min: 0, // Start Y-axis from 0
            suggestedMax: 10000, // Ensure space for max value
            grid: {
              color: "transparent", // Hide grid lines
            },
          },
        },
      };

      chart.value = new Chart(ctx, {
        type: "line", // Line chart with area
        data: data,
        options: options,
      });
    });

    return {
      chart,
    };
  },
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
  background-color: #645d5d;
  padding: 10px;
}
</style>
