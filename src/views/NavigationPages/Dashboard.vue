<template>
  <ion-page id="main-content">
    <!-- Block 1: Header (No changes) -->
    <ion-header style="background-color: var( --ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TRACERRGT</ion-title>

      

        <ion-buttons slot="end">
          <div class="custom_icon" @click="goToHelpScreen">
            <ion-icon :icon="helpCircleOutline" slot="icon-only"></ion-icon>
          </div>


       <div class="custom_icon" @click="goToSharePage">
            <ion-icon :icon="shareSocial" slot="icon-only"></ion-icon>
          </div>

          <div class="custom_icon" @click="goToProfilePage">
            <ion-icon :icon="personCircleOutline" slot="icon-only"></ion-icon>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Page Content -->
    <ion-content>
      <div class="main-content">

        <!-- ═══════════════════════════════════════════ -->
        <!-- SECTION 1: Site List (always visible)       -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="section-block">
          <div class="section-header">
            <span class="section-label">Sites</span>
            <span class="section-sub" v-if="selectedSite">{{ selectedSite.name }} selected</span>
          </div>
          <div class="horizontal-scroll-container">
            <ion-icon
              class="back_arrow"
              :class="{ 'visible': isSiteScrolled }"
              :icon="chevronBackOutline"
              @click="scrollBackward(siteScrollContainer)">
            </ion-icon>
            <div class="horizontal-scroll" ref="siteScrollContainer" @scroll="handleSiteScroll">
              <div
                class="site-card"
                v-for="site in siteData"
                :key="site.id"
                :class="{ 'site-card-active': selectedSite?.id === site.id }"
                @click="selectSite(site)"
              >
                <div class="site-card-name">{{ site.name }}</div>
                <div class="site-card-count">{{ site.genCount }} Generators</div>
                <ion-progress-bar class="site-progress" :value="site.progress" :color="site.color"></ion-progress-bar>
              </div>
            </div>
            <ion-icon
              class="forword_arrow"
              :icon="chevronForwardOutline"
              @click="scrollHorizontally(siteScrollContainer)">
            </ion-icon>
          </div>
          <div class="tap-hint" v-if="!selectedSite">
            <ion-icon :icon="chevronForwardOutline" style="vertical-align:middle"></ion-icon>
            Tap a site to view its generators
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- SECTION 2: Generator List (shown after site click) -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="section-block" v-if="selectedSite">
          <div class="section-header">
            <span class="section-label">Generators — {{ selectedSite.name }}</span>
            <span class="section-sub">{{ generatorStatusSummary }}</span>
          </div>
          <div class="horizontal-scroll-container">
            <ion-icon
              class="back_arrow"
              :class="{ 'visible': isGeneratorScrolled }"
              :icon="chevronBackOutline"
              @click="scrollBackward(generatorScrollContainer)">
            </ion-icon>
            <div class="horizontal-scroll" ref="generatorScrollContainer" @scroll="handleGeneratorScroll">
              <div
                class="generator-item"
                v-for="gen in generatorData"
                :key="gen.id"
                :class="{ active: gen.isActive }"
                @click="selectGenerator(gen)"
              >
                <ion-icon :icon="gen.icon" :color="gen.isActive ? 'primary' : 'secondary'"></ion-icon>
                <div class="gen-details">
                  <strong>{{ gen.name }}</strong>
                  <span :class="statusClass(gen.status)">{{ gen.status }}</span>
                </div>
              </div>
            </div>
            <ion-icon
              class="forword_arrow"
              :icon="chevronForwardOutline"
              @click="scrollHorizontally(generatorScrollContainer)">
            </ion-icon>
          </div>
          <div class="tap-hint" v-if="!selectedGenerator">
            <ion-icon :icon="chevronForwardOutline" style="vertical-align:middle"></ion-icon>
            Tap a generator to view its details
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- SECTION 3: Generator Details (shown after generator click)    -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="section-block details-section" v-if="selectedGenerator">
          <!-- Info Card -->
          <ion-card class="info-card">
            <ion-card-content class="info_card_content">
              <p class="heading_class">{{ selectedGenerator.name }}</p>
              <p class="descri1_class">{{ selectedGenerator.capacity || '—' }}</p>
              <p class="descri2_class">{{ selectedGenerator.desc || selectedGenerator.capacity || '—' }}</p>
              <div class="status-line">
                <p><ion-icon :icon="locationOutline"></ion-icon> {{ selectedGenerator.location || '—' }}</p>
                <div>
                  <div :class="selectedGenerator.status === 'Running' ? 'running-status' : 'offline-status'">{{ selectedGenerator.status }}</div>
                  <div class="last-updated">Last Updated - {{ selectedGenerator.lastUpdated || '—' }}</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Telemetry Area -->
          <ion-grid class="info_param_grid">
            <ion-row>
              <!-- Left Side Menu -->
              <ion-col size="3.5" class="info_paran_col">
                <ion-list class="menu-list">
                  <ion-button @click="selectCategory('power')" :fill="selectedCategory === 'power' ? 'solid' : 'outline'" color="primary" expand="block">
                    <ion-icon slot="start" :icon="flashOutline"></ion-icon>
                    Power
                  </ion-button>
                  <ion-button @click="selectCategory('energy')" :fill="selectedCategory === 'energy' ? 'solid' : 'outline'" color="primary" expand="block">
                    <ion-icon slot="start" :icon="sunnyOutline"></ion-icon>
                    Energy
                  </ion-button>
                  <ion-button @click="selectCategory('runHour')" :fill="selectedCategory === 'runHour' ? 'solid' : 'outline'" color="primary" expand="block">
                    <ion-icon slot="start" :icon="timeOutline"></ion-icon>
                    RunHour
                  </ion-button>
                  <ion-button @click="selectCategory('engine')" :fill="selectedCategory === 'engine' ? 'solid' : 'outline'" color="primary" expand="block">
                    <ion-icon slot="start" :icon="cogOutline"></ion-icon>
                    Engine
                  </ion-button>
                  <ion-button @click="selectCategory('vandi')" :fill="selectedCategory === 'vandi' ? 'solid' : 'outline'" color="primary" expand="block">
                    <ion-icon slot="start" :icon="analyticsOutline"></ion-icon>
                    V and I
                  </ion-button>
                </ion-list>
              </ion-col>

              <!-- Right Side Swiper Slides -->
               <ion-col size="8.5">
              <div class="slides-container">
                <!-- Power Swiper -->
                <swiper-container :key="selectedCategory" v-if="selectedCategory === 'power'" :slides-per-view="1" :pagination="{ clickable: true }">
                  <!-- Power Slide 1 (Full Page 2x2 Gauges) -->
                  <swiper-slide>
                    <div class="data-container power-total-container">
                      <div class="slide-title">Power - Total</div>
                      <div class="gauges-2x2-grid">
                        <!-- 1. kW Gauge -->
                        <div class="gauge-card">
                          <div class="gauge-wrapper">
                            <svg viewBox="0 0 100 58" class="gauge-svg">
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="7" stroke-linecap="round" />
                              <path d="M 12 50 A 38 38 0 0 1 54 12" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
                            </svg>
                            <div class="gauge-content">
                              <div class="gauge-value">{{ powerTotalData.kw }}</div>
                              <div class="gauge-unit">kW</div>
                            </div>
                          </div>
                        </div>

                        <!-- 2. kVA Gauge -->
                        <div class="gauge-card">
                          <div class="gauge-wrapper">
                            <svg viewBox="0 0 100 58" class="gauge-svg">
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="7" stroke-linecap="round" />
                              <path d="M 12 50 A 38 38 0 0 1 54 12" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
                            </svg>
                            <div class="gauge-content">
                              <div class="gauge-value">{{ powerTotalData.kva }}</div>
                              <div class="gauge-unit">kVA</div>
                            </div>
                          </div>
                        </div>

                        <!-- 3. kVAR Gauge -->
                        <div class="gauge-card">
                          <div class="gauge-wrapper">
                            <svg viewBox="0 0 100 58" class="gauge-svg">
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="7" stroke-linecap="round" />
                              <path d="M 12 50 A 38 38 0 0 1 54 12" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
                            </svg>
                            <div class="gauge-content">
                              <div class="gauge-value">{{ powerTotalData.kvar }}</div>
                              <div class="gauge-unit">kVAR</div>
                            </div>
                          </div>
                        </div>

                        <!-- 4. pf LAG Gauge -->
                        <div class="gauge-card">
                          <div class="gauge-wrapper">
                            <svg viewBox="0 0 100 58" class="gauge-svg">
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="7" stroke-linecap="round" />
                              <path d="M 12 50 A 38 38 0 0 1 54 12" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
                            </svg>
                            <div class="gauge-content">
                              <div class="gauge-value">{{ powerTotalData.pf }}</div>
                              <div class="gauge-unit">pf <span class="gauge-lag">{{ powerTotalData.pfLabel }}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </swiper-slide>
                  
                  <!-- NEW: Power Slide 2 (3-Phase) -->
                  <swiper-slide>
                    <div class="data-container">
                      <div class="slide-title">Power - 3Phase</div>
                      <ion-grid class="data-grid">
                        <ion-row>
                          <ion-col>
                            <div class="data-header">P1</div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">pf</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kW</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">KVA</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kVAR</span></div>
                          </ion-col>
                          <ion-col>
                            <div class="data-header">P2</div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">pf</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kW</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">KVA</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kVAR</span></div>
                          </ion-col>
                          <ion-col>
                            <div class="data-header">P3</div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">pf</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kW</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">KVA</span></div>
                            <div class="data-row"><span>0.0</span> <span class="data-unit">kVAR</span></div>
                          </ion-col>
                        </ion-row>
                      </ion-grid>
                    </div>
                  </swiper-slide>
                </swiper-container>

                <!-- Energy Swiper -->
                <swiper-container :key="selectedCategory" v-if="selectedCategory === 'energy'" :slides-per-view="1" :pagination="{ clickable: true }">
              <!-- Loop through each slide object in our data -->
              <swiper-slide v-for="slide in energySlidesData" :key="slide.id">
                <div class="data-container">
                  <div class="slide-title">{{ slide.title }}</div>

                  <!-- Use a <template> for the inner loop to correctly handle the divider -->
                  <template v-for="(item, index) in slide.items" :key="item.label">
                    <div class="energy-item">
                      <div class="energy-label">{{ item.label }}</div>
                      <!-- Conditionally apply the highlight class based on our data -->
                      <div class="energy-value" :class="{ 'highlight-value': item.isHighlighted }">
                        {{ item.value }}
                      </div>
                    </div>
                    <!-- Only show the divider if it's NOT the last item in the list -->
                    <hr v-if="index < slide.items.length - 1" class="divider"/>
                  </template>

                </div>
              </swiper-slide>
            </swiper-container>


                <!-- RunHour Swiper -->
                <swiper-container :key="selectedCategory" v-if="selectedCategory === 'runHour'" :slides-per-view="1" :pagination="{ clickable: true }">
              <swiper-slide v-for="slide in runHourSlidesData" :key="slide.id">
                <div class="data-container">
                  <div class="slide-title">{{ slide.title }}</div>
                  <!-- We can reuse the same layout and classes from the Energy slides -->
                  <template v-for="(item, index) in slide.items" :key="item.label">
                    <div class="energy-item">
                      <div class="energy-label">{{ item.label }}</div>
                      <div class="energy-value">{{ item.value }}</div>
                    </div>
                    <hr v-if="index < slide.items.length - 1" class="divider"/>
                  </template>
                </div>
              </swiper-slide>
            </swiper-container>

            <!-- UPDATED: Engine Swiper with new complex layout -->
            <swiper-container :key="selectedCategory" v-if="selectedCategory === 'engine'" :slides-per-view="1" :pagination="{ clickable: true }">
              <swiper-slide>
               <div class="data-container">
                          <div class="slide-title">Engine</div>
                          <!-- NEW: A much simpler and more robust two-row grid structure -->
                          <ion-grid class="engine-grid">
                            <!-- TOP ROW: Contains the primary gauges -->
                            <ion-row>
                              <!-- Column 1: Battery -->
                              <ion-col size="2">
                                <div class="engine-item">
                                  <div class="engine-value-large">{{ engineData.battery.voltage }}</div>
                                  <ion-icon class="engine-icon" :icon="batteryChargingOutline"></ion-icon>
                                  <div class="engine-label-small">BATTERY</div>
                                </div>
                              </ion-col>
                              <!-- Column 2: RPM -->
                              <ion-col size="8">
                                <div class="engine-item">
                                  <div class="rpm-gauge">
                                    <div class="rpm-value">{{ engineData.rpm }}</div>
                                    <div class="rpm-unit">rpm</div>
                                  </div>
                                </div>
                              </ion-col>
                              <!-- Column 3: Fuel -->
                              <ion-col size="2">
                                <div class="engine-item">
                                  <div class="engine-value-large">{{ engineData.fuel.levelValue }}</div>
                                  <ion-icon class="engine-icon" :icon="funnelOutline"></ion-icon>
                                  <div class="engine-label-small">FUEL</div>
                                </div>
                              </ion-col>
                            </ion-row>

                            <!-- BOTTOM ROW: Contains the secondary readings -->
                            <ion-row class="ion-align-items-start">
                              <!-- Column 1: Oil Pressure -->
                              <ion-col size="2">
                                <div class="engine-item">
                                  <div class="engine-value-small">{{ engineData.oilPressure }}</div>
                                  <ion-icon class="engine-icon" :icon="swapVerticalOutline"></ion-icon>
                                  <div class="engine-label-small">OIL PRES</div>
                                </div>
                              </ion-col>
                              <!-- Column 2: Oil Temp -->
                              <ion-col size="8">
                                <div class="engine-item">
                                  <div class="engine-value-small">{{ engineData.oilTemp }}</div>
                                  <ion-icon class="engine-icon" :icon="thermometerOutline"></ion-icon>
                                  <div class="engine-label-small">OIL TEMP</div>
                                </div>
                              </ion-col>
                              <!-- Column 3: Coolant Temp -->
                              <ion-col size="2">
                                <div class="engine-item">
                                  <div class="engine-value-small">{{ engineData.coolantTemp }}</div>
                                  <ion-icon class="engine-icon" :icon="waterOutline"></ion-icon>
                                  <div class="engine-label-small">COOLANT TEMP</div>
                                </div>
                              </ion-col>
                            </ion-row>
                          </ion-grid>
                        </div>

              </swiper-slide>
            </swiper-container>

                  <!-- V and I Swiper -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'vandi'" :slides-per-view="1" :pagination="{ clickable: true }">
                               <swiper-slide v-for="slide in vAndISlidesData" :key="slide.id">
                <div class="data-container">
                  <div class="slide-title">{{ slide.title }}</div>

                  <!-- LAYOUT 1 & 2: Simple List OR List with Indicator -->
                  <div v-if="slide.type === 'simple-list' || slide.type === 'list-with-indicator'" class="vi-list-container">
                    <template v-for="(item, index) in slide.items" :key="item.label">
                      <div class="vi-item">
                        <!-- Left side: Label and Value -->
                        <div class="vi-text-content">
                          <div class="vi-label">{{ item.label }}</div>
                          <div class="vi-value">{{ item.value }}</div>
                        </div>
                        <!-- Right side: Indicator (only for 'list-with-indicator' type) -->
                        <div v-if="slide.type === 'list-with-indicator'" class="level-indicator-wrapper">
                          <div class="level-indicator-bar" :style="{ width: (item.level * 100) + '%' }"></div>
                        </div>
                      </div>
                      <hr v-if="index < slide.items.length - 1" class="divider"/>
                    </template>
                  </div>

                  <!-- LAYOUT 3: Dual Column Grid -->
                  <div v-if="slide.type === 'dual-column'" class="voltage-grid-container">
                <!-- We loop based on the number of items in a column (assuming both are equal length) -->
                <!-- The <template> tag lets us group a row and a divider together in the loop -->
                <template v-for="(item, index) in slide.leftColumn" :key="index">
                  <ion-grid class="voltage-grid">
                    <ion-row>
                      <!-- Left Column Cell -->
                      <ion-col>
                        <div class="vi-item">
                          <div class="vi-text-content">
                            <div class="vi-label">{{ slide.leftColumn[index].label }}</div>
                            <div class="vi-value">{{ slide.leftColumn[index].value }}</div>
                          </div>
                        </div>
                      </ion-col>
                      <!-- Right Column Cell -->
                      <ion-col>
                        <div class="vi-item">
                          <div class="vi-text-content">
                            <div class="vi-label">{{ slide.rightColumn[index].label }}</div>
                            <div class="vi-value">{{ slide.rightColumn[index].value }}</div>
                          </div>
                        </div>
                      </ion-col>
                    </ion-row>
                  </ion-grid>
                  <!-- Add a divider after each row, except for the last one -->
                  <hr v-if="index < slide.leftColumn.length - 1" class="divider"/>
                </template>
              </div>
                </div>
              </swiper-slide>

                  </swiper-container>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// --- Vue Imports ---
