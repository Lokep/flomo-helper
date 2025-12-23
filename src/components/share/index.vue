<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ImageInfo } from '@/lib/dom';
import { ChevronDown } from "lucide-vue-next";
import { PropType, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { snapdom } from '@zumer/snapdom';
import { imageUrlToFile } from '@/lib/image';
import { useDebounceFn, useMutationObserver, watchOnce } from '@vueuse/core';

const props = defineProps({
  richText: {
    type: String,
    default: ''
  },
  imgList: {
    type: Array as PropType<ImageInfo[]>,
    default: () => []
  }
})

const open = defineModel('open', {
  type: Boolean,
  default: false
})

const visibleState = ref({
  userInfo: true,
  flomo: true,
  tag: true
})


const localImages = ref<{ src: string, blob: Blob }[]>([])
const targetRef = ref()
const exportImage = ref("")


async function downloadImages(list: ImageInfo[]) {
  console.log('list', list)
  for (const item of list) {
    const res = await imageUrlToFile(item.src, { returnType: 'blob' })

    localImages.value.push({
      src: URL.createObjectURL(res as Blob),
      blob: res
    })
  }
}


async function generateImage() {
  const timeOut = setTimeout(async () => {
    exportImage.value = ""

    console.log('targetRef: ', targetRef.value)

    if (!open.value) {
      return
    }

    if (!targetRef.value) {
      throw new Error('target not found')
    }

    const img = await snapdom(targetRef.value)
    const png = await img.toPng()

    exportImage.value = png.getAttribute('src') || ""

    clearTimeout(timeOut)
  }, 300)
}


const generateImageFn = useDebounceFn(generateImage, 1000)


watch([() => props.imgList, () => open.value], ([list, visible]) => {

  exportImage.value = ""

  localImages.value.forEach(item => {
    URL.revokeObjectURL(item.src)
  })

  localImages.value = []

  if (!visible) {
    return
  }

  downloadImages(list)
}, {
  immediate: true,
})

useMutationObserver(targetRef, () => {
  console.log('mutation')
  exportImage.value = ""
  generateImageFn()
}, {
  attributes: true,
  childList: true,
  subtree: true,
})

onBeforeUnmount(() => {
  localImages.value.forEach(item => {
    URL.revokeObjectURL(item.src)
  })
})
</script>

<template>
  <Dialog v-model:open="open">

    <DialogContent class="w-[630px] max-w-3xl h-[80vh]  share" @openAutoFocus.prevent="e => e.preventDefault()">
      <DialogHeader>
        <DialogTitle>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <div class="text-lg font-semibold">生成分享图片</div>

              <!--
                显示个人信息相关
                显示flomo标志
                显示笔记中的标签
              -->




              <Popover>
                <PopoverTrigger as-child>
                  <Button class="!gap-1" variant="secondary" size="xs">
                    <div class="text-xs">设置</div>
                    <ChevronDown class="!size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-40 !p-2">
                  <div class="size-full flex flex-col gap-1">
                    <div class="flex items-center space-x-2">
                      <Label class="flex-1" for="userInfo">
                        <div class="text-sm font-normal">显示个人信息相关</div>
                      </Label>
                      <Switch v-model="visibleState.userInfo" id="userInfo" class="scale-75 origin-right" size="xs" />
                    </div>
                    <div class="flex items-center space-x-2">
                      <Label class="flex-1" for="flomo">
                        <div class="text-sm font-normal">显示flomo标志</div>
                      </Label>
                      <Switch v-model="visibleState.flomo" id="flomo" class="scale-75 origin-right" />
                    </div>
                    <div class="flex items-center space-x-2">
                      <Label class="flex-1" for="tag">
                        <div class="text-sm font-normal">显示笔记中的标签</div>
                      </Label>
                      <Switch v-model="visibleState.tag" id="tag" class="scale-75 origin-right" />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>


            </div>

          </div>
        </DialogTitle>
        <DialogDescription>
          <div class="text-sm text-gray-500">请右键点击图片保存或复制</div>
        </DialogDescription>
      </DialogHeader>


      <div class="flex-1 overflow-y-scroll">

        <div class="mt-5 mb-8 mx-auto  flex flex-col relative"
          style="width: 360px; box-shadow: 0px 0px 20px 0px rgba(0,0,0,.08);">

          <div ref="targetRef" class="size-full bg-white">
            <template v-if="open">
              <div v-if="visibleState.flomo" class="flex items-center justify-between pt-7 px-5">
                <div class="text-sm text-[#9d9d9d]" style="font-family: 'Barlow'">2025/12/23</div>
                <svg width="33" height="10" viewBox="0 0 33 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path data-v-1eb11fee="" fill-rule="evenodd" clip-rule="evenodd"
                    d="M1.67424 2.9646C1.67424 2.0354 2.02671 1.59292 2.68759 1.59292H4.31777V0H2.68759C0.925236 0 0 1.10619 0 2.9646V3.53982V4.86725V9.86725H1.67424V5H4.31777V3.53982H1.67424V2.9646ZM27.3604 9.07081C27.9773 9.69028 28.7703 10 29.6955 10C30.6208 10 31.3698 9.69028 32.0307 9.07081C32.6916 8.45134 33 7.65488 33 6.68143C33 5.70798 32.6475 4.91152 32.0307 4.29205C31.3698 3.67259 30.6208 3.36285 29.6955 3.36285C28.7703 3.36285 28.0213 3.67259 27.3604 4.29205C26.6995 4.91152 26.3911 5.70798 26.3911 6.68143C26.3911 7.65488 26.7436 8.45134 27.3604 9.07081ZM28.0654 6.68143C28.0654 5.70798 28.7703 5.04427 29.6955 5.04427C30.6208 5.04427 31.3698 5.70798 31.3257 6.68143C31.3257 7.69913 30.6208 8.36285 29.6955 8.36285C28.7703 8.36285 28.0654 7.69913 28.0654 6.68143ZM11.2788 9.99999C10.3535 9.99999 9.56047 9.69026 8.94364 9.07079C8.32682 8.45132 7.97435 7.69911 7.97435 6.72566C7.97435 5.75221 8.28276 4.95575 8.94364 4.33628C9.60452 3.71681 10.3535 3.40708 11.2788 3.40708C12.204 3.40708 12.953 3.71681 13.6139 4.33628C14.2748 4.95575 14.5832 5.75221 14.5832 6.72566C14.5832 7.69911 14.2748 8.49557 13.6139 9.11504C12.953 9.73451 12.204 9.99999 11.2788 9.99999ZM11.2788 5.04424C10.3535 5.04424 9.64858 5.70796 9.64858 6.68141C9.64858 7.69911 10.3535 8.36283 11.2788 8.36283C12.204 8.36283 12.9089 7.69911 12.9089 6.68141C12.9089 5.70796 12.204 5.04424 11.2788 5.04424ZM21.3243 6.50442V9.9115H19.6941V6.41593C19.6941 5.57522 19.2095 5.04424 18.5486 5.04424C17.7996 5.04424 17.2268 5.48672 17.2268 6.50442V9.9115H15.5967V3.53982H17.2268V4.46902C17.5352 3.76106 18.3283 3.40708 19.0332 3.40708C20.0466 3.45133 20.7075 3.84956 21.06 4.60177C21.5005 3.80531 22.1614 3.40708 23.0426 3.40708C24.5847 3.40708 25.4658 4.42478 25.4658 6.28318V9.9115H23.8357V6.46017C23.8357 5.57522 23.351 5.04424 22.6461 5.04424C21.853 5.04424 21.3243 5.57522 21.3243 6.50442ZM5.3752 1.59292V0H7.00538V9.9115H5.3752V2.34513V1.59292Z"
                    fill="black" fill-opacity="0.1"></path>
                </svg>
              </div>

              <div class="py-7 px-5">
                <div class="text-sm mb-2" v-html="richText"
                  style="letter-spacing: 0.2px;line-height: 1.8; color: rgba(0,0,0,.85);"></div>

                <img v-for="item in localImages" :src="item.src" alt="" class="w-full h-auto block !p-0 !m-0 rounded" />
              </div>

              <div v-if="visibleState.userInfo" class="p-5 bg-[#fafafa] flex items-center justify-between">
                <div class="flex-1">
                  <div class="author" style="font-family: 'Barlow'">lokep</div>
                  <div class="stat" style="font-family: 'Barlow'"> 201 MEMOS · 846DAYS</div>
                </div>

                <div class="shrink-0 grid grid-cols-7 justify-center items-center gap-0.5">
                  <div class="day" v-for="day in 30" :key="day"></div>
                </div>
              </div>
            </template>

          </div>
          <img v-if="exportImage" class="w-full h-full object-cover absolute left-0 top-0" :src="exportImage" alt="">
        </div>

      </div>
    </DialogContent>

  </Dialog>
</template>
<style lang="scss">
.share {
  background-color: #fafafa;

  &-title {
    font-size: 18px;
    font-weight: 600;
  }

  .author {
    font-size: 14px;
    font-weight: bold;
    color: #70b991;
  }

  .stat {
    font-size: 12px;
    color: #9d9d9d;
    font-weight: bold;
    margin-top: 6px;
  }

  .day {
    width: 4px;
    height: 4px;
    text-align: center;
    background: #efefef;
    border-radius: 1px;
  }
}
</style>
