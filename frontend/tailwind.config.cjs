/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Meet/Zoom inspired palette
        primary: {
          DEFAULT: '#1A73E8', // Google Blue / Zoom-like Blue
          hover: '#1557B0',
        },
        secondary: '#5F6368', // Icons / Secondary text
        danger: '#EA4335', // Hangup / Mute
        success: '#00796B', // Active / On
        
        // Backgrounds
        light: '#FFFFFF',
        surface: '#F1F3F4', // Light gray background
        
        // Dark mode
        dark: {
          DEFAULT: '#202124', // Main dark bg
          surface: '#303134', // Secondary dark bg
        },
      }
    },
  },
  plugins: [],
}
