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

        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
        <!-- SECTION 1: Site List (always visible)       -->
        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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

        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
        <!-- SECTION 2: Generator List (shown after site click) -->
        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
        <div class="section-block" v-if="selectedSite">
          <div class="section-header">
            <span class="section-label">Generators â€” {{ selectedSite.name }}</span>
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
                <div class="gen-thumb-wrap">
                  <img
                    :src="getGenStatusImage(gen)"
                    :alt="gen.name"
                    class="gen-item-thumb"
                  />
                  <span class="gen-thumb-status-dot" :class="isGenRunning(gen) ? 'dot-on' : 'dot-off'"></span>
                </div>
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

        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
        <!-- SECTION 3: Generator Details (shown after generator click)    -->
        <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
        <div class="section-block details-section" v-if="selectedGenerator">
          <!-- Info Card with Generator Image -->
          <ion-card class="info-card">
            <ion-card-content class="info_card_content">
              <div class="gen-detail-header-flex">
                <div class="gen-detail-info-col">
                  <p class="heading_class">{{ selectedGenerator.name }}</p>
                  <p class="descri1_class">{{ selectedGenerator.capacity || selectedGenerator.model || 'â€”' }}</p>
                  <p class="descri2_class">{{ selectedGenerator.desc || selectedGenerator.model || selectedGenerator.capacity || 'â€”' }}</p>
                  <div class="status-line">
                    <p><ion-icon :icon="locationOutline"></ion-icon> {{ selectedGenerator.location || selectedGenerator.loc || 'â€”' }}</p>
                  </div>
                </div>
                <div class="gen-detail-img-col">
                  <img
                    :src="getGenStatusImage(selectedGenerator)"
                    :alt="selectedGenerator.name"
                    class="gen-detail-photo"
                  />
                  <div class="gen-img-badge" :class="isGenRunning(selectedGenerator) ? 'badge-running' : 'badge-stopped'">
                    {{ isGenRunning(selectedGenerator) ? 'RUNNING' : 'STOPPED' }}
                  </div>
                </div>
              </div>
              <div class="status-footer-line">
                <div :class="isGenRunning(selectedGenerator) ? 'running-status' : 'offline-status'">
                  {{ formatGenStatus(selectedGenerator) }}
                </div>
                <div class="last-updated">Last Updated - {{ selectedGenerator.lastUpdated || selectedGenerator.rtcdatetime || 'â€”' }}</div>
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
                  <!-- â”€â”€â”€ 1. Power Swiper â”€â”€â”€ -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'power'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <!-- Power Slide 1 (Full Page 2x2 Gauges) -->
                    <swiper-slide>
                      <div class="data-container power-total-container">
                        <div class="slide-title">Power - Total</div>
                        <div class="gauges-2x2-grid">
                          <!-- 1. kW Gauge -->
                          <div class="gauge-card">
                            <div class="circular-gauge-wrapper">
                              <img src="/cgb.png" class="circular-gauge-bg" alt="kw bg" />
                              <img :src="powerTotalData.kwGauge.layer1" class="circular-gauge-fill" alt="kw r1" />
                              <img :src="powerTotalData.kwGauge.layer2" class="circular-gauge-fill" alt="kw g2" />
                              <img :src="powerTotalData.kwGauge.layer3" class="circular-gauge-fill" alt="kw r3" />
                              <div class="circular-gauge-content">
                                <div class="circular-gauge-val" :class="{ 'power-alert-color': powerTotalData.kwAlert === 1 }">{{ powerTotalData.kw }}</div>
                                <div class="circular-gauge-unit" :class="{ 'power-alert-color': powerTotalData.kwAlert === 1 }">{{ powerTotalData.kwUnit }}</div>
                              </div>
                              <img v-if="powerTotalData.kwAlertImg" :src="powerTotalData.kwAlertImg" class="power-alert-badge" alt="kw alert" />
                            </div>
                          </div>

                          <!-- 2. kVA Gauge -->
                          <div class="gauge-card">
                            <div class="circular-gauge-wrapper">
                              <img src="/cgb.png" class="circular-gauge-bg" alt="kva bg" />
                              <img :src="powerTotalData.kvaGauge.layer1" class="circular-gauge-fill" alt="kva r1" />
                              <img :src="powerTotalData.kvaGauge.layer2" class="circular-gauge-fill" alt="kva g2" />
                              <img :src="powerTotalData.kvaGauge.layer3" class="circular-gauge-fill" alt="kva r3" />
                              <div class="circular-gauge-content">
                                <div class="circular-gauge-val" :class="{ 'power-alert-color': powerTotalData.kvaAlert === 1 }">{{ powerTotalData.kva }}</div>
                                <div class="circular-gauge-unit" :class="{ 'power-alert-color': powerTotalData.kvaAlert === 1 }">{{ powerTotalData.kvaUnit }}</div>
                              </div>
                              <img v-if="powerTotalData.kvaAlertImg" :src="powerTotalData.kvaAlertImg" class="power-alert-badge" alt="kva alert" />
                            </div>
                          </div>

                          <!-- 3. kVAR Gauge -->
                          <div class="gauge-card">
                            <div class="circular-gauge-wrapper">
                              <img src="/cgb.png" class="circular-gauge-bg" alt="kvar bg" />
                              <img :src="powerTotalData.kvarGauge.layer1" class="circular-gauge-fill" alt="kvar r1" />
                              <img :src="powerTotalData.kvarGauge.layer2" class="circular-gauge-fill" alt="kvar g2" />
                              <img :src="powerTotalData.kvarGauge.layer3" class="circular-gauge-fill" alt="kvar r3" />
                              <div class="circular-gauge-content">
                                <div class="circular-gauge-val" :class="{ 'power-alert-color': powerTotalData.kvarAlert === 1 }">{{ powerTotalData.kvar }}</div>
                                <div class="circular-gauge-unit" :class="{ 'power-alert-color': powerTotalData.kvarAlert === 1 }">{{ powerTotalData.kvarUnit }}</div>
                              </div>
                              <img v-if="powerTotalData.kvarAlertImg" :src="powerTotalData.kvarAlertImg" class="power-alert-badge" alt="kvar alert" />
                            </div>
                          </div>

                          <!-- 4. pf Gauge -->
                          <div class="gauge-card">
                            <div class="circular-gauge-wrapper">
                              <img :src="powerTotalData.pfGaugeImg" class="circular-gauge-bg" alt="pf icon" />
                              <div class="circular-gauge-content1">
                                <div class="circular-gauge-val" :class="{ 'power-alert-color': powerTotalData.pfAlert === 1 }">{{ powerTotalData.pf }}</div>
                                <div class="circular-gauge-unit" :class="{ 'power-alert-color': powerTotalData.pfAlert === 1 }">
                                  {{ powerTotalData.pfUnit }}
                                  <span v-if="powerTotalData.showPfLag" class="pf-lag-text">{{ powerTotalData.pfLabel }}</span>
                                </div>
                              </div>
                              <img v-if="powerTotalData.pfAlertImg" :src="powerTotalData.pfAlertImg" class="power-alert-badge" alt="pf alert" />
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
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p1.pfAlert === 1 }">
                                <span>{{ power3PhaseData.p1.pf }}</span> <span class="data-unit">{{ power3PhaseData.p1.pfUnit }}</span>
                                <img v-if="power3PhaseData.p1.pfAlertImg" :src="power3PhaseData.p1.pfAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p1.kwAlert === 1 }">
                                <span>{{ power3PhaseData.p1.kw }}</span> <span class="data-unit">{{ power3PhaseData.p1.kwUnit }}</span>
                                <img v-if="power3PhaseData.p1.kwAlertImg" :src="power3PhaseData.p1.kwAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p1.kvaAlert === 1 }">
                                <span>{{ power3PhaseData.p1.kva }}</span> <span class="data-unit">{{ power3PhaseData.p1.kvaUnit }}</span>
                                <img v-if="power3PhaseData.p1.kvaAlertImg" :src="power3PhaseData.p1.kvaAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p1.kvarAlert === 1 }">
                                <span>{{ power3PhaseData.p1.kvar }}</span> <span class="data-unit">{{ power3PhaseData.p1.kvarUnit }}</span>
                                <img v-if="power3PhaseData.p1.kvarAlertImg" :src="power3PhaseData.p1.kvarAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                            </ion-col>
                            <ion-col>
                              <div class="data-header">P2</div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p2.pfAlert === 1 }">
                                <span>{{ power3PhaseData.p2.pf }}</span> <span class="data-unit">{{ power3PhaseData.p2.pfUnit }}</span>
                                <img v-if="power3PhaseData.p2.pfAlertImg" :src="power3PhaseData.p2.pfAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p2.kwAlert === 1 }">
                                <span>{{ power3PhaseData.p2.kw }}</span> <span class="data-unit">{{ power3PhaseData.p2.kwUnit }}</span>
                                <img v-if="power3PhaseData.p2.kwAlertImg" :src="power3PhaseData.p2.kwAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p2.kvaAlert === 1 }">
                                <span>{{ power3PhaseData.p2.kva }}</span> <span class="data-unit">{{ power3PhaseData.p2.kvaUnit }}</span>
                                <img v-if="power3PhaseData.p2.kvaAlertImg" :src="power3PhaseData.p2.kvaAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p2.kvarAlert === 1 }">
                                <span>{{ power3PhaseData.p2.kvar }}</span> <span class="data-unit">{{ power3PhaseData.p2.kvarUnit }}</span>
                                <img v-if="power3PhaseData.p2.kvarAlertImg" :src="power3PhaseData.p2.kvarAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                            </ion-col>
                            <ion-col>
                              <div class="data-header">P3</div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p3.pfAlert === 1 }">
                                <span>{{ power3PhaseData.p3.pf }}</span> <span class="data-unit">{{ power3PhaseData.p3.pfUnit }}</span>
                                <img v-if="power3PhaseData.p3.pfAlertImg" :src="power3PhaseData.p3.pfAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p3.kwAlert === 1 }">
                                <span>{{ power3PhaseData.p3.kw }}</span> <span class="data-unit">{{ power3PhaseData.p3.kwUnit }}</span>
                                <img v-if="power3PhaseData.p3.kwAlertImg" :src="power3PhaseData.p3.kwAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p3.kvaAlert === 1 }">
                                <span>{{ power3PhaseData.p3.kva }}</span> <span class="data-unit">{{ power3PhaseData.p3.kvaUnit }}</span>
                                <img v-if="power3PhaseData.p3.kvaAlertImg" :src="power3PhaseData.p3.kvaAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                              <div class="data-row" :class="{ 'power-alert-color': power3PhaseData.p3.kvarAlert === 1 }">
                                <span>{{ power3PhaseData.p3.kvar }}</span> <span class="data-unit">{{ power3PhaseData.p3.kvarUnit }}</span>
                                <img v-if="power3PhaseData.p3.kvarAlertImg" :src="power3PhaseData.p3.kvarAlertImg" class="phase-alert-badge" alt="alert" />
                              </div>
                            </ion-col>
                          </ion-row>
                        </ion-grid>
                      </div>
                    </swiper-slide>
                  </swiper-container>

                  <!-- â”€â”€â”€ 2. Energy Swiper â”€â”€â”€ -->
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

                  <!-- â”€â”€â”€ 3. RunHour Swiper â”€â”€â”€ -->
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

                  <!-- â”€â”€â”€ 4. Engine Swiper â”€â”€â”€ -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'engine'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide>
                      <div class="data-container">
                        <div class="slide-title">Engine</div>
                        <ion-grid class="engine-grid">
                          <!-- Top Row -->
                          <ion-row class="ion-align-items-center">
                            <!-- 1. Battery -->
                            <ion-col size="3.5">
                              <div class="engine-item">
                                <div class="engine-val-top" :class="{ 'power-alert-color': engineData.battery.isAlert }">{{ engineData.battery.voltage }}</div>
                                <div class="engine-vbar-container">
                                  <img src="/vbgb.png" class="engine-vbar-bg" alt="batt vbar bg" />
                                  <img :src="engineData.battery.gauge.layer1" class="engine-vbar-fill" alt="batt r1" />
                                   <img :src="engineData.battery.gauge.layer2" class="engine-vbar-fill" alt="batt g2" />
                                   <img :src="engineData.battery.gauge.layer3" class="engine-vbar-fill" alt="batt r3" />
                                  <img v-if="engineData.battery.alertImg" :src="engineData.battery.alertImg" class="engine-alert-badge" alt="batt alert" />
                                </div>
                                <img src="/icon_batt.png" class="engine-item-icon" alt="battery" />
                                <div class="engine-label-small">BATTERY</div>
                              </div>
                            </ion-col>

                            <!-- 2. RPM -->
                            <ion-col size="5">
                              <div class="engine-item">
                                <div class="rpm-gauge-wrapper">
                                  <img src="/cgb.png" class="rpm-circle-bg" alt="rpm bg" />
                                  <img :src="engineData.rpmGauge.layer1" class="rpm-circle-fill" alt="rpm r1" />
                                   <img :src="engineData.rpmGauge.layer2" class="rpm-circle-fill" alt="rpm g2" />
                                   <img :src="engineData.rpmGauge.layer3" class="rpm-circle-fill" alt="rpm r3" />
                                  <div class="rpm-inner-text">
                                    <div class="rpm-value" :class="{ 'power-alert-color': engineData.rpmAlert }">{{ engineData.rpm }}</div>
                                    <div class="rpm-unit" :class="{ 'power-alert-color': engineData.rpmAlert }">{{ engineData.rpmUnit || 'rpm' }}</div>
                                  </div>
                                  <img v-if="engineData.rpmAlertImg" :src="engineData.rpmAlertImg" class="engine-alert-badge rpm-alert" alt="rpm alert" />
                                </div>
                              </div>
                            </ion-col>

                            <!-- 3. Fuel -->
                            <ion-col size="3.5">
                              <div class="engine-item">
                                <div class="engine-val-top" :class="{ 'power-alert-color': engineData.fuel.isAlert }">{{ engineData.fuel.levelValue }}</div>
                                <div class="engine-vbar-container">
                                  <img src="/vbgb.png" class="engine-vbar-bg" alt="fuel vbar bg" />
                                  <img :src="engineData.fuel.gauge.layer1" class="engine-vbar-fill" alt="fuel r1" />
                                   <img :src="engineData.fuel.gauge.layer2" class="engine-vbar-fill" alt="fuel g2" />
                                   <img :src="engineData.fuel.gauge.layer3" class="engine-vbar-fill" alt="fuel r3" />
                                  <img v-if="engineData.fuel.alertImg" :src="engineData.fuel.alertImg" class="engine-alert-badge" alt="fuel alert" />
                                </div>
                                <img src="/icon_fuel.png" class="engine-item-icon" alt="fuel" />
                                <div class="engine-label-small">FUEL</div>
                              </div>
                            </ion-col>
                          </ion-row>

                          <!-- Bottom Row -->
                          <ion-row class="ion-align-items-center">
                            <!-- 4. Oil Pressure -->
                            <ion-col size="4">
                              <div class="engine-item">
                                <div class="engine-val-top" :class="{ 'power-alert-color': engineData.oilPresAlert }">{{ engineData.oilPressure }}</div>
                                <div class="engine-vbar-container">
                                  <img src="/vbgb.png" class="engine-vbar-bg" alt="oil pres vbar bg" />
                                  <img :src="engineData.oilPresGauge.layer1" class="engine-vbar-fill" alt="oilp r1" />
                                   <img :src="engineData.oilPresGauge.layer2" class="engine-vbar-fill" alt="oilp g2" />
                                   <img :src="engineData.oilPresGauge.layer3" class="engine-vbar-fill" alt="oilp r3" />
                                  <img v-if="engineData.oilPresAlertImg" :src="engineData.oilPresAlertImg" class="engine-alert-badge" alt="oil pres alert" />
                                </div>
                                <img src="/icon_oil_pres.png" class="engine-item-icon" alt="oil pressure" />
                                <div class="engine-label-small">OIL PRES</div>
                              </div>
                            </ion-col>

                            <!-- 5. Oil Temp -->
                            <ion-col size="4">
                              <div class="engine-item">
                                <div class="engine-val-top" :class="{ 'power-alert-color': engineData.oilTempAlert }">{{ engineData.oilTemp }}</div>
                                <div class="engine-vbar-container">
                                  <img src="/vbgb.png" class="engine-vbar-bg" alt="oil temp vbar bg" />
                                  <img :src="engineData.oilTempGauge.layer1" class="engine-vbar-fill" alt="oilt r1" />
                                   <img :src="engineData.oilTempGauge.layer2" class="engine-vbar-fill" alt="oilt g2" />
                                   <img :src="engineData.oilTempGauge.layer3" class="engine-vbar-fill" alt="oilt r3" />
                                  <img v-if="engineData.oilTempAlertImg" :src="engineData.oilTempAlertImg" class="engine-alert-badge" alt="oil temp alert" />
                                </div>
                                <img src="/icon_oil_temp.png" class="engine-item-icon" alt="oil temp" />
                                <div class="engine-label-small">OIL TEMP</div>
                              </div>
                            </ion-col>

                            <!-- 6. Coolant Temp -->
                            <ion-col size="4">
                              <div class="engine-item">
                                <div class="engine-val-top" :class="{ 'power-alert-color': engineData.coolTempAlert }">{{ engineData.coolantTemp }}</div>
                                <div class="engine-vbar-container">
                                  <img src="/vbgb.png" class="engine-vbar-bg" alt="cool temp vbar bg" />
                                  <img :src="engineData.coolantTempGauge.layer1" class="engine-vbar-fill" alt="coolt r1" />
                                   <img :src="engineData.coolantTempGauge.layer2" class="engine-vbar-fill" alt="coolt g2" />
                                   <img :src="engineData.coolantTempGauge.layer3" class="engine-vbar-fill" alt="coolt r3" />
                                  <img v-if="engineData.coolantTempAlertImg" :src="engineData.coolantTempAlertImg" class="engine-alert-badge" alt="cool temp alert" />
                                </div>
                                <img src="/icon_cool_temp.png" class="engine-item-icon" alt="coolant temp" />
                                <div class="engine-label-small">COOLANT TEMP</div>
                              </div>
                            </ion-col>
                          </ion-row>
                        </ion-grid>
                      </div>
                    </swiper-slide>
                  </swiper-container>

                  <!-- â”€â”€â”€ 5. V and I Swiper â”€â”€â”€ -->
                  <swiper-container :key="selectedCategory" v-if="selectedCategory === 'vandi'" :slides-per-view="1" :pagination="{ clickable: true }">
                    <swiper-slide v-for="slide in vAndISlidesData" :key="slide.id">
                      <div class="data-container">
                        <div class="slide-title">{{ slide.title }}</div>

                        <!-- Layout 1 & 2: Simple List or List with Indicator -->
                      <!-- Around line 463 to 476 -->
