import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tartu-cell-towers-viz/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@deck.gl/core',
      '@deck.gl/react',
      '@deck.gl/layers',
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
