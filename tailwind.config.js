module.exports = {
  darkMode: 'class',
  content: [
    './index.html', './admin.html', './guides.html', './usuario.html', './user.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#6c5af7',
          hover:   '#5b4adc',
          light:   '#ede9fe',
          dark:    '#7c6aff',
        },
      },
      borderRadius: {
        card:  '12px',
        chip:  '8px',
        input: '10px',
      },
    },
  },
  plugins: [],
}
