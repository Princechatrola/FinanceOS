// Vite configuration for the FinanceOS React application

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // Enables React support
    react(),

    // Enables Tailwind CSS in the Vite project
    tailwindcss(),
  ],
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/backend/**",
        "**/data/**",
        "**/*.log",
        "**/.git/**",
        "**/node_modules/**",
      ],
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});