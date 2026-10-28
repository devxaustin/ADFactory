import { defineConfig } from 'vite';

// Relative base so the build works from any sub-path
// (e.g. https://devxaustin.github.io/ADFactory/monkey-island/).
export default defineConfig({
  base: './',
  build: {
    // Written straight into the site's public folder so Astro serves it at /monkey-island/.
    outDir: '../../public/monkey-island',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