<div v-if="slide.type === 'simple-list' || slide.type === 'list-with-indicator'" class="vi-list-container">
  <template v-for="(item, index) in slide.items" :key="item.label">
    <div class="vi-item">
      <div class="vi-text-content">
        <div class="vi-label">{{ item.label }}</div>
        <div class="vi-value" :class="{ 'vi-alert-color': item.isAlert }">
          {{ item.value }}
          <img v-if="item.alertImg" :src="item.alertImg" class="vi-alert-badge" alt="alarm" />
        </div>
      </div>
      <div v-if="slide.type === 'list-with-indicator'" class="vi-barchart-container">
        <img src="/bgb.png" class="vi-barchart-bg" alt="barchart bg" />
        <img :src="item.gauge ? item.gauge.layer1 : '/bgr_0.png'" class="vi-barchart-fill" alt="barchart r1" />
        <img :src="item.gauge ? item.gauge.layer2 : '/bgg_0.png'" class="vi-barchart-fill" alt="barchart g2" />
        <img :src="item.gauge ? item.gauge.layer3 : '/bgr_0.png'" class="vi-barchart-fill" alt="barchart r3" />
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
                                      <div class="vi-value" :class="{ 'vi-alert-color': slide.leftColumn[index].isAlert }">
                                        {{ slide.leftColumn[index].value }}
                                        <img v-if="slide.leftColumn[index].alertImg" :src="slide.leftColumn[index].alertImg" class="vi-alert-badge" alt="alarm" />
                                      </div>
                                    </div>
                                  </div>
                                </ion-col>
                                <ion-col>
                                  <div class="vi-item">
                                    <div class="vi-text-content">
                                      <div class="vi-label">{{ slide.rightColumn[index].label }}</div>
                                      <div class="vi-value" :class="{ 'vi-alert-color': slide.rightColumn[index].isAlert }">
                                        {{ slide.rightColumn[index].value }}
                                        <img v-if="slide.rightColumn[index].alertImg" :src="slide.rightColumn[index].alertImg" class="vi-alert-badge" alt="alarm" />
                                      </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import router from '@/router/index';
import { getDashboardDetail, getGeneratorDetail } from '@/services/ApiService';
import { register as registerSwiperElements } from 'swiper/element/bundle';

registerSwiperElements();

// --- Ionic Vue Imports ---
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent,
  IonProgressBar, IonGrid, IonRow, IonCol, IonList,
  onIonViewDidEnter, onIonViewDidLeave,
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

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Section 1: selected site
const selectedSite = ref<any>(null);
// Section 2: selected generator (drives Section 3)
const selectedGenerator = ref<any>(null);

// Raw data pools
const allGenerators = ref<any[]>([]);

// Section 1 â€” site list
const siteData = ref<any[]>([]);

// Section 2 â€” generator list filtered by selected site
const generatorData = ref<any[]>([]);

// Helper to determine if a generator is running/ON
const isGenRunning = (gen: any): boolean => {
  if (!gen) return false;
  const stsicon = Number(gen.stsicon_gen ?? gen.stsiconGen ?? 0);
  if (stsicon === 1) return true;
  if (stsicon === 2 || stsicon === 5 || stsicon === 6) {
    const s = String(gen.gen_sts || gen.status || gen.sts || '').toLowerCase();
    if (s.includes('generator on') || s.includes('running') || (s.includes('on for') && !s.includes('0 min'))) {
      return true;
    }
    return false;
  }
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
  const s = String(gen.gen_sts || gen.status || gen.sts || '').toLowerCase();
  if (s.includes('off') || gen.stsicon_gen === 2) return 'status-off';
  return 'status-offline';
};

// Formatter for generator block status text (matching Android txtGenSts and getGenSts)
const formatGenStatus = (gen: any) => {
  if (!gen) return 'Offline';
  const sts = String(gen.sts || '').trim();
  if (sts && sts !== '—' && sts !== '-') {
    return sts;
  }
  const genSts = String(gen.gen_sts || gen.status || '').trim();
  if (genSts && genSts !== '—' && genSts !== '-') {
    return genSts;
  }
  if (isGenRunning(gen)) {
    return 'Generator ON';
  }
  return 'Generator OFF';
};

