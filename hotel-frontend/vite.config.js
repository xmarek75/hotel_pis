import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // všechno pod /api pošli na backend
      "/api": {
        target: "http://localhost:9080",
        changeOrigin: true,
        // protože backend je pod context root /hotel
        rewrite: (path) => path.replace(/^\/api/, "/hotel/api"),
      },
    },
  },
});