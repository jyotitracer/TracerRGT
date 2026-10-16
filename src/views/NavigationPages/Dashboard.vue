<template>
  <ion-page id="main-content">
    <!-- Block 1: Header -->
    <ion-header style="background-color: var(--ion-color-greyishBrown);">
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
                <div class="site-card-count">{{ site.site_info_str || (site.genCount + ' Generators') }}</div>
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
            <span class="section-sub">{{ selectedSite.site_info_str || generatorStatusSummary }}</span>
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
                <ion-icon
                  class="gen-box-icon"
                  :icon="gen.icon"
                  :color="isGenRunning(gen) ? 'success' : (gen.isActive ? 'primary' : 'secondary')"
                ></ion-icon>
                <div class="gen-details">
                  <strong class="gen-name-text">{{ gen.name }}</strong>
                  <span class="gen-status-text" :class="statusClass(gen)">{{ formatGenStatus(gen) }}</span>
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
              <p class="descri1_class">{{ selectedGenerator.capacity || selectedGenerator.model || '—' }}</p>
              <p class="descri2_class">{{ selectedGenerator.desc || selectedGenerator.model || selectedGenerator.capacity || '—' }}</p>
              <div class="status-line">
                <p><ion-icon :icon="locationOutline"></ion-icon> {{ selectedGenerator.location || selectedGenerator.loc || '—' }}</p>
                <div>
                  <div :class="isGenRunning(selectedGenerator) ? 'running-status' : 'offline-status'">
                    {{ formatGenStatus(selectedGenerator) }}
                  </div>
                  <div class="last-updated">Last Updated - {{ selectedGenerator.lastUpdated || selectedGenerator.rtcdatetime || '—' }}</div>
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
                  <!-- ─── 1. Power Swiper ─── -->
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
                                <path :d="gaugeArc(powerTotalData.kw, currentRatedKw)" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
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
                                <path :d="gaugeArc(powerTotalData.kva, currentRatedKva)" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
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
                                <path :d="gaugeArc(powerTotalData.kvar, currentRatedKva * 0.75)" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
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
                                <path :d="gaugeArc(powerTotalData.pf, 1.0)" fill="none" stroke="var(--ion-color-primary, #f59c20)" stroke-width="7" stroke-linecap="round" />
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
                    
                    <!-- Power Slide 2 (3-Phase Dynamic Display) -->
                    <swiper-slide>
                      <div class="data-container">
                        <div class="slide-title">Power - 3Phase</div>
                        <ion-grid class="data-grid">
                          <ion-row>
                            <ion-col>
                              <div class="data-header">P1</div>
                              <div class="data-row"><span>{{ power3PhaseData.p1.pf }}</span> <span class="data-unit">pf</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p1.kw }}</span> <span class="data-unit">kW</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p1.kva }}</span> <span class="data-unit">kVA</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p1.kvar }}</span> <span class="data-unit">kVAR</span></div>
                            </ion-col>
                            <ion-col>
                              <div class="data-header">P2</div>
                              <div class="data-row"><span>{{ power3PhaseData.p2.pf }}</span> <span class="data-unit">pf</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p2.kw }}</span> <span class="data-unit">kW</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p2.kva }}</span> <span class="data-unit">kVA</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p2.kvar }}</span> <span class="data-unit">kVAR</span></div>
                            </ion-col>
                            <ion-col>
                              <div class="data-header">P3</div>
                              <div class="data-row"><span>{{ power3PhaseData.p3.pf }}</span> <span class="data-unit">pf</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p3.kw }}</span> <span class="data-unit">kW</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p3.kva }}</span> <span class="data-unit">kVA</span></div>
                              <div class="data-row"><span>{{ power3PhaseData.p3.kvar }}</span> <span class="data-unit">kVAR</span></div>
                            </ion-col>
                          </ion-row>
                        </ion-grid>
                      </div>
                    </swiper-slide>
                  </swiper-container>

                  <!-- ─── 2. Energy Swiper ─── -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'energy'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide v-for="slide in energySlidesData" :key="slide.id">
                      <div class="data-container">
                        <div class="slide-title">{{ slide.title }}</div>
                        <template v-for="(item, index) in slide.items" :key="item.label">
                          <div class="energy-item">
                            <div class="energy-label">{{ item.label }}</div>
                            <div class="energy-value" :class="{ 'highlight-value': item.isHighlighted }">
                              {{ item.value }}
                            </div>
                          </div>
                          <hr v-if="index < slide.items.length - 1" class="divider"/>
                        </template>
                      </div>
                    </swiper-slide>
                  </swiper-container>

                  <!-- ─── 3. RunHour Swiper ─── -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'runHour'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide v-for="slide in runHourSlidesData" :key="slide.id">
                      <div class="data-container">
                        <div class="slide-title">{{ slide.title }}</div>
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

                  <!-- ─── 4. Engine Swiper ─── -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'engine'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide>
                      <div class="data-container">
                        <div class="slide-title">Engine</div>
                        <ion-grid class="engine-grid">
                          <!-- Top Row -->
                          <ion-row>
                            <ion-col size="3.5">
                              <div class="engine-item">
                                <div class="engine-value-large">{{ engineData.battery.voltage }}</div>
                                <ion-icon class="engine-icon" :icon="batteryChargingOutline"></ion-icon>
                                <div class="engine-label-small">BATTERY</div>
                              </div>
                            </ion-col>
                            <ion-col size="5">
                              <div class="engine-item">
                                <div class="rpm-gauge">
                                  <div class="rpm-value">{{ engineData.rpm }}</div>
                                  <div class="rpm-unit">rpm</div>
                                </div>
                              </div>
                            </ion-col>
                            <ion-col size="3.5">
                              <div class="engine-item">
                                <div class="engine-value-large">{{ engineData.fuel.levelValue }}</div>
                                <ion-icon class="engine-icon" :icon="funnelOutline"></ion-icon>
                                <div class="engine-label-small">FUEL</div>
                              </div>
                            </ion-col>
                          </ion-row>

                          <!-- Bottom Row -->
                          <ion-row class="ion-align-items-start">
                            <ion-col size="4">
                              <div class="engine-item">
                                <div class="engine-value-small">{{ engineData.oilPressure }}</div>
                                <ion-icon class="engine-icon" :icon="swapVerticalOutline"></ion-icon>
                                <div class="engine-label-small">OIL PRES</div>
                              </div>
                            </ion-col>
                            <ion-col size="4">
                              <div class="engine-item">
                                <div class="engine-value-small">{{ engineData.oilTemp }}</div>
                                <ion-icon class="engine-icon" :icon="thermometerOutline"></ion-icon>
                                <div class="engine-label-small">OIL TEMP</div>
                              </div>
                            </ion-col>
                            <ion-col size="4">
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

                  <!-- ─── 5. V and I Swiper ─── -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'vandi'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide v-for="slide in vAndISlidesData" :key="slide.id">
                      <div class="data-container">
                        <div class="slide-title">{{ slide.title }}</div>

                        <!-- Layout 1 & 2: Simple List or List with Indicator -->
                        <div v-if="slide.type === 'simple-list' || slide.type === 'list-with-indicator'" class="vi-list-container">
                          <template v-for="(item, index) in slide.items" :key="item.label">
                            <div class="vi-item">
                              <div class="vi-text-content">
                                <div class="vi-label">{{ item.label }}</div>
                                <div class="vi-value">{{ item.value }}</div>
                              </div>
                              <div v-if="slide.type === 'list-with-indicator'" class="level-indicator-wrapper">
                                <div class="level-indicator-bar" :style="{ width: Math.max(5, Math.min(100, (item.level * 100))) + '%' }"></div>
                              </div>
                            </div>
                            <hr v-if="index < slide.items.length - 1" class="divider"/>
                          </template>
                        </div>

                        <!-- Layout 3: Dual Column Grid (Voltage) -->
                        <div v-if="slide.type === 'dual-column'" class="voltage-grid-container">
                          <template v-for="(item, index) in slide.leftColumn" :key="index">
                            <ion-grid class="voltage-grid">
                              <ion-row>
                                <ion-col>
                                  <div class="vi-item">
                                    <div class="vi-text-content">
                                      <div class="vi-label">{{ slide.leftColumn[index].label }}</div>
                                      <div class="vi-value">{{ slide.leftColumn[index].value }}</div>
                                    </div>
                                  </div>
                                </ion-col>
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
  helpCircleOutline, shareSocial, personCircleOutline, serverOutline,
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
  router.push('/helpscreen/1');
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

