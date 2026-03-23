import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true
  },
  plugins: [react(), tailwindcss()]
});
