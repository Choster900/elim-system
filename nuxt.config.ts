import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { validateEnv } from './config/env'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const env = validateEnv()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/eslint'],
    devtools: { enabled: true },
    app: {
        head: {
            title: env.NUXT_PUBLIC_APP_NAME,
            script: [
                {
                    key: 'theme-mode-init',
                    tagPriority: 'critical',
                    innerHTML: `(function(){try{var stored=localStorage.getItem('app-theme-mode');var mode=(stored==='light'||stored==='dark')?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.classList.toggle('dark',mode==='dark');root.classList.toggle('light',mode==='light');}catch(e){}})();`,
                },
            ],
        },
    },
    css: [
        '~/assets/styles/base/globals.css',
        '~/assets/styles/themes/light/theme.css',
        '~/assets/styles/themes/dark/theme.css',
        'vue-sonner/style.css',
        // main.css is injected by @nuxtjs/tailwindcss via cssPath above
    ],
    runtimeConfig: {
        databaseUrl: env.DATABASE_URL,
        public: {
            appName: env.NUXT_PUBLIC_APP_NAME,
        },
    },
    alias: {
        '@presentation': '/app/presentation',
        '@shared': '/app/shared',
        '@interfaces': '/app/shared/interfaces',
        '@types': '/app/types',
        '@utils': '/app/utils',
        '@constants': '/app/constants',
        '@services': '/app/services',
        '@lib': resolve(__dirname, 'app/lib'),
    },
    devServer: {
        host: '0.0.0.0',
        port: env.PORT,
    },
    compatibilityDate: '2025-07-15',
    tailwindcss: {
        configPath: 'tailwind.config.ts',
        cssPath: '~/assets/styles/tailwind/main.css',
    },
})
