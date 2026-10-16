<template>
  <ion-page id="main-content">
    <ion-header style="background-color: var( --ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TracerRGT</ion-title>
      <ion-buttons  slot="primary">
        <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="helpCircle" @click="goToHelpScreen"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="shareSocial" @click="goToSharePage"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="personCircle" @click="goToProfilePage"></ion-icon>
        </div>

    </ion-buttons>
   
  </ion-toolbar>

    </ion-header>
    <ion-content>
      <div class="example-content">
        <div class="box" @click="navigateTo('/history_log')">
          <ion-icon :icon="barChart" /> <!-- First icon -->
          <p class="p_class">History Log</p>
        </div>
        <div class="box" @click="navigateTo('/event')">
          <ion-icon :icon="notifications" /> <!-- Second icon -->
          <p class="p_class">Event</p>
        </div>
        <div class="box" @click="navigateTo('/fuel')">
          <ion-icon :icon="funnel" /> <!-- Third icon -->
          <p class="p_class">Fuel</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton,IonButtons,IonIcon } from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { helpCircle, personCircle, shareSocial, } from 'ionicons/icons';
import router from '@/router/index'; // Assuming your router file is named router.js
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { notifications, barChart, funnel } from 'ionicons/icons';


const goToHelpScreen = () => {
  router.push('/helpscreen/3');
};

const goToSharePage = async () => {
  try {
        const ionPageElement = document.getElementById("main-content");
        if (!ionPageElement) {
          console.error("Main content area not found.");
          return;
        }

        const canvas = await html2canvas(ionPageElement);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const fileName = `screenshot_${new Date().getTime()}.jpg`;

        await Filesystem.writeFile({
          path: fileName,
          data: dataUrl.split(',')[1],
          directory: Directory.Cache,
        });

        const uri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Check this out!',
          text: 'Sharing a screenshot',
          url: uri.uri,
          dialogTitle: 'Share Screenshot',
        });
      } catch (error) {
        console.error('Error capturing and sharing screenshot', error);
      }

};

const goToProfilePage = () => {
  router.push('/profile');
};

const  navigateTo=(route: string) =>{
      router.push(route);
    };


</script>


<style scoped>
.custom_icon{
  margin-right: 10px;
}

ion-icon{
    height: 30px;
    width: 30px;
    color: #fdcf9f; /* Custom color for the icon */
  }


  .example-content {
  display: flex;
  justify-content: center;
  height: 100%;
  gap: 20px; /* Space between boxes */
  margin-top: 30px;
}

.box {
  display: flex;
  background-color:var(--ion-color-brownishGrey);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px; /* Set a fixed width for each box */
  height: 80px; /* Set a fixed height for each box */
  border: 1px solid var(--ion-color-paleSalmon); /* Optional: Add a border */
  border-radius: 2px; /* Optional: Add rounded corners */
  padding: 8px; /* Optional: Add some padding */
  color: var(--ion-color-paleSalmon);
  cursor: pointer;
}

.p_class{
  font-size: 14px; /* Adjust icon size */
  margin: 5px 2px;

}
</style>