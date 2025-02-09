import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        chatgpt: {
          sidebar: "#171717",
          main: "#212121",
          secondary: "#444654",
          hover: "#2A2B32",
          border: "#4E4F60"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'white',
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#60a5fa',
              },
            },
            h1: { color: 'white' },
            h2: { color: 'white' },
            h3: { color: 'white' },
            h4: { color: 'white' },
            p: { color: 'white' },
            strong: { color: 'white' },
            code: { 
              color: 'white',
              backgroundColor: '#1f2937',
              borderRadius: '0.25rem',
              padding: '0.25rem',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
            },
            blockquote: {
              color: '#9ca3af',
              borderLeftColor: '#4b5563',
            },
            ul: {
              color: 'white',
            },
            ol: {
              color: 'white',
            },
            li: {
              color: 'white',
            },
            table: {
              color: 'white',
              thead: {
                borderBottomColor: '#4b5563',
              },
              tbody: {
                tr: {
                  borderBottomColor: '#374151',
                },
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
