<template>
  <ion-page id="main-content">
    <ion-header style="background-color: var( --ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TracerRGT</ion-title>
     <ion-buttons  slot="primary">
        <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="helpCircle" @click="goToHelpScreen"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="shareSocial" @click="goToSharePage"></ion-icon>
      </div>
      <div class="custom_icon">
        <ion-icon  slot="icon-only" :icon="personCircle" @click="goToProfilePage"></ion-icon>
        </div>

    </ion-buttons>
  </ion-toolbar>

    </ion-header>
    <ion-content>
      <div ref="mapContainer" id="map" style="height: 100%;"></div>

     
      <!-- Search Box displayed on top of the map -->
      <div id="search-box-container" ref="searchContainerRef">
        <div class="search-input-wrapper">
          <ion-icon :icon="searchOutline" class="search-input-icon"></ion-icon>
          <input
            id="search-box"
            type="text"
            placeholder="Search Generator"
            ref="searchBoxRef"
            v-model="searchTerm"
            @focus="onSearchFocus"
            @click="onSearchFocus"
          />
          <ion-icon
            v-if="searchTerm"
            :icon="closeCircle"
            class="clear-input-icon"
            @click.stop="clearSearch"
          ></ion-icon>
        </div>

        <!-- Generator Dropdown List -->
        <div v-if="isSearchOpen && displayGenerators.length > 0" class="search-results">
          <div
            v-for="gen in displayGenerators"
            :key="gen.id"
            class="search-item"
            @click.stop="selectGeneratorFromSearch(gen)"
          >
            <span
              class="gen-badge-dot"
              :style="{ backgroundColor: gen.color || '#4caf50' }"
            ></span>
            <div class="search-item-info">
              <span class="gen-title">{{ gen.name }}</span>
              <span class="gen-subtitle" v-if="gen.capacity || gen.status">
                {{ gen.capacity ? gen.capacity + ' • ' : '' }}{{ gen.status }}
              </span>
            </div>
            <ion-icon :icon="navigateOutline" class="gen-locate-icon"></ion-icon>
          </div>
        </div>

        <div
          v-else-if="isSearchOpen && searchTerm && displayGenerators.length === 0"
          class="search-results search-empty"
        >
          <span>No generator found for "{{ searchTerm }}"</span>
        </div>
      </div>
            
      <ion-fab slot="fixed" vertical="bottom" horizontal="start">
        <ion-fab-button>
          <ion-icon :icon="chevronUpCircle" style="color: var(--ion-color-paleSalmon);"></ion-icon>
        </ion-fab-button>

        <ion-fab-list side="top">
          <!-- Each FAB button with icon on the left and label on the right -->
         

          <div class="fab-item" @click="navigateToPage(1)">
            <ion-icon class="fab-icon" :icon="filterCircle"></ion-icon>
            <ion-label class="fab-label">Filter Generators</ion-label>
          </div>

          <div class="fab-item" @click="navigateToPage(2)">
            <ion-icon class="fab-icon" :icon="homeSharp"></ion-icon>
            <ion-label class="fab-label">Home</ion-label>
          </div>
        </ion-fab-list>
      </ion-fab>
    </ion-content>  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton,IonButtons,IonIcon, IonFab,
  IonFabButton,
  IonFabList,
  IonLabel,   onIonViewWillEnter  // Import necessary lifecycle hooks from Ionic
} from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { fileTrayFull, fileTraySharp, helpCircle, homeSharp, personCircle, shareSocial, } from 'ionicons/icons';
import router from '@/router/index'; // Assuming your router file is named router.js
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Constants from '@/common/constants';
import axios from 'axios';
import { createApp,onMounted,ref,onUnmounted,computed } from 'vue';
import { Loader } from "@googlemaps/js-api-loader";
import {
  homeOutline,
  filterCircle,
  chevronUpCircle,
  searchOutline,
  closeCircle,
  navigateOutline
} from 'ionicons/icons';

declare global {
  interface Window {
    google?: any;
  }
}


const goToHelpScreen = () => {
  router.push('/helpscreen');
};

