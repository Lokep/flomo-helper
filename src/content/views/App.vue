<script setup lang="ts">
import Editor from "@/components/editor/index.vue";
import SaveToFlomoModal from '@/components/modal/save-to-flomo.vue';
import SelectNode from "@/components/nodes/select.vue";
import ShareModal from "@/components/share/index.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { MessageKeys } from "@/lib/constant";
import { ImageInfo, getImagesFromHtml, processHtmlInBrowser } from "@/lib/dom";
import { noop } from "@/lib/utils";
import { Editor as TEditor, isFunction } from "@tiptap/core";
import { useBrowserLocation, useEventListener } from "@vueuse/core";
import { CircleX, Plus, Share, SquareDashedMousePointer, X } from "lucide-vue-next";
import { h } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Toaster, toast } from "vue-sonner";
import { Position, Theme } from "vue-sonner/src/packages/types.ts";
import { BridgeMessage } from "webext-bridge";
import { onMessage } from "webext-bridge/content-script";

const openStatus = ref(false);

const initialToastProps = {
  theme: 'light' as Theme,
  position: 'top-center' as Position,
  richColors: true
}
const toasterProps = ref(initialToastProps)

const editorRef = ref<InstanceType<typeof SelectNode> | null>(null);
const editorInstance = computed<TEditor>(() => {
  if (editorRef.value) {
    // @ts-expect-error
    return editorRef.value.editor;
  }

  return null
})

const initialFormState = {
  content: '',
  imgList: [] as ImageInfo[],
  saveLink: false,
}

const formState = ref({
  ...initialFormState,
});

// showModalBeforeSheetCloseWhileFormStateChanged
function showModalBeforeSheetClose() {
  toast.warning('You have unsaved changes. Are you sure you want to close?');
}

function resetFormState() {
  formState.value = {
    ...initialFormState,
  };
}

function onCloseSheet() {
  showModalBeforeSheetClose()
  resetFormState();
  openStatus.value = false;
}

const currentTab = ref<chrome.tabs.Tab>();

/**
 * 判断编辑区域是否为空
 */
function isEditorEmpty() {
  return editorInstance.value?.isEmpty;
}

/**
 * 获取编辑器内容
 */
function getHTML() {
  return editorInstance.value?.getHTML();
}

/**
 * 清空编辑器内容
 */
function clearEditor() {
  return editorInstance.value?.commands.clearContent();
}


/**
 * 补充笔记，当 formState.value.saveLink === true，的时候，会自动补充链接
 */
function patchLink(content: string) {

  const { title, url } = currentTab.value!

  return content + `
    <p></p> 
    <p></p> 
    <p></p> 
    <p>---- 摘取自：<a href="${url}">${title}</a><p/>
  `
}




/**
 * 保存flomo笔记
 */


/**
 * 处理剪贴板
 */


/**
 * 生成图片
 */


/**
 * 查找节点
 */
const location = useBrowserLocation()
const selectNodeVisible = ref(false)
const toastId = ref()

function startSelectNote() {
  selectNodeVisible.value = true

  toastId.value = toast("正在选取内容...", {
    duration: Infinity,
    action: {
      label: '退出',
      onClick: () => {
        quitSelectNode()
      }
    }
  })
}





function getSelectedElement(element: HTMLElement) {

  const processedHtml = processHtmlInBrowser(`<p>${element.outerHTML}</p>`)

  const images = getImagesFromHtml(element.outerHTML)

  quitSelectNode()

  console.log('processedHtml', processedHtml)


  editorInstance.value?.commands.insertContent(processedHtml)

  if (images && images.length) {
    formState.value.imgList.push(...images)
  }
}


function removeImg(index: number) {
  formState.value.imgList.splice(index, 1)
}

function quitSelectNode() {
  selectNodeVisible.value = false

  if (toastId.value) {
    toast.dismiss(toastId.value)
  }
}

/**
 * 截图
 */



/**
 * 分享
 */
const shareEnabled = ref(false)

function onShare() {
  if (isEditorEmpty()) {
    toast.warning("当前无可分享内容")
    return
  }
  shareEnabled.value = true
}



/**
 * weread 相关
 */
const selectNodeEnabled = computed(() => {
  if (!location.value) {
    return false
  }

  return !location.value.host?.includes('weread.qq.com')
})

const isWeread = computed(() => {
  if (!location.value) {
    return false
  }

  return location.value.host?.includes('weread.qq.com')
})

const saveToFlomoModalState = ref({
  visible: false,
  text: ''
})
function showSaveToFlomoModal(text: string) {
  console.log('showSaveToFlomoModal', text)
  if (!text) {
    return
  }

  saveToFlomoModalState.value.visible = true
  saveToFlomoModalState.value.text = text
}

function onSaveToFlomoModalClose() {
  saveToFlomoModalState.value.visible = false
  saveToFlomoModalState.value.text = ''
}

function onSaveToFlomoModalSave() {
  // TODO save to flomo

  onSaveToFlomoModalClose()
}

