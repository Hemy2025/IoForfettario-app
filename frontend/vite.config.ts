import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Tutte le chiamate che iniziano per /api
      // vengono girate al backend sulla porta 3001 dentro il Codespace
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});