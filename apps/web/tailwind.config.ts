import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'background-text': '#1E2121', // Darker shade for text colors
        foreground: 'var(--foreground)',
        'sunset-start': '#d90084',
        'sunset-end': '#ff4300',
        'bright-teal': '#25b4b1',
        'racing-orange': '#ef771b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sageva', 'serif'],
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(45deg, #d90084, #ff4300)',
        'background': 'linear-gradient(180deg, #1E2121 0%, #303232 100%)',
      },
    },
  },
  plugins: [],
}
export default config