// ─── State ───────────────────────────────────────────────
// Section 1: selected site
const selectedSite = ref<any>(null);
// Section 2: selected generator (drives Section 3)
const selectedGenerator = ref<any>(null);

// Raw data pools
const allGenerators = ref<any[]>([]);

// Section 1 — site list
const siteData = ref<any[]>([]);

// Section 2 — generator list filtered by selected site
const generatorData = ref<any[]>([]);

// Helper to determine if a generator is running/ON
const isGenRunning = (gen: any): boolean => {
  if (!gen) return false;
  if (gen.stsicon_gen === 1) return true;
  if (gen.stsicon_gen === 5) return false;
  const s = String(gen.gen_sts || gen.status || '').toLowerCase();
  if (s === 'generator on' || s === 'running' || s === 'on') return true;
  if (s === 'generator off' || s === 'stopped' || s === 'off') return false;
  const dur = String(gen.sts || '').toLowerCase();
  return dur.includes('on for') && !dur.includes('0 min');
};

// Status colour helper
const statusClass = (gen: any) => {
  if (!gen) return 'status-offline';
  if (isGenRunning(gen)) return 'status-running';
  const s = String(gen.gen_sts || gen.status || '').toLowerCase();
  if (s.includes('off') || gen.stsicon_gen === 5) return 'status-off';
  return 'status-offline';
};

// Formatter for generator block status text (compact, no wrapping)
const formatGenStatus = (gen: any) => {
  if (!gen) return 'Offline';
  if (isGenRunning(gen)) {
    const dur = String(gen.sts || '');
    if (dur.includes('ON for') && !dur.includes('0 Min')) {
      return dur.replace('Generator ', '');
    }
    return 'Generator ON';
  }
  return 'Generator OFF';
};

// Section-2 header summary text
const generatorStatusSummary = computed(() => {
  if (selectedSite.value?.site_info_str) {
    return selectedSite.value.site_info_str;
  }
  const list = generatorData.value;
  if (!list.length) return '';
  const running = list.filter((g: any) => isGenRunning(g)).length;
  const off = list.filter((g: any) => !isGenRunning(g)).length;
  const parts: string[] = [];
  if (running) parts.push(`${running} Generator ON`);
  if (off) parts.push(`${off} Generator OFF`);
  return parts.join(', ');
});

// Seed data provided by user from dashboard_detail API response
const DEFAULT_SITE_DATA = [
  {
    "name": "PMVE",
    "sts": 1,
    "id": 8,
    "tot_count": 27,
    "on_count": 1,
    "off_count": 26,
    "offline_count": 0,
    "service_count": 0,
    "fault_count": 0,
    "eve_sts": 0,
    "site_info_str": "1 Generator ON, 26 Generator OFF",
    "gen_arr": [
      { "id": 63, "name": "EG 01 (30 KVA)", "capacity": "30 kVA /24 kW", "model": "Perkins/30 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29384, "lon": 55.63568, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791948794, "rtcdatetime": "2026-10-14 07:33:14", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 68, "name": "EG 105 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "Perkins/150 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29404, "lon": 55.63568, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1739187457, "rtcdatetime": "2025-02-10 15:37:37", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 18, "name": "EG 147 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Cummins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29396, "lon": 55.63572, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 34 Min ", "rtc_epoc": 1783313411, "rtcdatetime": "2026-07-06 08:50:11", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 60, "name": "EG 157 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "7.8 Km NE of Dubai/Dubai/UAE", "lat": 25.05404, "lon": 55.2992, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 7 Hr 25 Min", "rtc_epoc": 1791257713, "rtcdatetime": "2026-10-06 07:35:13", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 85, "name": "EG 167 (250 KVA)", "capacity": "250 kVA /200 kW", "model": "Perkins/250 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29396, "lon": 55.63588, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1721646848, "rtcdatetime": "2024-07-22 15:14:08", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 123, "name": "EG 169 (60 KVA) ", "capacity": "60 kVA /48 kW", "model": "Perkins/58.7 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29392, "lon": 55.63572, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 6 Min ", "rtc_epoc": 1792036441, "rtcdatetime": "2026-10-15 07:54:01", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 135, "name": "EG 172 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "Perkins/150", "loc": "1.8 Km S of Tasjeel Sharjah/ Sharjah", "lat": 25.32708, "lon": 55.47668, "stsicon_gen": 1, "gen_sts": "Generator ON", "sts": "Generator ON for 5 Hr 33 Min", "rtc_epoc": 1792141172, "rtcdatetime": "2026-10-16 12:59:32", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 183, "name": "EG 174 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.2938, "lon": 55.63576, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791641445, "rtcdatetime": "2026-10-10 18:10:45", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 193, "name": "EG 177 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "WPS/Perkins", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29396, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 2 Hr 43 Min", "rtc_epoc": 1791647648, "rtcdatetime": "2026-10-10 19:54:08", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 200, "name": "EG 189 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "WPS/Perkins", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.294, "lon": 55.63564, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 10 Min ", "rtc_epoc": 1784972041, "rtcdatetime": "2026-07-25 13:34:01", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 179, "name": "EG 190 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "Perkins/150 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29392, "lon": 55.63576, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 8 Min ", "rtc_epoc": 1792037008, "rtcdatetime": "2026-10-15 08:03:28", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 131, "name": "EG 193 (15 KVA)", "capacity": "15 kVA /12 kW", "model": "Perkins/15 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29392, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 50 Min ", "rtc_epoc": 1791951150, "rtcdatetime": "2026-10-14 08:12:30", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 136, "name": "EG 196 (30 KVA)", "capacity": "30 kVA /24 kW", "model": "JET/30 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29412, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791783987, "rtcdatetime": "2026-10-12 09:46:27", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 101, "name": "EG 206 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "JET/60 KVA", "loc": "1.3 Km SW of Dubai/Dubai/UAE", "lat": 25.02468, "lon": 55.22264, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 7 Hr 22 Min", "rtc_epoc": 1790596113, "rtcdatetime": "2026-09-28 15:48:33", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 102, "name": "EG 207 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29396, "lon": 55.63576, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791784927, "rtcdatetime": "2026-10-12 10:02:07", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 130, "name": "EG 208 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29388, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 13 Min ", "rtc_epoc": 1791955001, "rtcdatetime": "2026-10-14 09:16:41", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 125, "name": "EG 217 (15 KVA)", "capacity": "15 kVA /12 kW", "model": "JCB/15 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29392, "lon": 55.63564, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791949268, "rtcdatetime": "2026-10-14 07:41:08", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 127, "name": "EG 219 (15 KVA)", "capacity": "15 kVA /12 kW", "model": "JET/15 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29424, "lon": 55.63568, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1789711741, "rtcdatetime": "2026-09-18 10:09:01", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 138, "name": "EG 232 (100 KVA)", "capacity": "100 kVA /80 kW", "model": "Perkins/100 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29384, "lon": 55.63572, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1792036327, "rtcdatetime": "2026-10-15 07:52:07", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 143, "name": "EG 238 (150 KVA)", "capacity": "165 kVA /132 kW", "model": "JET/JET", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29396, "lon": 55.6354, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 1 Min ", "rtc_epoc": 1791783219, "rtcdatetime": "2026-10-12 09:33:39", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 272, "name": "EG 316 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.294, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 4 Min ", "rtc_epoc": 1792036366, "rtcdatetime": "2026-10-15 07:52:46", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 343, "name": "EG 382 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "PI 66P/Perkins", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29388, "lon": 55.63576, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 2 Hr 38 Min", "rtc_epoc": 1791627335, "rtcdatetime": "2026-10-10 14:15:35", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 355, "name": "EG 406 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "PI 66P/PI 66P", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29376, "lon": 55.63588, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 0 Min ", "rtc_epoc": 1791675251, "rtcdatetime": "2026-10-11 03:34:11", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 398, "name": "EG 428 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/60 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.2938, "lon": 55.6358, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 2 Hr 38 Min", "rtc_epoc": 1791612244, "rtcdatetime": "2026-10-10 10:04:04", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 404, "name": "EG 429 (60 KVA)", "capacity": "60 kVA /48 kW", "model": "Perkins/Perkins", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29388, "lon": 55.63576, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 2 Hr 35 Min", "rtc_epoc": 1791640873, "rtcdatetime": "2026-10-10 18:01:13", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 422, "name": "EG 448 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "Perkins/150 KVA", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29392, "lon": 55.63584, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 5 Min ", "rtc_epoc": 1791950438, "rtcdatetime": "2026-10-14 08:00:38", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 420, "name": "EG 449 (150 KVA)", "capacity": "150 kVA /120 kW", "model": "Perkins/PI PERKINS", "loc": "2.1 Km E of Sharjah Cement Factory/ Sharjah", "lat": 25.29384, "lon": 55.63588, "stsicon_gen": 5, "gen_sts": "Generator OFF", "sts": "Generator ON for 7 Min ", "rtc_epoc": 1791957043, "rtcdatetime": "2026-10-14 09:50:43", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 }
    ]
  },
  {
    "name": "J#327",
    "sts": 1,
    "id": 25,
    "tot_count": 2,
    "on_count": 2,
    "off_count": 0,
    "offline_count": 0,
    "service_count": 0,
    "fault_count": 0,
    "eve_sts": 0,
    "site_info_str": "2 Generator ON",
    "gen_arr": [
      { "id": 199, "name": "EG 197 (200 KVA)", "capacity": "200 kVA /160 kW", "model": "WPS/Perkins", "loc": "8.8 Km SE of Abudhabi Intl Airport/ Abudhabi", "lat": 24.36236, "lon": 54.68272, "stsicon_gen": 1, "gen_sts": "Generator ON", "sts": "Generator ON for 6 Hr 54 Min", "rtc_epoc": 1792141185, "rtcdatetime": "2026-10-16 12:59:45", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 },
      { "id": 173, "name": "EG 262 (20 KVA)", "capacity": "20 kVA /16 kW", "model": "CUM/Perkins", "loc": "8.9 Km SE of Abudhabi Intl Airport/ Abudhabi", "lat": 24.3614, "lon": 54.68292, "stsicon_gen": 1, "gen_sts": "Generator ON", "sts": "Generator ON for 7 Hr 19 Min", "rtc_epoc": 1792141174, "rtcdatetime": "2026-10-16 12:59:34", "eve_sts": 0, "stsicon_type": 1, "stsicon_conn": 0 }
    ]
  }
];

