/**
 * 异步/同步函数的错误捕获工具，返回 [数据, 错误] 格式
 * @param func 要执行的函数（同步/异步）
 * @param errorHandler 可选的错误处理函数，用于自定义错误转换
 * @returns [成功数据, 错误对象] 数组，成功时错误为 null，失败时数据为 null
 */
export async function tryCatch<
  T = null, // 成功返回值类型
  E extends Error = Error // 错误类型约束为 Error 子类
>(
  func: () => T | Promise<T>,
  errorHandler?: (rawError: unknown) => E
): Promise<[T, null] | [null, E]> {
  try {
    // 兼容同步函数，统一转为 Promise 处理
    const res = await Promise.resolve(func());
    // 成功时返回 [数据, null]
    return [res, null];
  } catch (rawError) {
    let error: E;
    // 处理原始错误，确保始终是 Error 实例
    if (rawError instanceof Error) {
      error = (errorHandler ? errorHandler(rawError) : rawError) as E;
    } else {
      // 非 Error 类型的错误，包装为通用 Error
      const fallbackError = new Error(
        rawError !== undefined && rawError !== null ? String(rawError) : 'Unknown error'
      );
      error = (errorHandler ? errorHandler(fallbackError) : fallbackError) as E;
    }
    // 失败时返回 [null, 错误]
    return [null, error];
  }
}

// 辅助类型：提取 tryCatch 的返回值类型
export type TryCatchResult<F> = F extends () => Promise<infer T>
  ? [T, null] | [null, Error]
  : F extends () => infer T
  ? [T, null] | [null, Error]
  : [null, Error];
