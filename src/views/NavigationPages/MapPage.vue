<template>
  <ion-page id="main-content">
    <ion-header style="background-color: var( --ion-color-greyishBrown);">
      <ion-toolbar>
        <ion-title>TracerRGT</ion-title>
        <ion-buttons slot="primary">
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="helpCircle" @click="goToHelpScreen"></ion-icon>
          </div>
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="shareSocial" @click="goToSharePage"></ion-icon>
          </div>
          <div class="custom_icon">
            <ion-icon slot="icon-only" :icon="personCircle" @click="goToProfilePage"></ion-icon>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div ref="mapContainer" id="map" style="height: 100%;"></div>

      <!-- Search Box & Active Filter Banner displayed on top of the map -->
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

        <!-- Active Filter Indicator Pill (shows when filter is active) -->
        <div v-if="isFilterActive" class="active-filter-badge" @click="navigateToPage(1)">
          <div class="filter-badge-content">
            <ion-icon :icon="funnelOutline" class="filter-badge-icon"></ion-icon>
            <span class="filter-badge-text">
              Filtered: {{ generatorList.length }} / {{ totalUnfilteredCount }}
            </span>
          </div>
          <button class="clear-filter-btn" @click.stop="clearFilter" title="Reset Filter">
            <ion-icon :icon="closeCircle" class="clear-filter-icon"></ion-icon>
            <span>Reset</span>
          </button>
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
              <span class="gen-subtitle">
                {{ gen.site_name ? gen.site_name + ' • ' : '' }}{{ gen.statusCategory || gen.status }}
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

      <!-- No Matching Generators Overlay (when filter returns 0) -->
      <div v-if="isFilterActive && generatorList.length === 0" class="no-match-overlay">
        <div class="no-match-card">
          <ion-icon :icon="alertCircleOutline" class="no-match-icon"></ion-icon>
          <div class="no-match-title">No Generators Match Filter</div>
          <div class="no-match-sub">Try selecting more statuses or sites in the filter screen.</div>
          <div class="no-match-btn-row">
            <button class="adjust-filter-btn" @click="navigateToPage(1)">
              <ion-icon :icon="filterCircle" slot="start"></ion-icon>
              Adjust Filter
            </button>
            <button class="reset-filter-btn" @click="clearFilter">
              Reset All
            </button>
          </div>
        </div>
      </div>

      <ion-fab ref="fabRef" slot="fixed" vertical="bottom" horizontal="start">

        <ion-fab-button>
          <ion-icon :icon="chevronUpCircle" style="color: var(--ion-color-paleSalmon);"></ion-icon>
        </ion-fab-button>

        <ion-fab-list side="top">
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonFab,
  IonFabButton,
  IonFabList,
  IonLabel,
  onIonViewWillEnter,
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
  helpCircle,
  homeSharp,
  personCircle,
  shareSocial,
  filterCircle,
  chevronUpCircle,
  searchOutline,
  closeCircle,
  navigateOutline,
  funnelOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import router from '@/router/index';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Constants from '@/common/constants';
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const fabRef = ref<any>(null);

declare global {
  interface Window {
    google?: any;
  }
}

// ─── Status Classification Helper ───────────────────────────────────────
// Matches the 6 statuses requested:
// 1. Generator On
// 2. Generator Off
// 3. Generator Under Service
// 4. Main On
// 5. Generator Offline
// 6. Generator not used
const classifyGeneratorStatus = (g: any): { category: string; color: string } => {
  if (!g) return { category: 'Generator Offline', color: '#9e9e9e' };

  if (g.stsicon_conn === 0) {
    return { category: 'Generator Offline', color: '#9e9e9e' };
  }

  const s = String(g.gen_sts || g.status || g.sts_name || '').trim().toLowerCase();
  const dur = String(g.duration_sts || g.sts || '').trim().toLowerCase();

  if (s.includes('not used') || s.includes('unused') || g.is_used === 0 || g.is_used === false) {
    return { category: 'Generator not used', color: '#78909c' };
  }
  if (g.stsicon_type === 2 || s.includes('main')) {
    return { category: 'Main On', color: '#ab47bc' };
  }
  if (g.stsicon_gen === 4 || s.includes('service') || s.includes('under service')) {
    return { category: 'Generator Under Service', color: '#f59c20' };
  }
  if (
    g.stsicon_gen === 1 ||
    s === 'generator on' ||
    s === 'running' ||
    (dur.includes('on for') && !dur.includes('0 min'))
  ) {
    return { category: 'Generator On', color: '#68c521' };
  }
  if (
    g.stsicon_gen === 5 ||
    s === 'generator off' ||
    s === 'stopped' ||
    s.includes('off')
  ) {
    return { category: 'Generator Off', color: '#078dfc' };
  }
  if (s.includes('offline') || s.includes('disconnected')) {
    return { category: 'Generator Offline', color: '#9e9e9e' };
  }

  return { category: 'Generator Off', color: '#078dfc' };
};

