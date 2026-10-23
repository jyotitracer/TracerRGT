import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.co.tracer.tracerrgt',
  appName: 'TracerRGT',
  webDir: 'dist',
    plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
