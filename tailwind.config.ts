import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
    darkMode: 'class',
    content: [
        './app/components/**/*.{vue,js,ts}',
        './app/shared/components/**/*.{vue,js,ts}',
        './app/layouts/**/*.vue',
        './app/presentation/**/*.{vue,js,ts}',
        './app/plugins/**/*.{js,ts}',
        './app/lib/**/*.ts',
        './app/app.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Hanken Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                body: ['Hanken Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                surface: {
                    DEFAULT: 'var(--surface)',
                    dim: 'var(--surface-dim)',
                    bright: 'var(--surface-bright)',
                    tint: 'var(--surface-tint)',
                    container: {
                        DEFAULT: 'var(--surface-container)',
                        lowest: 'var(--surface-container-lowest)',
                        low: 'var(--surface-container-low)',
                        high: 'var(--surface-container-high)',
                        highest: 'var(--surface-container-highest)',
                    },
                },
                on: {
                    surface: {
                        DEFAULT: 'var(--on-surface)',
                        variant: 'var(--on-surface-variant)',
                    },
                    background: 'var(--on-background)',
                    primary: 'var(--on-primary)',
                },
                outline: {
                    DEFAULT: 'var(--outline)',
                    variant: 'var(--outline-variant)',
                },
                sidebar: {
                    DEFAULT: 'var(--sidebar)',
                    foreground: 'var(--sidebar-foreground)',
                    primary: 'var(--sidebar-primary)',
                    'primary-foreground': 'var(--sidebar-primary-foreground)',
                    accent: 'var(--sidebar-accent)',
                    'accent-foreground': 'var(--sidebar-accent-foreground)',
                    border: 'var(--sidebar-border)',
                    ring: 'var(--sidebar-ring)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            maxWidth: {
                system: '1200px',
            },
            spacing: {
                'system-gutter': '32px',
                'system-section': '120px',
                'system-mobile': '24px',
                'system-desktop': '80px',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-22px)' },
                },
                'float-rev': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(22px)' },
                },
                'fade-slide-up': {
                    from: { opacity: '0', transform: 'translateY(16px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                float: 'float 7s ease-in-out infinite',
                'float-rev': 'float-rev 9s ease-in-out infinite',
                'float-slow': 'float 11s ease-in-out infinite 2s',
                'fade-slide-up': 'fade-slide-up 0.5s ease-out',
            },
        },
    },
    plugins: [animate],
} satisfies Config
