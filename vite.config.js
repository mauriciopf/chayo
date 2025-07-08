import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/', // Custom domain, so use root path
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
