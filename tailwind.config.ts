import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class',
    content: [
        './app/shared/components/**/*.{vue,js,ts}',
        './app/layouts/**/*.vue',
        './app/presentation/**/*.{vue,js,ts}',
        './app/plugins/**/*.{js,ts}',
        './app/app.vue',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config
