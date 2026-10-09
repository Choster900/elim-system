import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { validateEnv } from './config/env'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const env = validateEnv()
const devServer = env.PORT ? { host: '0.0.0.0', port: env.PORT } : { host: '0.0.0.0' }

export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/eslint'],
    devtools: { enabled: true },
    app: {
        head: {
            title: env.NUXT_PUBLIC_APP_NAME,
            link: [
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
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
        '~/assets/styles/base/toast.css',
        'leaflet/dist/leaflet.css',
    ],
    runtimeConfig: {
        databaseUrl: env.DATABASE_URL,
        jwtSecret: env.JWT_SECRET,
        public: {
            appName: env.NUXT_PUBLIC_APP_NAME,
            mapProvider: env.NUXT_PUBLIC_MAP_PROVIDER,
            mapTileUrl: env.NUXT_PUBLIC_MAP_TILE_URL,
            mapAttribution: env.NUXT_PUBLIC_MAP_ATTRIBUTION,
            mapApiKey: env.NUXT_PUBLIC_MAP_API_KEY,
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
    devServer,
    compatibilityDate: '2025-07-15',
    tailwindcss: {
        configPath: 'tailwind.config.ts',
        cssPath: '~/assets/styles/tailwind/main.css',
    },
    typescript: {
        nodeTsConfig: {
            include: ['../prisma.config.ts'],
            compilerOptions: { types: ['node'] },
        },
    },
})
