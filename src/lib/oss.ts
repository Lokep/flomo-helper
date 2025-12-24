import http from "@/lib/http";
import { getOSSSignatureApi, saveFileApi } from "@/api/flomo";

function getExt(file: File) {
  return file.name.slice(file.name.lastIndexOf("."));
}

export function generateFormData(file: File, filename: string, oss: any) {
  const formData = new FormData();

  if (!oss) {
    return null;
  }

  formData.append("name", filename);
  formData.append("key", oss.dir + "/" + filename);
  formData.append("policy", oss.policy);
  formData.append("OSSAccessKeyId", oss.accessId);
  formData.append("success_action_status", "201");
  formData.append("signature", oss.signature);
  formData.append("file", file, file.name);

  return formData;
}

export async function getOSSConfig() {
  const res = await getOSSSignatureApi();

  if (res.code === 0) {
    const {
      dir = "",
      expire = "",
      host = "",
      accessid: accessId,
      policy,
      signature,
    } = res.data || {};

    const ossData = {
      dir,
      expire,
      host,
      accessId,
      policy,
      signature,
    };

    return ossData;
  }
}

export async function uploadImage(file: File) {
  const oss = await getOSSConfig();
  const filename = Date.now() + getExt(file);
  const formData = generateFormData(file, filename, oss);

  await http.post(oss?.host, formData!, {
    baseURL: "",
  });

  return saveFileApi({
    name: file.name,
    size: file.size,
    path: oss?.dir + "/" + filename,
  }).then((res) => {
    const { url, id } = res.data || {};

    return {
      // @ts-expect-error
      uid: file.uid,
      url,
      size: file.size,
      name: file.name,
      type: file.type,
      status: "done",
      percent: 100,
      id,
    };
  });
}
