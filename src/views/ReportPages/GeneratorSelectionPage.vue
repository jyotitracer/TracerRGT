<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Generator</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <div class="content-card">
        <!-- Filter bar with search -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Generator..."
            :disabled="isLoading"
          ></ion-searchbar>
        </div>

        <!-- The list of generators -->
        <ion-list v-if="!isLoading && filteredGenerators.length > 0" class="generator-list">
          <ion-item
            v-for="generator in filteredGenerators"
            :key="generator.id"
            button
            lines="full"
            class="generator-item"
            @click="handleSelection(generator)"
          >
            <div class="gen-item-content">
              <span class="gen-name">{{ generator.name }}</span>
              <span v-if="generator.siteName" class="gen-sub">{{ generator.siteName }}</span>
            </div>
            <ion-icon
              v-if="String(selectedGeneratorId) === String(generator.id)"
              :icon="checkmarkCircle"
              class="selected-check-icon"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>
        
        <!-- Loading Spinner -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
        
        <!-- No Data message -->
        <div v-if="!isLoading && filteredGenerators.length === 0" class="status-container no-data-message">
          <p>No generators available</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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
  IonSpinner,
  IonIcon,
} from '@ionic/vue';
import { checkmarkCircle } from 'ionicons/icons';

interface Generator {
  id: string | number;
  name: string;
  siteName?: string;
  capacity?: string;
}

const router = useRouter();
const isLoading = ref(false);
const searchQuery = ref('');
const selectedGeneratorId = ref<string | number>('all');
const allGenerators = ref<Generator[]>([]);

const filteredGenerators = computed(() => {
  if (!searchQuery.value) {
    return allGenerators.value;
  }
  const query = searchQuery.value.toLowerCase();
  return allGenerators.value.filter(gen =>
    gen.name.toLowerCase().includes(query) || (gen.siteName && gen.siteName.toLowerCase().includes(query))
  );
});

const fetchGenerators = async () => {
  isLoading.value = true;

  // Read saved selection
  try {
    const saved = localStorage.getItem('selected_report_generator');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id !== undefined) {
        selectedGeneratorId.value = parsed.id;
      }
    }
  } catch (e) {}

  let siteArr: any[] = [];

  // Query real API
  try {
    const { getDashboardDetail } = await import('@/services/ApiService');
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      const apiArr = d.site_arr || d.arr_site || d.data?.site_arr;
      if (Array.isArray(apiArr) && apiArr.length > 0) {
        siteArr = apiArr;
      }
    }
  } catch (e) {
    console.warn('API error in GeneratorSelectionPage:', e);
  }

  // Fallback to cache
  if (siteArr.length === 0) {
    try {
      const cached = localStorage.getItem('dashboard_detail');
      if (cached) {
        const d = JSON.parse(cached);
        if (Array.isArray(d?.site_arr) && d.site_arr.length > 0) {
          siteArr = d.site_arr;
        }
      }
    } catch (e) {}
  }

  const list: Generator[] = [
    { id: 'all', name: 'All Generators', siteName: 'Fleet overview' }
  ];

  if (siteArr.length > 0) {
    siteArr.forEach((s: any) => {
      const sName = s.name || s.site_name || '';
      if (Array.isArray(s.gen_arr)) {
        s.gen_arr.forEach((g: any) => {
          const gId = g.id || g.gen_id;
          const gName = g.name || g.gen_name || `EG ${gId}`;
          const cap = g.capacity || g.model || '';
          list.push({
            id: gId,
            name: cap ? `${gName} (${cap})` : gName,
            siteName: sName,
            capacity: cap,
          });
        });
      }
    });
  } else {
    list.push(
      { id: '181', name: 'EG 181 (60 KVA)', siteName: 'Site 23 - Dubai Industrial' },
      { id: '86', name: 'EG 86 (500 KVA)', siteName: 'Site 23 - Dubai Industrial' },
      { id: '75', name: 'EG 75 (250 KVA)', siteName: 'Site 8 - PMVE Station' },
      { id: '105', name: 'EG 105 (150 KVA)', siteName: 'Site 8 - PMVE Station' },
      { id: '197', name: 'EG 197 (200 KVA)', siteName: 'Site 9 - J#327 Plant' },
      { id: '262', name: 'EG 262 (20 KVA)', siteName: 'Site 9 - J#327 Plant' },
    );
  }

  allGenerators.value = list;
  isLoading.value = false;
};

const handleSelection = (generator: Generator) => {
  selectedGeneratorId.value = generator.id;
  try {
    localStorage.setItem('selected_report_generator', JSON.stringify(generator));
  } catch (e) {
    console.error('Failed to save selected generator:', e);
  }
  router.back();
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchGenerators();
});
</script>

<style scoped>
.page-background {
  --background: #3c3a37;
  color: #ffffff;
}

.custom-toolbar {
  --background: #32302e;
  --color: #fdcf9f;
  font-weight: 600;
}

.content-card {
  padding: 12px;
}

.filter-bar {
  background-color: #2b2826;
  border-radius: 8px;
  padding: 4px 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.custom-searchbar {
  --background: transparent;
  --color: #ffffff;
  --placeholder-color: #a8a095;
  --icon-color: #fdcf9f;
  --clear-button-color: #fdcf9f;
  padding: 0;
}

.generator-list {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.generator-item {
  --background: #343230;
  --color: #ffffff;
  --border-color: rgba(255, 255, 255, 0.08);
  --padding-start: 14px;
  --inner-padding-end: 14px;
}

.gen-item-content {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
}

.gen-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.gen-sub {
  font-size: 12px;
  color: #c4b9a9;
  margin-top: 2px;
}

.selected-check-icon {
  font-size: 22px;
  color: #2dd36f;
}

.status-container {
  display: flex;
  justify-content: center;
  padding: 40px 10px;
}

.no-data-message p {
  color: #a8a095;
  font-size: 15px;
}
</style>