import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset URLs so the built page also loads over file:// inside the
  // Electron shell, not just from a server root.
  base: './',
  plugins: [svelte()],
  server: { port: 5273 },
})
