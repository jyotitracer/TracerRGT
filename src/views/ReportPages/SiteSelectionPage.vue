<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Sites</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="applyAndGoBack" class="done-btn">Done</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="content-card">
        <!-- Filter bar with search and the "All" toggle -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Sites..."
          ></ion-searchbar>
          <div class="all-toggle-wrap">
            <span class="all-label">ALL</span>
            <ion-toggle
              :checked="areAllSitesSelected"
              @ionChange="handleToggleAll($event)"
              mode="ios"
              class="header-toggle"
            ></ion-toggle>
          </div>
        </div>

        <!-- The list of sites -->
        <ion-list v-if="!isLoading && filteredSites.length > 0" class="site-list">
          <ion-item v-for="site in filteredSites" :key="site.id" lines="full" class="site-item">
            <ion-label class="site-label">{{ site.name }}</ion-label>
            <ion-toggle
              slot="end"
              :checked="site.isSelected"
              @ionChange="handleToggleSite(site, $event)"
              mode="ios"
              class="item-toggle"
            ></ion-toggle>
          </ion-item>
        </ion-list>

        <!-- Loading spinner -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- No Data message -->
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
  IonButton,
  IonSearchbar,
  IonToggle,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';

interface Site {
  id: number | string;
  name: string;
  isSelected: boolean;
}

const router = useRouter();
const isLoading = ref(false);
const searchQuery = ref('');
const allSites = ref<Site[]>([]);

const filteredSites = computed(() => {
  if (!searchQuery.value) {
    return allSites.value;
  }
  return allSites.value.filter(site =>
    site.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const areAllSitesSelected = computed(() => {
  if (filteredSites.value.length === 0) return false;
  return filteredSites.value.every(site => site.isSelected);
});

const saveSelectedSites = () => {
  const selected = allSites.value.filter(s => s.isSelected);
  try {
    localStorage.setItem('selected_report_sites', JSON.stringify(selected));
  } catch (e) {
    console.error('Failed to save selected sites:', e);
  }
};

const handleToggleAll = (event: CustomEvent) => {
  const checked = Boolean(event.detail.checked);
  filteredSites.value.forEach(site => {
    site.isSelected = checked;
  });
  saveSelectedSites();
};

const handleToggleSite = (site: Site, event: CustomEvent) => {
  site.isSelected = Boolean(event.detail.checked);
  saveSelectedSites();
};

const fetchSites = async () => {
  isLoading.value = true;
  let siteList: any[] = [];

  // Check saved selections
  let savedIds: (string | number)[] | null = null;
  try {
    const saved = localStorage.getItem('selected_report_sites');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        savedIds = parsed.map((s: any) => s.id);
      }
    }
  } catch (e) {}

  // Fetch real sites from dashboard API
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
    console.warn('API error in SiteSelectionPage:', e);
  }

  // Fallback to cached dashboard detail
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

  // Default fallback sites if needed
  if (siteList.length === 0) {
    siteList = [
      { id: 23, name: 'Site 23 - Dubai Industrial' },
      { id: 8, name: 'Site 8 - PMVE Station' },
      { id: 9, name: 'Site 9 - J#327 Plant' },
    ];
  }

  allSites.value = siteList.map((s: any) => {
    const id = s.id || s.site_id;
    const name = s.name || s.site_name || `Site ${id}`;
    const isSelected = savedIds !== null ? savedIds.includes(id) : true;
    return { id, name, isSelected };
  });

  saveSelectedSites();
  isLoading.value = false;
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchSites();
  (event.target as HTMLIonRefresherElement).complete();
};

const applyAndGoBack = () => {
  saveSelectedSites();
  router.back();
};

const goBack = () => {
  saveSelectedSites();
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

.done-btn {
  --color: #f59c20;
  font-weight: 700;
  font-size: 14px;
}

.content-card {
  padding: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  flex: 1;
}

.all-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.all-label {
  font-size: 13px;
  font-weight: 700;
  color: #fdcf9f;
  letter-spacing: 0.5px;
}

.header-toggle {
  --track-background: #484542;
  --track-background-checked: #f59c20;
  --handle-background-checked: #ffffff;
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

.site-label {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
}

.item-toggle {
  --track-background: #484542;
  --track-background-checked: #2dd36f;
  --handle-background-checked: #ffffff;
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