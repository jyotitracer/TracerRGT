<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab4"></ion-back-button>
        </ion-buttons>
        <ion-title>Filter Generator</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="resetFilters" class="header-action-btn">Reset</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-background">
      <div class="content-wrapper">

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- SECTION 1: GENERATOR STATUS LIST -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div class="filter-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-badge">1</span>
              <h3 class="section-title">Generator Status</h3>
            </div>
            <div class="all-toggle-wrap">
              <span class="all-toggle-label">ALL</span>
              <ion-toggle
                :checked="allStatusesSelected"
                @ionChange="handleToggleAllStatuses($event)"
                mode="ios"
                class="header-toggle"
              ></ion-toggle>
            </div>
          </div>

          <!-- Status List with Toggle Buttons (No dots, No checkboxes) -->
          <ion-list class="filter-list" lines="full">
            <ion-item
              v-for="status in statusList"
              :key="status.name"
              class="filter-list-item"
              lines="full"
            >
              <ion-label class="item-label">
                <span class="status-name">{{ status.name }}</span>
                <span class="status-count" v-if="statusCounts[status.name] !== undefined">
                  ({{ statusCounts[status.name] }})
                </span>
              </ion-label>
              <ion-toggle
                slot="end"
                :checked="isStatusSelected(status.name)"
                @ionChange="handleToggleStatus(status.name, $event)"
                mode="ios"
                class="custom-toggle"
              ></ion-toggle>
            </ion-item>
          </ion-list>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- SECTION 2: ALL SITES LIST (from Dashboard Detail) -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div class="filter-section">
          <div class="section-header">
            <div class="section-title-wrap">
              <span class="section-badge">2</span>
              <h3 class="section-title">Sites</h3>
              <span class="site-total-badge" v-if="allSites.length > 0">({{ allSites.length }})</span>
            </div>
            <div class="all-toggle-wrap">
              <span class="all-toggle-label">ALL</span>
              <ion-toggle
                :checked="allSitesSelected"
                @ionChange="handleToggleAllSites($event)"
                mode="ios"
                class="header-toggle"
              ></ion-toggle>
            </div>
          </div>

          <!-- Site Search Bar -->
          <div class="site-search-wrap" v-if="allSites.length > 4">
            <ion-searchbar
              class="custom-searchbar"
              v-model="siteSearchQuery"
              placeholder="Search site..."
              :debounce="150"
            ></ion-searchbar>
          </div>

          <!-- Loading Spinner -->
          <div v-if="isLoading" class="loading-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <span class="loading-text">Loading sites...</span>
          </div>

          <!-- Empty Sites State -->
          <div v-else-if="filteredSites.length === 0" class="empty-state">
            <span>{{ siteSearchQuery ? 'No sites match search' : 'No sites available' }}</span>
          </div>

          <!-- Sites List with Toggle Buttons -->
          <ion-list v-else class="filter-list" lines="full">
            <ion-item
              v-for="site in filteredSites"
              :key="site.id"
              class="filter-list-item"
              lines="full"
            >
              <ion-label class="item-label">
                <span class="site-name">{{ site.name }}</span>
                <span class="site-gen-count" v-if="site.genCount !== undefined">
                  {{ site.genCount }} {{ site.genCount === 1 ? 'Generator' : 'Generators' }}
                </span>
              </ion-label>
              <ion-toggle
                slot="end"
                :checked="isSiteSelected(site.id)"
                @ionChange="handleToggleSite(site.id, $event)"
                mode="ios"
                class="custom-toggle"
              ></ion-toggle>
            </ion-item>
          </ion-list>
        </div>

        <!-- Matching Generators Summary Banner -->
        <div class="match-summary-card">
          <div class="match-info">
            <ion-icon :icon="funnelOutline" class="funnel-icon"></ion-icon>
            <span class="match-label">Generators matching filter:</span>
          </div>
          <span class="match-count">{{ matchingGeneratorsCount }} of {{ totalGeneratorsCount }}</span>
        </div>

      </div>
    </ion-content>

    <!-- Bottom Action Bar -->
    <ion-footer class="custom-footer">
      <div class="footer-btn-container">
        <ion-button expand="block" class="apply-filter-btn" @click="applyFilter">
          <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
          Apply Filter ({{ matchingGeneratorsCount }})
        </ion-button>
      </div>
    </ion-footer>
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
  IonFooter,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
} from '@ionic/vue';
import {
  checkmarkDoneOutline,
  funnelOutline,
} from 'ionicons/icons';

