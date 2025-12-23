/**
 * 图片转换为File的配置选项
 */
export interface ImageToFileOptions {
  /** 自定义文件名（默认自动提取或生成） */
  fileName?: string;
  /** 自定义文件MIME类型（默认从图片链接/响应中提取） */
  mimeType?: string;
  /** 网络图片请求超时时间（毫秒，默认10000ms） */
  timeout?: number;

  returnType?: 'blob' | 'file';
}

/**
 * 图片链接类型枚举
 */
export enum ImageUrlType {
  HTTP = 'http', // http/https 网络链接
  RELATIVE = 'relative', // 相对路径链接
  BASE64 = 'base64', // Base64 编码链接（data:image/xxx）
  BLOB = 'blob', // Blob URL 链接（blob:xxx）
  INVALID = 'invalid', // 无效链接
}

/**
 * 检测图片链接的类型
 * @param url 图片链接字符串
 * @returns 链接类型枚举值
 */
const detectImageUrlType = (url: string): ImageUrlType => {
  if (!url || typeof url !== 'string') {
    return ImageUrlType.INVALID;
  }

  // 匹配Base64图片（data:image/xxx;base64,xxx）
  if (url.startsWith('data:image/')) {
    return ImageUrlType.BASE64;
  }

  // 匹配Blob URL（blob:https://xxx 或 blob:http://xxx）
  if (url.startsWith('blob:')) {
    return ImageUrlType.BLOB;
  }

  // 匹配HTTP/HTTPS网络链接
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return ImageUrlType.HTTP;
  }

  // 其余非空字符串判定为相对路径
  return ImageUrlType.RELATIVE;
};

/**
 * 拼接相对路径为完整的HTTP/HTTPS URL
 * @param relativeUrl 相对路径（如 /static/img.jpg、./img.png）
 * @returns 完整的绝对URL
 */
const resolveRelativeUrl = (relativeUrl: string): string => {
  try {
    // 利用浏览器原生URL构造器自动拼接当前页面地址
    return new URL(relativeUrl, window.location.href).href;
  } catch (error) {
    throw new Error(`相对路径拼接失败: ${(error as Error).message}`);
  }
};

/**
 * 将Base64字符串转换为Blob对象
 * @param base64 Base64图片字符串（含data:image前缀）
 * @returns Blob对象
 */
const base64ToBlob = (base64: string): Blob => {
  try {
    // 分割Base64头（如data:image/png;base64）和数据体
    const [header, data] = base64.split(',');
    if (!data) {
      throw new Error('Base64字符串格式错误，缺少数据体');
    }

    // 提取MIME类型（如data:image/png;base64 → image/png）
    const mimeTypeMatch = header.match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // 解码Base64为二进制字符串
    const byteCharacters = atob(data);
    const byteArrays: Uint8Array[] = [];

    // 按512字节分片处理，避免大文件内存溢出
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    throw new Error(`Base64转Blob失败: ${(error as Error).message}`);
  }
};

/**
 * 从Blob URL中获取原始Blob对象
 * @param blobUrl Blob URL字符串（blob:xxx）
 * @returns Blob对象
 */
const blobUrlToBlob = async (blobUrl: string): Promise<Blob> => {
  try {
    // 通过fetch请求Blob URL获取Blob（Blob URL仅当前页面有效）
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Blob请求失败: ${response.status} ${response.statusText}`);
    }
    return response.blob();
  } catch (error) {
    throw new Error(`Blob URL转Blob失败: ${(error as Error).message}`);
  }
};

/**
 * 下载网络图片并转换为Blob对象
 * @param url 完整的网络图片URL
 * @param timeout 超时时间（毫秒）
 * @returns Blob对象
 */
const downloadImageToBlob = async (url: string, timeout: number): Promise<Blob> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // 跨域请求配置
      signal: controller.signal,
      headers: {
        'Accept': 'image/*', // 只接受图片类型响应
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
    }

    // 验证响应是否为图片类型
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`响应内容非图片类型: ${contentType}`);
    }

    return await response.blob();
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error(`图片请求超时（${timeout}ms）`);
    }
    throw new Error(`网络图片转Blob失败: ${(error as Error).message}`);
  }
};

/**
 * 生成默认文件名
 * @param url 图片链接
 * @param mimeType 文件MIME类型
 * @returns 自动生成的文件名
 */
const generateDefaultFileName = (url: string, mimeType: string): string => {
  // 从URL中提取文件名（处理带参数的情况，如 xxx.png?size=100）
  const rawFileName = url.split('/').pop()?.split('?')[0] || 'unknown-image';
  
  // 提取文件扩展名（从MIME类型，如 image/png → png）
  const ext = mimeType.split('/')[1] || 'png';
  
  // 若文件名无扩展名则补充
  return rawFileName.includes('.') ? rawFileName : `${rawFileName}.${ext}`;
};

/**
 * 将图片链接转换为File对象
 * @param imageUrl 图片链接（支持HTTP/相对路径/Base64/Blob）
 * @param options 转换配置选项
 * @returns File对象
 * @throws 转换失败时抛出错误信息
 */
export const imageUrlToFile = async (
  imageUrl: string,
  options: ImageToFileOptions = {}
): Promise<File | Blob> => {
  // 解构配置并设置默认值
  const {
    fileName: customFileName,
    mimeType: customMimeType,
    timeout = 10000,
    returnType = 'file',
  } = options;

  // 入参基础校验
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('无效的图片链接：必须传入非空的字符串');
  }

  // 检测链接类型
  const urlType = detectImageUrlType(imageUrl);
  let blob: Blob;
  let finalMimeType: string;

  // 根据不同链接类型处理
  switch (urlType) {
    case ImageUrlType.INVALID:
      throw new Error('图片链接格式无效，无法识别');

    case ImageUrlType.HTTP:
      // 处理HTTP/HTTPS网络图片
      blob = await downloadImageToBlob(imageUrl, timeout);
      finalMimeType = customMimeType || blob.type;
      break;

    case ImageUrlType.RELATIVE:
      // 处理相对路径，拼接为完整URL后下载
      const fullUrl = resolveRelativeUrl(imageUrl);
      blob = await downloadImageToBlob(fullUrl, timeout);
      finalMimeType = customMimeType || blob.type;
      break;

    case ImageUrlType.BASE64:
      // 处理Base64图片
      blob = base64ToBlob(imageUrl);
      finalMimeType = customMimeType || blob.type;
      break;

    case ImageUrlType.BLOB:
      // 处理Blob URL
      blob = await blobUrlToBlob(imageUrl);
      finalMimeType = customMimeType || blob.type;
      break;

    default:
      throw new Error(`暂不支持的图片链接类型: ${urlType}`);
  }

  // 确定最终文件名
  const finalFileName = customFileName || generateDefaultFileName(imageUrl, finalMimeType);

  // 将Blob转换为File对象（File是Blob的子类）
  const file = new File([blob], finalFileName, {
    type: finalMimeType,
    lastModified: Date.now(),
  });

  return returnType === 'file' ?  file : blob;
};

/**
 * （可选）批量转换图片链接为File对象
 * @param imageUrls 图片链接数组
 * @param options 转换配置
 * @returns File对象数组（失败的项返回null）
 */
export const batchImageUrlToFile = async (
  imageUrls: string[],
  options: ImageToFileOptions = {}
): Promise<(File | null)[]> => {
  const results: (File | null)[] = [];
  for (const url of imageUrls) {
    try {
      const file = await imageUrlToFile(url, options) as File;
      results.push(file as File);
    } catch (error) {
      console.error(`转换${url}失败:`, error);
      results.push(null);
    }
  }
  return results;
};
