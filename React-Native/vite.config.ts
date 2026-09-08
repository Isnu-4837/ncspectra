import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias 'react-native' to our web shim so all components work in browser
      'react-native': path.resolve(__dirname, './src/react-native/index.tsx'),
    },
  },
});
