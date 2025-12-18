<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-vue-next";
// import Editor from "@/components/editor/index.vue"
import { onMessage } from "webext-bridge/content-script";
import { ref } from "vue";
import { MessageKeys } from "@/lib/constant";
import { useAppStore } from "@/store";
import { storeToRefs } from "pinia";

const body = document.body;
const openStatus = ref(true);

const appStore = useAppStore();
const { currentTab } = storeToRefs(appStore);

const formState = ref({
  saveLink: false,
});

onMessage(MessageKeys.Toggle_Sheet, () => {
  console.log("toggle sheet");
  openStatus.value = !openStatus.value;
});
</script>

<template>
  <Sheet v-model:open="openStatus" :modal="false">
    <SheetContent
      class="my-4 right-4 h-auto rounded-xl p-4 flex flex-col"
      :to="body"
    >
      <!-- topbar icon slogan / ... 关闭按钮 -->
      <SheetHeader class="shrink-0">
        <SheetTitle class="flex items-center justify-between gap-2">
          <div class="flex items-end gap-2">
            <svg
            class="h-5 shrink-0"
            data-v-2c27dda8=""
            width="48"
            height="16"
            viewBox="0 0 48 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16.4054 5.61085C17.7512 5.61085 18.8409 6.07548 19.8021 7.00469C20.7634 7.93385 21.2118 9.12837 21.2119 10.5885C21.2119 12.0486 20.7634 13.2435 19.8021 14.1727C18.8409 15.1019 17.7512 15.4999 16.4054 15.4999C15.0597 15.4999 13.9063 15.0353 13.0092 14.1061C12.112 13.1769 11.5994 12.0486 11.5994 10.5885C11.5995 9.12837 12.0479 7.93385 13.0092 7.00469C13.9704 6.07553 15.0597 5.6109 16.4054 5.61085ZM16.4054 8.06659C15.0597 8.0667 14.0343 9.06224 14.0343 10.5223C14.0344 12.0487 15.0598 13.0441 16.4054 13.0442C17.7512 13.0442 18.7769 12.0488 18.777 10.5223C18.777 9.06216 17.7512 8.06659 16.4054 8.06659Z"
              fill="currentColor"
            ></path>
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M43.1937 5.54429C44.5394 5.54432 45.6288 6.00901 46.59 6.93812C47.4872 7.86732 48.0002 9.06216 48.0002 10.5223C48.0001 11.9824 47.5512 13.1769 46.59 14.1061C45.6287 15.0353 44.5394 15.4999 43.1937 15.4999C41.8479 15.4999 40.6942 15.0353 39.797 14.1061C38.8999 13.1769 38.3873 11.9824 38.3873 10.5223C38.3873 9.06216 38.8357 7.86732 39.797 6.93812C40.7583 6.00892 41.8479 5.54429 43.1937 5.54429ZM43.1937 8.06659C41.8479 8.06659 40.8226 9.06216 40.8226 10.5223C40.8226 12.0488 41.8479 13.0442 43.1937 13.0442C44.5394 13.0441 45.5648 12.0488 45.5648 10.5223C45.6289 9.06221 44.5394 8.06666 43.1937 8.06659Z"
              fill="currentColor"
            ></path>
            <path
              d="M10.1897 0.500122V15.3673H7.81817V0.500122H10.1897Z"
              fill="currentColor"
            ></path>
            <path
              d="M33.5166 5.61085C35.7596 5.61085 37.0414 7.13743 37.0414 9.92504V15.3673H34.6702V10.1904C34.6702 8.86297 33.9651 8.06659 32.9398 8.06659C31.7864 8.06667 31.0175 8.86292 31.0175 10.2565V15.3673H28.6464V10.1238C28.6463 8.86293 27.9413 8.06667 26.9801 8.06659C25.8907 8.06659 25.0575 8.73013 25.0574 10.2565V15.3673H22.6863V5.80965H25.0574V7.20349C25.506 6.14162 26.6597 5.61085 27.685 5.61085C29.1589 5.67724 30.1202 6.27444 30.6329 7.40273C31.2737 6.20811 32.235 5.61089 33.5166 5.61085Z"
              fill="currentColor"
            ></path>
            <path
              d="M6.2804 2.8893H3.9093C2.94802 2.8893 2.43534 3.55321 2.43534 4.94699V5.80965H6.2804V8.00003H2.43534V15.3011H0V4.94699C9.12162e-06 2.1594 1.34588 0.500122 3.9093 0.500122H6.2804V2.8893Z"
              fill="currentColor"
            ></path>
          </svg>

          <div class="flex-1 text-xs text-gray-400 font-normal">
            换个角度，意义自然浮现
          </div>
          </div>

          <Button class="shrink-0" variant="ghost" size="icon">
            <X />
          </Button>
        </SheetTitle>
      </SheetHeader>

      <div class="flex-1 flex flex-col gap-2 w-full">
        <!-- shadowbar 展示当前页面信息 -->
        <!-- <div class="child p-1 shadow rounded-lg flex items-center">
          <img :src="currentTab.favIconUrl" alt="" class="size-8 mr-2 object-fill shrink-0">

          <div class="text-sm mr-2 flex-1 w-0 truncate">{{ currentTab.title }}</div>
        </div> -->

        <div
          v-if="currentTab"
          class="child p-1 shadow rounded-lg flex items-center"
        >
          <img
            :src="currentTab?.favIconUrl"
            alt=""
            class="size-8 mr-2 object-fill shrink-0"
          />
          <Label class="text-sm mr-2 flex-1 w-0 truncate" for="airplane-mode">{{
            currentTab?.title
          }}</Label>
          <Switch v-model="formState.saveLink" id="airplane-mode" />
        </div>

        <!-- editor -->
        <div
          class="rounded-lg border border-solid border-gray-100 p-2 child flex-1"
        ></div>

        <!-- bottombar 提交按钮 -->
        <div class="child">
          <Button class="bg-flomo w-full"> 保存到 Flomo </Button>
        </div>

        <!-- menu bar 选取笔记，分享，截图，ai总结 -->
      </div>
    </SheetContent>
  </Sheet>
</template>

<style lang="scss" scoped>
.child {
  @apply w-full shrink-0 box-border;
}
</style>
