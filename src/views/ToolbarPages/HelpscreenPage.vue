<template>
  <ion-page>
    <!-- Header with Back Button and Guide Title -->
    <ion-header style="background-color: var(--ion-color-greyishBrown, #24201e);">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack" class="back-btn">
            <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ screenTitle }}</ion-title>
        <ion-buttons slot="end">
          <div class="page-id-badge">
            Module {{ targetPageId }}
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <div v-if="!isConnected" class="network-status-bar">
      No Network Connection
    </div>
    <div v-if="isConnected && showReconnectedMessage" class="network-status-bar connected">
      Connected to Network
    </div>

    <ion-content class="help-content-bg" :fullscreen="false">
      <div class="swiper-container" v-if="slides.length > 0">
        <swiper
          :modules="[Pagination]"
          :slides-per-view="1"
          :space-between="16"
          :pagination="{ clickable: true }"
          @swiper="onSwiper"
          @slideChange="onSlideChange"
          ref="swiperRef"
          class="help-swiper"
        >
          <swiper-slide v-for="(slide, index) in slides" :key="index">
            <div class="slide-content">
              <div class="image-wrapper">
                <img
                  class="slide-image"
                  :src="slide.imagelink"
                  :alt="slide.headername"
                  @error="onImageError($event, index)"
                />
                <div class="slide-step-badge">
                  {{ index + 1 }} / {{ slides.length }}
                </div>
              </div>

              <h2 class="slide-title">{{ slide.headername }}</h2>
              <p class="slide-description">{{ slide.description }}</p>
            </div>
          </swiper-slide>
        </swiper>

        <!-- Navigation Footer -->
        <div class="navigation-container">
          <ion-button
            v-if="!isLastSlide"
            class="custom-skip"
            @click="skip"
            fill="clear"
          >
            Skip
          </ion-button>
          <div v-else class="skip-placeholder"></div>

          <!-- Page Numbering Display -->
          <div class="pagination-numbering">
            <span class="page-num-text">Page {{ currentIndex + 1 }} of {{ slides.length }}</span>
          </div>

          <ion-button
            class="custom-next"
            @click="next"
            fill="solid"
          >
            {{ nextButtonText }}
          </ion-button>
        </div>
      </div>

      <!-- Loading / Empty State -->
      <div v-else class="loading-state">
        <ion-spinner name="crescent" color="warning"></ion-spinner>
        <p>Loading help content for Page #{{ targetPageId }}...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSpinner,
  loadingController,
} from '@ionic/vue';
import { arrowBack } from 'ionicons/icons';
import 'swiper/css';
import 'swiper/css/pagination';
import { getHelpScreen } from '@/services/ApiService';
import { Network } from '@capacitor/network';
import useNetwork from '@/services/networkService';
import { showToast } from '@/services/toast';

const { isConnected, showReconnectedMessage, initNetworkListener } = useNetwork();

interface SlideItem {
  srno: string;
  page_id: string;
  headername: string;
  imagelink: string;
  description: string;
}

const slides = ref<SlideItem[]>([]);
const swiperRef = ref<any>(null);
const swiperInstance = ref<any>(null);
const currentIndex = ref(0);

const router = useRouter();
const route = useRoute();

// Reactively compute target pageid from route params or query (defaults to 1)
const targetPageId = computed<number>(() => {
  const p = route.params.pageid || route.query.pageid;
  const num = Number(p);
  return !isNaN(num) && num > 0 ? num : 1;
});

// Title mapped to each module page id
const screenTitle = computed(() => {
  switch (targetPageId.value) {
    case 1:
      return 'Dashboard Guide';
    case 2:
      return 'Notifications Guide';
    case 3:
      return 'Reports & History Guide';
    case 4:
      return 'Fleet Map Guide';
    case 5:
      return 'Generator Control Guide';
    default:
      return `Help Guide (${targetPageId.value})`;
  }
});