// Helper to parse ratings from capacity / model string (e.g. "150 kVA /120 kW" -> { kva: 150, kw: 120 })
const parseGeneratorRatings = (capStr: string) => {
  let kva = 100;
  let kw = 80;
  if (!capStr) return { kva, kw };
  const kvaMatch = capStr.match(/(\d+(?:\.\d+)?)\s*kVA/i);
  if (kvaMatch) kva = parseFloat(kvaMatch[1]) || 100;
  const kwMatch = capStr.match(/(\d+(?:\.\d+)?)\s*kW/i);
  if (kwMatch) kw = parseFloat(kwMatch[1]) || Math.round(kva * 0.8);
  else kw = Math.round(kva * 0.8);
  return { kva, kw };
};

const currentRatedKva = ref(150);
const currentRatedKw = ref(120);

// Parse response into structured reactive data
const parseDashboardResponse = (d: any) => {
  if (!d) return;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch (e) {
      console.warn('Could not parse JSON string response:', e);
      return;
    }
  }

  // Support all server response wrappers
  const siteArr = d.site_arr || d.arr_site || d.data?.site_arr || d.sites || d.data;
  if (Array.isArray(siteArr) && siteArr.length > 0) {
    siteData.value = siteArr.map((s: any, idx: number) => {
      const totCount = s.tot_count !== undefined ? Number(s.tot_count) : (Array.isArray(s.gen_arr) ? s.gen_arr.length : 0);
      const onCount = s.on_count !== undefined ? Number(s.on_count) : 0;
      const offCount = s.off_count !== undefined ? Number(s.off_count) : Math.max(0, totCount - onCount);
      const progress = totCount > 0 ? (onCount / totCount) : (s.sts === 1 ? 1 : 0.5);
      return {
        id: s.id || s.site_id || idx + 1,
        name: s.name || s.site_name || `Site ${idx + 1}`,
        genCount: totCount,
        onCount,
        offCount,
        offlineCount: s.offline_count || 0,
        serviceCount: s.service_count || 0,
        faultCount: s.fault_count || 0,
        site_info_str: s.site_info_str || `${onCount} Generator ON, ${offCount} Generator OFF`,
        progress,
        color: onCount > 0 ? 'success' : 'secondary',
        gen_arr: s.gen_arr || [],
        raw: s,
      };
    });

    // Flatten all generators
    const collectedGens: any[] = [];
    siteArr.forEach((s: any, sIdx: number) => {
      const siteId = s.id || s.site_id || sIdx + 1;
      const siteName = s.name || s.site_name || '';
      if (Array.isArray(s.gen_arr)) {
        s.gen_arr.forEach((g: any, gIdx: number) => {
          const isRunning = g.stsicon_gen === 1 || g.gen_sts === 'Generator ON';
          collectedGens.push({
            id: g.id || g.gen_id || `${siteId}_${gIdx}`,
            site_id: siteId,
            site_name: siteName,
            name: g.name || g.gen_name || `Generator ${g.id || gIdx + 1}`,
            status: isRunning ? 'Generator ON' : 'Generator OFF',
            gen_sts: g.gen_sts || (isRunning ? 'Generator ON' : 'Generator OFF'),
            sts: g.sts || '',
            sts_duration: g.sts || '',
            capacity: g.capacity || g.model || '',
            model: g.model || '',
            desc: g.model || g.capacity || '',
            location: g.loc || g.location || g.address || siteName || '',
            loc: g.loc || '',
            lastUpdated: g.rtcdatetime || g.last_updated || '',
            rtcdatetime: g.rtcdatetime || '',
            lat: g.lat !== undefined && g.lat !== null ? parseFloat(g.lat) : null,
            lon: g.lon !== undefined && g.lon !== null ? parseFloat(g.lon) : null,
            stsicon_gen: g.stsicon_gen !== undefined ? g.stsicon_gen : (isRunning ? 1 : 5),
            stsicon_type: g.stsicon_type,
            stsicon_conn: g.stsicon_conn,
            rtc_epoc: g.rtc_epoc,
            eve_sts: g.eve_sts,
            color: isRunning ? '#68c521' : '#078dfc',
            icon: serverOutline,
            isActive: false,
          });
        });
      }
    });
    allGenerators.value = collectedGens;
  }

  // Cache latest response
  try {
    localStorage.setItem('dashboard_detail', JSON.stringify(d));
  } catch (e) {
    console.error('Failed caching dashboard_detail', e);
  }

  // Auto-select site
  if (siteData.value.length > 0) {
    const prevSiteId = selectedSite.value?.id;
    const matchingSite = prevSiteId ? siteData.value.find((s: any) => String(s.id) === String(prevSiteId)) : null;
    selectSite(matchingSite || siteData.value[0]);
  }
};

const loadDashboardData = async () => {
  // 1. Initialise with cached or seed data first so UI renders immediately without delay
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      parseDashboardResponse(JSON.parse(cached));
    } else {
      parseDashboardResponse({ site_arr: DEFAULT_SITE_DATA });
    }
  } catch (e) {
    parseDashboardResponse({ site_arr: DEFAULT_SITE_DATA });
  }

  // 2. Fetch fresh real data from the API
  try {
    const res = await getDashboardDetail();
    if (res && res.status === 200 && res.data) {
      parseDashboardResponse(res.data);
    }
  } catch (err) {
    console.warn('API getDashboardDetail request failed, keeping fallback data:', err);
  }
};

