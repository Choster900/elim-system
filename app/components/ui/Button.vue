<script setup lang="ts">
import { type VariantProps, cva } from 'class-variance-authority'
import { Loader2 } from '@lucide/vue'

import { cn } from '@lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow hover:opacity-90',
                destructive: 'bg-destructive text-white shadow-sm hover:opacity-90',
                outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:opacity-80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        variant?: ButtonVariants['variant']
        size?: ButtonVariants['size']
        class?: string
        disabled?: boolean
        loading?: boolean
    }>(),
    { variant: 'default', size: 'default' },
)
</script>

<template>
    <button
        :class="cn(buttonVariants({ variant, size }), props.class)"
        :disabled="disabled || loading"
        v-bind="$attrs"
    >
        <Loader2 v-if="loading" class="animate-spin" />
        <slot />
    </button>
</template>