// ─── Header Navigation ──────────────────────────────────────────────────
const goToHelpScreen = () => {
  router.push('/helpscreen/4');
};

const goToSharePage = async () => {
  try {
    const ionPageElement = document.getElementById('main-content');
    if (!ionPageElement) {
      console.error('Main content area not found.');
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

// ─── Reactive State ─────────────────────────────────────────────────────
const isDirection = ref(false);
const isSearchLand = ref(false);
const isMapType = ref(false);

const mapRef = ref<any>(null);
const searchTerm = ref('');
const isSearchOpen = ref(false);
const searchContainerRef = ref<HTMLElement | null>(null);
const searchBoxRef = ref<HTMLInputElement | null>(null);

// Generator & Filter State
const generatorList = ref<any[]>([]); // Current filtered list shown on map & dropdown
const rawAllGenerators = ref<any[]>([]); // Full unfiltered master list
const isFilterActive = ref(false);
const totalUnfilteredCount = ref(0);

const vehicleObject = ref<any>(null);
const mapContainer = ref<HTMLElement | null>(null);

let newMap: any = null;
let allMarkers: any[] = [];
let currentInfoWindow: any = null;

// Fallback coordinate (Ahmedabad, India default)
const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;

// Shows matching generators when typing in search box
const displayGenerators = computed(() => {
  if (!searchTerm.value || !searchTerm.value.trim()) {
    return generatorList.value;
  }
  const term = searchTerm.value.toLowerCase().trim();
  return generatorList.value.filter(
    (g) =>
      (g.name && g.name.toLowerCase().includes(term)) ||
      (g.site_name && String(g.site_name).toLowerCase().includes(term)) ||
      (g.capacity && String(g.capacity).toLowerCase().includes(term)) ||
      (g.statusCategory && String(g.statusCategory).toLowerCase().includes(term)) ||
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
  clearAllMarkers();
  if (currentInfoWindow) currentInfoWindow.close();
  mapRef.value = null;
  newMap = null;
});

// Clear all map markers
const clearAllMarkers = () => {
  allMarkers.forEach((item: any) => {
    try {
      if (item && item.marker && item.marker.setMap) {
        item.marker.setMap(null);
      } else if (item && item.setMap) {
        item.setMap(null);
      }
    } catch (e) {}
  });
  allMarkers = [];
};

// Reset / Clear active filter
const clearFilter = () => {
  localStorage.removeItem('map_filter_settings');
  isFilterActive.value = false;
  applyFilterAndRenderMarkers();
};

// ─── Fetch Generators from Cache & API ──────────────────────────────────
const fetchAllGenerators = async (): Promise<any[]> => {
  let parsedData: any = null;

  // 1. Immediately read from cache (fastest & robust against network drops)
  try {
    const cached = localStorage.getItem('dashboard_detail');
    if (cached) {
      parsedData = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Error reading cached dashboard_detail in MapPage:', e);
  }

  // 2. Fallback to API if cache was empty
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
      console.warn('Could not fetch generator list from API in MapPage:', err);
    }
  }

  const gens: any[] = [];
  if (parsedData && Array.isArray(parsedData.site_arr)) {
    parsedData.site_arr.forEach((s: any) => {
      const siteId = s.id || s.site_id;
      const siteName = s.name || s.site_name || `Site ${siteId}`;
      if (Array.isArray(s.gen_arr)) {
        s.gen_arr.forEach((g: any, idx: number) => {
          const { category, color } = classifyGeneratorStatus(g);

          const rawLat = parseFloat(g.lat);
          const rawLon = parseFloat(g.lon);
          const isValidCoord =
            !isNaN(rawLat) &&
            !isNaN(rawLon) &&
            Math.abs(rawLat) <= 90 &&
            Math.abs(rawLon) <= 180 &&
            (rawLat !== 0 || rawLon !== 0);

          gens.push({
            id: g.id || g.gen_id || `${siteId}_${idx}`,
            name: g.name || `Generator ${g.id || idx + 1}`,
            lat: isValidCoord ? rawLat : DEFAULT_LAT + idx * 0.002,
            lon: isValidCoord ? rawLon : DEFAULT_LNG + idx * 0.002,
            hasExactCoord: isValidCoord,
            status: g.gen_sts || category,
            statusCategory: category,
            color: color,
            capacity: g.capacity || g.model || '',
            location: g.loc || '',
            site_id: siteId,
            site_name: siteName,
            duration_sts: g.sts || '',
            raw: g,
          });
        });
      }
    });
  } else if (parsedData) {
    const rawGens = parsedData.arr_data || parsedData.generators || parsedData.data;
    if (Array.isArray(rawGens) && rawGens.length > 0) {
      rawGens.forEach((g: any, idx: number) => {
        const { category, color } = classifyGeneratorStatus(g);
        const rawLat = parseFloat(g.lat || g.latitude);
        const rawLon = parseFloat(g.lon || g.longitude || g.lng);
        const isValidCoord =
          !isNaN(rawLat) &&
          !isNaN(rawLon) &&
          Math.abs(rawLat) <= 90 &&
          Math.abs(rawLon) <= 180 &&
          (rawLat !== 0 || rawLon !== 0);

        gens.push({
          id: g.gen_id || g.id || idx + 1,
          name: g.gen_name || g.name || `Generator ${g.gen_id || idx + 1}`,
          lat: isValidCoord ? rawLat : DEFAULT_LAT + idx * 0.002,
          lon: isValidCoord ? rawLon : DEFAULT_LNG + idx * 0.002,
          hasExactCoord: isValidCoord,
          status: g.status_name || g.status || category,
          statusCategory: category,
          color: color,
          capacity: g.capacity || g.kva_rating || '',
          site_id: g.site_id || 1,
          site_name: g.site_name || '',
          raw: g,
        });
      });
    }
  }

  return gens;
};

// ─── Camera Movement ────────────────────────────────────────────────────
const moveCameraToLocation = (lat: number, lon: number, zoomno: number) => {
  if (newMap && window.google?.maps) {
    newMap.setCenter(new window.google.maps.LatLng(lat, lon));
    newMap.setZoom(zoomno);
  } else {
    console.warn('Map not initialized yet');
  }
};

// Selection from search dropdown
const selectGeneratorFromSearch = (gen: any) => {
  searchTerm.value = gen.name;
  isSearchOpen.value = false;
  const lat = parseFloat(gen.lat) || DEFAULT_LAT;
  const lon = parseFloat(gen.lon) || DEFAULT_LNG;
  moveCameraToLocation(lat, lon, 16);

  const found = allMarkers.find((item: any) => String(item.id) === String(gen.id));
  if (found && found.marker && currentInfoWindow && newMap) {
    currentInfoWindow.setContent(found.infoContent);
    currentInfoWindow.open({ map: newMap, anchor: found.marker, shouldFocus: false });
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

// FAB button navigation
// FAB button navigation
const navigateToPage = (pageName: number) => {
  // Close the floating FAB list
  if (fabRef.value) {
    const el = fabRef.value.$el || fabRef.value;
    if (typeof el?.close === 'function') {
      el.close();
    }
  }

  if (pageName === 1) {
    router.push('/mapfilterGen');
  } else if (pageName === 2) {
    const targetLat = vehicleObject.value ? parseFloat(vehicleObject.value.lat) || DEFAULT_LAT : DEFAULT_LAT;
    const targetLng = vehicleObject.value ? parseFloat(vehicleObject.value.lon) || DEFAULT_LNG : DEFAULT_LNG;
    moveCameraToLocation(targetLat, targetLng, 15);
  }
};


// ─── Filter & Render Markers ────────────────────────────────────────────
const applyFilterAndRenderMarkers = () => {
  if (!newMap || !window.google?.maps) return;

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

  const bounds = new window.google.maps.LatLngBounds();
  let validMarkerCount = 0;

  displayedGens.forEach((gen: any) => {
    try {
      const isSelected = String(gen.id) === String(selectedId);
      const lat = parseFloat(gen.lat);
      const lng = parseFloat(gen.lon);

      if (isNaN(lat) || isNaN(lng)) return;

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
          strokeWeight: isSelected ? 2.5 : 1.5,
          strokeColor: '#ffffff',
          scale: isSelected ? 8 : 6,
        },
        zIndex: isSelected ? 100 : 10,
      });

      bounds.extend({ lat, lng });
      validMarkerCount++;

      const infoContent = `
        <div style="color:#222;font-family:sans-serif;padding:6px 8px;min-width:150px;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:4px;color:#111;">${gen.name}</div>
          <div style="font-size:12px;color:#444;margin-bottom:3px;">Site: <b>${gen.site_name || 'N/A'}</b></div>
          <div style="font-size:12px;color:#444;margin-bottom:3px;">
            Status: <span style="font-weight:600;color:${markerColor};">${gen.statusCategory || gen.status}</span>
          </div>
          ${gen.capacity ? `<div style="font-size:12px;color:#555;margin-bottom:3px;">Capacity: ${gen.capacity}</div>` : ''}
          ${gen.duration_sts ? `<div style="font-size:11px;color:#777;margin-bottom:3px;">${gen.duration_sts}</div>` : ''}
          <div style="font-size:10px;color:#888;margin-top:4px;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        </div>`;

      marker.addListener('click', () => {
        sharedInfoWindow.setContent(infoContent);
        sharedInfoWindow.open({ map: newMap, anchor: marker, shouldFocus: false });
      });

      allMarkers.push({
        id: gen.id,
        marker: marker,
        infoContent: infoContent,
      });

      if (isSelected) {
        sharedInfoWindow.setContent(infoContent);
        sharedInfoWindow.open({ map: newMap, anchor: marker, shouldFocus: false });
      }
    } catch (err) {
      console.warn('Error plotting marker for gen:', gen?.name, err);
    }
  });

  // Fit bounds to show all filtered generators nicely
  if (validMarkerCount > 1) {
    newMap.fitBounds(bounds, { top: 70, right: 30, bottom: 80, left: 30 });
  } else if (validMarkerCount === 1) {
    newMap.setCenter(bounds.getCenter());
    newMap.setZoom(15);
  }
};

// ─── Initialize Google Map ──────────────────────────────────────────────
const initGoogleMap = async () => {
  if (!mapContainer.value) return;

  const vehicleData = localStorage.getItem('selectedVeh');
  if (vehicleData) {
    try {
      vehicleObject.value = JSON.parse(vehicleData);
    } catch (e) {
      vehicleObject.value = null;
    }
  }

  const initialLat = vehicleObject.value?.lat ? parseFloat(vehicleObject.value.lat) : DEFAULT_LAT;
  const initialLong = vehicleObject.value?.lon ? parseFloat(vehicleObject.value.lon) : DEFAULT_LNG;
  const initialZoom = vehicleObject.value?.lat ? 14 : 12;
  const initialCenter = { lat: initialLat, lng: initialLong };
  const storedMapType = localStorage.getItem('groupmapType') || 'roadmap';

  try {
       if (!window.google?.maps) {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || Constants.Google_map_API;
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      await importLibrary('maps');
      await importLibrary('geometry');
    }


    

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
    } else if (newMap) {
      // Trigger resize to fix blank/gray canvas errors on Ionic tab re-entry
      window.google.maps.event.trigger(newMap, 'resize');
      newMap.setCenter(initialCenter);
      newMap.setZoom(initialZoom);
    }

    // Fetch master generator list once
    const gens = await fetchAllGenerators();
    rawAllGenerators.value = gens;

    // Apply filters and render markers
    applyFilterAndRenderMarkers();
  } catch (e) {
    console.error('Error initializing Google Maps:', e);
  }
};

// ─── Ionic Lifecycle Hook ───────────────────────────────────────────────
onIonViewWillEnter(async () => {
  // Reset search box
  searchTerm.value = '';
  isSearchOpen.value = false;

  await initGoogleMap();

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
    const land_dirLat = localStorage.getItem('landmark_lat');
    const land_dirLng = localStorage.getItem('landmark_lng');
    if (land_dirLat && land_dirLng) {
      moveCameraToLocation(parseFloat(land_dirLat), parseFloat(land_dirLng), 10);
    }
    localStorage.removeItem('landmark_lat');
    localStorage.removeItem('landmark_lng');
  }
});
</script>

