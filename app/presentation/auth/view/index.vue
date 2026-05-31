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
    <div class="auth-layout">
        <!-- ════════════════════════════════ LEFT BRAND PANEL ════════════════════════════════ -->
        <aside class="brand-panel">
            <!-- Ambient glow orbs -->
            <div class="orb orb-1" />
            <div class="orb orb-2" />
            <div class="orb orb-3" />
            <!-- Dot grid texture -->
            <div class="dot-overlay" />

            <div class="brand-content">
                <!-- Logo -->
                <header class="brand-header">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                        <rect width="44" height="44" rx="12" fill="rgba(255,255,255,0.1)" />
                        <rect x="0.5" y="0.5" width="43" height="43" rx="11.5" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                        <path d="M13 15h18M13 22h14M13 29h18" stroke="white" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                    <span class="brand-name">Elim</span>
                </header>

                <!-- Hero -->
                <div class="brand-hero">
                    <h1 class="brand-heading">
                        Enterprise-grade,<br />
                        <span class="heading-gradient">ready today.</span>
                    </h1>
                    <p class="brand-subtext">
                        Ship your next product faster with a production-ready
                        full-stack template built to scale from day one.
                    </p>

                    <!-- Feature list -->
                    <ul class="features-list" role="list">
                        <li
                            v-for="feat in features"
                            :key="feat.title"
                            class="feature-item"
                        >
                            <div class="feature-icon-wrap" aria-hidden="true">
                                <component :is="feat.icon" :size="16" />
                            </div>
                            <div>
                                <p class="feature-title">{{ feat.title }}</p>
                                <p class="feature-desc">{{ feat.description }}</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Testimonial -->
                <blockquote class="testimonial">
                    <p class="testimonial-text">
                        "This template cut our setup time from weeks to hours.
                        The architecture is exactly what we needed for a production app."
                    </p>
                    <footer class="testimonial-footer">
                        <div class="testimonial-avatar" aria-hidden="true" />
                        <div>
                            <p class="testimonial-name">Alex Rivera</p>
                            <p class="testimonial-role">Lead Engineer, Acme Corp</p>
                        </div>
                    </footer>
                </blockquote>
            </div>
        </aside>

        <!-- ════════════════════════════════ RIGHT FORM PANEL ════════════════════════════════ -->
        <main class="form-panel">
            <div class="form-dot-bg" aria-hidden="true" />

            <div class="form-card">
                <!-- Mobile logo (visible only on small screens) -->
                <div class="mobile-logo" aria-hidden="true">
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <rect width="30" height="30" rx="8" fill="var(--primary)" />
                        <path d="M8 10h14M8 15h11M8 20h14" stroke="white" stroke-width="2.2" stroke-linecap="round" />
                    </svg>
                    <span class="mobile-brand-name">Elim</span>
                </div>

                <!-- Heading -->
                <div class="form-header">
                    <h2 class="form-title">Welcome back</h2>
                    <p class="form-subtitle">Sign in to your account to continue</p>
                </div>

                <!-- Form -->
                <form class="form-body" @submit.prevent="handleSubmit" novalidate>
                    <!-- Email -->
                    <div class="field">
                        <UiLabel for="email">Email address</UiLabel>
                        <div class="input-wrap">
                            <Mail class="field-icon" :size="15" aria-hidden="true" />
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
                    <div class="field">
                        <div class="field-row-header">
                            <UiLabel for="password">Password</UiLabel>
                            <a href="#" class="forgot-link">Forgot password?</a>
                        </div>
                        <div class="input-wrap">
                            <Lock class="field-icon" :size="15" aria-hidden="true" />
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
                                class="eye-btn"
                                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                @click="showPassword = !showPassword"
                            >
                                <Eye v-if="!showPassword" :size="15" />
                                <EyeOff v-else :size="15" />
                            </button>
                        </div>
                    </div>

                    <!-- Remember me -->
                    <label class="remember-row">
                        <input
                            type="checkbox"
                            v-model="form.remember"
                            class="remember-check"
                        />
                        <span class="remember-text">Remember me for 30 days</span>
                    </label>

                    <!-- Submit -->
                    <button
                        type="submit"
                        class="submit-btn"
                        :disabled="isLoading"
                    >
                        <Loader2 v-if="isLoading" :size="17" class="spin" aria-hidden="true" />
                        <template v-else>
                            <span>Sign in</span>
                            <ArrowRight :size="15" aria-hidden="true" />
                        </template>
                    </button>
                </form>

                <!-- OR divider -->
                <div class="or-divider" aria-hidden="true">
                    <UiSeparator decorative />
                    <span class="or-label">or continue with</span>
                    <UiSeparator decorative />
                </div>

                <!-- GitHub -->
                <UiButton variant="outline" type="button" class="w-full gap-2">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="size-4 shrink-0" aria-hidden="true">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                </UiButton>

                <!-- Sign up -->
                <p class="signup-prompt">
                    Don't have an account?
                    <a href="#" class="signup-link">Create one free</a>
                </p>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.auth-layout {
    display: flex;
    min-height: 100vh;
}

