<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/history_log" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Site</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <div class="content-card">
        <!-- Search bar -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Sites..."
            :disabled="isLoading"
          ></ion-searchbar>
        </div>

        <!-- Site list — tap to select single site -->
        <ion-list v-if="!isLoading && filteredSites.length > 0" class="site-list">
          <ion-item
            v-for="site in filteredSites"
            :key="site.id"
            button
            lines="full"
            class="site-item"
            @click="handleSelection(site)"
          >
            <ion-label class="site-label">{{ site.name }}</ion-label>
            <ion-icon
              v-if="String(selectedSiteId) === String(site.id)"
              :icon="checkmarkCircle"
              class="selected-check-icon"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>

        <!-- Loading -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- No data -->
        <div v-if="!isLoading && filteredSites.length === 0" class="status-container no-data-message">
          <p>No sites available</p>
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
  IonLabel,
  IonSpinner,
  IonIcon,
} from '@ionic/vue';
import { checkmarkCircle } from 'ionicons/icons';

interface Site {
  id: number | string;
  name: string;
}

const router = useRouter();
const isLoading = ref(false);
const searchQuery = ref('');
const selectedSiteId = ref<string | number>('');
const allSites = ref<Site[]>([]);

const filteredSites = computed(() => {
  if (!searchQuery.value) return allSites.value;
  return allSites.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const fetchSites = async () => {
  isLoading.value = true;

  // Read saved single-site selection
  try {
    const saved = localStorage.getItem('selected_history_site');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.id !== undefined) selectedSiteId.value = parsed.id;
    }
  } catch (e) {}

  let siteList: any[] = [];

  try {
    const { getDashboardDetail } = await import('@/services/ApiService');
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      const apiArr = d.site_arr || d.arr_site || d.data?.site_arr;
      if (Array.isArray(apiArr) && apiArr.length > 0) {
        siteList = apiArr;
      }
    }
  } catch (e) {
    console.warn('API error in SiteSingleSelectPage:', e);
  }

  // Fallback to cache
  if (siteList.length === 0) {
    try {
      const cached = localStorage.getItem('dashboard_detail');
      if (cached) {
        const d = JSON.parse(cached);
        const cachedArr = d?.site_arr;
        if (Array.isArray(cachedArr) && cachedArr.length > 0) {
          siteList = cachedArr;
        }
      }
    } catch (e) {}
  }

  allSites.value = siteList.map((s: any) => ({
    id: s.id || s.site_id,
    name: s.name || s.site_name || `Site ${s.id || s.site_id}`,
  }));

  // Auto-select first site if nothing is selected
  if (!selectedSiteId.value && allSites.value.length > 0) {
    const first = allSites.value[0];
    selectedSiteId.value = first.id;
    try { localStorage.setItem('selected_history_site', JSON.stringify(first)); } catch (e) {}
  }

  isLoading.value = false;
};

const handleSelection = (site: Site) => {
  selectedSiteId.value = site.id;
  try {
    localStorage.setItem('selected_history_site', JSON.stringify(site));
  } catch (e) {
    console.error('Failed to save selected site:', e);
  }
  router.back();
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchSites();
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

.site-list {
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.site-item {
  --background: #343230;
  --color: #ffffff;
  --border-color: rgba(255, 255, 255, 0.08);
  --padding-start: 14px;
  --inner-padding-end: 14px;
}

.site-item:active {
  --background: #3e3b38;
}

.site-label {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
}

.selected-check-icon {
  font-size: 18px;
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
