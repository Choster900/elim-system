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
            link: [
                // El emblema va en blanco y sin fondo, tal como fue entregado. En una
                // barra de pestañas clara se distingue poco: es una decisión tomada
                // a la vista de la comparativa, no un descuido.
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
                // El mismo trazo en 16, 32 y 48 px; es el que el navegador pide solo.
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                // iOS pinta de negro cualquier transparencia, así que este va con fondo.
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
            ],
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
        'leaflet/dist/leaflet.css',
        // main.css is injected by @nuxtjs/tailwindcss via cssPath above
    ],
    runtimeConfig: {
        databaseUrl: env.DATABASE_URL,
        jwtSecret: env.JWT_SECRET,
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
