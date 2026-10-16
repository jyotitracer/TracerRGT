import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/MainMenuPage.vue'
import SplashScreen from '@/views/SplashScreen.vue';
import Login from '@/views/Login.vue';
import HelpscreenPage from '@/views/ToolbarPages/HelpscreenPage.vue';
import ProfilePage from '@/views/ToolbarPages/ProfilePage.vue';
import HistoryLog from '@/views/ReportPages/HistoryLog.vue';
import EventReport from '@/views/ReportPages/EventReport.vue';
import FuelReport from '@/views/ReportPages/FuelReport.vue';
import MapFiltergen from '@/views/MapFiltergen.vue';
import SiteSelectionPage from '@/views/ReportPages/SiteSelectionPage.vue';
import GeneratorSelectionPage from '@/views/ReportPages/GeneratorSelectionPage.vue';
import EventSelectionPage from '@/views/ReportPages/EventSelectionPage.vue';
import FuelFillingdropping from '@/views/ReportPages/FuelFillingdropping.vue';
import FuelChart from '@/views/ReportPages/FuelChart.vue';


const routes: Array<RouteRecordRaw> = [

  {
    path: '/',
    redirect: '/splash', // Redirect to splash page
  },
  {
    path: '/splash',
    component: SplashScreen,
  },
  {
    path: '/login',
    component: Login,
  },
 
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/NavigationPages/Dashboard.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/NavigationPages/Notification.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/NavigationPages/Report.vue')
      }
      ,{
        path: 'tab4',
        component: () => import('@/views/NavigationPages/MapPage.vue')
      },
      {
        path: 'tab5',
        component: () => import('@/views/NavigationPages/GenOnOff.vue')
      }
    ]
  },
  {
    path: '/helpscreen',
    component: HelpscreenPage,
  },
  {
    path: '/profile',
    component: ProfilePage,
  },
  {
    path: '/history_log',
    component: HistoryLog,
  },
  {
    path: '/event',
    component: EventReport,
  },
  {
    path: '/fuel',
    component: FuelReport,
  },
  {
    path:'/mapfilterGen',
    component:MapFiltergen
  },
  
{
  path: '/select-sites',
  name: 'SelectSites',
  component: SiteSelectionPage
},
{
  path: '/select-generator',
  name: 'SelectGenerator',
  component:GeneratorSelectionPage
},
{
  path: '/select-events',
  name: 'SelectEvents',
  component: EventSelectionPage
},
{
  path: '/fuelfillingdropping/:vehid/',
  name: 'FuelFillingDropping',
  component: FuelFillingdropping
},
 {
    // The path includes placeholders for the parameters we are passing
    path: '/fuel-chart/:vehid/:fromdate/:todate',
    name: 'fuelChart', // This name MUST match the one used in router.push
    component: FuelChart
  },
]

import storage from '@/services/storagefile';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes
});

// Authentication session guard
router.beforeEach(async (to, from, next) => {
  const publicPages = ['/splash', '/login', '/helpscreen'];
  const isAuthRequired = !publicPages.some(page => to.path === page);

  try {
    const isLoginAlready = (await storage.get('IsLoginAlready')) || (await storage.get('RIsLoginAlready'));
    const token = (await storage.get('token')) || (await storage.get('login_data'))?.token;
    const isAuthenticated = Boolean(isLoginAlready || token);

    // If already logged in and navigating to /login, redirect directly to dashboard
    if (to.path === '/login' && isAuthenticated) {
      return next('/tabs/tab1');
    }

    // If route requires authentication and user is not authenticated, redirect to /login
    if (isAuthRequired && !isAuthenticated) {
      return next('/login');
    }
  } catch (err) {
    console.error('Error in route navigation guard:', err);
  }

  next();
});

export default router;