const goToSharePage = async () => {
  try {
        const ionPageElement = document.getElementById("main-content");
        if (!ionPageElement) {
          console.error("Main content area not found.");
          return;
        }

        const canvas = await html2canvas(ionPageElement);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const fileName = `screenshot_${new Date().getTime()}.jpg`;

        await Filesystem.writeFile({
          path: fileName,
          data: dataUrl.split(',')[1],
          directory: Directory.Cache,
        });

        const uri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Check this out!',
          text: 'Sharing a screenshot',
          url: uri.uri,
          dialogTitle: 'Share Screenshot',
        });
      } catch (error) {
        console.error('Error capturing and sharing screenshot', error);
      }

};

const goToProfilePage = () => {
  router.push('/profile');
};



const isDirection = ref(false);
const isSearchLand = ref(false);
const isMapType = ref(false);

const mapRef = ref<any>(null);
// Search related refs
const searchTerm = ref('');
const isSearchOpen = ref(false);
const searchContainerRef = ref<HTMLElement | null>(null);
const searchBoxRef = ref<HTMLInputElement | null>(null);
const generatorList = ref<any[]>([]);

// Shows all generators when clicked/focused, and filters dynamically when typing
const displayGenerators = computed(() => {
  if (!searchTerm.value || !searchTerm.value.trim()) {
    return generatorList.value;
  }
  const term = searchTerm.value.toLowerCase().trim();
  return generatorList.value.filter((g) =>
    (g.name && g.name.toLowerCase().includes(term)) ||
    (g.capacity && String(g.capacity).toLowerCase().includes(term)) ||
    (g.status && String(g.status).toLowerCase().includes(term))
  );
});

const onSearchFocus = () => {
  isSearchOpen.value = true;
};

const clearSearch = () => {
  searchTerm.value = '';
};