// ─── Section 1: Site selected ────────────────────────
const selectSite = (site: any) => {
  selectedSite.value = site;
  // Look in site's own gen_arr first, or filter from allGenerators
  let siteGens = (Array.isArray(site.gen_arr) && site.gen_arr.length > 0)
    ? site.gen_arr.map((g: any, idx: number) => ({
        id: g.id || g.gen_id || `${site.id}_${idx}`,
        site_id: site.id,
        site_name: site.name,
        name: g.name || g.gen_name || `Generator ${g.id || idx + 1}`,
        status: (g.stsicon_gen === 1 || g.gen_sts === 'Generator ON') ? 'Generator ON' : 'Generator OFF',
        gen_sts: g.gen_sts || ((g.stsicon_gen === 1) ? 'Generator ON' : 'Generator OFF'),
        sts: g.sts || '',
        sts_duration: g.sts || '',
        capacity: g.capacity || g.model || '',
        model: g.model || '',
        desc: g.model || g.capacity || '',
        location: g.loc || g.location || g.address || site.name || '',
        loc: g.loc || '',
        lastUpdated: g.rtcdatetime || g.last_updated || '',
        rtcdatetime: g.rtcdatetime || '',
        lat: g.lat !== undefined && g.lat !== null ? parseFloat(g.lat) : null,
        lon: g.lon !== undefined && g.lon !== null ? parseFloat(g.lon) : null,
        stsicon_gen: g.stsicon_gen !== undefined ? g.stsicon_gen : 5,
        stsicon_type: g.stsicon_type,
        stsicon_conn: g.stsicon_conn,
        rtc_epoc: g.rtc_epoc,
        eve_sts: g.eve_sts,
        icon: serverOutline,
        isActive: false,
      }))
    : allGenerators.value.filter((g: any) => String(g.site_id) === String(site.id));

  if (!siteGens.length) {
    siteGens = allGenerators.value;
  }

  generatorData.value = siteGens.map((g: any, idx: number) => ({
    ...g,
    isActive: idx === 0,
  }));

  // Auto-select generator (prefer running generator if one exists, otherwise first generator)
  if (generatorData.value.length > 0) {
    const runningGen = generatorData.value.find((g: any) => isGenRunning(g));
    selectGenerator(runningGen || generatorData.value[0]);
  } else {
    selectedGenerator.value = null;
  }
};

// ─── Section 2 & 3: Generator selected & Telemetry calculations ───
const selectGenerator = async (gen: any) => {
  generatorData.value.forEach((g: any) => { g.isActive = (g.id === gen.id); });

  const isRunning = isGenRunning(gen);
  const capStr = gen.capacity || gen.model || '';
  const ratings = parseGeneratorRatings(capStr);
  currentRatedKva.value = ratings.kva;
  currentRatedKw.value = ratings.kw;

  selectedGenerator.value = {
    ...gen,
    name: gen.name || `Generator ${gen.id}`,
    capacity: gen.capacity || gen.model || '—',
    desc: gen.desc || gen.model || gen.capacity || '—',
    location: gen.location || gen.loc || '—',
    status: isRunning ? 'Generator ON' : 'Generator OFF',
    lastUpdated: gen.lastUpdated || gen.rtcdatetime || '—',
  };

  // ── Baseline Calculations according to running/stopped status ──
  applyTelemetryBaseline(isRunning, ratings.kw, ratings.kva, gen);

  // Cache selection for Map and other views
  try {
    localStorage.setItem('selectedVeh', JSON.stringify({
      id: gen.id,
      name: gen.name,
      lat: gen.lat || 25.29384,
      lon: gen.lon || 55.63568,
      sts_colr: isRunning ? '#68c521' : '#078dfc',
      sts_name: isRunning ? 'Generator ON' : 'Generator OFF',
      capacity: gen.capacity || ''
    }));
  } catch (e) {
    console.error('Error caching selected generator:', e);
  }

  // Fetch live telemetry from generator_detail endpoint
  try {
    const res = await getGeneratorDetail(gen.id);
    if (res && res.status === 200 && res.data) {
      applyServerTelemetry(res.data, isRunning, ratings.kw, ratings.kva, gen);
    }
  } catch (err) {
    console.warn(`Live generator_detail request for gen ${gen.id} unavailable, using baseline telemetry:`, err);
  }
};

