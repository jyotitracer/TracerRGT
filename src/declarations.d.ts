declare module '@/services/ApiService' {
  export const RequestForAPI: (postData: any, controller: string, command: string) => Promise<any>;
  export const fetchData: (controller: string, command: string, params?: any) => Promise<any>;
  export const initializeToken: () => Promise<string>;
  export const setAuthToken: (token: string) => void;
  export const getAuthToken: () => string;
  export const getPlaceApi: (query: string, googleApiKey: string) => Promise<any>;
  export const loginApi: (credentials: any) => Promise<any>;
  export const logoutApi: (params?: any) => Promise<any>;
  export const getDashboardDetail: (params?: any) => Promise<any>;
  export const getGeneratorDetail: (genId: number | string) => Promise<any>;
  export const getNotificationList: (recId?: number) => Promise<any>;
  export const getParameterList: (params?: any) => Promise<any>;
  export const getHistoryMapData: (payload: any) => Promise<any>;
  export const getEventReport: (payload: any) => Promise<any>;
  export const getFuelEfficiencyReport: (payload: any, version?: string) => Promise<any>;
  export const getFillingAndDropping: (payload: any) => Promise<any>;
  export const getFillDropReport: (payload: any) => Promise<any>;
  export const getFuelChart: (payload: any) => Promise<any>;
  export const getEventList: (action?: number) => Promise<any>;
  export const updateEventStatus: (arrData: any[], action?: number) => Promise<any>;
  export const getHelpScreen: (pageId?: number | string) => Promise<any>;
  export const getGeneratorOnOffList: (params?: any) => Promise<any>;
  export const updateGenOnOff: (genArr: string[]) => Promise<any>;
}

declare module '@/services/storagefile' {
  const storage: {
    set: (key: string, value: any) => Promise<void>;
    get: (key: string) => Promise<any>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  export default storage;
}

declare module '@/services/toast' {
  export const showToast: (message?: string) => void;
  export const showToastMessage: (message: string) => void;
}

declare module '@/services/networkService' {
  export default function useNetwork(): {
    isConnected: any;
    showReconnectedMessage: any;
    initNetworkListener: () => void;
    removeNetworkListener: () => void;
    checkNetworkStatus: () => Promise<any>;
  };
}

declare module './services/networkService' {
  export default function useNetwork(): {
    isConnected: any;
    showReconnectedMessage: any;
    initNetworkListener: () => void;
    removeNetworkListener: () => void;
    checkNetworkStatus: () => Promise<any>;
  };
}

declare module '@/components/LineChart.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

