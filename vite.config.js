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
});