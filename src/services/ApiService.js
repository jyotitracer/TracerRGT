import axios from 'axios';
import storage from '@/services/storagefile';
import Constants from '@/common/constants';
import { Capacitor } from '@capacitor/core';

let globalToken = ''; // In-memory cache for token

// Base URL helper to avoid duplicate or missing slashes
const getBaseUrl = () => {
  // When running in browser during dev, route via Vite proxy to bypass CORS
  if (!Capacitor.isNativePlatform() && import.meta.env.DEV) {
    return '/rgt/index_1.php/';
  }
  const base = Constants.BASE_URL;
  return base.endsWith('/') ? base : base + '/';
};

// Function to initialize and retrieve token from storage
const initializeToken = async () => {
  try {
    const data = await storage.get('login_data');
    if (data) {
      globalToken = data.token || data.bearer_token || (data.data && data.data.token) || '';
    }
    if (!globalToken) {
      const directToken = await storage.get('token');
      if (directToken) {
        globalToken = directToken;
      }
    }
    return globalToken;
  } catch (error) {
    console.error('Error initializing token:', error);
    return globalToken;
  }
};

const setAuthToken = (token) => {
  globalToken = token;
};

const getAuthToken = () => {
  return globalToken;
};

// Low-level Unauthenticated API Request
const RequestForAPI = (postData, controller, command) => {
  const url = `${getBaseUrl()}${controller}/${command}`;
  console.log(`${command} [POST ${url}]:`, postData);

  return axios.post(url, postData, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => {
      console.log(`${command} Response:`, response.data);
      return response;
    })
    .catch(error => {
      console.error(`Error in ${command}:`, error.response ? error.response.data : error.message);
      throw error;
    });
};

// Low-level Authenticated API Request (Bearer token)
const fetchData = async (controller, command, params = {}) => {
  await initializeToken();
  const url = `${getBaseUrl()}${controller}/${command}`;
  console.log(`${command} [AUTH POST ${url}]:`, params);

  return axios.post(url, params, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${globalToken}`,
    }
  })
    .then(response => {
      console.log(`${command} Response:`, response.data);
      return response;
    })
    .catch(async error => {
      const isExpectedError = command === 'parameter_list' || command === 'notification_list';
      if (isExpectedError) {
        console.warn(`API Notice: ${command} returned ${error.response?.status || 'network error'}, using fallback.`);
      } else {
        console.error(`Error fetching ${command}:`, error.response?.status, error.response?.data || error.message);
      }
      if (error.response && error.response.status === 401) {
        console.warn('Authentication token expired or invalid (401) for ' + command);
        if (command !== 'dashboard_detail' && command !== 'generator_detail' && command !== 'parameter_list') {
          globalToken = '';
          await storage.clear();
          import('@/router/index').then(({ default: router }) => {
            router.replace('/login');
          }).catch(err => console.error('Router navigation error on 401:', err));
        }
      }
      throw error;
    });
};

const getPlaceApi = (query, googleApiKey) => {
  return axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleApiKey}`)
    .then(response => {
      console.log('Place Response', response.data);
      return response.data;
    })
    .catch(error => {
      console.error('Error fetching place data:', error.response ? error.response.data : error.message);
      throw error;
    });
};

// ==========================================
// Specific Postman Collection API Services
// ==========================================

/**
 * 1. Login / Authenticate
 * POST {{base_url}}/login/authenticate
 */
const loginApi = (params) => {
  return RequestForAPI(params, Constants.CONT.Login_Contro, Constants.CMD.AUTHENTICATE || 'authenticate');
};

/**
 * 2. Logout Session
 * POST {{base_url}}/login/logout
 */
const logoutApi = (params = {}) => {
  return fetchData(Constants.CONT.Login_Contro, Constants.CMD.LOGOUT || 'logout', params);
};

/**
 * 3. Dashboard Summary & Detail
 * POST {{base_url}}/Mobile_Contro/dashboard_detail
 */
const getDashboardDetail = (params = {}) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.DASHBOARD_DETAIL || 'dashboard_detail', params);
};

/**
 * 4. Generator Detail Telemetry
 * POST {{base_url}}/Mobile_Contro/generator_detail
 * Body: { gen_id: number }
 */
const getGeneratorDetail = (genId) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.GENERATOR_DETAIL || 'generator_detail', { gen_id: Number(genId), id: Number(genId) });
};

/**
 * 5. Notification List
 * POST {{base_url}}/Mobile_Contro/notification_list
 * Body: { rec_id: number }
 */
const getNotificationList = (recId = 0) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.NOTIFICATION_LIST || 'notification_list', { rec_id: Number(recId) });
};

