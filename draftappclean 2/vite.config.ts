import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages whether it's served
  // from the domain root (you.github.io) or a project subpath (you.github.io/draft/).
  base: './',
  plugins: [react()],
})
