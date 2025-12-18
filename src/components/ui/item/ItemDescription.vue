<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p
    data-slot="item-description"
    :class="cn(
      'text-neutral-500 line-clamp-2 text-sm leading-normal font-normal text-balance dark:text-neutral-400',
      '[&>a:hover]:text-neutral-900 [&>a]:underline [&>a]:underline-offset-4 dark:[&>a:hover]:text-neutral-50',
      props.class,
    )"
  >
    <slot />
  </p>
</template>