// Close search dropdown on click outside
const handleClickOutside = (e: MouseEvent) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target as Node)) {
    isSearchOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

let newMap: any = null;
// All generator markers
let allMarkers: any[] = [];
let currentInfoWindow: any = null;
let autocomplete: any = null;

const vehicleObject = ref<any>(null);
const mapContainer = ref<HTMLElement | null>(null);

// Clear all map markers
const clearAllMarkers = () => {
  allMarkers.forEach((item: any) => {
    if (item && item.setMap) {
      item.setMap(null);
    } else if (item && item.marker && item.marker.setMap) {
      item.marker.setMap(null);
    }
  });
  allMarkers = [];
};

// Fetch all generators from dashboard API
const fetchAllGenerators = async (): Promise<any[]> => {
  try {
    const { getDashboardDetail } = await import('@/services/ApiService');
    const res = await getDashboardDetail();
    if (res.status === 200 && res.data) {
      const d = res.data;
      let gens: any[] = [];
      if (Array.isArray(d.site_arr)) {
        d.site_arr.forEach((s: any) => {
          if (Array.isArray(s.gen_arr)) {
            s.gen_arr.forEach((g: any, idx: number) => {
              const isOn = g.gen_sts === 'Generator ON' || g.stsicon_gen === 1;
              gens.push({
                id: g.id || g.gen_id || `${s.id}_${idx}`,
                name: g.name || `Generator ${g.id || idx + 1}`,
                lat: g.lat !== undefined && g.lat !== null ? parseFloat(g.lat) : DEFAULT_LAT + (idx * 0.002),
                lon: g.lon !== undefined && g.lon !== null ? parseFloat(g.lon) : DEFAULT_LNG + (idx * 0.002),
                status: g.gen_sts || (isOn ? 'Generator ON' : 'Generator OFF'),
                color: isOn ? '#4caf50' : '#f44336',
                capacity: g.capacity || g.model || '',
                location: g.loc || '',
                site_name: s.name || '',
                duration_sts: g.sts || '',
              });
            });
          }
        });
      } else {
        const rawGens = d.arr_data || d.generators || d.data;
        if (Array.isArray(rawGens) && rawGens.length > 0) {
          gens = rawGens.map((g: any, idx: number) => ({
            id: g.gen_id || g.id || idx + 1,
            name: g.gen_name || g.name || `Generator ${g.gen_id || idx + 1}`,
            lat: g.lat || g.latitude || DEFAULT_LAT + (idx * 0.002),
            lon: g.lon || g.longitude || g.lng || DEFAULT_LNG + (idx * 0.002),
            status: g.status_name || g.status || 'Unknown',
            color: g.sts_colr || (g.sts === 1 ? '#4caf50' : '#f44336'),
            capacity: g.capacity || g.kva_rating || '',
          }));
        }
      }
      if (gens.length > 0) return gens;
    }
  } catch (err) {
    console.warn('Could not fetch generator list from API:', err);
  }
  return [];
};

// Fallback coordinate (Ahmedabad, India default or site center)
const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;

// Move camera to specific location
const moveCameraToLocation = (lat: number, lon: number, zoomno: number) => {
  if (newMap && window.google?.maps) {
    newMap.setCenter(new window.google.maps.LatLng(lat, lon));
    newMap.setZoom(zoomno);
  } else {
    console.warn('Map not initialized yet');
  }
};

// Handle selection from custom search dropdown: camera moves to generator coordinates & opens InfoWindow
const selectGeneratorFromSearch = (gen: any) => {
  searchTerm.value = gen.name;
  isSearchOpen.value = false;
  const lat = parseFloat(gen.lat) || DEFAULT_LAT;
  const lon = parseFloat(gen.lon) || DEFAULT_LNG;
  moveCameraToLocation(lat, lon, 16);

  // Auto-open InfoWindow on the selected generator's marker
  const found = allMarkers.find((item: any) => String(item.id) === String(gen.id));
  if (found && found.marker && currentInfoWindow && newMap) {
    currentInfoWindow.setContent(found.infoContent);
    currentInfoWindow.open(newMap, found.marker);
  }
};



// Safe directions method
const getDirections = (destLat: number, destLon: number) => {
  if (!newMap || !window.google?.maps) return;
  try {
    const origin = new window.google.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG);
    const destination = new window.google.maps.LatLng(destLat, destLon);

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({ map: newMap });

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        } else {
          console.warn('Directions request failed due to ' + status);
        }
      }
    );
  } catch (err) {
    console.error('Error getting directions:', err);
  }
};

// FAB button click handling
const navigateToPage = (pageName: number) => {
  if (pageName === 1) {
    router.push('/mapfilterGen');
  } else if (pageName === 2) {
    const targetLat = vehicleObject.value ? parseFloat(vehicleObject.value.lat) || DEFAULT_LAT : DEFAULT_LAT;
    const targetLng = vehicleObject.value ? parseFloat(vehicleObject.value.lon) || DEFAULT_LNG : DEFAULT_LNG;
    moveCameraToLocation(targetLat, targetLng, 15);
  }
};