import { ref, computed, onMounted } from 'vue';
import router from '@/router/index';
import { getDashboardDetail, getGeneratorDetail } from '@/services/ApiService';
import { register as registerSwiperElements } from 'swiper/element/bundle';

registerSwiperElements();

// --- Ionic Vue Imports ---
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent,
  IonProgressBar, IonGrid, IonRow, IonCol, IonList,
} from '@ionic/vue';

// --- Ionicons Imports ---
import {
  helpCircleOutline, shareSocialOutline, shareSocial,personCircleOutline, serverOutline,
  chevronForwardOutline, locationOutline, flashOutline, sunnyOutline, timeOutline,
  cogOutline, analyticsOutline,
  chevronBackOutline,
  batteryChargingOutline,
  swapVerticalOutline,
  thermometerOutline,
  funnelOutline,
  waterOutline,
} from 'ionicons/icons';

const goToHelpScreen = () => {
  router.push('/helpscreen');
};

const goToProfilePage = () => {
  router.push('/profile');
};

const goToSharePage = async () => {
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: 'TracerRGT',
      text: 'TracerRGT Generator Monitoring System',
      dialogTitle: 'Share TracerRGT',
    });
  } catch (err) {
    console.error('Error sharing:', err);
  }
};

// --- Component Logic ---

