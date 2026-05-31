<script setup lang="ts">
import { Eye, EyeOff, Mail, Lock, Zap, Shield, Code2, ArrowRight, Loader2 } from '@lucide/vue'

defineOptions({ name: 'LoginPage' })

const showPassword = ref(false)
const isLoading = ref(false)

const form = reactive({
    email: '',
    password: '',
    remember: false,
})

async function handleSubmit() {
    isLoading.value = true
    await new Promise((r) => setTimeout(r, 2000))
    isLoading.value = false
}

const features = [
    {
        icon: Shield,
        title: 'Secure by default',
        description: 'JWT auth, RBAC & permissions baked in from day one',
    },
    {
        icon: Zap,
        title: 'Built for speed',
        description: 'TanStack Query with optimistic updates and caching',
    },
    {
        icon: Code2,
        title: 'Developer first',
        description: 'TypeScript throughout, clean architecture, full docs',
    },
]
</script>

<template>
    <div class="flex min-h-screen">

        <!-- ══════════════════════════ LEFT BRAND PANEL ══════════════════════════ -->
        <aside
            class="relative hidden lg:flex lg:w-[56%] flex-col overflow-hidden
                   bg-[linear-gradient(150deg,oklch(0.12_0.026_228)_0%,oklch(0.17_0.055_225)_45%,oklch(0.13_0.038_220)_100%)]"
        >
            <!-- Ambient orbs -->
            <div class="absolute rounded-full w-[520px] h-[520px] top-[-130px] left-[-110px]
                        bg-[oklch(0.52_0.105_223.128_/_0.18)] blur-[90px] pointer-events-none
                        animate-float" />
            <div class="absolute rounded-full w-[400px] h-[400px] bottom-[-90px] right-[-70px]
                        bg-[oklch(0.609_0.126_221.723_/_0.16)] blur-[90px] pointer-events-none
                        animate-float-rev" />
            <div class="absolute rounded-full w-[240px] h-[240px] top-[48%] right-[12%]
                        bg-[oklch(0.715_0.143_215.221_/_0.12)] blur-[90px] pointer-events-none
                        animate-float-slow" />

            <!-- Dot texture overlay -->
            <div class="absolute inset-0 pointer-events-none
                        [background-image:radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)]
                        [background-size:28px_28px]" />

            <!-- Content -->
            <div class="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">

                <!-- Logo -->
                <header class="flex items-center gap-3">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                        <rect width="44" height="44" rx="12" fill="rgba(255,255,255,0.1)" />
                        <rect x="0.5" y="0.5" width="43" height="43" rx="11.5"
                              stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                        <path d="M13 15h18M13 22h14M13 29h18"
                              stroke="white" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                    <span class="text-white text-[1.375rem] font-bold tracking-tight">Elim</span>
                </header>

                <!-- Hero -->
                <div class="flex flex-col">
                    <h1 class="text-white text-[clamp(2rem,3.2vw,3.1rem)] font-extrabold
                               leading-[1.1] tracking-[-0.035em] mb-4">
                        Enterprise-grade,<br />
                        <span class="bg-[linear-gradient(135deg,oklch(0.715_0.143_215.221),oklch(0.87_0.08_195))]
                                     bg-clip-text text-transparent">
                            ready today.
                        </span>
                    </h1>

                    <p class="text-white/50 text-base leading-[1.65] max-w-[32ch] mb-8">
                        Ship your next product faster with a production-ready full-stack template
                        built to scale from day one.
                    </p>

                    <!-- Feature cards -->
                    <ul class="flex flex-col gap-3 list-none p-0 m-0" role="list">
                        <li
                            v-for="feat in features"
                            :key="feat.title"
                            class="flex items-start gap-[0.875rem] p-[0.875rem_1rem]
                                   bg-white/[0.04] border border-white/[0.07] rounded-xl
                                   backdrop-blur-[8px]
                                   transition-colors duration-200
                                   hover:bg-white/[0.07] hover:border-white/[0.12]"
                        >
                            <div class="flex items-center justify-center w-[34px] h-[34px]
                                        rounded-lg shrink-0
                                        bg-[oklch(0.52_0.105_223.128_/_0.22)]
                                        border border-[oklch(0.52_0.105_223.128_/_0.3)]
                                        text-[oklch(0.87_0.08_195)]"
                                 aria-hidden="true">
                                <component :is="feat.icon" :size="16" />
                            </div>
                            <div>
                                <p class="text-white/[0.92] text-sm font-semibold mb-[0.2rem]">
                                    {{ feat.title }}
                                </p>
                                <p class="text-white/[0.42] text-[0.8125rem] leading-snug m-0">
                                    {{ feat.description }}
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Testimonial -->
                <blockquote class="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 m-0">
                    <p class="text-white/[0.68] text-[0.9375rem] leading-[1.7] italic mb-4">
                        "This template cut our setup time from weeks to hours.
                        The architecture is exactly what we needed for a production app."
                    </p>
                    <footer class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full shrink-0
                                    bg-[linear-gradient(135deg,oklch(0.52_0.105_223.128),oklch(0.715_0.143_215.221))]"
                             aria-hidden="true" />
                        <div>
                            <p class="text-white/90 text-sm font-semibold m-0">Alex Rivera</p>
                            <p class="text-white/[0.42] text-xs m-0">Lead Engineer, Acme Corp</p>
                        </div>
                    </footer>
                </blockquote>
            </div>
        </aside>

        <!-- ══════════════════════════ RIGHT FORM PANEL ══════════════════════════ -->
        <main class="flex flex-1 flex-col items-center justify-center relative
                     px-6 py-10 bg-background overflow-hidden">

            <!-- Dot bg -->
            <div class="absolute inset-0 pointer-events-none opacity-45
                        [background-image:radial-gradient(circle,var(--border)_1px,transparent_1px)]
                        [background-size:24px_24px]"
                 aria-hidden="true" />

            <!-- Form card -->
            <div class="relative w-full max-w-[400px] bg-card border border-border
                        rounded-[1.25rem] overflow-hidden animate-fade-slide-up
                        shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.07)]">

                <!-- Gradient accent bar (replaces ::before) -->
                <div class="h-[3px] bg-[linear-gradient(90deg,oklch(0.52_0.105_223.128),oklch(0.609_0.126_221.723),oklch(0.715_0.143_215.221))]" />

                <div class="px-8 pb-8 pt-6">

                    <!-- Mobile logo (hidden on lg+) -->
                    <div class="flex lg:hidden items-center gap-2 justify-center mb-7" aria-hidden="true">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                            <rect width="30" height="30" rx="8" fill="var(--primary)" />
                            <path d="M8 10h14M8 15h11M8 20h14"
                                  stroke="white" stroke-width="2.2" stroke-linecap="round" />
                        </svg>
                        <span class="font-bold text-[1.125rem] text-foreground tracking-tight">
                            Elim
                        </span>
                    </div>

                    <!-- Heading -->
                    <div class="mb-7">
                        <h2 class="text-[1.75rem] font-extrabold tracking-[-0.035em] text-foreground mb-[0.375rem]">
                            Welcome back
                        </h2>
                        <p class="text-[0.9375rem] text-muted-foreground">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <!-- Form -->
                    <form class="flex flex-col gap-[1.125rem]" @submit.prevent="handleSubmit" novalidate>

                        <!-- Email -->
                        <div class="flex flex-col gap-[0.375rem]">
                            <UiLabel for="email">Email address</UiLabel>
                            <div class="relative flex items-center">
                                <Mail class="absolute left-3 text-muted-foreground pointer-events-none z-10"
                                      :size="15" aria-hidden="true" />
                                <UiInput
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    v-model="form.email"
                                    class="pl-9"
                                    autocomplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <!-- Password -->
                        <div class="flex flex-col gap-[0.375rem]">
                            <div class="flex items-center justify-between">
                                <UiLabel for="password">Password</UiLabel>
                                <a href="#"
                                   class="text-[0.8125rem] text-primary font-medium
                                          transition-opacity hover:opacity-75
                                          hover:underline underline-offset-[3px]">
                                    Forgot password?
                                </a>
                            </div>
                            <div class="relative flex items-center">
                                <Lock class="absolute left-3 text-muted-foreground pointer-events-none z-10"
                                      :size="15" aria-hidden="true" />
                                <UiInput
                                    id="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="••••••••"
                                    v-model="form.password"
                                    class="pl-9 pr-10"
                                    autocomplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    class="absolute right-3 flex items-center justify-center
                                           p-0 bg-transparent border-0 cursor-pointer
                                           text-muted-foreground hover:text-foreground
                                           transition-colors"
                                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                    @click="showPassword = !showPassword"
                                >
                                    <Eye v-if="!showPassword" :size="15" />
                                    <EyeOff v-else :size="15" />
                                </button>
                            </div>
                        </div>

                        <!-- Remember me -->
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                v-model="form.remember"
                                class="w-4 h-4 rounded shrink-0 cursor-pointer
                                       accent-[var(--primary)]"
                            />
                            <span class="text-sm text-muted-foreground">
                                Remember me for 30 days
                            </span>
                        </label>

                        <!-- Submit -->
                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="mt-1 w-full h-11 flex items-center justify-center gap-2
                                   rounded-[var(--radius)] border-0 cursor-pointer
                                   text-[0.9375rem] font-semibold tracking-[-0.01em]
                                   text-[oklch(0.984_0.019_200.873)]
                                   bg-[linear-gradient(135deg,oklch(0.52_0.105_223.128),oklch(0.609_0.126_221.723))]
                                   shadow-[0_4px_14px_oklch(0.52_0.105_223.128_/_0.35)]
                                   transition-[opacity,transform,box-shadow] duration-200
                                   hover:enabled:opacity-90
                                   hover:enabled:shadow-[0_6px_20px_oklch(0.52_0.105_223.128_/_0.45)]
                                   active:enabled:scale-[0.99]
                                   disabled:opacity-65 disabled:cursor-not-allowed"
                        >
                            <Loader2 v-if="isLoading" :size="17" class="animate-spin" aria-hidden="true" />
                            <template v-else>
                                <span>Sign in</span>
                                <ArrowRight :size="15" aria-hidden="true" />
                            </template>
                        </button>
                    </form>

                    <!-- OR divider -->
                    <div class="flex items-center gap-3 my-6" aria-hidden="true">
                        <UiSeparator decorative />
                        <span class="text-[0.7rem] font-medium text-muted-foreground
                                     uppercase tracking-[0.09em] whitespace-nowrap">
                            or continue with
                        </span>
                        <UiSeparator decorative />
                    </div>

                    <!-- GitHub -->
                    <UiButton variant="outline" type="button" class="w-full">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0" aria-hidden="true">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                    </UiButton>

                    <!-- Sign up -->
                    <p class="text-center text-sm text-muted-foreground mt-5 mb-0">
                        Don't have an account?
                        <a href="#"
                           class="text-primary font-semibold transition-opacity
                                  hover:opacity-75 hover:underline underline-offset-[3px]">
                            Create one free
                        </a>
                    </p>
                </div>
            </div>
        </main>
    </div>
</template>
