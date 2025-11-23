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
        foreground: 'var(--foreground)',
        'foundation-black': '#001e21',
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
      },
    },
  },
  plugins: [],
}
export default config
