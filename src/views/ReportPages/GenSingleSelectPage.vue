<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/history_log" @click="goBack"></ion-back-button>
        </ion-buttons>
        <ion-title>Select Generator</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <div class="content-card">
        <!-- Search bar -->
        <div class="filter-bar">
          <ion-searchbar
            class="custom-searchbar"
            v-model="searchQuery"
            placeholder="Search Generator..."
            :disabled="isLoading"
          ></ion-searchbar>
        </div>

        <!-- Generator list — tap to select a single generator -->
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

        <!-- Loading -->
        <div v-if="isLoading" class="status-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- No data -->
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
const selectedGeneratorId = ref<string | number>('');
const allGenerators = ref<Generator[]>([]);

// Filter by the currently selected history site (single site mode)
const selectedSiteId = ref<string | number>('');

const filteredGenerators = computed(() => {
  let list = allGenerators.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.siteName && g.siteName.toLowerCase().includes(q))
    );
  }
  return list;
});

const fetchGenerators = async () => {
  isLoading.value = true;

  // Read saved selection
  try {
    const saved = localStorage.getItem('selected_history_generator');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.id !== undefined) selectedGeneratorId.value = parsed.id;
    }
  } catch (e) {}

  // Read the single selected site to filter generators
  try {
    const savedSite = localStorage.getItem('selected_history_site');
    if (savedSite) {
      const parsed = JSON.parse(savedSite);
      if (parsed?.id !== undefined) selectedSiteId.value = parsed.id;
    }
  } catch (e) {}

  let siteArr: any[] = [];

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
    console.warn('API error in GenSingleSelectPage:', e);
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

  const list: Generator[] = [];
  siteArr.forEach((s: any) => {
    const siteId = s.id || s.site_id;
    const sName = s.name || s.site_name || '';

    // Filter by selected site if one is chosen
    if (selectedSiteId.value && String(siteId) !== String(selectedSiteId.value)) return;

    if (Array.isArray(s.gen_arr)) {
      s.gen_arr.forEach((g: any) => {
        const gId = g.id || g.gen_id;
        const gName = g.name || g.gen_name || `Generator ${gId}`;
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

  allGenerators.value = list;

  // Auto-select first generator if nothing selected
  if (!selectedGeneratorId.value && list.length > 0) {
    const first = list[0];
    selectedGeneratorId.value = first.id;
    try { localStorage.setItem('selected_history_generator', JSON.stringify(first)); } catch (e) {}
  }

  isLoading.value = false;
};

const handleSelection = (generator: Generator) => {
  selectedGeneratorId.value = generator.id;
  try {
    localStorage.setItem('selected_history_generator', JSON.stringify(generator));
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
