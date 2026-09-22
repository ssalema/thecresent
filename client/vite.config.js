import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import organizationMeta from './plugins/organizationMeta.js';

// Ports come from the environment so a deploy — or a second checkout running
// alongside this one — can move them without editing the config. VITE_PORT is
// the public site; 3000 is the default, and the admin panel sits on 3001.
const DEFAULT_PORT = 3000;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT || env.PORT) || DEFAULT_PORT;

  return {
    // organizationMeta writes the title, SEO meta and Open Graph tags into the
    // built index.html so link-preview scrapers — which never run the bundle —
    // see them. <OrganizationHead /> still owns them at runtime.
    plugins: [react(), organizationMeta()],

    server: {
      port,
      open: true,
    },

    preview: {
      port,
    },

    build: {
      // Kept as `build` rather than Vite's default `dist` so the CI workflow and
      // the Render static-site publish path carry over from react-scripts
      // unchanged.
      outDir: 'build',
      sourcemap: false,
    },
  };
});
