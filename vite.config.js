import { defineConfig } from "vite";
//import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true,
  },
});