/* ── Left: Brand Panel ───────────────────────────────────────────────────── */
.brand-panel {
    position: relative;
    display: none;
    overflow: hidden;
    background: linear-gradient(
        150deg,
        oklch(0.12 0.026 228) 0%,
        oklch(0.17 0.055 225) 45%,
        oklch(0.13 0.038 220) 100%
    );
}

@media (min-width: 1024px) {
    .brand-panel {
        display: flex;
        flex-direction: column;
        width: 56%;
    }
}

/* Orbs */
.orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(90px);
}

.orb-1 {
    width: 520px;
    height: 520px;
    top: -130px;
    left: -110px;
    background: oklch(0.52 0.105 223.128 / 0.18);
    animation: float 7s ease-in-out infinite;
}

.orb-2 {
    width: 400px;
    height: 400px;
    bottom: -90px;
    right: -70px;
    background: oklch(0.609 0.126 221.723 / 0.16);
    animation: float-rev 9s ease-in-out infinite;
}

.orb-3 {
    width: 240px;
    height: 240px;
    top: 48%;
    right: 12%;
    background: oklch(0.715 0.143 215.221 / 0.12);
    animation: float 11s ease-in-out infinite 2s;
}

/* Dot overlay */
.dot-overlay {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
}

/* Brand content */
.brand-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 3rem 3.5rem;
}

/* Logo */
.brand-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.brand-name {
    color: white;
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.025em;
}

/* Hero */
.brand-hero {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.brand-heading {
    color: white;
    font-size: clamp(2rem, 3.2vw, 3.1rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.035em;
    margin: 0 0 1rem;
}

.heading-gradient {
    background: linear-gradient(135deg, oklch(0.715 0.143 215.221) 0%, oklch(0.87 0.08 195) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.brand-subtext {
    color: rgba(255, 255, 255, 0.52);
    font-size: 1rem;
    line-height: 1.65;
    max-width: 32ch;
    margin: 0 0 2rem;
}

/* Features */
.features-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 0.75rem;
    backdrop-filter: blur(8px);
    transition: background 0.2s, border-color 0.2s;
}

.feature-item:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.12);
}

.feature-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 8px;
    background: oklch(0.52 0.105 223.128 / 0.22);
    border: 1px solid oklch(0.52 0.105 223.128 / 0.3);
    color: oklch(0.87 0.08 195);
}

.feature-title {
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.2rem;
}

.feature-desc {
    color: rgba(255, 255, 255, 0.42);
    font-size: 0.8125rem;
    line-height: 1.5;
    margin: 0;
}

/* Testimonial */
.testimonial {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 1rem;
    padding: 1.5rem;
    margin: 0;
}

.testimonial-text {
    color: rgba(255, 255, 255, 0.68);
    font-size: 0.9375rem;
    line-height: 1.7;
    font-style: italic;
    margin: 0 0 1rem;
}

