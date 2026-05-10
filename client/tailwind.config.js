export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#0f172a',
        cloud: '#f8fafc',
        brand: '#2563eb',
        mint: '#10b981',
        coral: '#f97316'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(37, 99, 235, 0.18)'
      }
    }
  },
  plugins: []
};

