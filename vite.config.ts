import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"


export default defineConfig(() =>
{
  return {
    root: "src",

    base: "/",

    publicDir: "../public",

    build: {
      outDir: "../dist",

      rolldownOptions: {
        input: {
          main: "src/index.html",
        },
      },
    },

    appType: "spa" as const,

    plugins: [

      cloudflare(),
      react(),
      tailwindcss(),
    ],

    server: {
      port: 3000,
      host: true,
      open: true,

      watch: {
        usePolling: true,
        interval: 100,
      },

      hmr: {
        overlay: true,
      },
    },
  }
})