<style scoped>
.custom_icon {
  margin-right: 10px;
}

ion-icon {
  height: 30px;
  width: 30px;
  color: #fdcf9f;
}

.fab-item {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-right: 16px;
  overflow: hidden;
}

ion-fab-button {
  --background: var(--ion-color-greyishBrown);
}

.fab-label {
  margin-left: 8px;
  font-size: 16px;
  color: var(--ion-color-paleSalmon);
  background-color: var(--ion-color-greyishBrown);
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.fab-icon {
  color: var(--ion-color-paleSalmon);
  background-color: var(--ion-color-greyishBrown);
  width: 30px;
  height: 30px;
  border-radius: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Reduce the size of the close button for InfoWindow */
.gm-ui-hover-effect {
  width: 30px !important;
  height: 30px !important;
  right: 5px !important;
  top: 5px !important;
}

.gm-ui-hover-effect > img {
  width: 100% !important;
  height: 100% !important;
}

#search-box-container {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1000;
  width: calc(100% - 28px);
  max-width: 340px;
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

/* ─── ACTIVE FILTER BADGE ─── */
.active-filter-badge {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(61, 55, 53, 0.94);
  border: 1px solid var(--ion-color-paleSalmon, #fdcf9f);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.filter-badge-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-badge-icon {
  font-size: 16px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
}

.filter-badge-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
}

.clear-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 6px;
  padding: 3px 7px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.clear-filter-btn:active {
  transform: scale(0.95);
}

.clear-filter-icon {
  font-size: 13px;
}

/* ─── SEARCH RESULTS DROPDOWN ─── */
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

.search-item:hover,
.search-item:active {
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

/* ─── NO MATCH OVERLAY ─── */
.no-match-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  width: calc(100% - 40px);
  max-width: 300px;
}

.no-match-card {
  background: rgba(61, 55, 53, 0.95);
  border: 1px solid var(--ion-color-paleSalmon, #fdcf9f);
  border-radius: 14px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.no-match-icon {
  font-size: 42px;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  margin-bottom: 8px;
}

.no-match-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
  margin-bottom: 6px;
}

.no-match-sub {
  font-size: 12px;
  color: #d1ccc1;
  margin-bottom: 14px;
  line-height: 1.4;
}

.no-match-btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.adjust-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--ion-color-paleSalmon, #fdcf9f);
  color: #2b2b2b;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Rajdhani', sans-serif;
  cursor: pointer;
}

.adjust-filter-btn ion-icon {
  width: 18px;
  height: 18px;
  color: #2b2b2b;
}

.reset-filter-btn {
  background: transparent;
  color: var(--ion-color-paleSalmon, #fdcf9f);
  border: 1px solid var(--ion-color-paleSalmon, #fdcf9f);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Rajdhani', sans-serif;
  cursor: pointer;
}

#map {
  height: 100%;
  width: 100%;
  min-height: 100%;
  position: relative;
  background-color: #2b2b2b;
}

ion-content::part(scroll) {
  height: 100%;
}
</style>