// Helper to initialize or update Google Map
const initGoogleMap = async () => {
  if (!mapContainer.value) return;

  // Retrieve cached (selected) generator
  const vehicleData = localStorage.getItem('selectedVeh');
  if (vehicleData) {
    try { vehicleObject.value = JSON.parse(vehicleData); } catch (e) { vehicleObject.value = null; }
  }

  const selectedId  = vehicleObject.value?.id;
  const initialLat  = vehicleObject.value?.lat  ? parseFloat(vehicleObject.value.lat)  : DEFAULT_LAT;
  const initialLong = vehicleObject.value?.lon  ? parseFloat(vehicleObject.value.lon)  : DEFAULT_LNG;
  const initialZoom = vehicleObject.value?.lat  ? 14 : 12;
  const initialCenter = { lat: initialLat, lng: initialLong };
  const storedMapType = localStorage.getItem('groupmapType') || 'roadmap';

  try {
    const loader = new Loader({
      apiKey: Constants.Google_map_API,
      version: "weekly",
      libraries: ['geometry', 'places']
    });

    await loader.load();
    console.log('Google Maps API successfully loaded');

    if (!mapRef.value && mapContainer.value) {
      newMap = new window.google.maps.Map(mapContainer.value, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeId: storedMapType,
        zoomControl: true,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      mapRef.value = newMap;

      // Custom generator search handling (no Google Places autocomplete)
      // The search input updates `searchTerm`, and matching generators are shown in a dropdown.
      // Clicking a generator moves the map camera to its location.
      // No external autocomplete is used.
    } else if (newMap) {
      newMap.setCenter(initialCenter);
      newMap.setZoom(initialZoom);
    }

    if (!newMap || !window.google?.maps) return;

    // ─── Plot ALL generators ─────────────────────────────────────
    clearAllMarkers();
    if (currentInfoWindow) currentInfoWindow.close();

    // Try API; fall back to just the selected generator
    let generators = await fetchAllGenerators();
    if (generators.length === 0 && vehicleObject.value) {
      generators = [{
        id: vehicleObject.value.id,
        name: vehicleObject.value.name || 'Selected Generator',
        lat: initialLat,
        lon: initialLong,
        status: vehicleObject.value.sts_name || 'Active',
        color: vehicleObject.value.sts_colr || '#f59c20',
        capacity: vehicleObject.value.capacity || '',
      }];
    }
    // Store in generatorList ref so search dropdown has all generators
    generatorList.value = generators;

    const sharedInfoWindow = new window.google.maps.InfoWindow();
    currentInfoWindow = sharedInfoWindow;

    generators.forEach((gen: any) => {
      const isSelected = String(gen.id) === String(selectedId);
      const lat = parseFloat(gen.lat) || DEFAULT_LAT;
      const lng = parseFloat(gen.lon) || DEFAULT_LNG;
      const markerColor = gen.color || (isSelected ? '#f59c20' : '#999999');

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: newMap,
        title: gen.name,
        icon: {
          path: isSelected
            ? window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW
            : window.google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeWeight: isSelected ? 2 : 1,
          strokeColor: '#ffffff',
          scale: isSelected ? 8 : 5,
        },
        zIndex: isSelected ? 10 : 1,
      });

      const infoContent = `
        <div style="color:#222;font-family:sans-serif;padding:6px 8px;min-width:140px;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${gen.name}</div>
          <div style="font-size:12px;color:#555;">Status: <span style="font-weight:600;color:${markerColor};">${gen.status}</span></div>
          ${gen.capacity ? `<div style="font-size:12px;color:#555;">Capacity: ${gen.capacity}</div>` : ''}
          <div style="font-size:11px;color:#888;margin-top:4px;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        </div>`;

      marker.addListener('click', () => {
        sharedInfoWindow.setContent(infoContent);
        sharedInfoWindow.open(newMap, marker);
      });

      allMarkers.push({
        id: gen.id,
        marker: marker,
        infoContent: infoContent
      });

      // Auto-open InfoWindow for selected generator
      if (isSelected) {
        sharedInfoWindow.setContent(infoContent);
        sharedInfoWindow.open(newMap, marker);
      }
    });

  } catch (e) {
    console.error('Error initializing Google Maps:', e);
  }
};

// Run every time the page enters the view
onIonViewWillEnter(async () => {
  // Pre-load generators immediately for instant search availability
  fetchAllGenerators().then((list) => {
    if (list && list.length > 0) {
      generatorList.value = list;
    }
  });

  await initGoogleMap();
  // Reset search term and dropdown on view entry
  searchTerm.value = '';
  isSearchOpen.value = false;

  if (isMapType.value && mapRef.value) {
    mapRef.value.setMapTypeId(localStorage.getItem('groupmapType') || 'roadmap');
  }

  if (isDirection.value) {
    const dirLat = localStorage.getItem('Dir_lat');
    const dirLon = localStorage.getItem('Dir_lon');
    if (dirLat && dirLon) {
      getDirections(parseFloat(dirLat), parseFloat(dirLon));
    }
    localStorage.removeItem('Dir_lat');
    localStorage.removeItem('Dir_lon');
  }

  if (isSearchLand.value) {
    const land_dirLat = localStorage.getItem("landmark_lat");
    const land_dirLng = localStorage.getItem("landmark_lng");
    if (land_dirLat && land_dirLng) {
      moveCameraToLocation(parseFloat(land_dirLat), parseFloat(land_dirLng), 10);
    }
    localStorage.removeItem('landmark_lat');
    localStorage.removeItem('landmark_lng');
  }
});

