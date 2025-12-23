<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { DialogCloseProps } from 'reka-ui'
import { DialogClose } from 'reka-ui'

const props = defineProps<DialogCloseProps>()
</script>

<template>
  <DialogClose :class="cn('outline-0', 'focus:outline-0')" v-bind="props">
    <slot />
  </DialogClose>
</template>