const router = useRouter();

// ─── Status List Definition ─────────────────────────────────────────────
// 1. Generator On
// 2. Generator Off
// 3. Generator Under Service
// 4. Main On
// 5. Generator Offline
// 6. Generator not used
export interface StatusItem {
  name: string;
}

const statusList: StatusItem[] = [
  { name: 'Generator On' },
  { name: 'Generator Off' },
  { name: 'Generator Under Service' },
  { name: 'Main On' },
  { name: 'Generator Offline' },
  { name: 'Generator not used' },
];

export interface SiteItem {
  id: string | number;
  name: string;
  genCount?: number;
}

// ─── Reactive State ─────────────────────────────────────────────────────
const isLoading = ref(false);
const siteSearchQuery = ref('');
const allSites = ref<SiteItem[]>([]);
const allGenerators = ref<any[]>([]);

// Selected statuses & sites (multi-selection)
const selectedStatuses = ref<string[]>([]);
const selectedSiteIds = ref<(string | number)[]>([]);

// Counts matching each status
const statusCounts = ref<Record<string, number>>({});

// ─── Helper: Classify a Generator's Status ──────────────────────────────
const classifyGeneratorStatus = (gen: any): string => {
  if (!gen) return 'Generator Offline';

  // 1. Connection check: Offline
  if (gen.stsicon_conn === 0) {
    return 'Generator Offline';
  }

  const genSts = String(gen.gen_sts || gen.status || gen.sts_name || '').trim().toLowerCase();
  const durSts = String(gen.duration_sts || gen.sts || '').trim().toLowerCase();

  // 2. Generator not used
  if (genSts.includes('not used') || genSts.includes('unused') || gen.is_used === 0 || gen.is_used === false) {
    return 'Generator not used';
  }

  // 3. Main On
  if (gen.stsicon_type === 2 || genSts.includes('main')) {
    return 'Main On';
  }

  // 4. Generator Under Service
  if (gen.stsicon_gen === 4 || genSts.includes('service') || genSts.includes('under service')) {
    return 'Generator Under Service';
  }

  // 5. Generator On
  if (
    gen.stsicon_gen === 1 ||
    genSts === 'generator on' ||
    genSts === 'running' ||
    (durSts.includes('on for') && !durSts.includes('0 min'))
  ) {
    return 'Generator On';
  }

  // 6. Generator Off
  if (
    gen.stsicon_gen === 5 ||
    genSts === 'generator off' ||
    genSts === 'stopped' ||
    genSts.includes('off')
  ) {
    return 'Generator Off';
  }

  // Explicit offline string
  if (genSts.includes('offline') || genSts.includes('disconnected')) {
    return 'Generator Offline';
  }

  return 'Generator Off';
};

// ─── Computed Properties ────────────────────────────────────────────────
const filteredSites = computed(() => {
  if (!siteSearchQuery.value.trim()) {
    return allSites.value;
  }
  const q = siteSearchQuery.value.toLowerCase().trim();
  return allSites.value.filter((s) => s.name && s.name.toLowerCase().includes(q));
});

const allStatusesSelected = computed(() => {
  return statusList.length > 0 && selectedStatuses.value.length === statusList.length;
});

const allSitesSelected = computed(() => {
  return allSites.value.length > 0 && selectedSiteIds.value.length === allSites.value.length;
});

const totalGeneratorsCount = computed(() => allGenerators.value.length);

const matchingGeneratorsCount = computed(() => {
  if (allGenerators.value.length === 0) return 0;
  return allGenerators.value.filter((gen) => {
    const statusMatch = selectedStatuses.value.includes(gen.statusCategory);
    const siteMatch = selectedSiteIds.value.some((sid) => String(sid) === String(gen.siteId));
    return statusMatch && siteMatch;
  }).length;
});

// ─── Selection Handlers ─────────────────────────────────────────────────
const isStatusSelected = (name: string): boolean => {
  return selectedStatuses.value.includes(name);
};

