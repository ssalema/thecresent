import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Ports come from the environment so a deploy — or a second checkout running
// alongside this one — can move them without editing the config. 3001 is the
// default, keeping the admin panel off 3000, which the public site uses.
const DEFAULT_PORT = 3001;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT || env.PORT) || DEFAULT_PORT;

  return {
    plugins: [react()],

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
