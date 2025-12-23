import { getTimeStamp } from "@/lib/auth";
import http from "@/lib/http";

/**
 *
 * @param text
 * @param file_ids
 * @returns
 */
export const updateFlomoApi = (text: string, file_ids: string[] = []) =>
  http
    .put("/memo", {
      content: text,
      created_at: getTimeStamp(),
      source: "web",
      file_ids,
      tz: "8:0",
    })
    .then((res) => {
      if (res.code === 0) {
        return res;
      } else if (res.code == -10) {
        // !登录失效
        return Promise.reject(res);
      } else {
        return Promise.reject(res);
      }
    });

export const getOSSSignatureApi = () => http.get("/file/oss_signature", {});

interface File {
  name: string;
  size: number;
  path: string;
}

/**
 * 保存文件，获取文件id
 */
export const saveFileApi = ({
  // 1726795830598.png
  name,
  // 31601
  size,
  // file/tmp/2024-09-20/1396309/88bdf3e2d2d43323d25ed956b13df82b.png
  path,
}: File) =>
  http.put("/file", {
    name,
    size,
    path,
  });





export const getUserMeApi = () => http.get("/user/me", {})