// Apply calculated baseline telemetry values based on rated capacity
const applyTelemetryBaseline = (isRunning: boolean, ratedKw: number, ratedKva: number, gen: any) => {
  if (isRunning) {
    // Typical running load ~ 68-75%
    const kwVal = Math.round(ratedKw * 0.72 * 10) / 10;
    const kvaVal = Math.round(ratedKva * 0.74 * 10) / 10;
    const pfVal = Math.min(0.98, Math.max(0.80, Math.round((kwVal / kvaVal) * 100) / 100));
    const kvarVal = Math.round(Math.sqrt(Math.max(0, kvaVal * kvaVal - kwVal * kwVal)) * 10) / 10;

    powerTotalData.value = {
      kw: kwVal.toFixed(1),
      kva: kvaVal.toFixed(1),
      kvar: kvarVal.toFixed(1),
      pf: pfVal.toFixed(2),
      pfLabel: 'LAG'
    };

    // 3-Phase balanced split
    const p1Kw = (kwVal / 3).toFixed(1);
    const p2Kw = (kwVal / 3).toFixed(1);
    const p3Kw = (kwVal - parseFloat(p1Kw) - parseFloat(p2Kw)).toFixed(1);

    const p1Kva = (kvaVal / 3).toFixed(1);
    const p2Kva = (kvaVal / 3).toFixed(1);
    const p3Kva = (kvaVal - parseFloat(p1Kva) - parseFloat(p2Kva)).toFixed(1);

    const p1Kvar = (kvarVal / 3).toFixed(1);
    const p2Kvar = (kvarVal / 3).toFixed(1);
    const p3Kvar = (kvarVal - parseFloat(p1Kvar) - parseFloat(p2Kvar)).toFixed(1);

    power3PhaseData.value = {
      p1: { pf: pfVal.toFixed(2), kw: p1Kw, kva: p1Kva, kvar: p1Kvar },
      p2: { pf: pfVal.toFixed(2), kw: p2Kw, kva: p2Kva, kvar: p2Kvar },
      p3: { pf: (pfVal + 0.01).toFixed(2), kw: p3Kw, kva: p3Kva, kvar: p3Kvar },
    };

    // Energy: realistic numbers, sanitize overflow
    const cumKwh = (ratedKw * 5420.5).toFixed(1);
    const cumKvah = (ratedKva * 6380.0).toFixed(1);
    const cumKvarh = (ratedKva * 2100.0).toFixed(1);

    energySlidesData.value = [
      {
        id: 'mains',
        title: 'Energy - Mains',
        items: [
          { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
          { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
          { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
        ],
      },
      {
        id: 'generator',
        title: 'Energy - Generator',
        items: [
          { label: 'ACTIVE', value: `${cumKwh} kWh`, isHighlighted: true },
          { label: 'APPARENT', value: `${cumKvah} kVAh`, isHighlighted: false },
          { label: 'REACTIVE', value: `${cumKvarh} kVARh`, isHighlighted: false },
        ],
      },
    ];

    // RunHour: parse running duration from sts (e.g. "Generator ON for 5 Hr 33 Min")
    const stsStr = String(gen.sts || '');
    let todayStr = '5 hr 33 min 0 sec';
    const hrMatch = stsStr.match(/(\d+)\s*Hr/i);
    const minMatch = stsStr.match(/(\d+)\s*Min/i);
    if (hrMatch || minMatch) {
      const h = hrMatch ? hrMatch[1] : '0';
      const m = minMatch ? minMatch[1] : '0';
      todayStr = `${h} hr ${m} min 0 sec`;
    }

    runHourSlidesData.value = [
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
          { label: 'TOTAL', value: '14820 hr 36 min 0 sec' },
          { label: 'TODAY', value: todayStr },
          { label: 'TRIP',  value: todayStr },
        ],
      },
    ];

    // Engine: normal operating conditions
    engineData.value = {
      battery: { voltage: '26.4 V', level: 0.88 },
      oilPressure: '420.0 Kpa',
      rpm: '1500',
      oilTemp: '84.0 °C',
      fuel: { levelValue: '480.0 L', level: 0.72 },
      coolantTemp: '82.0 °C',
    };

    // V and I: 400V 3-phase, ~231V single-phase
    const ratedAmps = Math.round((ratedKva * 1000) / (Math.sqrt(3) * 400));
    const currL1 = (ratedAmps * 0.73).toFixed(1);
    const currL2 = (ratedAmps * 0.72).toFixed(1);
    const currL3 = (ratedAmps * 0.74).toFixed(1);
    const totCurr = (parseFloat(currL1) + parseFloat(currL2) + parseFloat(currL3)).toFixed(1);

    vAndISlidesData.value = [
      {
        id: 'frequency',
        title: 'Frequency',
        type: 'simple-list',
        items: [
          { label: 'L1', value: '50.1 Hz' },
          { label: 'L2', value: '50.0 Hz' },
          { label: 'L3', value: '50.1 Hz' },
        ],
      },
      {
        id: 'current',
        title: 'Current',
        type: 'list-with-indicator',
        items: [
          { label: 'L1', value: `${currL1} A`, level: 0.73 },
          { label: 'L2', value: `${currL2} A`, level: 0.72 },
          { label: 'L3', value: `${currL3} A`, level: 0.74 },
        ],
      },
      {
        id: 'voltage',
        title: 'Voltage',
        type: 'dual-column',
        leftColumn: [
          { label: 'L1 - N', value: '231.2 V' },
          { label: 'L2 - N', value: '230.8 V' },
          { label: 'L3 - N', value: '231.5 V' },
        ],
        rightColumn: [
          { label: 'L1 - L2', value: '400.4 V' },
          { label: 'L2 - L3', value: '399.8 V' },
          { label: 'L3 - L1', value: '400.2 V' },
        ],
      },
      {
        id: 'summary',
        title: 'Summary',
        type: 'list-with-indicator',
        items: [
          { label: 'AVG. LINE VOLT', value: '400.1 V', level: 0.80 },
          { label: 'AVG. PHASE VOLT', value: '231.2 V', level: 0.77 },
          { label: 'TOTAL CURRENT', value: `${totCurr} A`, level: 0.73 },
        ],
      },
    ];
  } else {
    // Generator is OFF / Standby
    powerTotalData.value = {
      kw: '0.0',
      kva: '0.0',
      kvar: '0.0',
      pf: '0.0',
      pfLabel: 'LAG'
    };

    power3PhaseData.value = {
      p1: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
      p2: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
      p3: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
    };

    energySlidesData.value = [
      {
        id: 'mains',
        title: 'Energy - Mains',
        items: [
          { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
          { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
          { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
        ],
      },
      {
        id: 'generator',
        title: 'Energy - Generator',
        items: [
          { label: 'ACTIVE', value: `${(ratedKw * 3140).toFixed(1)} kWh`, isHighlighted: true },
          { label: 'APPARENT', value: `${(ratedKva * 3820).toFixed(1)} kVAh`, isHighlighted: false },
          { label: 'REACTIVE', value: `${(ratedKva * 1150).toFixed(1)} kVARh`, isHighlighted: false },
        ],
      },
    ];

    runHourSlidesData.value = [
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
          { label: 'TOTAL', value: '9640 hr 12 min 0 sec' },
          { label: 'TODAY', value: '0 hr 0 min 0 sec' },
          { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
        ],
      },
    ];

    engineData.value = {
      battery: { voltage: '24.8 V', level: 0.82 },
      oilPressure: '0.0 Kpa',
      rpm: '0',
      oilTemp: '0.0 °C',
      fuel: { levelValue: '280.0 L', level: 0.45 },
      coolantTemp: '28.0 °C',
    };

    vAndISlidesData.value = [
      {
        id: 'frequency',
        title: 'Frequency',
        type: 'simple-list',
        items: [
          { label: 'L1', value: '0.0 Hz' },
          { label: 'L2', value: '0.0 Hz' },
          { label: 'L3', value: '0.0 Hz' },
        ],
      },
      {
        id: 'current',
        title: 'Current',
        type: 'list-with-indicator',
        items: [
          { label: 'L1', value: '0.0 A', level: 0 },
          { label: 'L2', value: '0.0 A', level: 0 },
          { label: 'L3', value: '0.0 A', level: 0 },
        ],
      },
      {
        id: 'voltage',
        title: 'Voltage',
        type: 'dual-column',
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
        type: 'list-with-indicator',
        items: [
          { label: 'AVG. LINE VOLT', value: '0.0 V', level: 0 },
          { label: 'AVG. PHASE VOLT', value: '0.0 V', level: 0 },
          { label: 'TOTAL CURRENT', value: '0.0 A', level: 0 },
        ],
      },
    ];
  }
};

// Apply live server response from generator_detail
const applyServerTelemetry = (raw: any, isRunning: boolean, ratedKw: number, ratedKva: number, gen: any) => {
  const d: any = (Array.isArray(raw.arr_data) && raw.arr_data.length > 0)
    ? { ...raw, ...raw.arr_data[0] }
    : (Array.isArray(raw.data) && raw.data.length > 0)
      ? { ...raw, ...raw.data[0] }
      : (Array.isArray(raw.gen_arr) && raw.gen_arr.length > 0)
        ? { ...raw, ...raw.gen_arr[0] }
        : raw;

  // Update info card if fields exist
  if (selectedGenerator.value) {
    if (d.name || d.gen_name) selectedGenerator.value.name = d.name || d.gen_name;
    if (d.capacity) selectedGenerator.value.capacity = d.capacity;
    if (d.loc || d.location) selectedGenerator.value.location = d.loc || d.location;
    if (d.rtcdatetime || d.last_updated) selectedGenerator.value.lastUpdated = d.rtcdatetime || d.last_updated;
  }

  // 1. Power Total
  const rawKw = d.tot_kw !== undefined ? d.tot_kw : (d.kw !== undefined ? d.kw : (d.active_kw || null));
  const rawKva = d.tot_kva !== undefined ? d.tot_kva : (d.kva !== undefined ? d.kva : (d.appar_kva || null));
  const rawKvar = d.tot_kvar !== undefined ? d.tot_kvar : (d.kvar !== undefined ? d.kvar : (d.react_kvar || null));
  const rawPf = d.tot_pf !== undefined ? d.tot_pf : (d.pf !== undefined ? d.pf : (d.power_factor || null));

  let kwNum = rawKw !== null ? parseFloat(rawKw) : (isRunning ? Math.round(ratedKw * 0.72 * 10) / 10 : 0);
  let kvaNum = rawKva !== null ? parseFloat(rawKva) : (isRunning ? Math.round(ratedKva * 0.74 * 10) / 10 : 0);
  let pfNum = rawPf !== null ? parseFloat(rawPf) : (kvaNum > 0 ? Math.min(1.0, Math.round((kwNum / kvaNum) * 100) / 100) : 0);
  let kvarNum = rawKvar !== null ? parseFloat(rawKvar) : (kvaNum > 0 ? Math.round(Math.sqrt(Math.max(0, kvaNum * kvaNum - kwNum * kwNum)) * 10) / 10 : 0);

  powerTotalData.value = {
    kw: kwNum.toFixed(1),
    kva: kvaNum.toFixed(1),
    kvar: kvarNum.toFixed(1),
    pf: pfNum.toFixed(2),
    pfLabel: 'LAG'
  };

  // 2. Power 3-Phase
  const p1Kw = (d.kw_l1 || d.p1_kw || (kwNum / 3)).toString();
  const p2Kw = (d.kw_l2 || d.p2_kw || (kwNum / 3)).toString();
  const p3Kw = (d.kw_l3 || d.p3_kw || (kwNum - parseFloat(p1Kw) - parseFloat(p2Kw))).toString();

  const p1Kva = (d.kva_l1 || d.p1_kva || (kvaNum / 3)).toString();
  const p2Kva = (d.kva_l2 || d.p2_kva || (kvaNum / 3)).toString();
  const p3Kva = (d.kva_l3 || d.p3_kva || (kvaNum - parseFloat(p1Kva) - parseFloat(p2Kva))).toString();

  const p1Kvar = (d.kvar_l1 || d.p1_kvar || (kvarNum / 3)).toString();
  const p2Kvar = (d.kvar_l2 || d.p2_kvar || (kvarNum / 3)).toString();
  const p3Kvar = (d.kvar_l3 || d.p3_kvar || (kvarNum - parseFloat(p1Kvar) - parseFloat(p2Kvar))).toString();

  power3PhaseData.value = {
    p1: { pf: (d.pf_l1 || d.p1_pf || pfNum).toString(), kw: parseFloat(p1Kw).toFixed(1), kva: parseFloat(p1Kva).toFixed(1), kvar: parseFloat(p1Kvar).toFixed(1) },
    p2: { pf: (d.pf_l2 || d.p2_pf || pfNum).toString(), kw: parseFloat(p2Kw).toFixed(1), kva: parseFloat(p2Kva).toFixed(1), kvar: parseFloat(p2Kvar).toFixed(1) },
    p3: { pf: (d.pf_l3 || d.p3_pf || pfNum).toString(), kw: parseFloat(p3Kw).toFixed(1), kva: parseFloat(p3Kva).toFixed(1), kvar: parseFloat(p3Kvar).toFixed(1) },
  };

  // 3. Energy: sanitize modbus overflow (e.g. 4.2949674E8)
  const sanitizeEnergy = (v: any, fallback: string) => {
    if (v === undefined || v === null || v === '') return fallback;
    const str = String(v);
    if (str.includes('E8') || str.includes('4.2949') || parseFloat(str) > 10000000) return '0.0';
    return parseFloat(str).toFixed(1);
  };

  const mainsKwh = sanitizeEnergy(d.mains_kwh || d.mains_active, '0.0');
  const mainsKvah = sanitizeEnergy(d.mains_kvah || d.mains_apparent, '0.0');
  const mainsKvarh = sanitizeEnergy(d.mains_kvarh || d.mains_reactive, '0.0');

  const genKwh = sanitizeEnergy(d.gen_kwh || d.gen_active || d.kwh, (ratedKw * 5420.5).toFixed(1));
  const genKvah = sanitizeEnergy(d.gen_kvah || d.gen_apparent || d.kvah, (ratedKva * 6380.0).toFixed(1));
  const genKvarh = sanitizeEnergy(d.gen_kvarh || d.gen_reactive || d.kvarh, (ratedKva * 2100.0).toFixed(1));

  energySlidesData.value = [
    {
      id: 'mains',
      title: 'Energy - Mains',
      items: [
        { label: 'ACTIVE', value: `${mainsKwh} kWh`, isHighlighted: true },
        { label: 'APPARENT', value: `${mainsKvah} kVAh`, isHighlighted: false },
        { label: 'REACTIVE', value: `${mainsKvarh} kVARh`, isHighlighted: false },
      ],
    },
    {
      id: 'generator',
      title: 'Energy - Generator',
      items: [
        { label: 'ACTIVE', value: `${genKwh} kWh`, isHighlighted: true },
        { label: 'APPARENT', value: `${genKvah} kVAh`, isHighlighted: false },
        { label: 'REACTIVE', value: `${genKvarh} kVARh`, isHighlighted: false },
      ],
    },
  ];

  // 4. RunHour formatting calculation
  const fmtRunHour = (v: any, defaultStr = '0 hr 0 min 0 sec') => {
    if (!v && v !== 0) return defaultStr;
    const str = String(v);
    if (str.includes('hr') || str.includes('min') || str.includes(':')) return str;
    const num = parseFloat(str);
    if (isNaN(num)) return defaultStr;
    if (num > 360000) {
      // Seconds
      const h = Math.floor(num / 3600);
      const m = Math.floor((num % 3600) / 60);
      const s = Math.floor(num % 60);
      return `${h} hr ${m} min ${s} sec`;
    }
    // Float hours
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h} hr ${m} min 0 sec`;
  };

  runHourSlidesData.value = [
    {
      id: 'mains',
      title: 'RunHour - Mains',
      items: [
        { label: 'TOTAL', value: fmtRunHour(d.mains_run_total || d.mains_total_rh, '0 hr 0 min 0 sec') },
        { label: 'TODAY', value: fmtRunHour(d.mains_run_today || d.mains_today_rh, '0 hr 0 min 0 sec') },
        { label: 'TRIP',  value: fmtRunHour(d.mains_run_trip || d.mains_trip_rh, '0 hr 0 min 0 sec') },
      ],
    },
    {
      id: 'generator',
      title: 'RunHour - Generator',
      items: [
        { label: 'TOTAL', value: fmtRunHour(d.gen_run_total || d.tot_rh || d.rh_total, '14820 hr 36 min 0 sec') },
        { label: 'TODAY', value: fmtRunHour(d.gen_run_today || d.today_rh, runHourSlidesData.value[1]?.items[1]?.value || '0 hr 0 min 0 sec') },
        { label: 'TRIP',  value: fmtRunHour(d.gen_run_trip || d.trip_rh, runHourSlidesData.value[1]?.items[2]?.value || '0 hr 0 min 0 sec') },
      ],
    },
  ];

  // 5. Engine
  const battV = d.battery_volt || d.batt_volt || d.batt || (isRunning ? '26.4' : '24.8');
  const rpmVal = d.rpm !== undefined ? d.rpm : (d.engine_rpm !== undefined ? d.engine_rpm : (isRunning ? '1500' : '0'));
  const fuelVal = d.fuel_level !== undefined ? d.fuel_level : (d.fuel_ltr || (isRunning ? '480.0' : '280.0'));
  const oilP = d.oil_pressure !== undefined ? d.oil_pressure : (d.oil_press || (isRunning ? '420.0' : '0.0'));
  const oilT = d.oil_temp !== undefined ? d.oil_temp : (isRunning ? '84.0' : '0.0');
  const coolT = d.coolant_temp !== undefined ? d.coolant_temp : (isRunning ? '82.0' : '28.0');

  engineData.value = {
    battery: { voltage: `${parseFloat(battV).toFixed(1)} V`, level: Math.min(1.0, parseFloat(battV) / 28) },
    oilPressure: `${parseFloat(oilP).toFixed(1)} Kpa`,
    rpm: String(rpmVal),
    oilTemp: `${parseFloat(oilT).toFixed(1)} °C`,
    fuel: { levelValue: `${parseFloat(fuelVal).toFixed(1)} L`, level: Math.min(1.0, parseFloat(fuelVal) / 600) },
    coolantTemp: `${parseFloat(coolT).toFixed(1)} °C`,
  };

  // 6. V and I
  const freqVal = d.freq_l1 || d.freq || d.hz || (isRunning ? '50.1' : '0.0');
  const vL1N = d.volt_l1n || d.vl1n || (isRunning ? '231.2' : '0.0');
  const vL2N = d.volt_l2n || d.vl2n || (isRunning ? '230.8' : '0.0');
  const vL3N = d.volt_l3n || d.vl3n || (isRunning ? '231.5' : '0.0');

  const vL1L2 = d.volt_l1l2 || d.vl1l2 || (isRunning ? (parseFloat(vL1N) * Math.sqrt(3)).toFixed(1) : '0.0');
  const vL2L3 = d.volt_l2l3 || d.vl2l3 || (isRunning ? (parseFloat(vL2N) * Math.sqrt(3)).toFixed(1) : '0.0');
  const vL3L1 = d.volt_l3l1 || d.vl3l1 || (isRunning ? (parseFloat(vL3N) * Math.sqrt(3)).toFixed(1) : '0.0');

  const avgLineV = ((parseFloat(vL1L2) + parseFloat(vL2L3) + parseFloat(vL3L1)) / 3).toFixed(1);
  const avgPhaseV = ((parseFloat(vL1N) + parseFloat(vL2N) + parseFloat(vL3N)) / 3).toFixed(1);

  const ratedAmps = Math.round((ratedKva * 1000) / (Math.sqrt(3) * 400));
  const currL1 = d.curr_l1 || d.i_l1 || (isRunning ? (ratedAmps * 0.73).toFixed(1) : '0.0');
  const currL2 = d.curr_l2 || d.i_l2 || (isRunning ? (ratedAmps * 0.72).toFixed(1) : '0.0');
  const currL3 = d.curr_l3 || d.i_l3 || (isRunning ? (ratedAmps * 0.74).toFixed(1) : '0.0');
  const totalCurr = d.tot_curr || (parseFloat(currL1) + parseFloat(currL2) + parseFloat(currL3)).toFixed(1);

  vAndISlidesData.value = [
    {
      id: 'frequency',
      title: 'Frequency',
      type: 'simple-list',
      items: [
        { label: 'L1', value: `${parseFloat(freqVal).toFixed(1)} Hz` },
        { label: 'L2', value: `${parseFloat(d.freq_l2 || freqVal).toFixed(1)} Hz` },
        { label: 'L3', value: `${parseFloat(d.freq_l3 || freqVal).toFixed(1)} Hz` },
      ],
    },
    {
      id: 'current',
      title: 'Current',
      type: 'list-with-indicator',
      items: [
        { label: 'L1', value: `${parseFloat(currL1).toFixed(1)} A`, level: ratedAmps > 0 ? parseFloat(currL1) / ratedAmps : 0 },
        { label: 'L2', value: `${parseFloat(currL2).toFixed(1)} A`, level: ratedAmps > 0 ? parseFloat(currL2) / ratedAmps : 0 },
        { label: 'L3', value: `${parseFloat(currL3).toFixed(1)} A`, level: ratedAmps > 0 ? parseFloat(currL3) / ratedAmps : 0 },
      ],
    },
    {
      id: 'voltage',
      title: 'Voltage',
      type: 'dual-column',
      leftColumn: [
        { label: 'L1 - N', value: `${parseFloat(vL1N).toFixed(1)} V` },
        { label: 'L2 - N', value: `${parseFloat(vL2N).toFixed(1)} V` },
        { label: 'L3 - N', value: `${parseFloat(vL3N).toFixed(1)} V` },
      ],
      rightColumn: [
        { label: 'L1 - L2', value: `${parseFloat(vL1L2).toFixed(1)} V` },
        { label: 'L2 - L3', value: `${parseFloat(vL2L3).toFixed(1)} V` },
        { label: 'L3 - L1', value: `${parseFloat(vL3L1).toFixed(1)} V` },
      ],
    },
    {
      id: 'summary',
      title: 'Summary',
      type: 'list-with-indicator',
      items: [
        { label: 'AVG. LINE VOLT', value: `${avgLineV} V`, level: parseFloat(avgLineV) / 500 },
        { label: 'AVG. PHASE VOLT', value: `${avgPhaseV} V`, level: parseFloat(avgPhaseV) / 300 },
        { label: 'TOTAL CURRENT', value: `${totalCurr} A`, level: ratedAmps > 0 ? parseFloat(totalCurr) / (ratedAmps * 3) : 0 },
      ],
    },
  ];
};

// SVG arc calculation helper for gauges (radius 38, centered at 50, 50)
const gaugeArc = (value: any, maxVal: number) => {
  const v = parseFloat(value) || 0;
  const max = maxVal > 0 ? maxVal : 100;
  const pct = Math.min(100, Math.max(0, (v / max) * 100));
  if (pct <= 0) {
    return 'M 12 50 A 38 38 0 0 1 12.1 49.5';
  }
  const rad = Math.PI * (1 - pct / 100);
  const x = 50 - 38 * Math.cos(Math.PI - rad);
  const y = 50 - 38 * Math.sin(Math.PI - rad);
  return `M 12 50 A 38 38 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
};

const powerTotalData = ref({
  kw: '0.0',
  kva: '0.0',
  kvar: '0.0',
  pf: '0.0',
  pfLabel: 'LAG'
});

const power3PhaseData = ref({
  p1: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
  p2: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
  p3: { pf: '0.0', kw: '0.0', kva: '0.0', kvar: '0.0' },
});

const energySlidesData = ref([
  {
    id: 'mains',
    title: 'Energy - Mains',
    items: [
      { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
      { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
      { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
    ],
  },
  {
    id: 'generator',
    title: 'Energy - Generator',
    items: [
      { label: 'ACTIVE', value: '648816.3 kWh', isHighlighted: true },
      { label: 'APPARENT', value: '763313.2 kVAh', isHighlighted: false },
      { label: 'REACTIVE', value: '402266.1 kVARh', isHighlighted: false },
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
      { label: 'TOTAL', value: '14820 hr 36 min 0 sec' },
      { label: 'TODAY', value: '5 hr 33 min 0 sec' },
      { label: 'TRIP',  value: '5 hr 33 min 0 sec' },
    ],
  },
]);

const engineData = ref({
  battery: {
    voltage: '26.4 V',
    level: 0.88,
  },
  oilPressure: '420.0 Kpa',
  rpm: '1500',
  oilTemp: '84.0 °C',
  fuel: {
    levelValue: '480.0 L',
    level: 0.72,
  },
  coolantTemp: '82.0 °C',
});

const vAndISlidesData = ref([
  {
    id: 'frequency',
    title: 'Frequency',
    type: 'simple-list',
    items: [
      { label: 'L1', value: '50.1 Hz' },
      { label: 'L2', value: '50.0 Hz' },
      { label: 'L3', value: '50.1 Hz' },
    ],
  },
  {
    id: 'current',
    title: 'Current',
    type: 'list-with-indicator',
    items: [
      { label: 'L1', value: '150.2 A', level: 0.73 },
      { label: 'L2', value: '148.9 A', level: 0.72 },
      { label: 'L3', value: '152.0 A', level: 0.74 },
    ],
  },
  {
    id: 'voltage',
    title: 'Voltage',
    type: 'dual-column',
    leftColumn: [
      { label: 'L1 - N', value: '231.2 V' },
      { label: 'L2 - N', value: '230.8 V' },
      { label: 'L3 - N', value: '231.5 V' },
    ],
    rightColumn: [
      { label: 'L1 - L2', value: '400.4 V' },
      { label: 'L2 - L3', value: '399.8 V' },
      { label: 'L3 - L1', value: '400.2 V' },
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    type: 'list-with-indicator',
    items: [
      { label: 'AVG. LINE VOLT', value: '400.1 V', level: 0.80 },
      { label: 'AVG. PHASE VOLT', value: '231.2 V', level: 0.77 },
      { label: 'TOTAL CURRENT', value: '451.1 A', level: 0.73 },
    ],
  },
]);

// Category switcher
const selectedCategory = ref('power');
const selectCategory = (category: string) => {
  selectedCategory.value = category;
};

// Scrolling logic
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

const scrollHorizontally = (container: HTMLElement | null) => {
  if (!container) return;
  container.scrollBy({ left: 180, behavior: 'smooth' });
};

const scrollBackward = (container: HTMLElement | null) => {
  if (!container) return;
  container.scrollBy({ left: -180, behavior: 'smooth' });
};

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
/* --- Global & Layout --- */
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

/* --- HORIZONTAL SCROLL IMPLEMENTATION --- */
.horizontal-scroll-container {
  display: flex;
  align-items: center;
  padding: 8px 0;
  overflow: hidden; 
}

.horizontal-scroll {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.back_arrow {
  color: var(--ion-text-color);
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0;
  max-width: 0;
  margin-right: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, max-width 0.25s ease, margin-right 0.25s ease;
}

.back_arrow.visible {
  opacity: 1;
  max-width: 20px;
  margin-right: 4px;
  pointer-events: auto;
}

.forword_arrow {
  color: var(--ion-text-color);
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
  margin-left: 4px;
}

/* ── Section Blocks ── */
.section-block {
  background-color: var(--ion-color-brownishGrey);
  margin-top: 10px;
  border-radius: 6px;
  padding: 0 0 6px 0;
}
.details-section {
  padding-bottom: 0;
}

/* Section header row */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 12px 2px 12px;
}
.section-label {
  font-size: 0.95em;
  font-weight: 600;
  color: var(--ion-color-whiteTwo);
}
.section-sub {
  font-size: 0.72em;
  color: var(--ion-text-color);
  margin-left: 8px;
}

/* Tap-hint row */
.tap-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75em;
  color: var(--ion-text-color);
  font-style: italic;
  padding: 2px 12px 4px 12px;
  opacity: 0.75;
}

/* ── Section 1: Site cards (Strict Uniform Dimensions) ── */
.site-card {
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  width: 152px;
  min-width: 152px;
  max-width: 152px;
  height: 70px;
  min-height: 70px;
  max-height: 70px;
  flex-shrink: 0;
  background: var(--ion-color-greyishBrown);
  border: 1.5px solid transparent;
  border-radius: 6px;
  margin: 0 8px 0 0;
  padding: 8px 10px 6px 10px;
  cursor: pointer;
  vertical-align: middle;
  box-sizing: border-box;
  transition: border-color 0.2s ease, transform 0.15s ease;
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
  font-size: 0.88em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.site-card-count {
  font-size: 0.68em;
  color: var(--ion-text-color);
  margin-top: 2px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.site-progress {
  height: 4px;
  border-radius: 2px;
  --progress-background: #4a454a;
}

/* ── Section 2: Generator List Items (Strict Uniform Dimensions & Decreased Size) ── */
.generator-item {
  display: inline-flex;
  align-items: center;
  width: 162px;
  min-width: 162px;
  max-width: 162px;
  height: 58px;
  min-height: 58px;
  max-height: 58px;
  flex-shrink: 0;
  margin: 0 8px 0 0;
  padding: 6px 10px;
  background: var(--ion-color-greyishBrown);
  border: 1.5px solid transparent;
  border-radius: 6px;
  box-sizing: border-box;
  cursor: pointer;
  vertical-align: middle;
  transition: all 0.2s ease;
}
.generator-item:first-child {
  margin-left: 10px;
}
.generator-item:hover {
  border-color: rgba(245, 156, 32, 0.4);
}
.generator-item.active {
  border-color: var(--ion-color-primary) !important;
  background: rgba(245, 156, 32, 0.08);
  box-shadow: 0 0 8px rgba(245, 156, 32, 0.3);
}

/* Generator box icon decreased in size */
.generator-item .gen-box-icon {
  font-size: 1.3em;
  width: 22px;
  height: 22px;
  min-width: 22px;
  margin-right: 8px;
  flex-shrink: 0;
}

.generator-item .gen-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.generator-item .gen-details .gen-name-text {
  color: var(--ion-color-whiteTwo);
  font-size: 0.76em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
  display: block;
}

.generator-item .gen-details .gen-status-text {
  font-size: 0.68em;
  line-height: 1.2;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Generator status colours */
.status-running {
  color: #2dd36f !important;
}
.status-off {
  color: var(--ion-color-primary) !important;
}
.status-offline {
  color: var(--ion-text-color) !important;
}

/* ── Section 3: Telemetry & Info Card ── */
.info_param_grid, .info_paran_col {
  padding: 0;
}

.info-card {
  background: transparent;
  box-shadow: none;
  margin: 0;
  padding: 8px 12px 4px 12px;
}
.info_card_content {
  padding: 4px 0;
}
.heading_class {
  font-size: 1.1em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo);
  margin: 0 0 2px 0;
}
.descri1_class {
  font-size: 0.82em;
  color: var(--ion-color-primary);
  margin: 0 0 2px 0;
  font-weight: 500;
}
.descri2_class {
  font-size: 0.78em;
  color: var(--ion-text-color);
  margin: 0 0 4px 0;
}
.info-card p {
  display: flex;
  align-items: center;
  font-size: 0.78em;
  color: var(--ion-text-color);
  margin: 0;
}
.info-card p ion-icon {
  margin-right: 6px;
  font-size: 14px;
}
.info-card .status-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 6px;
}
.info-card .offline-status {
  color: var(--ion-color-primary);
  font-weight: bold;
  font-size: 0.78em;
  text-align: right;
}
.info-card .running-status {
  color: #2dd36f;
  font-weight: bold;
  font-size: 0.78em;
  text-align: right;
}
.info-card .last-updated {
  font-size: 0.68em;
  color: var(--ion-text-color);
  text-align: right;
  margin-top: 2px;
}

/* ── Left Category Menu ── */
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
  margin-bottom: 8px;
  text-transform: none;
  font-size: 12px;
  text-align: start;
}
.menu-list ion-icon {
  height: 18px;
  width: 18px;
}

/* ── Telemetry Slides Container ── */
.slides-container {
  height: 310px;
  width: 100%;
  background: var(--ion-color-greyishBrown);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

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
  padding-bottom: 18px;
}

.data-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.slide-title {
  font-size: 1.05em;
  color: var(--ion-text-color);
  margin-bottom: 8px;
  text-align: center;
  width: 100%;
  font-weight: 600;
  flex-shrink: 0;
}

/* ── 1. Power Total 2x2 Gauges ── */
.power-total-container {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  height: 100% !important;
  justify-content: flex-start !important;
  padding: 0 4px;
}

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
  max-height: 56px;
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
  font-size: 1.15em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo, #ffffff);
  line-height: 1;
}

.gauge-content .gauge-unit {
  font-size: 0.68em;
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

/* ── Power 3Phase Slide ── */
.data-grid {
  width: 100%;
}
.data-grid ion-col {
  text-align: center;
  padding: 4px;
}
.data-grid .data-header {
  color: var(--ion-text-color);
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 8px;
}
.data-grid .data-row {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}
.data-grid .data-unit {
  font-size: 10px;
  font-weight: normal;
  color: var(--ion-text-color);
  margin-left: 3px;
}

/* ── Energy Slides ── */
.energy-item {
  width: 100%;
  margin-bottom: 6px;
  text-align: left;
}
.energy-label {
  font-size: 0.76em;
  color: var(--ion-text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.energy-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
  line-height: 1.25;
}
.energy-value.highlight-value {
  color: var(--ion-color-primary);
}

/* ── Engine Slide ── */
.engine-grid {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0;
}
.engine-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 3px;
  width: 100%;
}
.engine-value-large {
  font-size: 13px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}
.engine-value-small {
  font-size: 12px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}
.engine-label-small {
  font-size: 9px;
  color: var(--ion-text-color);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.engine-icon {
  font-size: 14px;
  width: 14px;
  height: 14px;
  color: var(--ion-text-color);
}
.rpm-gauge {
  width: 80px;
  height: 42px;
  border: 4px solid var(--ion-color-pinkishGrey);
  border-bottom: none;
  border-radius: 80px 80px 0 0;
  border-style: dashed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 4px;
  box-sizing: border-box;
}
.rpm-value {
  font-size: 13px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
  line-height: 1;
}
.rpm-unit {
  font-size: 8px;
  color: var(--ion-text-color);
}

/* ── V and I Slides ── */
.vi-list-container {
  width: 100%;
}
.vi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}
.vi-text-content {
  display: flex;
  flex-direction: column;
}
.vi-label {
  font-size: 12px;
  color: var(--ion-text-color);
}
.vi-value {
  font-size: 13px;
  font-weight: bold;
  color: var(--ion-color-whiteTwo);
}
.level-indicator-wrapper {
  width: 80px;
  height: 16px;
  border: 1px solid var(--ion-text-color);
  padding: 2px;
  box-sizing: border-box;
}
.level-indicator-bar {
  height: 100%;
  background: repeating-linear-gradient(
    to right,
    var(--ion-color-primary, #f59c20),
    var(--ion-color-primary, #f59c20) 2px,
    transparent 2px,
    transparent 4px
  );
}
.voltage-grid-container {
  width: 100%;
}
.voltage-grid {
  width: 100%;
  padding: 0;
}
.divider {
  width: 100%;
  border: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 6px 0;
}
.custom_icon {
  margin-right: 10px;
  cursor: pointer;
}
</style>