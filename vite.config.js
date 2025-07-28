import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.googleapis.com;
        connect-src 'self' https://www.googleapis.com https://accounts.google.com https://www.gstatic.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        frame-src https://accounts.google.com https://www.gstatic.com;
        script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com;
        img-src 'self' https://i.ytimg.com data:;
      `.replace(/\n/g, '')
    }
  }
})