// Generator status image icon matching Android generatorAdapter.java & generator details
const getGenStatusImage = (gen: any) => {
  if (!gen) return '/ic_gen_off.png';
  const stsicon = Number(gen.stsicon_gen ?? gen.stsiconGen ?? 0);
  if (stsicon === 1) return '/ic_gen_on.png';
  if (stsicon === 2) return '/ic_gen_off.png';
  if (stsicon === 3) return '/ic_service.png';
  if (stsicon === 4) return '/ic_mains_on.png';
  if (stsicon === 5 || stsicon === 6) return '/ic_gen_offline.png';

  const s = String(gen.gen_sts || gen.status || gen.sts || '').toLowerCase();
  if (s.includes('service')) return '/ic_service.png';
  if (s.includes('offline')) return '/ic_gen_offline.png';
  if (s.includes('mains on')) return '/ic_mains_on.png';
  if (isGenRunning(gen)) return '/ic_gen_on.png';
  return '/ic_gen_off.png';
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
            stsicon_gen: g.stsicon_gen !== undefined ? g.stsicon_gen : (g.stsiconGen !== undefined ? g.stsiconGen : (isRunning ? 1 : 2)),
            stsicon_type: g.stsicon_type,
            stsicon_conn: g.stsicon_conn,
            rtc_epoc: g.rtc_epoc,
            eve_sts: g.eve_sts,
            color: isRunning ? '#68c521' : '#078dfc',
            icon: serverOutline,
            image: g.image || g.img || g.gen_image || g.image_url || g.photo || '/generator_default.jpg',
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
  // 1. Try loading from localStorage cache for instant render
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      parseDashboardResponse(JSON.parse(cached));
    }
  } catch (e) {
    console.warn('Could not read cached dashboard_detail:', e);
  }

  // 2. Fetch fresh real data from the API
  try {
    const res = await getDashboardDetail();
    if (res && res.status === 200 && res.data) {
      parseDashboardResponse(res.data);
    }
  } catch (err) {
    console.warn('API getDashboardDetail request failed:', err);
  }
};

// â”€â”€â”€ Section 1: Site selected â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        stsicon_gen: g.stsicon_gen !== undefined ? g.stsicon_gen : (g.stsiconGen !== undefined ? g.stsiconGen : ((g.gen_sts === 'Generator ON' || g.status === 'Generator ON') ? 1 : 2)),
        stsicon_type: g.stsicon_type,
        stsicon_conn: g.stsicon_conn,
        rtc_epoc: g.rtc_epoc,
        eve_sts: g.eve_sts,
        icon: serverOutline,
        image: g.image || g.img || g.gen_image || g.image_url || g.photo || '/generator_default.jpg',
        isActive: false,
      }))
    : allGenerators.value.filter((g: any) => String(g.site_id) === String(site.id));

  if (!siteGens.length) {
    siteGens = allGenerators.value;
  }

  // Preserve existing selected generator if it exists in the newly loaded list
  const currentGenId = selectedGenerator.value?.id;
  generatorData.value = siteGens.map((g: any) => ({
    ...g,
    isActive: currentGenId ? String(g.id) === String(currentGenId) : false,
  }));

  const existingGen = currentGenId
    ? generatorData.value.find((g: any) => String(g.id) === String(currentGenId))
    : null;

  // Auto-select generator (prefer currently selected, then running generator if one exists, otherwise first generator)
  if (generatorData.value.length > 0) {
    if (existingGen) {
      selectGenerator(existingGen);
    } else {
      const runningGen = generatorData.value.find((g: any) => isGenRunning(g));
      selectGenerator(runningGen || generatorData.value[0]);
    }
  } else {
    selectedGenerator.value = null;
  }
};

// â”€â”€â”€ Section 2 & 3: Generator selected & Telemetry calculations â”€â”€â”€
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
    capacity: gen.capacity || gen.model || 'â€”',
    desc: gen.desc || gen.model || gen.capacity || 'â€”',
    location: gen.location || gen.loc || 'â€”',
    image: gen.image || gen.img || gen.gen_image || '/generator_default.jpg',
    status: isRunning ? 'Generator ON' : 'Generator OFF',
    lastUpdated: gen.lastUpdated || gen.rtcdatetime || 'â€”',
  };

  // â”€â”€ Baseline Calculations according to running/stopped status â”€â”€
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
      console.log("dataDisplayGen",res.data);
      applyServerTelemetry(res.data, isRunning, ratings.kw, ratings.kva, gen);
    }
  } catch (err) {
    console.warn(`Live generator_detail request for gen ${gen.id} unavailable, using baseline telemetry:`, err);
  }
};

const onGenDetailImgError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target && target.src && !target.src.endsWith('/generator_default.jpg')) {
    target.src = '/generator_default.jpg';
  }
};