// Clean up on component unmount
onUnmounted(() => {
  clearAllMarkers();
  if (currentInfoWindow) currentInfoWindow.close();
  mapRef.value = null;
  newMap = null;
});


</script>


<style scoped>
.custom_icon{
  margin-right: 10px;
}

ion-icon{
    height: 30px;
    width: 30px;
    color: #fdcf9f; /* Custom color for the icon */
  }



  .fab-item {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-right: 16px; /* Add padding to the right to avoid text being cut off */
  overflow: hidden; /* Prevent overflow issues */
}
ion-fab-button{
  --background: var(--ion-color-greyishBrown);

}

.fab-label {
  margin-left: 8px; /* Space between icon and label */
  font-size: 16px;
  color: var(--ion-color-paleSalmon);
  background-color: var(--ion-color-greyishBrown);
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap; /* Prevent the label from breaking into a new line */
  overflow: hidden; /* Prevent overflow */
  text-overflow: ellipsis; /* Add ellipsis if the text overflows */
  max-width: 150px; /* Set a max width for labels */
}
.fab-icon {
  color: var(--ion-color-paleSalmon);

  /* Add circular background */
  background-color: var(--ion-color-greyishBrown); /* Background color */
  width: 30px;  /* Set the width of the circle */
  height: 30px; /* Set the height of the circle */
  border-radius: 100%; /* Make it circular */
  
  display: flex; /* Center the icon inside the circle */
  justify-content: center;
  align-items: center;
}

/* Reduce the size of the close button for the InfoWindow */
.gm-ui-hover-effect {
  width: 30px !important;    /* Adjust the width */
  height: 30px !important;   /* Adjust the height */
  right: 5px !important;     /* Adjust the position if needed */
  top: 5px !important;       /* Adjust the position if needed */
  
}
.gm-ui-hover-effect > img {
  width: 100% !important;    /* Make sure the image inside the button scales accordingly */
  height: 100% !important;
}



#search-box-container {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1000;
  width: calc(100% - 28px);
  max-width: 320px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--ion-color-greyishBrown, #3d3735);
  border-radius: 12px;
  padding: 0 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(253, 207, 159, 0.25);
  height: 44px;
  box-sizing: border-box;
}

.search-input-icon {
  font-size: 20px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  margin-right: 8px;
  flex-shrink: 0;
}

#search-box {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: #ffffff;
  padding: 8px 0;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.3px;
}

#search-box::placeholder {
  color: #a0998e;
  font-weight: 500;
}

.clear-input-icon {
  font-size: 20px;
  color: #a0998e;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.clear-input-icon:hover {
  color: #ffffff;
}

/* Generator results dropdown */
.search-results {
  margin-top: 6px;
  background-color: var(--ion-color-greyishBrown, #3d3735);
  border-radius: 12px;
  max-height: 270px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(253, 207, 159, 0.25);
  backdrop-filter: blur(10px);
}

.search-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 0.15s ease;
}

.search-item:last-child {
  border-bottom: none;
}

.search-item:hover, .search-item:active {
  background-color: rgba(253, 207, 159, 0.14);
}

.gen-badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.search-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gen-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Rajdhani', sans-serif;
}

.gen-subtitle {
  font-size: 11px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  opacity: 0.85;
  margin-top: 2px;
}

.gen-locate-icon {
  font-size: 18px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  margin-left: 8px;
  opacity: 0.8;
  flex-shrink: 0;
}

.search-empty {
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: #a0998e;
  font-family: 'Rajdhani', sans-serif;
}

#map {
  height: 100%;
  width: 100%;
  min-height: 100%;
  position: relative;
  background-color: #2b2b2b;
}

/* Ensure Ionic content inner scroll container fills the whole screen for the map */
ion-content::part(scroll) {
  height: 100%;
}
</style>