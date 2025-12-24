/**
 * 浏览器插件专用 fetch 封装
 * 特性：
 * 1. 适配 Manifest V2/V3 跨域权限
 * 2. 统一错误处理（网络错误/状态码错误/业务错误）
 * 3. 超时控制、请求/响应拦截
 * 4. 支持 Content Script/Background/Popup 多上下文
 * 5. 兼容 Chrome/Firefox/Edge
 */

import { getSign, getTimeStamp, kSort } from "./auth";
import { StorageKeys } from "./constant";
import chromeStorage from "@/lib/storage"

// 请求配置类型
interface RequestOptions extends RequestInit {
  // 基础URL（可拼接路径）
  baseURL?: string;
  // 请求路径（或完整URL）
  url: string;
  // 请求参数（GET拼到URL，POST放body）
  params?: Record<string, any>;
  // 请求体（自动序列化JSON）
  data?: Record<string, any>;
  // 超时时间（默认10s）
  timeout?: number;
  // 是否携带Cookie（仅Background上下文有效）
  credentials?: RequestCredentials;
  // 自定义错误提示
  errorMessage?: string;
  // 是否忽略业务错误（仅捕获网络/状态码错误）
  ignoreBusinessError?: boolean;
}

// 响应结果类型
interface ResponseResult<T = any> {
  code: number;
  data: T;
  msg: string;
  [key: string]: any;
}

// 拦截器类型
interface Interceptors {
  request: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  response: <T = any>(
    res: ResponseResult<T>
  ) => ResponseResult<T> | Promise<ResponseResult<T>>;
  error: (err: Error) => Error | Promise<Error>;
}

class PluginFetch {
  // 默认配置
  private defaultConfig: Partial<RequestOptions> = {
    timeout: 10000,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Origin: "https://v.flomoapp.com",
      Referer: "https://v.flomoapp.com/",
    },

