import { MessageKeys, StorageKeys } from "@/lib/constant";
import type { BridgeMessage } from "webext-bridge";
import { onMessage, sendMessage } from "webext-bridge/background";
import chromStorage from "@/lib/storage";
import { authData } from "@/lib/auth";
import { getUserMeApi } from "@/api/flomo";
import { tryCatch } from "@/lib/tryCatch";

onMessage("greeting", ({ data }: BridgeMessage<{ name: string }>) => {
  return `hello${data.name}`;
});

/**
 * Flomo地址：https://v.flomoapp.com/mine
 * 一、当点击浏览器Action按钮时，会触发以下逻辑：
 * 1. 获取当前选项卡的URL、tabId，并记录当前选项卡
 * 2.如果不是Flomo地址，则执行以下逻辑：
 *    1. 判断当前store中是否有me数据
 *    2. 如果有，打开content script里注入的弹窗
 *    3. 如果没有或校验失效，则打开Flomo地址
 * 3. 如果是，则执行以下逻辑：
 *    1.从page的storage里获取me数据
 *    2. 如果me数据不存在，开启localstorage监听，监听me数据
 *    3. 在beforeunload事件中，取消localstorage监听
 * 
 * 
 * ! 除了读取me，还要读取store:stat
 */

const Flomo_Page = "https://v.flomoapp.com/mine";

async function doAuthentication() {
  const hasAuthData = await authData()

  if (hasAuthData) {
    const [res] = await tryCatch(getUserMeApi)

    return res?.code === 0
  }

  return false
}


function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0])
    })
  })
}


onMessage(MessageKeys.Get_Current_Tab, async (e) => {
  const tab = await getActiveTab()
  
  return tab
})


chrome.action.onClicked.addListener(async (tab) => {
  chromStorage.setItem(StorageKeys.CurrentTab, tab);

  if (!tab.url?.includes(Flomo_Page)) {
    await doAuthentication();
  }

  if (tab.id) {
    // https://github.com/serversideup/webext-bridge/issues/71
    // https://github.com/serversideup/webext-bridge/issues/37
    sendMessage(
      MessageKeys.Toggle_Sheet,
      tab as any,
      {
        tabId: tab.id,
        context: "content-script",
      }
    );
  }
});
