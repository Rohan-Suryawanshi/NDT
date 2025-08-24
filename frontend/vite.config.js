import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import viteCompression from 'vite-plugin-compression';


import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss(),viteCompression()],
   resolve: {
      alias: {
         "@": path.resolve(__dirname, "./src"),
      },
   },
});
