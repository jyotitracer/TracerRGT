<template>
  <ion-page>
    
    <ion-tabs style="background-color: var( --ion-color-greyishBrown);">

      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" style="background-color: black;">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="speedometer" />
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="notifications" />
          <ion-label>
            Notification
          </ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon aria-hidden="true" :icon="barChart" />
          <ion-label>Reports</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab4" href="/tabs/tab4">
          <ion-icon aria-hidden="true" :icon="map" />
          <ion-label>Map</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab5" href="/tabs/tab5">
          <ion-icon aria-hidden="true" :icon="cog" />
          <ion-label>Gen On/Off</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { speedometer, notifications, barChart,map,cog } from 'ionicons/icons';

</script>


<style>
ion-tab-bar {
  --color: var(--ion-color-greyishBrown); /* Default color for label and icon */
  --color-selected: #fdcf9f; /* Color for label and icon when active/selected */
  background-color: black;
}

ion-tab-button {
  --color: #c4c4c4; /* Default color for icon and label */
  --color-selected: #fdcf9f; /* Active color for icon and label */
}

/* Hover and focused state */
ion-tab-button:hover,
ion-tab-button:focus {
  --color: #f0a500; /* Custom color when hovered or focused */
}

</style>