const handleToggleStatus = (name: string, event: CustomEvent) => {
  const isChecked = event.detail.checked;
  const idx = selectedStatuses.value.indexOf(name);
  if (isChecked) {
    if (idx === -1) selectedStatuses.value.push(name);
  } else {
    if (idx >= 0) selectedStatuses.value.splice(idx, 1);
  }
};

const handleToggleAllStatuses = (event: CustomEvent) => {
  const isChecked = event.detail.checked;
  if (isChecked) {
    selectedStatuses.value = statusList.map((s) => s.name);
  } else {
    selectedStatuses.value = [];
  }
};

const isSiteSelected = (id: string | number): boolean => {
  return selectedSiteIds.value.some((sid) => String(sid) === String(id));
};

const handleToggleSite = (id: string | number, event: CustomEvent) => {
  const isChecked = event.detail.checked;
  const existingIdx = selectedSiteIds.value.findIndex((sid) => String(sid) === String(id));
  if (isChecked) {
    if (existingIdx === -1) selectedSiteIds.value.push(id);
  } else {
    if (existingIdx >= 0) selectedSiteIds.value.splice(existingIdx, 1);
  }
};

const handleToggleAllSites = (event: CustomEvent) => {
  const isChecked = event.detail.checked;
  if (isChecked) {
    selectedSiteIds.value = allSites.value.map((s) => s.id);
  } else {
    selectedSiteIds.value = [];
  }
};

// ─── Reset / Apply ──────────────────────────────────────────────────────
const resetFilters = () => {
  selectedStatuses.value = statusList.map((s) => s.name);
  selectedSiteIds.value = allSites.value.map((s) => s.id);
};

const applyFilter = () => {
  const filterData = {
    selectedStatuses: selectedStatuses.value,
    selectedSiteIds: selectedSiteIds.value,
    isFilterActive:
      selectedStatuses.value.length !== statusList.length ||
      selectedSiteIds.value.length !== allSites.value.length,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem('map_filter_settings', JSON.stringify(filterData));
  } catch (e) {
    console.error('Failed to save map_filter_settings:', e);
  }

  // Navigate back to map page (tab4)
  router.back();
};