.testimonial-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.testimonial-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, oklch(0.52 0.105 223.128), oklch(0.715 0.143 215.221));
    flex-shrink: 0;
}

.testimonial-name {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
}

.testimonial-role {
    color: rgba(255, 255, 255, 0.42);
    font-size: 0.75rem;
    margin: 0;
}

/* ── Right: Form Panel ───────────────────────────────────────────────────── */
.form-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 2.5rem 1.5rem;
    background: var(--background);
    overflow: hidden;
}

.form-dot-bg {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.45;
    pointer-events: none;
}

/* Form card */
.form-card {
    position: relative;
    width: 100%;
    max-width: 400px;
    background: var(--card);
    border-radius: 1.25rem;
    border: 1px solid var(--border);
    padding: 2.5rem 2rem 2rem;
    overflow: hidden;
    box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.03),
        0 4px 8px rgba(0, 0, 0, 0.04),
        0 20px 40px rgba(0, 0, 0, 0.07);
    animation: fade-slide-up 0.45s ease-out;
}

/* Gradient accent bar */
.form-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg,
        oklch(0.52 0.105 223.128),
        oklch(0.609 0.126 221.723),
        oklch(0.715 0.143 215.221)
    );
}

/* Mobile logo */
.mobile-logo {
    display: none;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.75rem;
}

@media (max-width: 1023px) {
    .mobile-logo {
        display: flex;
    }
}

.mobile-brand-name {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--foreground);
    letter-spacing: -0.02em;
}

/* Form header */
.form-header {
    margin-bottom: 1.75rem;
}

.form-title {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.035em;
    color: var(--foreground);
    margin: 0 0 0.375rem;
}

.form-subtitle {
    font-size: 0.9375rem;
    color: var(--muted-foreground);
    margin: 0;
}

/* Fields */
.form-body {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.field-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.field-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--muted-foreground);
    pointer-events: none;
    z-index: 1;
}

.eye-btn {
    position: absolute;
    right: 0.75rem;
    color: var(--muted-foreground);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
    z-index: 1;
}

.eye-btn:hover {
    color: var(--foreground);
}

.forgot-link {
    font-size: 0.8125rem;
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.15s;
}

.forgot-link:hover {
    opacity: 0.75;
    text-decoration: underline;
    text-underline-offset: 3px;
}

/* Remember me */
.remember-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
}

.remember-check {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    accent-color: var(--primary);
    cursor: pointer;
    flex-shrink: 0;
}

.remember-text {
    font-size: 0.875rem;
    color: var(--muted-foreground);
}

/* Submit button */
.submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 2.75rem;
    border-radius: var(--radius);
    border: none;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: -0.01em;
    color: oklch(0.984 0.019 200.873);
    background: linear-gradient(135deg, oklch(0.52 0.105 223.128), oklch(0.609 0.126 221.723));
    box-shadow: 0 4px 14px oklch(0.52 0.105 223.128 / 0.35);
    transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
    margin-top: 0.25rem;
}

.submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 6px 20px oklch(0.52 0.105 223.128 / 0.45);
}

.submit-btn:active:not(:disabled) {
    transform: scale(0.99);
}

.submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

/* OR divider */
.or-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem 0;
}

.or-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--muted-foreground);
    text-transform: uppercase;
    letter-spacing: 0.09em;
    white-space: nowrap;
}

/* Sign up */
.signup-prompt {
    text-align: center;
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-top: 1.25rem;
    margin-bottom: 0;
}

.signup-link {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
}

.signup-link:hover {
    opacity: 0.75;
    text-decoration: underline;
    text-underline-offset: 3px;
}

/* Spinner */
.spin {
    animation: spin 0.75s linear infinite;
}

/* Animations */
@keyframes float {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-22px);
    }
}

@keyframes float-rev {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(22px);
    }
}

@keyframes fade-slide-up {
    from {
        opacity: 0;
        transform: translateY(18px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