const cancelCopyFn = ref()
function watchCopyButton() {
  const cls = `wr_copy`
  const node = document.querySelectorAll(`.${cls}`)

  console.log('node: ', node)

  if (!node || !node.length) {
    return false
  }
  cancelCopyFn.value = useEventListener(node[0], 'click', async (e) => {

    try {
      const text = await navigator.clipboard.readText();

      showSaveToFlomoModal(text)

    } catch (e: any) {

      const ClipboardPermissionDeniedError = "'Clipboard': Read permission denied"

      if (e && e.message.includes(ClipboardPermissionDeniedError)) {
        toast.error('请先允许剪贴板权限')
      }

      console.log(e.message.includes(ClipboardPermissionDeniedError))
    }

  })

  return true
}


onMessage(MessageKeys.Toggle_Sheet, ({ data }: BridgeMessage<any>) => {
  console.log("toggle sheet", data);
  currentTab.value = data;
  
  if (!isWeread.value) {
    openStatus.value = !openStatus.value;
  }
});


onMounted(() => {
  nextTick(() => {
    console.log("mounted", isWeread.value);

    if (isWeread.value) {
      const stopFn = useEventListener('click', (e) => {
        console.log("useEventListener", e);
        const gotNode = watchCopyButton()

        if (gotNode) {
          stopFn()
        }
      })
    }

  })
})

onBeforeUnmount(() => {
  isFunction(cancelCopyFn.value) && cancelCopyFn.value()
})
</script>

