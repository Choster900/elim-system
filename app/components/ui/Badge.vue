<script setup lang="ts">
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@lib/utils'

const badgeVariants = cva(
    'inline-flex items-center border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                outline: 'border-outline-variant text-on-surface-variant',
                sacred: 'border-primary text-primary bg-[rgba(233,193,118,0.08)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = withDefaults(
    defineProps<{
        variant?: BadgeVariants['variant']
        class?: string
    }>(),
    { variant: 'default' },
)
</script>

<template>
    <span :class="cn(badgeVariants({ variant }), props.class)">
        <slot />
    </span>
</template>
