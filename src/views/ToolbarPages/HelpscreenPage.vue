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
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <ion-spinner name="crescent" color="warning"></ion-spinner>
        <p>Loading help content for Page #{{ targetPageId }}...</p>
      </div>

      <!-- Slides Content -->
      <div class="swiper-container" v-else-if="slides.length > 0">
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
              <div class="image-wrapper" v-if="slide.imagelink">
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

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="helpCircleOutline" class="empty-icon"></ion-icon>
        <p class="empty-text">No help content available</p>
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
import { arrowBack, helpCircleOutline } from 'ionicons/icons';
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
const isLoading = ref(false);
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

// Fetch slides data from API
const fetchSlidesData = async () => {
  isLoading.value = true;
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
          imagelink: item.imagelink || item.image || item.img || '',
          description: item.description || item.desc || '',
        }));
        currentIndex.value = 0;
        return;
      }
    }

    slides.value = [];
    currentIndex.value = 0;
  } catch (error: any) {
    console.warn(`Error fetching help screen data for page #${targetPageId.value}:`, error);
    slides.value = [];
    currentIndex.value = 0;
  } finally {
    isLoading.value = false;
    try {
      await loading.dismiss();
    } catch (e) {}
  }
};

const onImageError = (event: Event, index: number) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
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
    slides.value = [];
    isLoading.value = false;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 12px;
  color: #a0998e;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  color: #fdcf9f;
  opacity: 0.7;
}

.empty-text {
  font-size: 15px;
  font-weight: 500;
  color: #c4b9a9;
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