<template>
  <Sheet v-model:open="openStatus" :modal="false">
    <SheetContent class="my-4 right-4 h-auto rounded-xl p-4 flex flex-col border-l-0"
      style="background-color: #fafafa; z-index: 99999;" :disableOutsidePointerEvents="true" to="#crxjs-app"
      @escapeKeyDown.prevent="noop" @closeAutoFocus.prevent="noop" @openAutoFocus.prevent="noop"
      @focusOutside.prevent="noop" @interactOutside.prevent="e => e.preventDefault()"
      @pointerDownOutside.prevent="noop">
      <!-- topbar icon slogan / ... 关闭按钮 -->
      <SheetHeader class="shrink-0">
        <SheetTitle class="flex items-center justify-between gap-2">
          <div class="flex items-end gap-2">
            <svg class="h-5 shrink-0" data-v-2c27dda8="" width="48" height="16" viewBox="0 0 48 16" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M16.4054 5.61085C17.7512 5.61085 18.8409 6.07548 19.8021 7.00469C20.7634 7.93385 21.2118 9.12837 21.2119 10.5885C21.2119 12.0486 20.7634 13.2435 19.8021 14.1727C18.8409 15.1019 17.7512 15.4999 16.4054 15.4999C15.0597 15.4999 13.9063 15.0353 13.0092 14.1061C12.112 13.1769 11.5994 12.0486 11.5994 10.5885C11.5995 9.12837 12.0479 7.93385 13.0092 7.00469C13.9704 6.07553 15.0597 5.6109 16.4054 5.61085ZM16.4054 8.06659C15.0597 8.0667 14.0343 9.06224 14.0343 10.5223C14.0344 12.0487 15.0598 13.0441 16.4054 13.0442C17.7512 13.0442 18.7769 12.0488 18.777 10.5223C18.777 9.06216 17.7512 8.06659 16.4054 8.06659Z"
                fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M43.1937 5.54429C44.5394 5.54432 45.6288 6.00901 46.59 6.93812C47.4872 7.86732 48.0002 9.06216 48.0002 10.5223C48.0001 11.9824 47.5512 13.1769 46.59 14.1061C45.6287 15.0353 44.5394 15.4999 43.1937 15.4999C41.8479 15.4999 40.6942 15.0353 39.797 14.1061C38.8999 13.1769 38.3873 11.9824 38.3873 10.5223C38.3873 9.06216 38.8357 7.86732 39.797 6.93812C40.7583 6.00892 41.8479 5.54429 43.1937 5.54429ZM43.1937 8.06659C41.8479 8.06659 40.8226 9.06216 40.8226 10.5223C40.8226 12.0488 41.8479 13.0442 43.1937 13.0442C44.5394 13.0441 45.5648 12.0488 45.5648 10.5223C45.6289 9.06221 44.5394 8.06666 43.1937 8.06659Z"
                fill="currentColor"></path>
              <path d="M10.1897 0.500122V15.3673H7.81817V0.500122H10.1897Z" fill="currentColor"></path>
              <path
                d="M33.5166 5.61085C35.7596 5.61085 37.0414 7.13743 37.0414 9.92504V15.3673H34.6702V10.1904C34.6702 8.86297 33.9651 8.06659 32.9398 8.06659C31.7864 8.06667 31.0175 8.86292 31.0175 10.2565V15.3673H28.6464V10.1238C28.6463 8.86293 27.9413 8.06667 26.9801 8.06659C25.8907 8.06659 25.0575 8.73013 25.0574 10.2565V15.3673H22.6863V5.80965H25.0574V7.20349C25.506 6.14162 26.6597 5.61085 27.685 5.61085C29.1589 5.67724 30.1202 6.27444 30.6329 7.40273C31.2737 6.20811 32.235 5.61089 33.5166 5.61085Z"
                fill="currentColor"></path>
              <path
                d="M6.2804 2.8893H3.9093C2.94802 2.8893 2.43534 3.55321 2.43534 4.94699V5.80965H6.2804V8.00003H2.43534V15.3011H0V4.94699C9.12162e-06 2.1594 1.34588 0.500122 3.9093 0.500122H6.2804V2.8893Z"
                fill="currentColor"></path>
            </svg>

            <div class="flex-1 text-xs text-gray-400 font-normal">
              换个角度，意义自然浮现
            </div>
          </div>

          <Button class="shrink-0" variant="ghost" size="icon" @click="onCloseSheet">
            <X />
          </Button>
        </SheetTitle>
        <SheetDescription class="hidden"></SheetDescription>
      </SheetHeader>

      <div class="flex-1 flex flex-col gap-4 w-full h-0">
        <!-- shadowbar 展示当前页面信息 -->
        <div v-if="currentTab" class="child p-2 shadow rounded-lg flex items-center">
          <img :src="currentTab?.favIconUrl" alt="" class="size-8 mr-2 object-fill shrink-0" />
          <Label class="text-sm mr-2 flex-1 w-0 truncate text-gray-500" for="airplane-mode">{{
            currentTab?.title
          }}</Label>
          <Switch v-model="formState.saveLink" id="airplane-mode" />
        </div>

        <!-- editor -->
        <!-- border-style: border border-solid border-gray-100 -->
        <div class="rounded-lg  py-4 px-4 child flex-1 bg-white flex flex-col gap-2 h-0">
          <div class="flex-1 w-full h-0 overflow-y-scroll">
            <Editor ref="editorRef" v-model="formState.content" />
          </div>

          <div class="upload grid grid-cols-5 gap-4 shrink-0">
            <!-- <div class="size-12 rounded relative">
              <CircleX class="absolute -right-2 -top-2 text-gray-300 hover:text-gray-600 cursor-pointer z-10" />
              <img class="size-full object-cover block rounded !p-0 !m-0" src="https://picsum.photos/200/300" alt="">
            </div> -->

            <div class="size-12 rounded relative" v-for="(item, index) in formState.imgList" :key="index">
              <CircleX class="absolute -right-2 -top-2 text-gray-300 hover:text-gray-600 cursor-pointer z-10"
                @click="() => removeImg(index)" />
              <img class="size-full object-cover block rounded !p-0 !m-0" :src="item.src" alt="">
            </div>

            <div
              class="size-12 rounded cursor-pointer !border !border-solid !border-gray-400 text-gray-400 !hover:border-gray-600 hover:text-gray-600 text-2xl flex items-center justify-center">
              <Plus class="size-6" />
            </div>


          </div>
        </div>

        <!-- bottombar 提交按钮 -->
        <div class="child">
          <Button class="bg-flomo w-full hover:bg-flomo-dark">
            保存到 Flomo
            <svg data-v-b093eae6="" width="44" height="28" viewBox="0 0 44 28" fill="none"
              xmlns="http://www.w3.org/2000/svg" class="!size-10 -ml-4">
              <rect data-v-b093eae6="" width="44" height="27.0769" rx="6" fill="transparent"></rect>
              <path data-v-b093eae6=""
                d="M16.0838 19.4615L30.4615 13.1154L16.0838 6.76923L16.0769 11.7051L26.3517 13.1154L16.0769 14.5256L16.0838 19.4615Z"
                fill="currentColor"></path>
            </svg>
          </Button>
        </div>

        <!-- menu bar 选取笔记，分享，截图，ai总结 -->
        <div class="flex items-center justify-between">
          <div></div>
          <div class="flex items-center gap-1">
            <Button v-if="selectNodeEnabled" class="shrink-0" variant="ghost" size="icon" title="选取笔记"
              @click="startSelectNote">
              <SquareDashedMousePointer style="color: #333" />
            </Button>

            <!-- <Button class="shrink-0" variant="ghost" size="icon" title="截图">
              <Scissors />
            </Button> -->

            <Button class="shrink-0" variant="ghost" size="icon" title="分享" @click="onShare">
              <Share style="color: #333" />
            </Button>

          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>


  <Toaster v-bind="toasterProps" />

  <SelectNode v-if="selectNodeVisible" @select="getSelectedElement" />

  <ShareModal v-model:open="shareEnabled" :richText="formState.content" :imgList="formState.imgList" />

  <SaveToFlomoModal :open="saveToFlomoModalState.visible" :text="saveToFlomoModalState.text"
    @close="onSaveToFlomoModalClose" @confirm="onSaveToFlomoModalSave" />
</template>

<style lang="scss" scoped>
.child {
  @apply w-full shrink-0 box-border;
}
</style>