// ─── State ───────────────────────────────────────────────
// Section 1: selected site
const selectedSite = ref<any>(null);
// Section 2: selected generator (drives Section 3)
const selectedGenerator = ref<any>(null);

// Raw data pools
const allGenerators = ref<any[]>([
]);

// Section 1 — site list
const siteData = ref<any[]>([
 
]);

// Section 2 — generator list filtered by selected site
const generatorData = ref<any[]>([]);

// Status colour helper used in template
const statusClass = (status: string) => {
  if (status === 'Running') return 'status-running';
  if (status === 'Generator OFF') return 'status-off';
  return 'status-offline';
};

// Section-2 header summary text
const generatorStatusSummary = computed(() => {
  const list = generatorData.value;
  if (!list.length) return '';
  const running = list.filter((g: any) => g.status === 'Running').length;
  const offline = list.filter((g: any) => g.status === 'Offline').length;
  const off    = list.filter((g: any) => g.status === 'Generator OFF').length;
  const parts: string[] = [];
  if (running) parts.push(`${running} Running`);
  if (off)     parts.push(`${off} Generator OFF`);
  if (offline) parts.push(`${offline} Offline`);
  return parts.join('  ·  ');
});

const loadDashboardData = async () => {
  try {
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      // ── Debug: log full dashboard_detail response ──────────────
      console.log('[Dashboard] dashboard_detail raw response:', JSON.stringify(d));
      // Populate site list from summary array
      const sum = d.summary || d.arr_summary;
      if (Array.isArray(sum) && sum.length > 0) {
        siteData.value = sum.map((s: any, idx: number) => ({
          id: s.site_id || s.id || idx + 1,
          name: s.site_name || s.name || s.subtitle || s.label || `Site ${idx + 1}`,
          genCount: s.gen_count || s.count || 0,
          progress: s.progress || 0.5,
          color: idx % 3 === 0 ? 'secondary' : idx % 3 === 1 ? 'success' : 'tertiary',
        }));
      }
      // Populate all generators pool
      const gens = d.arr_data || d.generators || d.data || d.gen_list || d.genArr;
      if (Array.isArray(gens) && gens.length > 0) {
        allGenerators.value = gens.map((g: any, idx: number) => ({
          id:          g.gen_id   || g.id   || idx + 1,
          site_id:     g.site_id  || g.sid  || null,
          name:        g.gen_name || g.gen_nm || g.name || g.veh_name || g.gen || `Generator ${g.gen_id || idx + 1}`,
          status:      g.status_name || g.sts_name || g.status || (g.sts == 1 ? 'Running' : g.sts == 0 ? 'Offline' : 'Unknown'),
          capacity:    g.capacity   || g.kva_rating || g.kva   || '',
          desc:        g.desc       || g.description || g.gen_type || '',
          location:    g.location   || g.address     || g.site_name || '',
          lastUpdated: g.last_updated || g.updated_at || g.lst_updt || '',
          lat:         g.lat || g.latitude  || null,
          lon:         g.lon || g.longitude || g.lng || null,
          color:       g.sts_colr  || g.color || null,
          icon:        serverOutline,
          isActive:    false,
        }));
      }
      // Auto-select first site (and its first generator) on initial load
      if (siteData.value.length > 0) {
        selectSite(siteData.value[0]);
      } else if (allGenerators.value.length > 0) {
        // No site data — just show all generators and select first
        generatorData.value = allGenerators.value.map((g: any, idx: number) => ({ ...g, isActive: idx === 0 }));
        selectGenerator(generatorData.value[0]);
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard detail:', err);
  }
};

// ─── Section 1 → 2: Site selected ────────────────────────
// When a site is selected or changed, filter its generators and auto-select its first generator
const selectSite = (site: any) => {
  selectedSite.value = site;
  const filtered = allGenerators.value.filter((g: any) =>
    g.site_id == null || String(g.site_id) === String(site.id)
  );
  const list = filtered.length ? filtered : allGenerators.value;
  generatorData.value = list.map((g: any, idx: number) => ({
    ...g,
    isActive: idx === 0,
  }));
  // Automatically select the first generator of this selected site to show Section 3 immediately
  if (generatorData.value.length > 0) {
    selectGenerator(generatorData.value[0]);
  } else {
    selectedGenerator.value = null;
  }
};

const selectGenerator = async (gen: any) => {
  // Update active state in the list
  generatorData.value.forEach((g: any) => { g.isActive = (g.id === gen.id); });
  // Set selected generator for info card
  selectedGenerator.value = gen;
  try {
    localStorage.setItem('selectedVeh', JSON.stringify({
      id: gen.id,
      name: gen.name,
      lat: gen.lat || 23.0225,
      lon: gen.lon || 72.5714,
      sts_colr: gen.color || '#f59c20',
      sts_name: gen.status || 'Active',
      capacity: gen.capacity || ''
    }));
  } catch (e) {
    console.error('Error caching selected generator:', e);
  }
  try {
    const res = await getGeneratorDetail(gen.id);
    if (res.status === 200 && res.data) {
      // The API may wrap data in arr_data[0] or return fields at root level
      const raw = res.data;
      // ── Log full response to help diagnose field names ──────────
      console.log(`[Dashboard] generator_detail raw response for gen ${gen.id}:`, JSON.stringify(raw));
      // Unwrap: some endpoints nest everything inside arr_data[0]
      const d: any = (Array.isArray(raw.arr_data) && raw.arr_data.length > 0)
        ? { ...raw, ...raw.arr_data[0] }
        : (Array.isArray(raw.data) && raw.data.length > 0)
          ? { ...raw, ...raw.data[0] }
          : raw;

      // ── Info card ─────────────────────────────────────────────
      selectedGenerator.value = {
        ...selectedGenerator.value,
        name:        d.gen_name   || d.gen_nm   || d.name       || gen.name,
        capacity:    d.capacity   || d.kva_rating|| d.kva        || gen.capacity,
        location:    d.location   || d.address  || d.site_name  || gen.location,
        status:      d.status_name|| d.sts_name || d.status     || gen.status,
        lastUpdated: d.last_updated||d.updated_at||d.lst_updt   || gen.lastUpdated,
      };

      // ── Power Total ───────────────────────────────────────────
      // Try every possible field name the server might use
      const getVal = (v: any) => (v !== undefined && v !== null && v !== '') ? String(v) : null;
      powerTotalData.value.kw   = getVal(d.kw)   || getVal(d.tot_kw)   || getVal(d.active_kw)  || getVal(d.p_kw)   || '0.0';
      powerTotalData.value.kva  = getVal(d.kva)  || getVal(d.tot_kva)  || getVal(d.appar_kva)  || getVal(d.p_kva)  || '0.0';
      powerTotalData.value.kvar = getVal(d.kvar) || getVal(d.tot_kvar) || getVal(d.react_kvar) || getVal(d.p_kvar) || '0.0';
      powerTotalData.value.pf   = getVal(d.pf)   || getVal(d.tot_pf)   || getVal(d.power_factor)|| getVal(d.p_pf)   || '0.0';

      // ── Energy ────────────────────────────────────────────────
      const fmt = (v: any, unit: string) => `${v !== undefined && v !== null && v !== '' ? v : '0.0'} ${unit}`;
      energySlidesData.value = [
        {
          id: 'mains',
          title: 'Energy - Mains',
          items: [
            { label: 'ACTIVE',   value: fmt(d.mains_kwh   || d.mains_active   || d.m_kwh   || d.mn_kwh,   'kWh'),  isHighlighted: true  },
            { label: 'APPARENT', value: fmt(d.mains_kvah  || d.mains_apparent || d.m_kvah  || d.mn_kvah,  'kVAh'), isHighlighted: false },
            { label: 'REACTIVE', value: fmt(d.mains_kvarh || d.mains_reactive || d.m_kvarh || d.mn_kvarh, 'kVARh'),isHighlighted: false },
          ],
        },
        {
          id: 'generator',
          title: 'Energy - Generator',
          items: [
            { label: 'ACTIVE',   value: fmt(d.gen_kwh   || d.gen_active   || d.g_kwh   || d.kwh   || d.energy_kwh,   'kWh'),  isHighlighted: true  },
            { label: 'APPARENT', value: fmt(d.gen_kvah  || d.gen_apparent || d.g_kvah  || d.kvah  || d.energy_kvah,  'kVAh'), isHighlighted: false },
            { label: 'REACTIVE', value: fmt(d.gen_kvarh || d.gen_reactive || d.g_kvarh || d.kvarh || d.energy_kvarh, 'kVARh'),isHighlighted: false },
          ],
        },
      ];

      // ── Run Hour ──────────────────────────────────────────────
      const fmtHr = (v: any) => {
        if (!v && v !== 0) return '0 hr 0 min 0 sec';
        if (typeof v === 'string' && (v.includes('hr') || v.includes(':'))) return v;
        const secs = Number(v);
        if (isNaN(secs)) return String(v);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        return `${h} hr ${m} min ${s} sec`;
      };
      runHourSlidesData.value = [
        {
          id: 'mains',
          title: 'RunHour - Mains',
          items: [
            { label: 'TOTAL', value: fmtHr(d.mains_run_total || d.mains_total_rh || d.m_rh_total || d.mn_rh) },
            { label: 'TODAY', value: fmtHr(d.mains_run_today || d.mains_today_rh || d.m_rh_today) },
            { label: 'TRIP',  value: fmtHr(d.mains_run_trip  || d.mains_trip_rh  || d.m_rh_trip)  },
          ],
        },
        {
          id: 'generator',
          title: 'RunHour - Generator',
          items: [
            { label: 'TOTAL', value: fmtHr(d.gen_run_total || d.gen_total_rh || d.tot_rh || d.rh_total || d.run_hour) },
            { label: 'TODAY', value: fmtHr(d.gen_run_today || d.gen_today_rh || d.today_rh || d.rh_today) },
            { label: 'TRIP',  value: fmtHr(d.gen_run_trip  || d.gen_trip_rh  || d.trip_rh  || d.rh_trip)  },
          ],
        },
      ];

      // ── Engine ────────────────────────────────────────────────
      engineData.value = {
        battery:     { voltage: fmt(d.battery_volt || d.batt_volt || d.batt || d.battery, 'V'), level: 0.8 },
        oilPressure: fmt(d.oil_pressure || d.oil_press || d.oil_pres || d.op, 'Kpa'),
        rpm:         String(d.rpm || d.engine_rpm || d.gen_rpm || '0.0'),
        oilTemp:     fmt(d.oil_temp || d.oil_temperature || d.ot, '°C'),
        fuel:        { levelValue: fmt(d.fuel_level || d.fuel_ltr || d.fuel || d.fl, 'L'), level: 0.6 },
        coolantTemp: fmt(d.coolant_temp || d.cool_temp || d.coolant || d.ct, '°C'),
      };

      // ── V and I ───────────────────────────────────────────────
      const safeNum = (v: any, divisor = 1000) => Math.min(Math.max((Number(v) || 0) / divisor, 0), 1);
      vAndISlidesData.value = [
        {
          id: 'frequency',
          title: 'Frequency',
          type: 'simple-list',
          items: [
            { label: 'L1', value: fmt(d.freq_l1 || d.f_l1 || d.hz_l1 || d.freq || d.hz, 'Hz') },
            { label: 'L2', value: fmt(d.freq_l2 || d.f_l2 || d.hz_l2 || d.freq || d.hz, 'Hz') },
            { label: 'L3', value: fmt(d.freq_l3 || d.f_l3 || d.hz_l3 || d.freq || d.hz, 'Hz') },
          ],
        },
        {
          id: 'current',
          title: 'Current',
          type: 'list-with-indicator',
          items: [
            { label: 'L1', value: fmt(d.curr_l1 || d.i_l1 || d.il1 || d.c_l1, 'A'), level: safeNum(d.curr_l1 || d.i_l1 || d.il1) },
            { label: 'L2', value: fmt(d.curr_l2 || d.i_l2 || d.il2 || d.c_l2, 'A'), level: safeNum(d.curr_l2 || d.i_l2 || d.il2) },
            { label: 'L3', value: fmt(d.curr_l3 || d.i_l3 || d.il3 || d.c_l3, 'A'), level: safeNum(d.curr_l3 || d.i_l3 || d.il3) },
          ],
        },
        {
          id: 'voltage',
          title: 'Voltage',
          type: 'dual-column',
          leftColumn: [
            { label: 'L1 - N', value: fmt(d.volt_l1n  || d.v_l1n  || d.vl1n  || d.v_l1  || d.vl1,  'V') },
            { label: 'L2 - N', value: fmt(d.volt_l2n  || d.v_l2n  || d.vl2n  || d.v_l2  || d.vl2,  'V') },
            { label: 'L3 - N', value: fmt(d.volt_l3n  || d.v_l3n  || d.vl3n  || d.v_l3  || d.vl3,  'V') },
          ],
          rightColumn: [
            { label: 'L1 - L2', value: fmt(d.volt_l1l2 || d.v_l1l2 || d.vl1l2 || d.vll12, 'V') },
            { label: 'L2 - L3', value: fmt(d.volt_l2l3 || d.v_l2l3 || d.vl2l3 || d.vll23, 'V') },
            { label: 'L3 - L1', value: fmt(d.volt_l3l1 || d.v_l3l1 || d.vl3l1 || d.vll31, 'V') },
          ],
        },
        {
          id: 'summary',
          title: 'Summary',
          type: 'list-with-indicator',
          items: [
            { label: 'AVG. LINE VOLT',  value: fmt(d.avg_line_volt  || d.avg_v_ll || d.avg_vll, 'V'), level: safeNum(d.avg_line_volt  || d.avg_v_ll, 500)  },
            { label: 'AVG. PHASE VOLT', value: fmt(d.avg_phase_volt || d.avg_v_ln || d.avg_vln, 'V'), level: safeNum(d.avg_phase_volt || d.avg_v_ln, 300) },
            { label: 'TOTAL CURRENT',   value: fmt(d.tot_curr || d.total_current || d.i_tot,    'A'),  level: safeNum(d.tot_curr || d.total_current, 3000) },
          ],
        },
      ];
    }
  } catch (err) {
    console.error(`Error loading generator ${gen.id} telemetry:`, err);
  }
};

const powerTotalData = ref({
  kw: '0.0',
  kva: '0.0',
  kvar: '0.0',
  pf: '0.0',
  pfLabel: 'LAG'
});

onMounted(() => {
  // Auto-select first site + generator from static fallback immediately (before API responds)
  if (siteData.value.length > 0) {
    selectSite(siteData.value[0]);
  }
  // Then load real data from API (will override defaults)
  loadDashboardData();
});

// Tracks which menu item is selected to show the correct slides
const selectedCategory = ref('power');

const selectCategory = (category: string) => {
  selectedCategory.value = category;
};

// --- SCROLLING LOGIC ---
const siteScrollContainer = ref<HTMLElement | null>(null);
const generatorScrollContainer = ref<HTMLElement | null>(null);

const isSiteScrolled = ref(false);
const isGeneratorScrolled = ref(false);


const handleSiteScroll = (event: Event) => {
  isSiteScrolled.value = (event.target as HTMLElement).scrollLeft > 10;
};
const handleGeneratorScroll = (event: Event) => {
  isGeneratorScrolled.value = (event.target as HTMLElement).scrollLeft > 10;
};


// 2. Define a function to handle the scrolling.
const scrollHorizontally = (container: HTMLElement | null) => {
  // Safety check to ensure the element exists
  if (!container) return;

  // Define how much to scroll. You can adjust this value.
  const scrollAmount = 200; 

  // Use the smooth scrollBy method
  container.scrollBy({
    left: scrollAmount,
    behavior: 'smooth',
  });
};


// NEW: Function to scroll backward
const scrollBackward = (container: HTMLElement | null) => {
  if (!container) return;
  const scrollAmount = 200;
  container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
};

const energySlidesData = ref([
  {
    id: 'mains',
    title: 'Energy - Mains',
    items: [
      {
        label: 'ACTIVE',
        value: '4.2949674E8 kWh',
        isHighlighted: true, // Flag to control the highlight style
      },
      {
        label: 'APPARANT',
        value: '0 kVAh',
        isHighlighted: false,
      },
      {
        label: 'REACTIVE',
        value: '0 kVARh',
        isHighlighted: false,
      },
    ],
  },
  {
    id: 'generator',
    title: 'Energy - Generator',
    items: [
      {
        label: 'ACTIVE',
        value: '648816.3 kWh',
        isHighlighted: true,
      },
      {
        label: 'APPARANT',
        value: '0 kVAh',
        isHighlighted: false,
      },
      {
        label: 'REACTIVE',
        value: '0 kVARh',
        isHighlighted: false,
      },
    ],
  },
]);


const runHourSlidesData = ref([
  {
    id: 'mains',
    title: 'RunHour - Mains',
    items: [
      { label: 'TOTAL', value: '0 hr 0 min 0 sec' },
      { label: 'TODAY', value: '0 hr 0 min 0 sec' },
      { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
    ],
  },
  {
    id: 'generator',
    title: 'RunHour - Generator',
    items: [
      { label: 'TOTAL', value: '40574 hr 36 min 0 sec' },
      { label: 'TODAY', value: '0 hr 0 min 0 sec' },
      { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
    ],
  },
]);

// --- NEW: DYNAMIC DATA FOR ENGINE SLIDE ---
// This is a single, more complex object.
const engineData = ref({
  battery: {
    voltage: '25.3 V',
    level: 0.8, // 80%
  },
  oilPressure: '0.0 Kpa',
  rpm: '0.0',
  oilTemp: '0.0 °C',
  fuel: {
    levelValue: '596.0 L',
    level: 0.6, // 60%
  },
  coolantTemp: '0.0 °C',
});

const vAndISlidesData = ref([
  {
    id: 'frequency',
    title: 'Frequency',
    type: 'simple-list', // A simple list with dividers
    items: [
      { label: 'L1', value: '0.0 Hz' },
      { label: 'L2', value: '0.0 Hz' },
      { label: 'L3', value: '0.0 Hz' },
    ],
  },
  {
    id: 'current',
    title: 'Current',
    type: 'list-with-indicator', // A list with a bar graph indicator
    items: [
      { label: 'L1', value: '0.0 A', level: 0.2 }, // level is 0.0 to 1.0
      { label: 'L2', value: '0.0 A', level: 0.5 },
      { label: 'L3', value: '0.0 A', level: 0.1 },
    ],
  },
  {
    id: 'voltage',
    title: 'Voltage',
    type: 'dual-column', // A two-column grid layout
    leftColumn: [
      { label: 'L1 - N', value: '0.0 V' },
      { label: 'L2 - N', value: '0.0 V' },
      { label: 'L3 - N', value: '0.0 V' },
    ],
    rightColumn: [
      { label: 'L1 - L2', value: '0.0 V' },
      { label: 'L2 - L3', value: '0.0 V' },
      { label: 'L3 - L1', value: '0.0 V' },
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    type: 'list-with-indicator', // Reuses the same layout as the 'Current' slide
    items: [
      { label: 'AVG. LINE VOLT', value: '0.0 V', level: 0.8 },
      { label: 'AVG. PHASE VOLT', value: '0.0 V', level: 0.4 },
      { label: 'TOTAL CURRENT', value: '0.0 A', level: 0.9 },
    ],
  },
]);

</script>

<style scoped>
/* --- Global & Layout (unchanged) --- */
ion-toolbar {
  --background: var(--ion-color-greyishBrown);
  --color: var(--ion-text-color);
}
ion-content {
  --background: var(--ion-background-color);
  --color: var(--ion-text-color);
}
.main-content {
  padding: 0 16px 16px 16px;
}
.background_cls{
  background-color: var(--ion-color-brownishGrey);
  margin-top: 10px;
}

/* --- HORIZONTAL SCROLL IMPLEMENTATION (updated for new arrow) --- */
.horizontal-scroll-container {
  display: flex;
  align-items: center;
  padding: 10px 0;
  /* NEW: Prevents content from overflowing the parent during animation */
  overflow: hidden; 
}

.horizontal-scroll {
  flex-grow: 1;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

/* --- UPDATED: Back arrow styling for collapsing effect --- */
.back_arrow {
  color: var(--ion-text-color);
  font-size: 24px;
  flex-shrink: 0;
  cursor: pointer;

  /* 1. Default (hidden) state: zero opacity, width, and margin */
  opacity: 0;
  max-width: 0;
  margin-right: 0;
  pointer-events: none;

  /* 2. Transition all three properties for a smooth effect */
  transition: opacity 0.3s ease-in-out, max-width 0.3s ease-in-out, margin-right 0.3s ease-in-out;
}

/* --- UPDATED: Class to make the back arrow visible and take up space --- */
.back_arrow.visible {
  /* 3. Visible state: full opacity, width, and margin */
  opacity: 1;
  max-width: 24px; /* The font-size of the icon */
  margin-right: 5px; /* The desired space between arrow and list */
  pointer-events: auto;
}

.forword_arrow {
  color: var(--ion-text-color);
  font-size: 24px;
  flex-shrink: 0;
  cursor: pointer;
  margin-left: 5px;
}

/* ── Section Blocks (3-step drill-down) ── */
.section-block {
  background-color: var(--ion-color-brownishGrey);
  margin-top: 10px;
  border-radius: 6px;
  padding: 0 0 8px 0;
}
.details-section {
  padding-bottom: 0;
}

/* Section header row */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 12px 0 12px;
}
.section-label {
  font-size: 1em;
  font-weight: 600;
  color: var(--ion-color-whiteTwo);
}
.section-sub {
  font-size: 0.75em;
  color: var(--ion-text-color);
  margin-left: 8px;
}

/* Tap-hint row below a list */
.tap-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78em;
  color: var(--ion-text-color);
  font-style: italic;
  padding: 4px 14px 6px 14px;
  opacity: 0.75;
}

/* ── Section 1: Site cards ── */
.site-card {
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  width: 130px;
  min-height: 62px;
  background: var(--ion-color-greyishBrown);
  border: 1px solid transparent;
  border-radius: 6px;
  margin: 0 8px 0 0;
  padding: 10px 12px 8px 12px;
  cursor: pointer;
  vertical-align: top;
  transition: border-color 0.2s ease, transform 0.15s ease;
  box-sizing: border-box;
}
.site-card:first-child { margin-left: 10px; }
.site-card:hover {
  border-color: rgba(245, 156, 32, 0.45);
  transform: translateY(-1px);
}
.site-card-active {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 8px rgba(245, 156, 32, 0.35);
}
.site-card-name {
  font-size: 0.95em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.site-card-count {
  font-size: 0.72em;
  color: var(--ion-text-color);
  margin-top: 2px;
  margin-bottom: 6px;
}
.site-progress {
  height: 5px;
  border-radius: 3px;
  --progress-background: #4a454a;
}

/* ── Generator status colours ── */
.status-running  { color: #2dd36f; font-size: 0.8em; }
.status-off      { color: var(--ion-color-primary); font-size: 0.8em; }
.status-offline  { color: var(--ion-text-color); font-size: 0.8em; }

.info_param_grid, .info_paran_col {
  padding: 0;
}

.info-card {
  background: transparent;
  box-shadow: none;
  margin-left: 0;
  margin-right: 0;
  padding-left: 10px;
}
.info-card p {
  display: flex;
  align-items: center;
  font-size: 0.8em;
  color: var(--ion-text-color);
}
.info-card p ion-icon {
  margin-right: 8px;
}
.info-card .status-line {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.info-card .offline-status {
  color: var(--ion-color-primary);
  font-weight: bold;
  font-size: 0.8em;
}
.info-card .running-status {
  color: #2dd36f;
  font-weight: bold;
  font-size: 0.8em;
}
.info-card .last-updated {
  font-size: 0.7em;
  color: var(--ion-text-color);
}
.info-card-placeholder {
  padding: 16px 20px;
  color: var(--ion-text-color);
  font-size: 0.85em;
  text-align: center;
  font-style: italic;
}

/* --- Block 4: Generator List --- */
.generator-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  width: 180px;
  margin-right: 10px;
  padding: 12px;
  background: var(--ion-color-greyishBrown);
  border: 1px solid transparent;
}
.generator-item:first-child {
  margin-left: 10px;
}
.generator-item.active {
  border-color: var(--ion-color-primary);
}
.generator-item ion-icon {
  font-size: 2em;
  margin-right: 10px;
}
.generator-item .gen-details {
  display: flex;
  flex-direction: column;
  white-space: normal;
}
.generator-item .gen-details strong {
  color: var(--ion-color-whiteTwo);
  font-size: 0.9em;
}
.generator-item .gen-details span {
  color: var(--ion-text-color);
  font-size: 0.8em;
}


/* --- Block 6: Menu & Slides --- */
.menu-list {
  background: transparent;
  padding: 0;
}
.menu-list ion-button {
  --border-radius: 0px 20px 20px 0px;
  --box-shadow: none;
  min-height: 30px;
  max-height: 30px;
  height: 30px;
  margin-bottom: 10px;
  text-transform: none;
  font-size: 12px;
  text-align: start;
}

.menu-list ion-icon{
height: 20px;
width: 20px;
}
.slides-container {
  height: 300px;
  width: 100%;
  background: var(--ion-color-greyishBrown);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* --- Swiper & Gauge Styles --- */
swiper-container {
  width: 100%;
  height: 100%;
  --swiper-pagination-bottom: 2px;
  --swiper-pagination-color: var(--ion-color-primary, #f59c20);
  --swiper-pagination-bullet-inactive-color: var(--ion-color-pinkishGrey, #c4c4c4);
  --swiper-pagination-bullet-inactive-opacity: 0.5;
  --swiper-pagination-bullet-size: 8px;
  --swiper-pagination-bullet-horizontal-gap: 5px;
}
swiper-container::part(pagination) {
  bottom: 2px;
}
swiper-container::part(bullet) {
  background-color: var(--ion-color-pinkishGrey, #c4c4c4);
  opacity: 0.5;
  width: 8px;
  height: 8px;
  cursor: pointer;
}
swiper-container::part(bullet-active) {
  background-color: var(--ion-color-primary, #f59c20);
  opacity: 1;
  width: 16px;
  border-radius: 4px;
}
swiper-slide {
  display: flex;
  align-items: stretch;
  justify-content: center;
  color: var(--ion-color-whiteTwo);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-bottom: 20px;
}

/* Full-height power total container */
.power-total-container {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  height: 100% !important;
  justify-content: flex-start !important;
  box-sizing: border-box;
  padding: 0 4px;
}

.power-total-container .slide-title {
  font-size: 1.05em;
  color: var(--ion-text-color);
  margin-bottom: 6px;
  text-align: center;
  width: 100%;
  font-weight: 600;
  flex-shrink: 0;
}

/* 2x2 grid filling full width and remaining height */
.gauges-2x2-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  width: 100%;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
}

.gauge-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.gauge-wrapper {
  position: relative;
  width: 100%;
  max-width: 125px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-svg {
  width: 100%;
  height: auto;
  max-height: 60px;
  overflow: visible;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
}

.gauge-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.gauge-content .gauge-value {
  font-size: 1.25em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo, #ffffff);
  line-height: 1;
}

.gauge-content .gauge-unit {
  font-size: 0.72em;
  font-weight: 600;
  color: var(--ion-color-pinkishGrey, #c4c4c4);
  letter-spacing: 0.3px;
  margin-top: 2px;
}

.gauge-lag {
  font-size: 0.85em;
  color: var(--ion-color-primary, #f59c20);
  font-weight: 700;
  margin-left: 2px;
}

/* --- NEW STYLES for Power & Energy Slides --- */

/* A general container for the content inside a slide */
.data-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* Center the content vertically within the container */
  justify-content: center; 
}

.slide-title {
  font-size: 1.1em;
  color: var(--ion-text-color);
  margin-bottom: 12px;
  /* Center the title text */
  text-align: center;
  /* Make the title span the full width */
  width: 100%;
}

/* Styles for "Power - 3Phase" slide */
.data-grid {
  width: 100%;
}

/* UPDATED: Center the column content */
.data-grid ion-col {
  text-align: center;
}

.data-grid .data-header {
  color: var(--ion-text-color);
  font-size: 0.9em;
  font-weight: bold;
  margin-bottom: 12px;
}

.data-grid .data-row {
  margin-bottom: 20px;
  font-size: 12px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}

.data-grid .data-unit {
  font-size:10px;
  font-weight: normal;
  color: var(--ion-text-color);
  margin-left: 4px;
}

/* Styles for "Energy" slides (These are not centered, so they stay the same) */
.energy-item {
  width: 100%;
  margin-bottom: 8px;
  text-align: left; /* Explicitly keep left alignment */
}
.energy-label {
  font-size: 0.8em;
  color: var(--ion-text-color);
  text-transform: uppercase;
}
.energy-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
  line-height: 1.2;
}
.energy-value.highlight-value {
  color: var(--ion-color-primary);
}

.engine-grid {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px; /* Creates space between the top and bottom row */
}
/* This is the main container for the content inside each cell */
.engine-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 5px; /* Adds consistent space between elements inside the item */
  width: 100%;
}
engine-value-large {
  font-size: 16px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}

.engine-value-small {
  font-size: 12px;
  color: var(--ion-color-whiteTwo);
}

.engine-label-small {
  font-size: 10px;
  color: var(--ion-text-color);
  text-transform: uppercase;
}

.engine-icon {
  font-size: 9px;
  color: var(--ion-text-color);
}

/* Vertical progress bar styles */
.engine-item ion-progress-bar {
  width: 60px;   /* This becomes the height of the vertical bar */
  height: 10px;  /* This becomes the width */
  min-height: 10px;
  transform: rotate(-90deg);
  --progress-background: var(--ion-color-primary);
  --background: var(--ion-color-step-350);
  border-radius: 5px;
}
/* RPM gauge styles */
.rpm-gauge {
  width: 90px;
  height: 45px;
  border: 5px solid var(--ion-color-pinkishGrey);
  border-bottom: none;
  border-radius: 90px 90px 0 0;
  border-style: dashed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 5px;
  box-sizing: border-box;
}
.rpm-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
  line-height: 1;
}
.rpm-unit {
  font-size: 8px;
  color: var(--ion-text-color);
}

.vi-list-container {
  width: 100%;
}

/* A single row item in any of the V&I lists */
.vi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Container for text on the left */
.vi-text-content {
  display: flex;
  flex-direction: column;
}

.vi-label {
  font-size: 14px;
  color: var(--ion-text-color);
}

.vi-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}

/* Styles for the bar graph indicator on the right */
.level-indicator-wrapper {
  width: 100px; /* Fixed width for the bar container */
  height: 20px;
  border: 1px solid var(--ion-text-color);
  padding: 2px;
  box-sizing: border-box;
}

.level-indicator-bar {
  height: 100%;
  /* This gradient creates the repeating vertical line effect */
  background: repeating-linear-gradient(
    to right,
    var(--ion-text-color),
    var(--ion-text-color) 2px,
    transparent 2px,
    transparent 4px
  );
}


.voltage-col {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Adds space between items in a column */
}

/* The divider can be reused from the Energy/RunHour slides */
.divider {
  width: 100%;
  border: 0;
  height: 1px;
  background-color: var(--ion-text-color);
  margin-top: 10px;
}

.voltage-grid-container {
  width: 100%;
}
.voltage-grid {
  width: 100%;
}

.custom_icon{
  margin-right: 10px;
}

ion-icon{
    height: 30px;
    width: 30px;
    color: #fdcf9f; /* Custom color for the icon */
  }

</style>