/**
 * 6. Telemetry Parameter Catalog
 * POST {{base_url}}/Mobile_Contro/parameter_list
 * Body: {}
 */
const getParameterList = (params = {}) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.PARAMETER_LIST || 'parameter_list', params)
    .catch(err => {
      console.warn('Backend parameter_list unavailable or returned 500, using client catalog:', err.message);
      return { status: 200, data: { arr_data: [] } };
    });
};

/**
 * 7. History Map & Trend Data
 * POST {{base_url}}/Mobile_Contro/history_map_data
 * Body: { gen_id, par_id, intrvl_id, fdate, tdate }
 */
const getHistoryMapData = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.HISTORY_MAP_DATA || 'history_map_data', payload);
};

/**
 * 8. Event Report (Multi-site / Single site / Single gen)
 * POST {{base_url}}/Mobile_Contro/event_report
 * Body: { gen_id, evnt_arr, rec_lmt, site_arr, intrvl_id, fdate, tdate, last_rec_no }
 */
const getEventReport = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.EVENT_REPORT || 'event_report', payload);
};

/**
 * 9. Fuel Efficiency Report (Fleet & Specific Gen)
 * POST {{base_url}}/Mobile_Contro/fuel_efficiency_report or {{base_url}}/Mobile_Contro/fuel_efficiency_report
 * Body: { site_arr, gen_arr, fdate, tdate, isGrping, intrvl_id }
 */
const getFuelEfficiencyReport = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.FUEL_EFFICIENCY_REPORT || 'fuel_efficiency_report', payload);
};

/**
 * 10. Filling & Dropping Audit
 * POST {{base_url}}/Mobile_Contro/filling_and_dropping
 * Body: { gen_id, intrvl_id, fdate, tdate }
 */
const getFillingAndDropping = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.FILLING_AND_DROPPING || 'filling_and_dropping', payload);
};

/**
 * 11. Fill & Drop Summary Report
 * POST {{base_url}}/Mobile_Contro/fill_drop_report
 * Body: { gen_arr, site_arr, intrvl_id, fdate, tdate, isGrping }
 */
const getFillDropReport = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.FILL_DROP_REPORT || 'fill_drop_report', payload);
};

/**
 * 12. Fuel Level Chart Curves
 * POST {{base_url}}/Mobile_Contro/fuel_chart
 * Body: { gen_id, par_id, intrvl_id, fdate, tdate }
 */
const getFuelChart = (payload) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.FUEL_CHART || 'fuel_chart', payload);
};

/**
 * 13. Configured Event Master List
 * POST {{base_url}}/Mobile_Contro/event_list
 * Body: { action: 1 }
 */
const getEventList = (action = 1) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.EVENT_LIST || 'event_list', { action });
};

/**
 * 14. Update Event Status
 * POST {{base_url}}/Mobile_Contro/update_event_status
 * Body: { action: 2, arr_data: [ { evnt_id, sts } ] }
 */
const updateEventStatus = (arrData, action = 2) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.UPDATE_EVENT_STATUS || 'update_event_status', { action, arr_data: arrData });
};

/**
 * 15. Help & Documentation Content
 * POST {{base_url}}/Mobile_Contro/help_screen
 * Body: { page_id: 1 }
 */
const getHelpScreen = (pageId = 1) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.HELP_SCREEN || 'help_screen', { page_id: Number(pageId) });
};

/**
 * 16. Remote Generator Control List
 * POST {{base_url}}/Mobile_Contro/generator_on_off_list
 * Body: {}
 */
const getGeneratorOnOffList = (params = {}) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.GENERATOR_ON_OFF_LIST || 'generator_on_off_list', params);
};

/**
 * 17. Update Gen On Off
 * POST {{base_url}}/Mobile_Contro/update_gen_on_off
 * Body: { gen_arr: ["1", "2"] }
 */
const updateGenOnOff = (genArr) => {
  return fetchData(Constants.CONT.Mobile_Contro, Constants.CMD.UPDATE_GEN_ON_OFF || 'update_gen_on_off', { gen_arr: genArr });
};

export {
  RequestForAPI,
  fetchData,
  initializeToken,
  setAuthToken,
  getAuthToken,
  getPlaceApi,
  // Postman endpoints
  loginApi,
  logoutApi,
  getDashboardDetail,
  getGeneratorDetail,
  getNotificationList,
  getParameterList,
  getHistoryMapData,
  getEventReport,
  getFuelEfficiencyReport,
  getFillingAndDropping,
  getFillDropReport,
  getFuelChart,
  getEventList,
  updateEventStatus,
  getHelpScreen,
  getGeneratorOnOffList,
  updateGenOnOff
};
