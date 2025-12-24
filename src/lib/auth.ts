
import { isEmptyObject } from "./utils";
import md5 from "md5"
import chromStorage from "@/lib/storage";
import { StorageKeys } from "./constant";

export async function authData() {
  const me = await chromStorage.getItem(StorageKeys.Me) || {}

  console.log('me', me);

  return !isEmptyObject(me);
}


export function kSort(e: Record<string, any>) {
  const sortedKeys = Object.keys(e).sort();
  const result: Record<string, any> = {};

  for (const k in sortedKeys) {
    result[sortedKeys[k]] = e[sortedKeys[k]];
  }

  return result;
}




export function getSign (params: Record<string, any>) {
  const salt = "dbbc3dd73364b4084c3a69346e0ce2b2"

  let n = ""

  for (const i in params) {
    if (params[i]) {
      n += i + "=" + params[i] + "&"
    }
  }
  n = n.substring(0, n.length - 1)

  return md5(n + salt)
}



export function getTimeStamp() {
  return Number(new Date().getTime().toString().slice(0, 10))
}