    baseURL: "https://flomoapp.com/api/v1",
  };

  // 拦截器
  private interceptors: Interceptors = {
    request: (config) => config,
    response: (res) => res,
    error: (err) => err,
  };

  constructor(defaultConfig?: Partial<RequestOptions>) {
    if (defaultConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...defaultConfig };
    }
  }

  /**
   * 设置拦截器
   * @param interceptors 拦截器对象
   */
  setInterceptors(interceptors: Partial<Interceptors>) {
    this.interceptors = { ...this.interceptors, ...interceptors };
  }

  /**
   * 拼接URL和参数（GET请求）
   * @param url 基础URL
   * @param params 请求参数
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${searchParams.toString()}`;
  }

  /**
   * 核心请求方法
   * @param options 请求配置
   */
  async request<T = any>(options: RequestOptions): Promise<ResponseResult<T>> {
    try {

      const me = await chromeStorage.getItem(StorageKeys.Me)

      // 合并配置
      const config: RequestOptions = {
        ...this.defaultConfig,
        ...options,
        headers: {
          ...this.defaultConfig.headers,
          ...options.headers,
          // @ts-expect-error
          Authorization: me ? `Bearer ${me.access_token}` : '',
        },
      };

      // 执行请求拦截器
      const finalConfig = await this.interceptors.request(config);

      console.log('[request]', finalConfig);

      // 处理URL
      const fullUrl = finalConfig.baseURL
        ? `${finalConfig.baseURL.replace(/\/$/, "")}/${finalConfig.url.replace(
          /^\//,
          ""
        )}`
        : finalConfig.url;



      const urlWithParams =
        finalConfig.method?.toUpperCase() === "GET"
          ? this.buildUrl(fullUrl, finalConfig.params)
          : fullUrl;

      // 构建请求参数
      const fetchOptions: RequestInit = {
        method: finalConfig.method || "GET",
        headers: finalConfig.headers,
        credentials: finalConfig.credentials,
        signal: AbortSignal.timeout(finalConfig.timeout || 10000), // 超时控制
      };

      const fetchMethod = fetchOptions.method?.toUpperCase() || "GET";

      // 处理POST/PUT等请求体
      if (["POST", "PUT", "PATCH", "DELETE"].includes(fetchMethod)) {
        if (finalConfig.data) {
          // 兼容FormData（不序列化）
          if (finalConfig.data instanceof FormData) {
            delete fetchOptions.headers; // 自动生成Content-Type
            fetchOptions.body = finalConfig.data;
          } else {
            fetchOptions.body = JSON.stringify(finalConfig.data);
          }

          console.log('[request]', finalConfig.data, fetchOptions.body);
        }
        // GET请求的params单独处理
      } else if (fetchMethod === "GET" && finalConfig.params) {
        // 已通过buildUrl处理，无需重复设置
      }

      // 发送请求
      const response = await fetch(urlWithParams, fetchOptions);

      // 处理响应状态码
      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} ${response.statusText}`,
          { cause: { status: response.status, url: urlWithParams } }
        );
      }

      // 解析响应（优先JSON，兼容文本）
      let responseData: any;

      const contentType = response.headers.get('Content-Type') || '';



      if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        return { code: 0 , data: {} as any, msg: ''}
      }

      try {
        responseData = await response.json();
      } catch(e) {

        console.log('responseData', e);

        responseData = await response.text();
        // 非JSON格式包装成标准结构
        responseData = { code: 200, data: responseData, msg: "success" };
      }

      // 处理业务错误（非200/0等成功码）
      if (!finalConfig.ignoreBusinessError) {
        const successCode = [200, 0, "200", "0"];
        if (!successCode.includes(responseData.code)) {
          throw new Error(
            finalConfig.errorMessage || responseData.msg || "业务请求失败",
            { cause: { ...responseData, url: urlWithParams } }
          );
        }
      }

      // 执行响应拦截器
      const finalResponse = await this.interceptors.response<T>(responseData);
      return finalResponse;
    } catch (err) {
      // 统一错误处理
      const error = err instanceof Error ? err : new Error(String(err));
      // 执行错误拦截器
      const finalError = await this.interceptors.error(error);
      throw finalError;
    }
  }

  // GET请求快捷方法
  get<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: Omit<RequestOptions, "url" | "method" | "params">
  ): Promise<ResponseResult<T>> {
    return this.request<T>({
      ...options,
      url,
      method: "GET",
      params,
    });
  }

  // POST请求快捷方法
  post<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ): Promise<ResponseResult<T>> {
    return this.request<T>({
      ...options,
      url,
      method: "POST",
      data,
    });
  }

  // PUT请求快捷方法
  put<T = any>(
    url: string,
    data?: Record<string, any>,
    options?: Omit<RequestOptions, "url" | "method" | "data">
  ): Promise<ResponseResult<T>> {
    return this.request<T>({
      ...options,
      url,
      method: "PUT",
      data,
    });
  }

  // DELETE请求快捷方法
  delete<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: Omit<RequestOptions, "url" | "method" | "params">
  ): Promise<ResponseResult<T>> {
    return this.request<T>({
      ...options,
      url,
      method: "DELETE",
      params,
    });
  }
}

// 创建默认实例
const pluginFetch = new PluginFetch();

pluginFetch.setInterceptors({
  request: (config) => {
    console.log("[request]", config)
    if (config.method?.toUpperCase() === 'POST' && config.data instanceof FormData) {
      return config;
    }

    const targetKey = config.method?.toUpperCase() === "GET" ? "params" : "data";

    const sortedParams = kSort({
      timestamp: getTimeStamp(),
      api_key: "flomo_web",
      app_version: "4.0",
      platform: "web",
      webp: "1",
      ...config[targetKey],
    })

    config[targetKey] = {
      ...sortedParams,
      sign: getSign(sortedParams),
    }

    return config;
  },
});

// 导出实例和类型
export default pluginFetch;
export type { RequestOptions, ResponseResult, Interceptors, PluginFetch };