// Apply baseline telemetry values (clean zero states until live server data arrives)
const applyTelemetryBaseline = (isRunning: boolean, ratedKw: number, ratedKva: number, gen: any) => {
  const ZERO_CIRC = { layer1: '/cgr_0.png', layer2: '/cgg_0.png', layer3: '/cgr_0.png' };
  powerTotalData.value = {
    kw: '0.0', kwUnit: 'kW', kwAlert: 0, kwAlertImg: null, kwGauge: ZERO_CIRC,
    kva: '0.0', kvaUnit: 'kVA',
    kvaAlert: 0, kvaAlertImg: null, kvaGauge: ZERO_CIRC,
    kvar: '0.0', kvarUnit: 'kVAR', kvarAlert: 0, kvarAlertImg: null, kvarGauge: ZERO_CIRC,
    pf: '0.0', pfUnit: 'pf', pfAlert: 0, pfAlertImg: null, pfGaugeImg: '/pf_0.png',
    pfLabel: 'LAG', showPfLag: true,
  };

  power3PhaseData.value = {
    p1: emptyPowerPhase(),
    p2: emptyPowerPhase(),
    p3: emptyPowerPhase(),
  };

  energySlidesData.value = [
    {
      id: 'generator',
      title: 'Energy - Generator',
      items: [
        { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
        { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
        { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
      ],
    },
      {
      id: 'mains',
      title: 'Energy - Mains',
      items: [
        { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
        { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
        { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
      ],
    },
  ];

  // Parse running duration from gen.sts if present in API response
  const stsStr = String(gen?.sts || '');
  let todayStr = '0 hr 0 min 0 sec';
  const hrMatch = stsStr.match(/(\d+)\s*Hr/i);
  const minMatch = stsStr.match(/(\d+)\s*Min/i);
  if (hrMatch || minMatch) {
    const h = hrMatch ? hrMatch[1] : '0';
    const m = minMatch ? minMatch[1] : '0';
    todayStr = `${h} hr ${m} min 0 sec`;
  }

  runHourSlidesData.value = [
   
    {
      id: 'generator',
      title: 'RunHour - Generator',
      items: [
        { label: 'TOTAL', value: '0 hr 0 min 0 sec' },
        { label: 'TODAY', value: isRunning ? todayStr : '0 hr 0 min 0 sec' },
        { label: 'TRIP',  value: isRunning ? todayStr : '0 hr 0 min 0 sec' },
      ],
    },
     {
      id: 'mains',
      title: 'RunHour - Mains',
      items: [
        { label: 'TOTAL', value: '0 hr 0 min 0 sec' },
        { label: 'TODAY', value: '0 hr 0 min 0 sec' },
        { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
      ],
    },
  ];

  const ZERO_VBAR = { layer1: '/vbgr_0.png', layer2: '/vbgg_0.png', layer3: '/vbgr_0.png' };
  const ZERO_CIRC2 = { layer1: '/cgr_0.png', layer2: '/cgg_0.png', layer3: '/cgr_0.png' };
  engineData.value = {
    battery: { voltage: '0.0 V', isAlert: false, gauge: ZERO_VBAR, alertImg: null as string | null, level: 0 },
    oilPressure: '0.0 Kpa',
    oilPresAlert: false,
    oilPresGauge: ZERO_VBAR,
    oilPresAlertImg: null as string | null,
    rpm: '0.0',
    rpmUnit: 'rpm',
    rpmAlert: false,
    rpmGauge: ZERO_CIRC2,
    rpmAlertImg: null as string | null,
    oilTemp: '0.0 Â°C',
    oilTempAlert: false,
    oilTempGauge: ZERO_VBAR,
    oilTempAlertImg: null as string | null,
    fuel: { levelValue: '0.0 L', isAlert: false, gauge: ZERO_VBAR, alertImg: null as string | null, level: 0 },
    coolantTemp: '0.0 Â°C',
    coolTempAlert: false,
    coolantTempGauge: ZERO_VBAR,
    coolantTempAlertImg: null as string | null,
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
        { label: 'L1', value: '0.0 A', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
        { label: 'L2', value: '0.0 A', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
        { label: 'L3', value: '0.0 A', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
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
        { label: 'AVG. LINE VOLT', value: '0.0 V', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
        { label: 'AVG. PHASE VOLT', value: '0.0 V', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
        { label: 'TOTAL CURRENT', value: '0.0 A', gauge: { layer1: '/bgr_0.png', layer2: '/bgg_0.png', layer3: '/bgr_0.png' } },
      ],
    },

  ];
};

// Apply live server response from generator_detail
const applyServerTelemetry = (raw: any, isRunning: boolean, ratedKw: number, ratedKva: number, gen: any) => {
  const d: any = (Array.isArray(raw.arr_data) && raw.arr_data.length > 0)
    ? { ...raw, ...raw.arr_data[0] }
    : (Array.isArray(raw.data) && raw.data.length > 0)
      ? { ...raw, ...raw.data[0] }
      : (Array.isArray(raw.gen_arr) && raw.gen_arr.length > 0)
        ? { ...raw, ...raw.gen_arr[0] }
        : (raw?.p ? { ...raw, ...raw.p } : (raw?.data?.p ? { ...raw, ...raw.data.p } : raw));

  // Update info card if fields exist
  if (selectedGenerator.value) {
    if (d.name || d.gen_name) selectedGenerator.value.name = d.name || d.gen_name;
    if (d.capacity) selectedGenerator.value.capacity = d.capacity;
    if (d.loc || d.location) selectedGenerator.value.location = d.loc || d.location;
    if (d.rtcdatetime || d.last_updated) selectedGenerator.value.lastUpdated = d.rtcdatetime || d.last_updated;
    if (d.image || d.img || d.gen_image || d.image_url) selectedGenerator.value.image = d.image || d.img || d.gen_image || d.image_url;
    if (d.stsicon_gen !== undefined) selectedGenerator.value.stsicon_gen = d.stsicon_gen;
    if (d.stsiconGen !== undefined) selectedGenerator.value.stsicon_gen = d.stsiconGen;
    if (d.gen_sts) selectedGenerator.value.gen_sts = d.gen_sts;
    if (d.sts) selectedGenerator.value.sts = d.sts;
  }

  // 1. Helpers for gauge step calculation and alert icons
  const toNumber = (value: any, fallback = 0): number => {
    if (value === undefined || value === null || value === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const parseEve = (value: any): number | undefined => {
    if (value === undefined || value === null) return undefined;
    const str = String(value).trim();
    if (str === '') return undefined;
    const n = Number(str);
    return Number.isFinite(n) ? n : undefined;
  };

  // Android get_gauge_vals ported from DBHelper.java
  const getGaugeCalculation = (
    val: number,
    rangeMin: number,
    rangeMax: number,
    eveMin: number | undefined | null,
    eveMax: number | undefined | null,
    gaugeCounts: number
  ) => {
    const v = Number.isFinite(Number(val)) ? Number(val) : 0;
    const rMin = Number.isFinite(Number(rangeMin)) ? Number(rangeMin) : 0;
    let rMax = Number.isFinite(Number(rangeMax)) ? Number(rangeMax) : 0;
    if (rMax <= rMin) {
      rMax = rMin > 0 ? rMin * 2 : 100;
    }

    // 1. Calculate actual value ticks matching Android:
    // int val_ticks = (int) (Math.round(Double.valueOf(val - range_min) / Double.valueOf(range_max - range_min) * Double.valueOf(gauge_counts)));
    const valTicks = Math.round(((v - rMin) / (rMax - rMin)) * gaugeCounts);

    // 2. Event minimum ticks:
    // if (eve_min <= range_min) { eve_min_max_ticks = 0; }
    // else { eve_min_max_ticks = (int) (Math.round(Double.valueOf(eve_min - range_min) / Double.valueOf(range_max - range_min) * Double.valueOf(gauge_counts))); }
    const hasEveMin = eveMin !== undefined && eveMin !== null && eveMin !== '' && Number.isFinite(Number(eveMin));
    const eMin = hasEveMin ? Number(eveMin) : 0;
    let eveMinMaxTicks = 0;
    if (hasEveMin && eMin > rMin) {
      eveMinMaxTicks = Math.round(((eMin - rMin) / (rMax - rMin)) * gaugeCounts);
    }

    // 3. Event maximum ticks:
    // if (eve_max >= range_max) { range_max_ticks = gauge_counts; }
    // else { range_max_ticks = (int) (Math.round(Double.valueOf(eve_max - range_min) / Double.valueOf(range_max - range_min) * Double.valueOf(gauge_counts))); }
    const hasEveMax = eveMax !== undefined && eveMax !== null && eveMax !== '' && Number.isFinite(Number(eveMax));
    const eMax = hasEveMax ? Number(eveMax) : rMax;
    let rangeMaxTicks = gaugeCounts;
    if (hasEveMax && eMax > 0 && eMax < rMax && eMax > rMin) {
      rangeMaxTicks = Math.round(((eMax - rMin) / (rMax - rMin)) * gaugeCounts);
    }

    // 4. Tick distribution matching Android DBHelper:
    let firstRedTicks = 0;
    let secondGreenTicks = 0;
    let thirdRedTicks = 0;

    if (valTicks > rangeMaxTicks) {
      firstRedTicks = valTicks;
      secondGreenTicks = rangeMaxTicks;
      thirdRedTicks = eveMinMaxTicks;
    } else {
      if (eveMinMaxTicks > 0) {
        if (valTicks > eveMinMaxTicks) {
          firstRedTicks = 0;
          secondGreenTicks = valTicks;
          thirdRedTicks = eveMinMaxTicks;
        } else {
          firstRedTicks = 0;
          secondGreenTicks = 0;
          thirdRedTicks = valTicks;
        }
      } else {
        firstRedTicks = 0;
        secondGreenTicks = valTicks;
        thirdRedTicks = 0;
      }
    }

    const clamp = (t: number) => Math.max(0, Math.min(gaugeCounts, t));
    const cFirstRed = clamp(firstRedTicks);
    const cSecondGreen = clamp(secondGreenTicks);
    const cThirdRed = clamp(thirdRedTicks);

    // 5. Finalize which prefix (bgr_/bgg_/cgr_/cgg_/vbgr_/vbgg_) and appended value to use:
    let isRed = false;
    let appendedTicks = 0;

    if (cFirstRed > 0) {
      // Over-maximum threshold event -> RED with first_red_ticks
      isRed = true;
      appendedTicks = cFirstRed;
    } else if (eveMinMaxTicks > 0 && cSecondGreen === 0 && cThirdRed > 0) {
      // Under-minimum threshold event -> RED with third_red_ticks
      isRed = true;
      appendedTicks = cThirdRed;
    } else {
      // Within acceptable normal range -> GREEN with second_green_ticks
      isRed = false;
      appendedTicks = cSecondGreen;
    }

    return {
      isRed,
      appendedTicks,
      firstRedTicks: cFirstRed,
      secondGreenTicks: cSecondGreen,
      thirdRedTicks: cThirdRed,
    };
  };

  // Helper: 3-layer gauge object matching Android's LayerDrawable approach
  const getCircularGauge = (val: number, min: number, max: number, eveMin?: number, eveMax?: number) => {
    const c = getGaugeCalculation(val, min, max, eveMin, eveMax, 20);
    return {
      layer1: `/cgr_${c.firstRedTicks}.png`,
      layer2: `/cgg_${c.secondGreenTicks}.png`,
      layer3: `/cgr_${c.thirdRedTicks}.png`,
      isRed: c.isRed,
    };
  };

  const getVBarGauge = (val: number, min: number, max: number, eveMin?: number, eveMax?: number) => {
    const c = getGaugeCalculation(val, min, max, eveMin, eveMax, 8);
    return {
      layer1: `/vbgr_${c.firstRedTicks}.png`,
      layer2: `/vbgg_${c.secondGreenTicks}.png`,
      layer3: `/vbgr_${c.thirdRedTicks}.png`,
      isRed: c.isRed,
    };
  };

  const getBarGauge = (val: number, min: number, max: number, eveMin?: number, eveMax?: number) => {
    const c = getGaugeCalculation(val, min, max, eveMin, eveMax, 8);
    return {
      layer1: `/bgr_${c.firstRedTicks}.png`,
      layer2: `/bgg_${c.secondGreenTicks}.png`,
      layer3: `/bgr_${c.thirdRedTicks}.png`,
      isRed: c.isRed,
    };
  };

  const getAlertBadge = (vio: any) => {
    const v = Number(vio);
    if (v >= 1 && v <= 4) {
      return `/icon_alarm_bg_${v}.png`;
    }
    return null;
  };

  const root = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const pars = d?.pars ?? root?.pars ?? raw?.pars ?? root?.p?.pars ?? raw?.p?.pars ?? d?.p?.pars ?? raw?.data?.p?.pars ?? raw?.data?.pars ?? [];
  const powerParam = Array.isArray(pars)
    ? (pars.find((item: any) => Number(item?.id) === 1)
      ?? pars.find((item: any) => String(item?.name ?? '').trim().toLowerCase() === 'power'))
    : null;
  const powerRows = Array.isArray(powerParam?.val_arr) ? powerParam.val_arr : (Array.isArray(powerParam?.valarr) ? powerParam.valarr : []);
  const findPowerRow = (type: string) => powerRows.find(
    (row: any) => String(row?.type ?? '').trim().toLowerCase() === type.toLowerCase()
  );
  const totalRow = findPowerRow('Total');

  // Fallback keys are retained only for older API payloads without pars[].val_arr[].
  const kwNum = toNumber(totalRow?.kw_val ?? d.tot_kw ?? d.kw ?? d.active_kw);
  const kwUnit = String(totalRow?.kw_unit ?? 'kW');
  const kwAlert = Number(totalRow?.kw_alert ?? totalRow?.kwAlert ?? 0);
  const kwVio = totalRow?.kw_vio ?? totalRow?.kwVio;
  const kwRangeMin = toNumber(totalRow?.kw_range_min ?? totalRow?.kwRangeMin, 0);
  const kwRangeMax = Math.max(toNumber(totalRow?.kw_range_max ?? totalRow?.kwRangeMax, ratedKw), 1);
  const kwEveMin = parseEve(totalRow?.kw_eve_min ?? totalRow?.kwEveMin);
  const kwEveMax = parseEve(totalRow?.kw_eve_max ?? totalRow?.kwEveMax);

  const kvaNum = toNumber(totalRow?.kva_val ?? d.tot_kva ?? d.kva ?? d.appar_kva);
  const kvaUnit = String(totalRow?.kva_unit ?? 'kVA');
  const kvaAlert = Number(totalRow?.kva_alert ?? totalRow?.kvaAlert ?? 0);
  const kvaVio = totalRow?.kva_vio ?? totalRow?.kvaVio;
  const kvaRangeMin = toNumber(totalRow?.kva_range_min ?? totalRow?.kvaRangeMin, 0);
  const kvaRangeMax = Math.max(toNumber(totalRow?.kva_range_max ?? totalRow?.kvaRangeMax, ratedKva), 1);
  const kvaEveMin = parseEve(totalRow?.kva_eve_min ?? totalRow?.kvaEveMin);
  const kvaEveMax = parseEve(totalRow?.kva_eve_max ?? totalRow?.kvaEveMax);

  const kvarFallback = kvaNum > 0 && kwNum >= 0
    ? Math.sqrt(Math.max(0, kvaNum * kvaNum - kwNum * kwNum)) : 0;
  const kvarNum = toNumber(totalRow?.kvar_val ?? d.tot_kvar ?? d.kvar ?? d.react_kvar, kvarFallback);
  const kvarUnit = String(totalRow?.kvar_unit ?? 'kVAR');
  const kvarAlert = Number(totalRow?.kvar_alert ?? totalRow?.kvarAlert ?? 0);
  const kvarVio = totalRow?.kvar_vio ?? totalRow?.kvarVio;
  const kvarRangeMin = toNumber(totalRow?.kvar_range_min ?? totalRow?.kvarRangeMin, 0);
  const kvarRangeMax = Math.max(toNumber(totalRow?.kvar_range_max ?? totalRow?.kvarRangeMax, ratedKva * 0.75), 1);
  const kvarEveMin = parseEve(totalRow?.kvar_eve_min ?? totalRow?.kvarEveMin);
  const kvarEveMax = parseEve(totalRow?.kvar_eve_max ?? totalRow?.kvarEveMax);

  const pfNum = toNumber(totalRow?.pf_val ?? d.tot_pf ?? d.pf ?? d.power_factor,
    kvaNum > 0 ? Math.min(1, kwNum / kvaNum) : 0);
  const pfUnit = String(totalRow?.pf_unit ?? 'pf');
  const pfAlert = Number(totalRow?.pf_alert ?? totalRow?.pfAlert ?? 0);
  const pfVio = totalRow?.pf_vio ?? totalRow?.pfVio;
  const pfLabel = String(totalRow?.pf_type ?? totalRow?.pfType ?? d.pf_type ?? 'LAG').toUpperCase();
  const hasPfVal = totalRow?.pf_val !== null && totalRow?.pf_val !== undefined && String(totalRow.pf_val).trim() !== '';
  const pfRawVal = hasPfVal ? String(totalRow.pf_val).trim() : (pfNum > 0 ? pfNum.toFixed(2) : '0');


  const pfIconIdx = totalRow?.pf_icon !== undefined && totalRow?.pf_icon !== null
    ? Math.max(0, Math.min(9, Number(totalRow.pf_icon)))
    : (totalRow?.pfIcon !== undefined && totalRow?.pfIcon !== null
      ? Math.max(0, Math.min(9, Number(totalRow.pfIcon)))
      : Math.max(0, Math.min(9, Math.round(pfNum * 9))));

  const kwGauge = getCircularGauge(kwNum, kwRangeMin, kwRangeMax, kwEveMin, kwEveMax);
  const kvaGauge = getCircularGauge(kvaNum, kvaRangeMin, kvaRangeMax, kvaEveMin, kvaEveMax);
  const kvarGauge = getCircularGauge(kvarNum, kvarRangeMin, kvarRangeMax, kvarEveMin, kvarEveMax);

  powerTotalData.value = {
    kw: totalRow?.kw_val !== null && totalRow?.kw_val !== undefined ? String(totalRow.kw_val) : kwNum.toFixed(1),
    kwUnit,
    kwAlert: kwAlert === 1 || kwGauge.isRed ? 1 : 0,
    kwAlertImg: getAlertBadge(kwVio),
    kwGauge,

    kva: totalRow?.kva_val !== null && totalRow?.kva_val !== undefined ? String(totalRow.kva_val) : kvaNum.toFixed(1),
    kvaUnit,
    kvaAlert: kvaAlert === 1 || kvaGauge.isRed ? 1 : 0,
    kvaAlertImg: getAlertBadge(kvaVio),
    kvaGauge,

    kvar: totalRow?.kvar_val !== null && totalRow?.kvar_val !== undefined ? String(totalRow.kvar_val) : kvarNum.toFixed(1),
    kvarUnit,
    kvarAlert: kvarAlert === 1 || kvarGauge.isRed ? 1 : 0,
    kvarAlertImg: getAlertBadge(kvarVio),
    kvarGauge,

    pf: pfRawVal,
    pfUnit,
    pfAlert,
    pfAlertImg: getAlertBadge(pfVio),
    pfGaugeImg: `/pf_${pfIconIdx}.png`,
    pfLabel,
    showPfLag: pfRawVal !== '1.0' && pfRawVal !== '1',
  };

  const phaseData = (phaseName: string) => {
    const row = findPowerRow(phaseName);
    const phaseIndex = phaseName.substring(1);
    const legacyPrefix = phaseName.toLowerCase();
    const phaseKw = toNumber(row?.kw_val ?? d[`kw_l${phaseIndex}`] ?? d[`${legacyPrefix}_kw`]);
    const phaseKva = toNumber(row?.kva_val ?? d[`kva_l${phaseIndex}`] ?? d[`${legacyPrefix}_kva`]);
    const phaseKvar = toNumber(row?.kvar_val ?? d[`kvar_l${phaseIndex}`] ?? d[`${legacyPrefix}_kvar`]);
    const phasePf = toNumber(row?.pf_val ?? d[`pf_l${phaseIndex}`] ?? d[`${legacyPrefix}_pf`], pfNum);
    const kwAlert = Number(row?.kw_alert ?? row?.kwAlert ?? 0);
    const kvaAlert = Number(row?.kva_alert ?? row?.kvaAlert ?? 0);
    const kvarAlert = Number(row?.kvar_alert ?? row?.kvarAlert ?? 0);
    const pfAlert = Number(row?.pf_alert ?? row?.pfAlert ?? 0);

    return {
      pf: (row?.pf_val !== undefined && row?.pf_val !== null) ? String(row.pf_val) : phasePf.toFixed(2),
      pfUnit: String(row?.pf_unit ?? 'pf'),
      pfAlert,
      pfAlertImg: getAlertBadge(row?.pf_vio ?? row?.pfVio),

      kw: (row?.kw_val !== undefined && row?.kw_val !== null) ? String(row.kw_val) : phaseKw.toFixed(1),
      kwUnit: String(row?.kw_unit ?? totalRow?.kw_unit ?? 'kW'),
      kwAlert,
      kwAlertImg: getAlertBadge(row?.kw_vio ?? row?.kwVio),

      kva: (row?.kva_val !== undefined && row?.kva_val !== null) ? String(row.kva_val) : phaseKva.toFixed(1),
      kvaUnit: String(row?.kva_unit ?? totalRow?.kva_unit ?? 'kVA'),
      kvaAlert,
      kvaAlertImg: getAlertBadge(row?.kva_vio ?? row?.kvaVio),

      kvar: (row?.kvar_val !== undefined && row?.kvar_val !== null) ? String(row.kvar_val) : phaseKvar.toFixed(1),
      kvarUnit: String(row?.kvar_unit ?? totalRow?.kvar_unit ?? 'kVAR'),
      kvarAlert,
      kvarAlertImg: getAlertBadge(row?.kvar_vio ?? row?.kvarVio),
    };
  };

  power3PhaseData.value = {
    p1: phaseData('P1'),
    p2: phaseData('P2'),
    p3: phaseData('P3')
  };
  console.log('Power parameter values:', powerParam);

  // 3. Energy: parse from pars[].val_arr[] based on type ('Generator' / 'Mains')
  const energyParam = Array.isArray(pars)
    ? (pars.find((item: any) => Number(item?.id) === 2)
      ?? pars.find((item: any) => String(item?.name ?? '').trim().toLowerCase() === 'energy'))
    : null;
  const energyRows = Array.isArray(energyParam?.val_arr) ? energyParam.val_arr : (Array.isArray(energyParam?.valarr) ? energyParam.valarr : []);
  console.log('Energy parameter values:', energyParam);

  const sanitizeEnergy = (v: any, fallback = '0.0') => {
    if (v === undefined || v === null || v === '') return fallback;
    const str = String(v).trim();
    if (str.includes('E8') || str.includes('4.2949') || parseFloat(str) > 100000000) return '0.0';
    const num = parseFloat(str);
    return isNaN(num) ? str : num.toFixed(1);
  };

  const pickVal = (row: any, keys: string[], fallback: any) => {
    if (row) {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          return row[k];
        }
      }
    }
    return fallback;
  };

  const buildEnergySlideItems = (row: any, isMains: boolean) => {
    const rawActive = pickVal(
      row,
      ['active_val', 'activeVal', 'active', 'kwh_val', 'kwhVal'],
      isMains ? (d.mains_kwh ?? d.mains_active) : (d.gen_kwh ?? d.gen_active ?? d.kwh)
    );
    const activeVal = sanitizeEnergy(rawActive, '0.0');
    const activeUnit = String(pickVal(row, ['active_unit', 'activeUnit', 'unit', 'kwh_unit', 'kwhUnit'], 'kWh')).trim();

    const rawApparent = pickVal(
      row,
      ['apparent_val', 'apparentVal', 'appar_val', 'apparVal', 'appr_val', 'app_val', 'apparent', 'kvah_val', 'kvahVal'],
      isMains ? (d.mains_kvah ?? d.mains_apparent) : (d.gen_kvah ?? d.gen_apparent ?? d.kvah)
    );
    const apparentVal = sanitizeEnergy(rawApparent, '0.0');
    const apparentUnit = String(pickVal(row, ['apparent_unit', 'apparentUnit', 'appar_unit', 'apparUnit', 'appr_unit', 'app_unit', 'kvah_unit', 'kvahUnit'], 'kVAh')).trim();

    const rawReactive = pickVal(
      row,
      ['reactive_val', 'reactiveVal', 'react_val', 'reactVal', 'reac_val', 'reactive', 'kvarh_val', 'kvarhVal'],
      isMains ? (d.mains_kvarh ?? d.mains_reactive) : (d.gen_kvarh ?? d.gen_reactive ?? d.kvarh)
    );
    const reactiveVal = sanitizeEnergy(rawReactive, '0.0');
    const reactiveUnit = String(pickVal(row, ['reactive_unit', 'reactiveUnit', 'react_unit', 'reactUnit', 'reac_unit', 'kvarh_unit', 'kvarhUnit'], 'kVARh')).trim();

    return [
      { label: 'ACTIVE', value: `${activeVal} ${activeUnit}`, isHighlighted: true },
      { label: 'APPARENT', value: `${apparentVal} ${apparentUnit}`, isHighlighted: false },
      { label: 'REACTIVE', value: `${reactiveVal} ${reactiveUnit}`, isHighlighted: false },
    ];
  };

  const findEnergyRow = (type: string) => energyRows.find(
    (row: any) => String(row?.type ?? '').trim().toLowerCase() === type.toLowerCase()
      || String(row?.type ?? '').trim().toLowerCase().includes(type.toLowerCase())
  );

  const mainsRow = findEnergyRow('Mains') || findEnergyRow('Main');
  const genRow = findEnergyRow('Generator') || findEnergyRow('Gen');

  energySlidesData.value = [
    
    {
      id: 'generator',
      title: 'Energy - Generator',
      items: buildEnergySlideItems(genRow, false),
    },
    {
      id: 'mains',
      title: 'Energy - Mains',
      items: buildEnergySlideItems(mainsRow, true),
    },
  ];

  // 4. RunHour: parse from pars[].val_arr[] based on type ('Generator' / 'Mains')
  const runHourParam = Array.isArray(pars)
    ? (pars.find((item: any) => {
        const n = String(item?.name ?? '').trim().toLowerCase();
        return n.includes('runhour') || n.includes('run_hour') || n.includes('run hour');
      }) ?? pars.find((item: any) => Number(item?.id) === 3))
    : null;

  const runHourRows = Array.isArray(runHourParam?.val_arr) ? runHourParam.val_arr : [];
  console.log('RunHour parameter values:', runHourParam);

  const findRunHourRow = (type: string) => runHourRows.find(
    (row: any) => String(row?.type ?? '').trim().toLowerCase() === type.toLowerCase()
      || String(row?.type ?? '').trim().toLowerCase().includes(type.toLowerCase())
  );

  const mainsRhRow = findRunHourRow('Mains') || findRunHourRow('Main');
  const genRhRow = findRunHourRow('Generator') || findRunHourRow('Gen');

  const fmtRunHour = (v: any, defaultStr = '0 hr 0 min 0 sec') => {
    if (v === undefined || v === null || v === '') return defaultStr;
    const str = String(v).trim();
    if (str.includes('hr') || str.includes('min') || str.includes(':')) return str;
    const num = parseFloat(str);
    if (isNaN(num)) return defaultStr;
    if (num > 360000) {
      const h = Math.floor(num / 3600);
      const m = Math.floor((num % 3600) / 60);
      const s = Math.floor(num % 60);
      return `${h} hr ${m} min ${s} sec`;
    }
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h} hr ${m} min 0 sec`;
  };

  const getRhVal = (row: any, keys: string[], fallback: any) => {
    if (row) {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          return fmtRunHour(row[k]);
        }
      }
    }
    return fmtRunHour(fallback);
  };

  runHourSlidesData.value = [
  
    {
      id: 'generator',
      title: 'RunHour - Generator',
      items: [
        { label: 'TOTAL', value: getRhVal(genRhRow, ['total_val', 'totalVal', 'total'], d.gen_run_total || d.tot_rh || d.rh_total) },
        { label: 'TODAY', value: getRhVal(genRhRow, ['today_val', 'todayVal', 'today'], d.gen_run_today || d.today_rh) },
        { label: 'TRIP',  value: getRhVal(genRhRow, ['trip_val', 'tripVal', 'trip'], d.gen_run_trip || d.trip_rh) },
      ],
    },
  {
      id: 'mains',
      title: 'RunHour - Mains',
      items: [
        { label: 'TOTAL', value: getRhVal(mainsRhRow, ['total_val', 'totalVal', 'total'], d.mains_run_total || d.mains_total_rh) },
        { label: 'TODAY', value: getRhVal(mainsRhRow, ['today_val', 'todayVal', 'today'], d.mains_run_today || d.mains_today_rh) },
        { label: 'TRIP',  value: getRhVal(mainsRhRow, ['trip_val', 'tripVal', 'trip'], d.mains_run_trip || d.mains_trip_rh) },
      ],
    },
  ];

  // 5. Engine: parse from pars[].val_arr[] matching Android implementation
  const engineParam = Array.isArray(pars)
    ? (pars.find((item: any) => Number(item?.id) === 4)
      ?? pars.find((item: any) => String(item?.name ?? '').trim().toLowerCase() === 'engine'))
    : null;
  const engineRows = Array.isArray(engineParam?.val_arr) ? engineParam.val_arr : (Array.isArray(engineParam?.valarr) ? engineParam.valarr : []);
  const engineObj = engineRows.length > 0 ? engineRows[0] : null;
  console.log('Engine parameter values:', engineParam);

  // Battery
  const battVal = engineObj?.batt_val ?? engineObj?.battVal ?? d.battery_volt ?? d.batt_volt ?? d.batt ?? '0.0';
  const battUnit = String(engineObj?.batt_unit ?? engineObj?.battUnit ?? 'V').trim();
  const battValNum = toNumber(battVal, 0);
  const battMin = toNumber(engineObj?.batt_range_min ?? engineObj?.battRangeMin, 0);
  const battMax = toNumber(engineObj?.batt_range_max ?? engineObj?.battRangeMax, 28);
  const battEveMin = parseEve(engineObj?.batt_eve_min ?? engineObj?.battEveMin);
  const battEveMax = parseEve(engineObj?.batt_eve_max ?? engineObj?.battEveMax);
  const battAlert = Number(engineObj?.batt_alert ?? engineObj?.battAlert ?? 0);

  // RPM
  const rpmVal = engineObj?.rpm_val ?? engineObj?.rpmVal ?? d.rpm ?? d.engine_rpm ?? '0';
  const rpmUnit = String(engineObj?.rpm_unit ?? engineObj?.rpmUnit ?? 'rpm').trim();
  const rpmNum = toNumber(rpmVal, 0);
  const rpmMin = toNumber(engineObj?.rpm_range_min ?? engineObj?.rpmRangeMin, 0);
  const rpmMax = toNumber(engineObj?.rpm_range_max ?? engineObj?.rpmRangeMax, 3000);
  const rpmEveMin = parseEve(engineObj?.rpm_eve_min ?? engineObj?.rpmEveMin);
  const rpmEveMax = parseEve(engineObj?.rpm_eve_max ?? engineObj?.rpmEveMax);
  const rpmAlert = Number(engineObj?.rpm_alert ?? engineObj?.rpmAlert ?? 0);

  // Fuel
  const fuelVal = engineObj?.fuel_val ?? engineObj?.fuelVal ?? d.fuel_level ?? d.fuel_ltr ?? '0.0';
  const fuelUnit = String(engineObj?.fuel_unit ?? engineObj?.fuelUnit ?? 'L').trim();
  const fuelValNum = toNumber(fuelVal, 0);
  const fuelMin = toNumber(engineObj?.fuel_range_min ?? engineObj?.fuelRangeMin, 0);
  const fuelMax = toNumber(engineObj?.fuel_range_max ?? engineObj?.fuelRangeMax, 1000);
  const fuelEveMin = parseEve(engineObj?.fuel_eve_min ?? engineObj?.fuelEveMin);
  const fuelEveMax = parseEve(engineObj?.fuel_eve_max ?? engineObj?.fuelEveMax);
  const fuelAlert = Number(engineObj?.fuel_alert ?? engineObj?.fuelAlert ?? 0);

  // Oil Pressure
  const oilPresVal = engineObj?.oil_pres_val ?? engineObj?.oilPresVal ?? d.oil_pressure ?? d.oil_press ?? '0.0';
  const oilPresUnit = String(engineObj?.oil_pres_unit ?? engineObj?.oilPresUnit ?? 'Kpa').trim();
  const oilPresNum = toNumber(oilPresVal, 0);
  const oilPresMin = toNumber(engineObj?.oil_pres_range_min ?? engineObj?.oilPresRangeMin, 0);
  const oilPresMax = toNumber(engineObj?.oil_pres_range_max ?? engineObj?.oilPresRangeMax, 1000);
  const oilPresEveMin = parseEve(engineObj?.oil_pres_eve_min ?? engineObj?.oil_eve_min ?? engineObj?.oilPresEveMin);
  const oilPresEveMax = parseEve(engineObj?.oil_pres_eve_max ?? engineObj?.oil_eve_max ?? engineObj?.oilPresEveMax);
  const oilPresAlert = Number(engineObj?.oil_pres_alert ?? engineObj?.oilPresAlert ?? 0);

  // Oil Temp
  const oilTempVal = engineObj?.oil_temp_val ?? engineObj?.oilTempVal ?? d.oil_temp ?? '0.0';
  const oilTempUnit = String(engineObj?.oil_temp_unit ?? engineObj?.oilTempUnit ?? 'Â°C').trim();
  const oilTempNum = toNumber(oilTempVal, 0);
  const oilTempMin = toNumber(engineObj?.oil_temp_range_min ?? engineObj?.oilTempRangeMin, 0);
  const oilTempMax = toNumber(engineObj?.oil_temp_range_max ?? engineObj?.oilTempRangeMax, 150);
  const oilTempEveMin = parseEve(engineObj?.oil_temp_eve_min ?? engineObj?.oilTempEveMin);
  const oilTempEveMax = parseEve(engineObj?.oil_temp_eve_max ?? engineObj?.oilTempEveMax);
  const oilTempAlert = Number(engineObj?.oil_temp_alert ?? engineObj?.oilTempAlert ?? 0);

  // Coolant Temp
  const coolTempVal = engineObj?.cool_temp_val ?? engineObj?.coolTempVal ?? d.coolant_temp ?? '0.0';
  const coolTempUnit = String(engineObj?.cool_temp_unit ?? engineObj?.coolTempUnit ?? 'Â°C').trim();
  const coolTempNum = toNumber(coolTempVal, 0);
  const coolTempMin = toNumber(engineObj?.cool_temp_range_min ?? engineObj?.coolTempRangeMin, 0);
  const coolTempMax = toNumber(engineObj?.cool_temp_range_max ?? engineObj?.coolTempRangeMax, 150);
  const coolTempEveMin = parseEve(engineObj?.cool_temp_eve_min ?? engineObj?.coolTempEveMin);
  const coolTempEveMax = parseEve(engineObj?.cool_temp_eve_max ?? engineObj?.coolTempEveMax);
  const coolTempAlert = Number(engineObj?.cool_temp_alert ?? engineObj?.coolTempAlert ?? 0);

  const battGauge = getVBarGauge(battValNum, battMin, battMax, battEveMin, battEveMax);
  const rpmGauge = getCircularGauge(rpmNum, rpmMin, rpmMax, rpmEveMin, rpmEveMax);
  const fuelGauge = getVBarGauge(fuelValNum, fuelMin, fuelMax, fuelEveMin, fuelEveMax);
  const oilPresGauge = getVBarGauge(oilPresNum, oilPresMin, oilPresMax, oilPresEveMin, oilPresEveMax);
  const oilTempGauge = getVBarGauge(oilTempNum, oilTempMin, oilTempMax, oilTempEveMin, oilTempEveMax);
  const coolTempGauge = getVBarGauge(coolTempNum, coolTempMin, coolTempMax, coolTempEveMin, coolTempEveMax);

  engineData.value = {
    battery: {
      voltage: `${battValNum.toFixed(1)} ${battUnit}`,
      isAlert: battAlert === 1 || battGauge.isRed,
      gauge: battGauge,
      alertImg: getAlertBadge(engineObj?.batt_vio ?? engineObj?.battVio),
      level: Math.min(1.0, battValNum / 28)
    },
    rpm: (engineObj?.rpm_val !== undefined && engineObj?.rpm_val !== null) ? String(engineObj.rpm_val) : (rpmNum > 0 ? rpmNum.toFixed(1) : String(rpmVal)),
    rpmUnit: rpmUnit,
    rpmAlert: rpmAlert === 1 || rpmGauge.isRed,
    rpmGauge,
    rpmAlertImg: getAlertBadge(engineObj?.rpm_vio ?? engineObj?.rpmVio),
    fuel: {
      levelValue: `${fuelValNum.toFixed(1)} ${fuelUnit}`,
      isAlert: fuelAlert === 1 || fuelGauge.isRed,
      gauge: fuelGauge,
      alertImg: getAlertBadge(engineObj?.fuel_vio ?? engineObj?.fuelVio),
      level: Math.min(1.0, fuelValNum / 600)
    },
    oilPressure: `${oilPresNum.toFixed(1)} ${oilPresUnit}`,
    oilPresAlert: oilPresAlert === 1 || oilPresGauge.isRed,
    oilPresGauge,
    oilPresAlertImg: getAlertBadge(engineObj?.oil_pres_vio ?? engineObj?.oilPresVio),
    oilTemp: `${oilTempNum.toFixed(1)} ${oilTempUnit}`,
    oilTempAlert: oilTempAlert === 1 || oilTempGauge.isRed,
    oilTempGauge,
    oilTempAlertImg: getAlertBadge(engineObj?.oil_temp_vio ?? engineObj?.oilTempVio),
    coolantTemp: `${coolTempNum.toFixed(1)} ${coolTempUnit}`,
    coolTempAlert: coolTempAlert === 1 || coolTempGauge.isRed,
    coolantTempGauge,
    coolantTempAlertImg: getAlertBadge(engineObj?.cool_temp_vio ?? engineObj?.coolTempVio),
  };

  const viParam = Array.isArray(pars)
    ? (pars.find((item: any) => Number(item?.id) === 5)
      ?? pars.find((item: any) => {
        const n = String(item?.name ?? '').trim().toLowerCase();
        return n === 'v and i' || n === 'v & i' || n === 'vandi' || n === 'voltage & current' || n === 'vi';
      }))
    : null;
  const viRows = Array.isArray(viParam?.val_arr) ? viParam.val_arr : (Array.isArray(viParam?.valarr) ? viParam.valarr : []);
  const viObj = viRows.length > 0 ? viRows[0] : null;
  console.log('VI parameter values:', viParam);

    // Helper to pick the first existing key with valid value
  const pickVal_Vi = (obj: any, keys: string[], fallback = '0.0') => {
    if (!obj) return fallback;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
        const v = obj[k];
        return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : String(v).trim();
      }
    }
    return fallback;
  };


  const freqL1 = pickVal_Vi(viObj, ['l1_freq_val', 'l1_freq', 'freq_l1'], '0.0');
  const freqL1Unit = pickVal_Vi(viObj, ['l1_freq_unit'], 'Hz');
  const freqL2 = pickVal_Vi(viObj, ['l2_freq_val', 'l2_freq', 'freq_l2'], freqL1);
  const freqL2Unit = pickVal_Vi(viObj, ['l2_freq_unit'], freqL1Unit);
  const freqL3 = pickVal_Vi(viObj, ['l3_freq_val', 'l3_freq', 'freq_l3'], freqL1);
  const freqL3Unit = pickVal_Vi(viObj, ['l3_freq_unit'], freqL1Unit);

  // 2. Current (matching Android l1_curr_val, l1_curr_unit, etc.)
  const currL1 = pickVal_Vi(viObj, ['l1_curr_val', 'l1_curr', 'curr_l1'], '0.0');
  const currL1Unit = pickVal_Vi(viObj, ['l1_curr_unit'], 'A');
  const currL2 = pickVal_Vi(viObj, ['l2_curr_val', 'l2_curr', 'curr_l2'], '0.0');
  const currL2Unit = pickVal_Vi(viObj, ['l2_curr_unit'], 'A');
  const currL3 = pickVal_Vi(viObj, ['l3_curr_val', 'l3_curr', 'curr_l3'], '0.0');
  const currL3Unit =  pickVal_Vi(viObj, ['l3_curr_unit'], 'A');

  // 3. Voltage Line-to-Neutral (matching Android L1_N_val, L1_N_unit, etc.)
  const vL1N = pickVal_Vi(viObj, ['L1_N_val', 'l1_n_val', 'l1n_val', 'volt_l1n'], '0.0');
  const vL1NUnit = pickVal_Vi(viObj, ['L1_N_unit', 'l1_n_unit', 'l1n_unit'], 'V');
  const vL1NAlert = Number(viObj?.L1_N_alert ?? viObj?.l1_n_alert ?? 0);
  const vL1NVio = viObj?.L1_N_vio ?? viObj?.l1_n_vio;

  const vL2N = pickVal_Vi(viObj, ['L2_N_val', 'l2_n_val', 'l2n_val', 'volt_l2n'], '0.0');
  const vL2NUnit = pickVal_Vi(viObj, ['L2_N_unit', 'l2_n_unit', 'l2n_unit'], 'V');
  const vL2NAlert = Number(viObj?.L2_N_alert ?? viObj?.l2_n_alert ?? 0);
  const vL2NVio = viObj?.L2_N_vio ?? viObj?.l2_n_vio;

  const vL3N = pickVal_Vi(viObj, ['L3_N_val', 'l3_n_val', 'l3n_val', 'volt_l3n'], '0.0');
  const vL3NUnit = pickVal_Vi(viObj, ['L3_N_unit', 'l3_n_unit', 'l3n_unit'], 'V');
  const vL3NAlert = Number(viObj?.L3_N_alert ?? viObj?.l3_n_alert ?? 0);
  const vL3NVio = viObj?.L3_N_vio ?? viObj?.l3_n_vio;

  // 4. Voltage Line-to-Line (matching Android L1_L2_val, L2_L3_val, L3_L1_val, etc.)
  const vL1L2 = pickVal_Vi(viObj, ['L1_L2_val', 'l1_l2_val', 'l1l2_val', 'volt_l1l2'], '0.0');
  const vL1L2Unit = pickVal_Vi(viObj, ['L1_L2_unit', 'l1_l2_unit', 'l1l2_unit'], 'V');
  const vL1L2Alert = Number(viObj?.L1_L2_alert ?? viObj?.l1_l2_alert ?? 0);
  const vL1L2Vio = viObj?.L1_L2_vio ?? viObj?.l1_l2_vio;

  const vL2L3 = pickVal_Vi(viObj, ['L2_L3_val', 'l2_l3_val', 'l2l3_val', 'volt_l2l3'], '0.0');
  const vL2L3Unit = pickVal_Vi(viObj, ['L2_L3_unit', 'l2_l3_unit', 'l2l3_unit'], 'V');
  const vL2L3Alert = Number(viObj?.L2_L3_alert ?? viObj?.l2_l3_alert ?? 0);
  const vL2L3Vio = viObj?.L2_L3_vio ?? viObj?.l2_l3_vio;

  const vL3L1 = pickVal_Vi(viObj, ['L3_L1_val', 'l3_l1_val', 'l3l1_val', 'volt_l3l1'], '0.0');
  const vL3L1Unit = pickVal_Vi(viObj, ['L3_L1_unit', 'l3_l1_unit', 'l3l1_unit'], 'V');
  const vL3L1Alert = Number(viObj?.L3_L1_alert ?? viObj?.l3_l1_alert ?? 0);
  const vL3L1Vio = viObj?.L3_L1_vio ?? viObj?.l3_l1_vio;

  // 5. Summary (matching Android lv_val, pv_val, c_val or Lv_summ_val, etc.)
  const lineVoltVal = pickVal_Vi(viObj, ['lv_val', 'Lv_summ_val', 'line_volt_val'], '0.0');
  const lineVoltUnit = pickVal_Vi(viObj, ['lv_unit', 'Lv_summ_unit'], 'V');
  const lineVoltAlert = Number(viObj?.lv_alert ?? viObj?.Lv_summ_alert ?? 0);
  const lineVoltVio = viObj?.lv_vio ?? viObj?.Lv_summ_vio;

  const phaseVoltVal = pickVal_Vi(viObj, ['pv_val', 'pv_summ_val', 'phase_volt_val'], '0.0');
  const phaseVoltUnit = pickVal_Vi(viObj, ['pv_unit', 'pv_summ_unit'], 'V');
  const phaseVoltAlert = Number(viObj?.pv_alert ?? viObj?.pv_summ_alert ?? 0);
  const phaseVoltVio = viObj?.pv_vio ?? viObj?.pv_summ_vio;

  const totalCurrVal = pickVal_Vi(viObj, ['c_val', 'c_summ_val', 'tot_curr'], '0.0');
  const totalCurrUnit = pickVal_Vi(viObj, ['c_unit', 'c_summ_unit'], 'A');
  const totalCurrAlert = Number(viObj?.c_alert ?? viObj?.c_summ_alert ?? 0);
  const totalCurrVio = viObj?.c_vio ?? viObj?.c_summ_vio;

  const ratedAmps = Math.round((ratedKva * 1000) / (Math.sqrt(3) * 400));

  // Current thresholds & alerts matching Android
  const currL1Num = toNumber(currL1, 0);
  const currL1Min = toNumber(viObj?.l1_curr_range_min ?? viObj?.l1CurrRangeMin, 0);
  const currL1Max = toNumber(viObj?.l1_curr_range_max ?? viObj?.l1CurrRangeMax, ratedAmps || 100);
  const currL1EveMin = parseEve(viObj?.l1_curr_eve_min ?? viObj?.l1CurrEveMin);
  const currL1EveMax = parseEve(viObj?.l1_curr_eve_max ?? viObj?.l1CurrEveMax);
  const currL1Alert = Number(viObj?.l1_curr_alert ?? viObj?.l1CurrAlert ?? 0);
  const currL1Vio = viObj?.l1_curr_vio ?? viObj?.l1CurrVio;

  const currL2Num = toNumber(currL2, 0);
  const currL2Min = toNumber(viObj?.l2_curr_range_min ?? viObj?.l2CurrRangeMin, 0);
  const currL2Max = toNumber(viObj?.l2_curr_range_max ?? viObj?.l2CurrRangeMax, ratedAmps || 100);
  const currL2EveMin = parseEve(viObj?.l2_curr_eve_min ?? viObj?.l2CurrEveMin);
  const currL2EveMax = parseEve(viObj?.l2_curr_eve_max ?? viObj?.l2CurrEveMax);
  const currL2Alert = Number(viObj?.l2_curr_alert ?? viObj?.l2CurrAlert ?? 0);
  const currL2Vio = viObj?.l2_curr_vio ?? viObj?.l2CurrVio;

  const currL3Num = toNumber(currL3, 0);
  const currL3Min = toNumber(viObj?.l3_curr_range_min ?? viObj?.l3CurrRangeMin, 0);
  const currL3Max = toNumber(viObj?.l3_curr_range_max ?? viObj?.l3CurrRangeMax, ratedAmps || 100);
  const currL3EveMin = parseEve(viObj?.l3_curr_eve_min ?? viObj?.l3CurrEveMin);
  const currL3EveMax = parseEve(viObj?.l3_curr_eve_max ?? viObj?.l3CurrEveMax);
  const currL3Alert = Number(viObj?.l3_curr_alert ?? viObj?.l3CurrAlert ?? 0);
  const currL3Vio = viObj?.l3_curr_vio ?? viObj?.l3CurrVio;

  // Summary thresholds & alerts matching Android
  const lineVoltNum = toNumber(lineVoltVal, 0);
  const lineVoltMin = toNumber(viObj?.lv_range_min ?? viObj?.Lv_summ_range_min, 0);
  const lineVoltMax = toNumber(viObj?.lv_range_max ?? viObj?.Lv_summ_range_max, 500);
  const lineVoltEveMin = parseEve(viObj?.lv_eve_min ?? viObj?.Lv_summ_eve_min);
  const lineVoltEveMax = parseEve(viObj?.lv_eve_max ?? viObj?.Lv_summ_eve_max);

  const phaseVoltNum = toNumber(phaseVoltVal, 0);
  const phaseVoltMin = toNumber(viObj?.pv_range_min ?? viObj?.pv_summ_range_min, 0);
  const phaseVoltMax = toNumber(viObj?.pv_range_max ?? viObj?.pv_summ_range_max, 300);
  const phaseVoltEveMin = parseEve(viObj?.pv_eve_min ?? viObj?.pv_summ_eve_min);
  const phaseVoltEveMax = parseEve(viObj?.pv_eve_max ?? viObj?.pv_summ_eve_max);

  const totalCurrNum = toNumber(totalCurrVal, 0);
  const totalCurrMin = toNumber(viObj?.c_range_min ?? viObj?.c_summ_range_min, 0);
  const totalCurrMax = toNumber(viObj?.c_range_max ?? viObj?.c_summ_range_max, (ratedAmps * 3) || 300);
  const totalCurrEveMin = parseEve(viObj?.c_eve_min ?? viObj?.c_summ_eve_min);
  const totalCurrEveMax = parseEve(viObj?.c_eve_max ?? viObj?.c_summ_eve_max);

  vAndISlidesData.value = [
    {
      id: 'frequency',
      title: 'Frequency',
      type: 'simple-list',
      items: [
        { label: 'L1', value: `${freqL1} ${freqL1Unit}`, isAlert: Number(viObj?.l1_freq_alert ?? 0) === 1, alertImg: getAlertBadge(viObj?.l1_freq_vio) },
        { label: 'L2', value: `${freqL2} ${freqL2Unit}`, isAlert: Number(viObj?.l2_freq_alert ?? 0) === 1, alertImg: getAlertBadge(viObj?.l2_freq_vio) },
        { label: 'L3', value: `${freqL3} ${freqL3Unit}`, isAlert: Number(viObj?.l3_freq_alert ?? 0) === 1, alertImg: getAlertBadge(viObj?.l3_freq_vio) },
      ],
    },
    {
      id: 'current',
      title: 'Current',
      type: 'list-with-indicator',
      items: [
        {
          label: 'L1',
          value: `${currL1} ${currL1Unit}`,
          isAlert: currL1Alert === 1 || getBarGauge(currL1Num, currL1Min, currL1Max, currL1EveMin, currL1EveMax).isRed,
          gauge: getBarGauge(currL1Num, currL1Min, currL1Max, currL1EveMin, currL1EveMax),
          alertImg: getAlertBadge(currL1Vio)
        },
        {
          label: 'L2',
          value: `${currL2} ${currL2Unit}`,
          isAlert: currL2Alert === 1 || getBarGauge(currL2Num, currL2Min, currL2Max, currL2EveMin, currL2EveMax).isRed,
          gauge: getBarGauge(currL2Num, currL2Min, currL2Max, currL2EveMin, currL2EveMax),
          alertImg: getAlertBadge(currL2Vio)
        },
        {
          label: 'L3',
          value: `${currL3} ${currL3Unit}`,
          isAlert: currL3Alert === 1 || getBarGauge(currL3Num, currL3Min, currL3Max, currL3EveMin, currL3EveMax).isRed,
          gauge: getBarGauge(currL3Num, currL3Min, currL3Max, currL3EveMin, currL3EveMax),
          alertImg: getAlertBadge(currL3Vio)
        },
      ],
    },
    {
      id: 'voltage',
      title: 'Voltage',
      type: 'dual-column',
      leftColumn: [
        { label: 'L1 - N', value: `${vL1N} ${vL1NUnit}`, isAlert: vL1NAlert === 1, alertImg: getAlertBadge(vL1NVio) },
        { label: 'L2 - N', value: `${vL2N} ${vL2NUnit}`, isAlert: vL2NAlert === 1, alertImg: getAlertBadge(vL2NVio) },
        { label: 'L3 - N', value: `${vL3N} ${vL3NUnit}`, isAlert: vL3NAlert === 1, alertImg: getAlertBadge(vL3NVio) },
      ],
      rightColumn: [
        { label: 'L1 - L2', value: `${vL1L2} ${vL1L2Unit}`, isAlert: vL1L2Alert === 1, alertImg: getAlertBadge(vL1L2Vio) },
        { label: 'L2 - L3', value: `${vL2L3} ${vL2L3Unit}`, isAlert: vL2L3Alert === 1, alertImg: getAlertBadge(vL2L3Vio) },
        { label: 'L3 - L1', value: `${vL3L1} ${vL3L1Unit}`, isAlert: vL3L1Alert === 1, alertImg: getAlertBadge(vL3L1Vio) },
      ],
    },
    {
      id: 'summary',
      title: 'Summary',
      type: 'list-with-indicator',
      items: [
        {
          label: 'AVG. LINE VOLT',
          value: `${lineVoltVal} ${lineVoltUnit}`,
          isAlert: lineVoltAlert === 1 || getBarGauge(lineVoltNum, lineVoltMin, lineVoltMax, lineVoltEveMin, lineVoltEveMax).isRed,
          gauge: getBarGauge(lineVoltNum, lineVoltMin, lineVoltMax, lineVoltEveMin, lineVoltEveMax),
          alertImg: getAlertBadge(lineVoltVio)
        },
        {
          label: 'AVG. PHASE VOLT',
          value: `${phaseVoltVal} ${phaseVoltUnit}`,
          isAlert: phaseVoltAlert === 1 || getBarGauge(phaseVoltNum, phaseVoltMin, phaseVoltMax, phaseVoltEveMin, phaseVoltEveMax).isRed,
          gauge: getBarGauge(phaseVoltNum, phaseVoltMin, phaseVoltMax, phaseVoltEveMin, phaseVoltEveMax),
          alertImg: getAlertBadge(phaseVoltVio)
        },
        {
          label: 'TOTAL CURRENT',
          value: `${totalCurrVal} ${totalCurrUnit}`,
          isAlert: totalCurrAlert === 1 || getBarGauge(totalCurrNum, totalCurrMin, totalCurrMax, totalCurrEveMin, totalCurrEveMax).isRed,
          gauge: getBarGauge(totalCurrNum, totalCurrMin, totalCurrMax, totalCurrEveMin, totalCurrEveMax),
          alertImg: getAlertBadge(totalCurrVio)
        },
      ],
    },
  ];

};

// SVG arc calculation helper for gauges (radius 38, centered at 50, 50)
const gaugeArc = (value: any, maxVal: number, minVal = 0) => {
  const v = parseFloat(value) || 0;
  const min = Number.isFinite(minVal) ? minVal : 0;
  const max = maxVal > min ? maxVal : min + 1;
  const pct = Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  if (pct <= 0) {
    return 'M 12 50 A 38 38 0 0 1 12.1 49.5';
  }
  const rad = Math.PI * (1 - pct / 100);
  const x = 50 - 38 * Math.cos(Math.PI - rad);
  const y = 50 - 38 * Math.sin(Math.PI - rad);
  return `M 12 50 A 38 38 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
};

// Draw a dashboard-style segmented half gauge, matching the Android dashboard.
const gaugeTicks = (value: any, maxVal: number, minVal = 0) => {
  const count = 25;
  const v = Number(value);
  const min = Number.isFinite(minVal) ? minVal : 0;
  const max = Number.isFinite(maxVal) && maxVal > min ? maxVal : min + 1;
  const pct = Math.max(0, Math.min(1, ( (Number.isFinite(v) ? v : 0) - min) / (max - min)));
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI - (index / (count - 1)) * Math.PI;
    const inner = 32;
    const outer = 38;
    const x1 = 50 + inner * Math.cos(angle);
    const y1 = 50 - inner * Math.sin(angle);
    const x2 = 50 + outer * Math.cos(angle);
    const y2 = 50 - outer * Math.sin(angle);
    return {
      index,
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      active: index / (count - 1) <= pct
    };
  });
};

const isOutOfEventRange = (value: any, eveMin: number, eveMax: number) => {
  const v = Number(value);
  if (!Number.isFinite(v) || !Number.isFinite(eveMin) || !Number.isFinite(eveMax)) return false;
  return v < eveMin || v > eveMax;
};

const ZERO_CIRC_INIT = { layer1: '/cgr_0.png', layer2: '/cgg_0.png', layer3: '/cgr_0.png', isRed: false };
const powerTotalData = ref({
  kw: '0.0', kwUnit: 'kW', kwAlert: 0, kwAlertImg: null as string | null, kwGauge: ZERO_CIRC_INIT,
  kva: '0.0', kvaUnit: 'kVA', kvaAlert: 0, kvaAlertImg: null as string | null, kvaGauge: ZERO_CIRC_INIT,
  kvar: '0.0', kvarUnit: 'kVAR', kvarAlert: 0, kvarAlertImg: null as string | null, kvarGauge: ZERO_CIRC_INIT,
  pf: '0.0', pfUnit: 'pf', pfAlert: 0, pfAlertImg: null as string | null, pfGaugeImg: '/pf_0.png',
  pfLabel: 'LAG', showPfLag: true,
});

const emptyPowerPhase = () => ({
  pf: '0.0', pfUnit: 'pf', pfAlert: 0, pfAlertImg: null as string | null,
  kw: '0.0', kwUnit: 'kW', kwAlert: 0, kwAlertImg: null as string | null,
  kva: '0.0', kvaUnit: 'kVA', kvaAlert: 0, kvaAlertImg: null as string | null,
  kvar: '0.0', kvarUnit: 'kVAR', kvarAlert: 0, kvarAlertImg: null as string | null,
});

const power3PhaseData = ref({
  p1: emptyPowerPhase(),
  p2: emptyPowerPhase(),
  p3: emptyPowerPhase(),
});

const energySlidesData = ref([
  
  {
    id: 'generator',
    title: 'Energy - Generator',
    items: [
      { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
      { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
      { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
    ],
  },
  {
    id: 'mains',
    title: 'Energy - Mains',
    items: [
      { label: 'ACTIVE', value: '0.0 kWh', isHighlighted: true },
      { label: 'APPARENT', value: '0.0 kVAh', isHighlighted: false },
      { label: 'REACTIVE', value: '0.0 kVARh', isHighlighted: false },
    ],
  },
]);

const runHourSlidesData = ref([

  {
    id: 'generator',
    title: 'RunHour - Generator',
    items: [
      { label: 'TOTAL', value: '0 hr 0 min 0 sec' },
      { label: 'TODAY', value: '0 hr 0 min 0 sec' },
      { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
    ],
  },
    {
    id: 'mains',
    title: 'RunHour - Mains',
    items: [
      { label: 'TOTAL', value: '0 hr 0 min 0 sec' },
      { label: 'TODAY', value: '0 hr 0 min 0 sec' },
      { label: 'TRIP',  value: '0 hr 0 min 0 sec' },
    ],
  },
]);

const ZERO_VBAR_INIT = { layer1: '/vbgr_0.png', layer2: '/vbgg_0.png', layer3: '/vbgr_0.png', isRed: false };
const ZERO_CIRC_INIT2 = { layer1: '/cgr_0.png', layer2: '/cgg_0.png', layer3: '/cgr_0.png', isRed: false };
const engineData = ref({
  battery: {
    voltage: '26.4 V',
    isAlert: false,
    gauge: { layer1: '/vbgr_0.png', layer2: '/vbgg_7.png', layer3: '/vbgr_0.png', isRed: false },
    alertImg: null as string | null,
    level: 0.88,
  },
  oilPressure: '420.0 Kpa',
  oilPresAlert: false,
  oilPresGauge: { layer1: '/vbgr_0.png', layer2: '/vbgg_4.png', layer3: '/vbgr_0.png', isRed: false },
  oilPresAlertImg: null as string | null,
  rpm: '1500',
  rpmUnit: 'rpm',
  rpmAlert: false,
  rpmGauge: { layer1: '/cgr_0.png', layer2: '/cgg_10.png', layer3: '/cgr_0.png', isRed: false },
  rpmAlertImg: null as string | null,
  oilTemp: '84.0 °C',
  oilTempAlert: false,
  oilTempGauge: { layer1: '/vbgr_0.png', layer2: '/vbgg_5.png', layer3: '/vbgr_0.png', isRed: false },
  oilTempAlertImg: null as string | null,
  fuel: {
    levelValue: '480.0 L',
    isAlert: false,
    gauge: { layer1: '/vbgr_0.png', layer2: '/vbgg_6.png', layer3: '/vbgr_0.png', isRed: false },
    alertImg: null as string | null,
    level: 0.72,
  },
  coolantTemp: '82.0 °C',
  coolTempAlert: false,
  coolantTempGauge: { layer1: '/vbgr_0.png', layer2: '/vbgg_5.png', layer3: '/vbgr_0.png', isRed: false },
  coolantTempAlertImg: null as string | null,
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

// â”€â”€â”€ 15-Minute Auto-Refresh Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const startAutoRefresh = () => {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    loadDashboardData();
  }, AUTO_REFRESH_INTERVAL_MS);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

onMounted(() => {
  loadDashboardData();
  startAutoRefresh();
});

onIonViewDidEnter(() => {
  startAutoRefresh();
});

onIonViewDidLeave(() => {
  stopAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
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

/* â”€â”€ Section Blocks â”€â”€ */
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

/* â”€â”€ Section 1: Site cards (Strict Uniform Dimensions) â”€â”€ */
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

/* â”€â”€ Section 2: Generator List Items (Strict Uniform Dimensions & Decreased Size) â”€â”€ */
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

.gen-thumb-wrap {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  margin-right: 8px;
  flex-shrink: 0;
  background: #23211f;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.gen-item-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gen-thumb-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid #1c1a18;
}
.gen-thumb-status-dot.dot-on {
  background-color: #2dd36f;
  box-shadow: 0 0 4px #2dd36f;
}
.gen-thumb-status-dot.dot-off {
  background-color: #92949c;
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

/* â”€â”€ Section 3: Telemetry & Info Card â”€â”€ */
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
.gen-detail-header-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.gen-detail-info-col {
  flex: 1;
  min-width: 0;
}
.gen-detail-img-col {
  flex-shrink: 0;
  width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.gen-detail-photo {
  width: 92px;
  height: 68px;
  object-fit: contain;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(245, 156, 32, 0.4);
  background: #252321;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.35);
}
.gen-img-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  letter-spacing: 0.5px;
  text-align: center;
  width: 100%;
}
.gen-img-badge.badge-running {
  background: rgba(45, 211, 111, 0.15);
  color: #2dd36f;
  border: 1px solid rgba(45, 211, 111, 0.4);
}
.gen-img-badge.badge-stopped {
  background: rgba(245, 156, 32, 0.15);
  color: #f59c20;
  border: 1px solid rgba(245, 156, 32, 0.4);
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
  margin-top: 4px;
}
.status-footer-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.info-card .offline-status {
  color: var(--ion-color-primary);
  font-weight: bold;
  font-size: 0.78em;
}
.info-card .running-status {
  color: #2dd36f;
  font-weight: bold;
  font-size: 0.78em;
}
.info-card .last-updated {
  font-size: 0.68em;
  color: var(--ion-text-color);
  text-align: right;
}

/* â”€â”€ Left Category Menu â”€â”€ */
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

/* â”€â”€ Telemetry Slides Container â”€â”€ */
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

/* â”€â”€ 1. Power Total 2x2 Gauges (Android layered images) â”€â”€ */
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

/* Circular gauge wrapper (kW, kVA, kVAR) â€” layers cgb.png + cgg/cgr */
.circular-gauge-wrapper {
  position: relative;
  width: 100%;
  max-width: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.circular-gauge-bg {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}
.circular-gauge-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  object-fit: contain;
}
.circular-gauge-content {
  position: absolute;
  bottom: 0.15px;          /* changed from 6px to fit inside the arch */  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.circular-gauge-content1 {
  position: absolute;
  top:30px;
  bottom: 0.15px;          /* changed from 6px to fit inside the arch */  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}



.circular-gauge-val {
  font-size: 1.1em;
  font-weight: 700;
  color: var(--ion-color-whiteTwo, #ffffff);
  line-height: 1;
}

.circular-gauge-unit {
  font-size: 0.65em;
  font-weight: 600;
  color: var(--ion-color-pinkishGrey, #c4c4c4);
  letter-spacing: 0.3px;
  margin-top: 1px;
  text-transform: uppercase;   /* makes "pf" appear as "PF" */
}
/* Power Factor LAG text */
.pf-lag-text {
  font-size: 0.85em;
  color: var(--ion-color-primary, #f59c20);
  font-weight: 700;
  margin-left: 2px;
}

/* Alert color for power values when alert === 1 */
.power-alert-color {
  color: #eb445a !important;
}

/* Alert badge icon on gauge cards */
.power-alert-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  object-fit: contain;
  z-index: 3;
}

/* Phase alert badge (in 3-phase rows) */
.phase-alert-badge {
  width: 13px;
  height: 13px;
  vertical-align: middle;
  margin-left: 4px;
}

/* â”€â”€ Power 3Phase Slide â”€â”€ */
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

/* â”€â”€ Energy Slides â”€â”€ */
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

/* â”€â”€ Engine Slide (Android layered vbar + circular gauges) â”€â”€ */
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
.engine-val-top {
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

/* Vertical bar gauge container (stacks vbgb + vbgg/vbgr) */
.engine-vbar-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  min-width: 16px;
  margin: 2px 0;
}
.engine-vbar-bg {
  height: 40px;
  width: auto;
  object-fit: contain;
}
.engine-vbar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  width: auto;
  object-fit: contain;
}

.engine-item-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.engine-alert-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  width: 14px;
  height: 14px;
  object-fit: contain;
  z-index: 2;
}

/* RPM circular gauge (stacks cgb + cgg/cgr) */
.rpm-gauge-wrapper {
  position: relative;
  width: 90px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rpm-circle-bg {
  width: 90px;
  height: 56px;
  object-fit: contain;
}
.rpm-circle-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 90px;
  height: 56px;
  object-fit: contain;
}
.rpm-inner-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -35%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.rpm-alert {
  top: -4px;
  right: 2px;
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
  margin-top: 1px;
}

/* â”€â”€ V and I Slides â”€â”€ */
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

.power-out-of-event-range {
  color: var(--ion-color-danger, #eb445a) !important;
}

.vi-alert-color {
  color: var(--ion-color-danger, #eb445a) !important;
}

.vi-alert-badge {
  width: 13px;
  height: 13px;
  vertical-align: middle;
  margin-left: 4px;
}

.vi-barchart-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 26px;
  flex-shrink: 0;
}

.vi-barchart-bg {
  width: 52px;
  height: 26px;
  display: block;
  object-fit: contain;
}

.vi-barchart-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 52px;
  height: 26px;
  object-fit: contain;
}

</style>
