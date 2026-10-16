
 <template> 
  <ion-page>
    <div v-if="!isConnected" class="network-status-bar">
      No Network Connection
    </div>
    <div v-if="isConnected && showReconnectedMessage" class="network-status-bar connected">
      Connected to Network
    </div>

    <ion-content>
      <div class="swiper-container">
        <swiper
          :modules="[Pagination]"
          :slides-per-view="1"
          :space-between="10"
          pagination
          @swiper="onSwiper"
          @slideChange="onSlideChange"
          ref="swiperRef"
        >
          <swiper-slide v-for="(slide, index) in slides" :key="index">
            <div class="slide-content">
              <img
                class="slide-image"
                :src="slide.imagelink"
                :alt="slide.headername"
              />
              <h2 class="slide-title">{{ slide.headername }}</h2>
              <p class="slide-description">{{ slide.description }}</p>
            </div>
          </swiper-slide>
        </swiper>

        <div class="navigation-container">
          <ion-button
            v-if="!isLastSlide"
            class="custom-skip"
            @click="skip"
            fill="clear"
          >
            Skip
          </ion-button>
          <div class="pagination-container"></div>
          <ion-button
            class="custom-next"
            @click="next"
            fill="clear"
          >
            {{ nextButtonText }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonButton, IonContent, IonPage, loadingController } from '@ionic/vue';
import 'swiper/css';
import 'swiper/css/pagination';
import Constants from "@/common/constants";
import { fetchData, getHelpScreen } from "@/services/ApiService";
import { Network } from '@capacitor/network';
import useNetwork from '@/services/networkService'; // Import the network service
import { showToast ,showToastMessage} from '@/services/toast'; // Import the toast utility function


const { isConnected, showReconnectedMessage, initNetworkListener } = useNetwork(); // Use network service

// Reactive ref to store slides data
const slides = ref([]);
const swiperRef = ref(null);
const swiperInstance = ref(null);

const router = useRouter();
const route = useRoute();

const currentIndex = ref(0); // Track the current slide index
const pageid = route.params.pageid;

console.log("displayPage", pageid);

// Fetch slides data from API
const fetchSlidesData = async () => {
  const loading = await loadingController.create({ message: 'Loading guide...' });
  await loading.present();

  try {
    const pageToLoad = pageid ? Number(pageid) : 1;
    const response = await getHelpScreen(pageToLoad);

    if (response.status === 200 && response.data) {
      const dataList = response.data.arr_data || response.data.data || (Array.isArray(response.data) ? response.data : []);
      if (dataList.length > 0) {
        slides.value = dataList.map((item: any, idx: number) => ({
          srno: String(item.srno || idx + 1),
          page_id: String(item.page_id || pageToLoad),
          headername: item.headername || item.title || item.header_name || 'Guide',
          imagelink: item.imagelink || item.image || item.img || 'https://via.placeholder.com/800x400',
          description: item.description || item.desc || '',
        }));
        return;
      }
    }
    // Fallback if empty response
    slides.value = [
      {
        srno: '1',
        page_id: '1',
        headername: 'Welcome to TracerRGT',
        imagelink: 'https://via.placeholder.com/800x400',
        description: 'Monitor your fleet of generators and fuel analytics in real-time.',
      }
    ];
  } catch (error: any) {
    console.error('Error fetching help screen data:', error);
    slides.value = [
      {
        srno: '1',
        page_id: '1',
        headername: 'TracerRGT Support',
        imagelink: 'https://via.placeholder.com/800x400',
        description: 'Discover generator status, telemetry parameters, fuel monitoring, and reports.',
      }
    ];
  } finally {
    await loading.dismiss();
  }
};

// Ensure Swiper instance is available when needed
onMounted(async () => {

  if (swiperRef.value && swiperRef.value.swiper) {
    swiperInstance.value = swiperRef.value.swiper;
  }
  
  return Network.getStatus().then((status) => {
                    if (status.connected) {
                      fetchSlidesData();
                    } else {
                      showToast();
                    }
                  });

  initNetworkListener();

});

// Reactively update swiperInstance when Swiper instance is created
watch(
  () => swiperRef.value?.swiper,
  (newSwiper) => {
    swiperInstance.value = newSwiper;
  },
  { immediate: true }
);

const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

// Update the current slide index on slide change
const onSlideChange = () => {
  currentIndex.value = swiperInstance.value?.realIndex || 0;
};

// Compute if the current slide is the last one
const isLastSlide = computed(() => currentIndex.value === slides.value.length - 1);

// Compute the button text based on the current slide
const nextButtonText = computed(() => (isLastSlide.value ? 'Got It' : 'Next'));

// Navigate to menu or slide to next
const skip = () => {
  router.replace({ path: "/tabs" });
};

const next = () => {
  if (swiperInstance.value) {
    const isLastSlide = swiperInstance.value.realIndex === slides.value.length - 1;
    if (isLastSlide) {
      router.replace({ path: "/tabs" });
    } else {
      swiperInstance.value.slideNext();
    }
  }
};

</script>

<style scoped>
.swiper-container {
  position: relative;
  height: 100%;
  justify-content: center;
  align-items: center;
  display: flex;
  color: #fff;
}

.slide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 20px;
}

.slide-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.slide-image {
  width: 100%;
  max-width: 800px;
  height: 300px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.slide-description {
  font-size: 16px;
  color: #fff;
}

.navigation-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  position: absolute;
  bottom: 10px;
  z-index: 10;
}

.custom-skip,
.custom-next {
  padding: 10px 20px;
  color: #fff;
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

.network-status-bar {
  background-color: red;
  color: white;
  text-align: center;
  padding: 5px;
  font-size: 14px;
}


.network-status-bar.connected {
  background-color: green;
}
</style> 