// Fallback guide slides for all 5 Android RGT screens
const getDefaultSlides = (pageId: number): SlideItem[] => {
  switch (pageId) {
    case 1:
      return [
        {
          srno: '1',
          page_id: '1',
          headername: 'Fleet Overview & Site Selection',
          imagelink: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          description: 'View total generator count, active ON/OFF status, and switch between sites (e.g. PMVE, J#327) using the horizontal site carousel.',
        },
        {
          srno: '2',
          page_id: '1',
          headername: 'Generator Cards & Real-Time Status',
          imagelink: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
          description: 'Each generator item displays its capacity, model, and active state (ON/OFF/Offline). Tap any card to view detailed telemetry metrics.',
        },
        {
          srno: '3',
          page_id: '1',
          headername: 'Telemetry Tabs: Power & 3-Phase',
          imagelink: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
          description: 'Monitor active total power, dynamic gauge meters, and phase-by-phase breakdown for kW, kVA, kVAR, and Power Factor.',
        },
        {
          srno: '4',
          page_id: '1',
          headername: 'Energy, RunHour, Engine & V/I Metrics',
          imagelink: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=800&q=80',
          description: 'Inspect Mains and Generator energy counters (kWh, kVAh), engine RPM, battery voltage, oil pressure, and line voltages.',
        },
      ];
    case 2:
      return [
        {
          srno: '1',
          page_id: '2',
          headername: 'Generator Alerts & Events',
          imagelink: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          description: 'Review critical alerts, maintenance reminders, and operational events triggered across your generator fleet.',
        },
        {
          srno: '2',
          page_id: '2',
          headername: 'Event Filtering & Search',
          imagelink: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
          description: 'Quickly find specific alarms by filtering by site, generator model, fault type, or timestamp.',
        },
      ];
    case 3:
      return [
        {
          srno: '1',
          page_id: '3',
          headername: 'Operational History & Logs',
          imagelink: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          description: 'Export and examine comprehensive historical data, including run hours, voltage stability, and event logs.',
        },
        {
          srno: '2',
          page_id: '3',
          headername: 'Fuel Filling & Consumption Analytics',
          imagelink: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
          description: 'Track fuel fill events, sudden drops, and consumption trends across custom date ranges with interactive charts.',
        },
      ];
    case 4:
      return [
        {
          srno: '1',
          page_id: '4',
          headername: 'Fleet GPS Map',
          imagelink: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
          description: 'Locate generators geographically with status-coded markers (Green for ON, Grey/Red for OFF).',
        },
        {
          srno: '2',
          page_id: '4',
          headername: 'Marker Details & Navigation',
          imagelink: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
          description: 'Tap any marker on the map to view the generator name, address, coordinates, and instant status.',
        },
      ];
    case 5:
      return [
        {
          srno: '1',
          page_id: '5',
          headername: 'Remote Generator Control',
          imagelink: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          description: 'Safely issue start and stop commands to authorized generators from anywhere with dual confirmation.',
        },
        {
          srno: '2',
          page_id: '5',
          headername: 'Site & Generator Search',
          imagelink: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
          description: 'Use the dual search bars at the top to filter generators by Site or Generator Name instantly.',
        },
      ];
    default:
      return [
        {
          srno: '1',
          page_id: String(pageId),
          headername: 'TracerRGT Help Guide',
          imagelink: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          description: 'Explore the full capabilities of TracerRGT Generator Management.',
        },
      ];
  }
};

// Fetch slides data from API with fallback
const fetchSlidesData = async () => {
  const loading = await loadingController.create({
    message: `Loading Guide (Page #${targetPageId.value})...`,
    duration: 3500,
  });
  await loading.present();

  try {
    const pageToLoad = targetPageId.value;
    const response = await getHelpScreen(pageToLoad);

    if (response?.status === 200 && response?.data) {
      const dataList =
        response.data.arr_data ||
        response.data.data ||
        (Array.isArray(response.data) ? response.data : []);

      if (Array.isArray(dataList) && dataList.length > 0) {
        slides.value = dataList.map((item: any, idx: number) => ({
          srno: String(item.srno || idx + 1),
          page_id: String(item.page_id || pageToLoad),
          headername: item.headername || item.title || item.header_name || `Guide Step ${idx + 1}`,
          imagelink:
            item.imagelink ||
            item.image ||
            item.img ||
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          description: item.description || item.desc || '',
        }));
        currentIndex.value = 0;
        return;
      }
    }

    // Default fallback specific to this pageid
    slides.value = getDefaultSlides(targetPageId.value);
    currentIndex.value = 0;
  } catch (error: any) {
    console.warn(`Error fetching help screen data for page #${targetPageId.value}:`, error);
    slides.value = getDefaultSlides(targetPageId.value);
    currentIndex.value = 0;
  } finally {
    try {
      await loading.dismiss();
    } catch (e) {}
  }
};

