import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/chayo/', // GitHub Pages subdirectory path
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
