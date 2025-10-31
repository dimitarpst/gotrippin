/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        card: "hsl(var(--color-card) / <alpha-value>)",
        "card-foreground": "hsl(var(--color-card-foreground) / <alpha-value>)",
        popover: "hsl(var(--color-popover) / <alpha-value>)",
        "popover-foreground":
          "hsl(var(--color-popover-foreground) / <alpha-value>)",
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        "primary-foreground":
          "hsl(var(--color-primary-foreground) / <alpha-value>)",
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        "secondary-foreground":
          "hsl(var(--color-secondary-foreground) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        "accent-foreground":
          "hsl(var(--color-accent-foreground) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        "muted-foreground":
          "hsl(var(--color-muted-foreground) / <alpha-value>)",
        destructive: "hsl(var(--color-destructive) / <alpha-value>)",
        "destructive-foreground":
          "hsl(var(--color-destructive-foreground) / <alpha-value>)",
        ring: "hsl(var(--color-ring) / <alpha-value>)",
      },
    },
  },
  plugins: [await import("tailwindcss-animate")],
};

export default config;