// ─── Data Initialization ────────────────────────────────────────────────
const loadDashboardDetails = async () => {
  isLoading.value = true;
  let parsedData: any = null;

  // 1. First attempt to read from localStorage cache
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      parsedData = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Could not read cached dashboard_detail in MapFiltergen:', e);
  }

  // 2. Fallback to API if cache was missing
  if (!parsedData || !Array.isArray(parsedData.site_arr) || parsedData.site_arr.length === 0) {
    try {
      const { getDashboardDetail } = await import('@/services/ApiService');
      const res = await getDashboardDetail();
      if (res && res.status === 200 && res.data) {
        parsedData = res.data;
        try {
          localStorage.setItem('dashboard_detail', JSON.stringify(res.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('API error fetching dashboard detail in MapFiltergen:', err);
    }
  }

  // 3. Process sites and generators
  const sites: SiteItem[] = [];
  const gens: any[] = [];
  const counts: Record<string, number> = {
    'Generator On': 0,
    'Generator Off': 0,
    'Generator Under Service': 0,
    'Main On': 0,
    'Generator Offline': 0,
    'Generator not used': 0,
  };

  if (parsedData && Array.isArray(parsedData.site_arr)) {
    parsedData.site_arr.forEach((s: any) => {
      const siteId = s.id || s.site_id;
      const siteName = s.name || s.site_name || `Site ${siteId}`;
      const genArr = Array.isArray(s.gen_arr) ? s.gen_arr : [];

      sites.push({
        id: siteId,
        name: siteName,
        genCount: genArr.length,
      });

      genArr.forEach((g: any, idx: number) => {
        const cat = classifyGeneratorStatus(g);
        if (counts[cat] !== undefined) {
          counts[cat]++;
        } else {
          counts[cat] = 1;
        }

        gens.push({
          id: g.id || g.gen_id || `${siteId}_${idx}`,
          name: g.name || `Generator ${g.id || idx + 1}`,
          siteId: siteId,
          siteName: siteName,
          statusCategory: cat,
          raw: g,
        });
      });
    });
  }

  allSites.value = sites;
  allGenerators.value = gens;
  statusCounts.value = counts;

  // 4. Restore saved filter state or default to ALL
  const savedSettingsStr = localStorage.getItem('map_filter_settings');
  if (savedSettingsStr) {
    try {
      const saved = JSON.parse(savedSettingsStr);
      if (Array.isArray(saved.selectedStatuses)) {
        selectedStatuses.value = saved.selectedStatuses;
      } else {
        selectedStatuses.value = statusList.map((s) => s.name);
      }

      if (Array.isArray(saved.selectedSiteIds) && saved.selectedSiteIds.length > 0) {
        selectedSiteIds.value = saved.selectedSiteIds;
      } else {
        selectedSiteIds.value = sites.map((s) => s.id);
      }
    } catch (e) {
      resetFilters();
    }
  } else {
    resetFilters();
  }

  isLoading.value = false;
};

onMounted(() => {
  loadDashboardDetails();
});
</script>

<style scoped>
.page-background {
  --background: #33312e;
}

.custom-toolbar {
  --background: #3c3a37;
  --color: #d1ccc1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-action-btn {
  --color: var(--ion-color-paleSalmon, #fdcf9f);
  font-size: 14px;
  font-weight: 600;
  text-transform: none;
}

.content-wrapper {
  padding: 14px 14px 24px 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── SECTION STYLING ─── */
.filter-section {
  background: var(--ion-color-greyishBrown, #3d3735);
  border-radius: 14px;
  padding: 14px 14px 6px 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(253, 207, 159, 0.18);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--ion-color-paleSalmon, #fdcf9f);
  color: #2b2b2b;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.3px;
}

.site-total-badge {
  font-size: 13px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  font-weight: 600;
}

.all-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.all-toggle-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  letter-spacing: 0.5px;
}

.header-toggle {
  --handle-background-checked: #2b2b2b;
  --background-checked: var(--ion-color-paleSalmon, #fdcf9f);
  transform: scale(0.85);
}

/* ─── FILTER LIST WITH TOGGLE SWITCHES ─── */
.filter-list {
  background: transparent;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.filter-list-item {
  --background: transparent;
  --color: #ffffff;
  --border-color: rgba(255, 255, 255, 0.08);
  --padding-start: 4px;
  --padding-end: 4px;
  --inner-padding-end: 4px;
  min-height: 48px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
}

.status-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
}

.status-count {
  font-size: 12px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  font-weight: 600;
}

.site-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
  display: block;
}

.site-gen-count {
  font-size: 11px;
  color: #a0998e;
  margin-top: 2px;
  display: block;
}

.custom-toggle {
  --background: rgba(255, 255, 255, 0.2);
  --background-checked: var(--ion-color-paleSalmon, #fdcf9f);
  --handle-background: #ffffff;
  --handle-background-checked: #2b2b2b;
  transform: scale(0.9);
}

/* ─── SITE SEARCH ─── */
.site-search-wrap {
  margin-bottom: 6px;
}

.custom-searchbar {
  --background: rgba(0, 0, 0, 0.25);
  --color: #fff;
  --placeholder-color: #a0998e;
  --icon-color: var(--ion-color-paleSalmon, #fdcf9f);
  --clear-button-color: #a0998e;
  border-radius: 10px;
  padding: 0;
  height: 40px;
}

/* ─── LOADING & EMPTY ─── */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
}

.loading-text {
  font-size: 13px;
  color: #a0998e;
}

.empty-state {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #a0998e;
}

/* ─── MATCH SUMMARY CARD ─── */
.match-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.28);
  border: 1px dashed rgba(253, 207, 159, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.funnel-icon {
  font-size: 18px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
}

.match-label {
  font-size: 13px;
  color: #c4c4c4;
}

.match-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  font-family: 'Rajdhani', sans-serif;
}

/* ─── FOOTER ─── */
.custom-footer {
  --background: #3c3a37;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-btn-container {
  padding: 10px 14px;
}

.apply-filter-btn {
  --background: var(--ion-color-paleSalmon, #fdcf9f);
  --color: #2b2b2b;
  --border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.5px;
  height: 46px;
  margin: 0;
}
</style>