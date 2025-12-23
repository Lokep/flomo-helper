<script lang="ts" setup>
import { useElementBounding, useElementByPoint, useEventListener, useMouse } from '@vueuse/core'
import { computed, onBeforeUnmount, reactive } from 'vue'

const { x, y } = useMouse({ type: 'client' })
const { element } = useElementByPoint({ x, y })
const bounding = reactive(useElementBounding(element))

const emit = defineEmits(['select'])

const cancelScrollFn = useEventListener('scroll', bounding.update, { passive: true, capture: true })

const cancelClickFn = useEventListener('click', (e) => {

  if (element.value) {
    emit('select', element.value)
  }

  // 阻止事件冒泡（原事件的冒泡监听会失效）
  e.stopPropagation();
  // 阻止默认行为（如a标签的跳转）
  e.preventDefault();
}, {
  capture: true
})

const boxStyles = computed(() => {
  if (element.value) {
    return {
      display: 'block',
      width: `${bounding.width}px`,
      height: `${bounding.height}px`,
      left: `${bounding.left}px`,
      top: `${bounding.top}px`,
      backgroundColor: '#3eaf7c44',
      transition: 'all 0.05s linear',
    } as Record<string, string | number>
  }
  return {
    display: 'none',
  }
})

const pointStyles = computed<Record<string, string | number>>(() => ({
  transform: `translate(calc(${x.value}px - 50%), calc(${y.value}px - 50%))`,
}))


onBeforeUnmount(() => {
  cancelScrollFn()
  cancelClickFn()
})

</script>

<template>
  <div class="fixed pointer-events-none z-50 border border-solid border-flomo" :style="boxStyles" />
  <div class="fixed pointer-events-none z-50 bg-flomo-dark shadow rounded-full size-2 inset-0" :style="pointStyles" />
</template>