const onImageError = (event: Event, index: number) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  }
};

onMounted(async () => {
  if (swiperRef.value && swiperRef.value.swiper) {
    swiperInstance.value = swiperRef.value.swiper;
  }

  const status = await Network.getStatus();
  if (status.connected) {
    fetchSlidesData();
  } else {
    showToast();
    slides.value = getDefaultSlides(targetPageId.value);
  }

  initNetworkListener();
});

// Re-fetch whenever the route or pageid param changes
watch(
  () => targetPageId.value,
  () => {
    fetchSlidesData();
  }
);

watch(
  () => swiperRef.value?.swiper,
  (newSwiper) => {
    swiperInstance.value = newSwiper;
  },
  { immediate: true }
);

const onSwiper = (swiper: any) => {
  swiperInstance.value = swiper;
};

const onSlideChange = () => {
  currentIndex.value = swiperInstance.value?.realIndex || 0;
};

const isLastSlide = computed(() => currentIndex.value === slides.value.length - 1);
const nextButtonText = computed(() => (isLastSlide.value ? 'Got It' : 'Next'));

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace(`/tabs/tab${targetPageId.value}`);
  }
};

const skip = () => {
  goBack();
};

const next = () => {
  if (swiperInstance.value) {
    if (isLastSlide.value) {
      goBack();
    } else {
      swiperInstance.value.slideNext();
    }
  }
};
</script>

<style scoped>
.help-content-bg {
  --background: var(--ion-color-greyishBrown, #24201e);
  color: #fff;
}

.back-btn {
  --color: #fdcf9f;
  font-size: 20px;
}

.page-id-badge {
  background-color: rgba(253, 207, 159, 0.15);
  color: #fdcf9f;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(253, 207, 159, 0.3);
  margin-right: 8px;
}

.swiper-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 60px);
  position: relative;
  box-sizing: border-box;
}

.help-swiper {
  flex: 1;
  width: 100%;
  height: calc(100% - 70px);
}

.slide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  height: 100%;
  padding: 20px 20px 80px 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.image-wrapper {
  position: relative;
  width: 100%;
  max-width: 560px;
  margin-bottom: 20px;
}

.slide-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.slide-step-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fdcf9f;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.slide-title {
  font-size: 20px;
  font-weight: 700;
  color: #fdcf9f;
  margin: 0 0 12px 0;
  font-family: 'Rajdhani', sans-serif;
}

.slide-description {
  font-size: 14px;
  line-height: 1.5;
  color: #e2ded8;
  max-width: 500px;
  margin: 0;
}

.navigation-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(36, 32, 30, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.custom-skip {
  --color: #a0998e;
  font-size: 14px;
  font-weight: 600;
  min-width: 70px;
}

.skip-placeholder {
  min-width: 70px;
}

.pagination-numbering {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.page-num-text {
  font-size: 12px;
  font-weight: 600;
  color: #fdcf9f;
  background: rgba(253, 207, 159, 0.1);
  padding: 4px 12px;
  border-radius: 14px;
  letter-spacing: 0.5px;
}

.custom-next {
  --background: #fdcf9f;
  --color: #24201e;
  --border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  min-width: 90px;
  height: 38px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
  color: #a0998e;
  font-size: 14px;
}

.network-status-bar {
  background-color: #dc3545;
  color: white;
  text-align: center;
  padding: 6px;
  font-size: 12px;
}

.network-status-bar.connected {
  background-color: #28a745;
}
</style>
