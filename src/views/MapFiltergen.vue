<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab4"></ion-back-button>
        </ion-buttons>
        <ion-title>Filter Generator</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <div class="content-card">
        <!-- Search Bar -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Generator..."
          ></ion-searchbar>
        </div>

        <!-- Generator List -->
        <ion-list class="generator-list">
          <ion-item
            v-for="gen in filteredGenerators"
            :key="gen.id"
            button
            lines="full"
            @click="selectGenerator(gen)"
          >
            <ion-label>
              <h2>{{ gen.name }}</h2>
              <p style="color: #c4c4c4; font-size: 13px;">{{ gen.capacity || 'Generator' }} • {{ gen.status || 'Active' }}</p>
            </ion-label>
            <ion-icon
              v-if="selectedId === gen.id"
              :icon="checkmarkCircle"
              style="color: var(--ion-color-primary, #f59c20);"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>
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
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/vue';
import { checkmarkCircle } from 'ionicons/icons';
import router from '@/router/index';

const searchQuery = ref('');
const selectedId = ref<any>(null);

const generatorList = ref([
  { id: 181, name: 'EG 181 (60 KVA)', capacity: '60 KVA', status: 'Running', lat: 23.0225, lon: 72.5714, sts_colr: '#68c521' },
  { id: 86, name: 'EG 86 (500 KVA)', capacity: '500 KVA', status: 'Running', lat: 23.0330, lon: 72.5850, sts_colr: '#68c521' },
  { id: 75, name: 'EG 75 (250 KVA)', capacity: '250 KVA', status: 'Idle', lat: 23.0450, lon: 72.5600, sts_colr: '#f59c20' },
  { id: 145, name: 'EG 145 (250 KVA)', capacity: '250 KVA', status: 'Offline', lat: 23.0150, lon: 72.5900, sts_colr: '#999999' },
  { id: 113, name: 'EG 113 (150 KVA)', capacity: '150 KVA', status: 'Running', lat: 23.0500, lon: 72.5400, sts_colr: '#68c521' },
]);

const filteredGenerators = computed(() => {
  if (!searchQuery.value) return generatorList.value;
  return generatorList.value.filter(g =>
    g.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

onMounted(() => {
  const current = localStorage.getItem('selectedVeh');
  if (current) {
    try {
      const parsed = JSON.parse(current);
      selectedId.value = parsed.id;
    } catch (e) {
      // ignore
    }
  }
});

const selectGenerator = (gen: any) => {
  selectedId.value = gen.id;
  localStorage.setItem('selectedVeh', JSON.stringify({
    id: gen.id,
    name: gen.name,
    lat: gen.lat,
    lon: gen.lon,
    sts_colr: gen.sts_colr,
    sts_name: gen.status,
    capacity: gen.capacity,
  }));
  router.back();
};
</script>

<style scoped>
.page-background {
  --background: #4e4c49;
}

.custom-toolbar {
  --background: #3c3a37;
  --color: #d1ccc1;
}

.content-card {
  padding: 12px;
}

.filter-bar {
  margin-bottom: 8px;
}

.custom-searchbar {
  --background: var(--ion-color-greyishBrown, #433b3b);
  --color: #fff;
  --placeholder-color: #c4c4c4;
  --icon-color: var(--ion-color-primary, #f59c20);
  border-radius: 8px;
}

.generator-list {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
}

ion-item {
  --background: var(--ion-color-brownishGrey, #645d5d);
  --color: #fff;
  --border-color: rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
  border-radius: 6px;
}
</style>