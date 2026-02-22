/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        secondary: 'var(--secondary)',
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        border: 'var(--border)',
        muted: 'var(--muted)'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-multi': 'var(--shadow-glow), var(--shadow-multi)'
      },
      borderWidth: {
        4: '4px',
        8: '8px'
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-18px) rotate(5deg)' } },
        'float-reverse': { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(18px) rotate(-5deg)' } },
        'pulse-glow': { '0%,100%': { boxShadow: '0 0 20px rgba(255,58,242,0.5)' }, '50%': { boxShadow: '0 0 40px rgba(255,58,242,0.8), 0 0 60px rgba(0,245,212,0.5)' } },
        'gradient-shift': { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s linear infinite'
      }
    }
  },
  plugins: []
};
