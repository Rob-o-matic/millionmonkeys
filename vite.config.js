import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

export default defineConfig({
  plugins: [react()],
  base: '/millionmonkeys/',
  define: {
    __COMMIT__: JSON.stringify(commitHash),
  },
  server: {
    port: 5173
  }
})
