/**
 * 前端环境下处理HTML字符串的增强方法
 * @param html 原始HTML字符串
 * @param options 配置项
 * @returns 处理后的HTML字符串
 */
export function processHtmlInBrowser(
  html: string,
  options: {
    // 保留的属性白名单（可选）
    preserveAttrs?: string[];
    // 需要过滤的危险标签（可选，默认包含指定的媒体/危险标签）
    dangerTags?: string[];
    // 是否清理空标签（可选）
    cleanEmptyTags?: boolean;
    // 需要过滤首尾空白的标签类型（可选）
    trimEmptyTagTypes?: string[];
  } = {}
): string {
  // 输入校验
  if (!html || typeof html !== 'string') return '';

  // 默认配置：将用户指定的标签列为默认过滤的危险标签
  const {
    preserveAttrs = ['alt', 'title', 'src', 'href'], // 保留常用合法属性（若过滤img，这些属性可按需删除）
    dangerTags = [
      'img',
      'video',
      'audio',
      'source',
      'map',
      'area',
      'iframe',
      'script',
      'style'
    ], // 替换为用户指定的标签列表
    cleanEmptyTags = true, // 开启空标签清理
    trimEmptyTagTypes = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'] // 需要过滤首尾空白的标签类型
  } = options;

  // 1. 解析HTML为DOM对象
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // 工具函数：移除元素的非白名单属性
  const removeInvalidAttributes = (element: Element) => {
    const attrs = Array.from(element.attributes);
    attrs.forEach(attr => {
      if (!preserveAttrs.includes(attr.name)) {
        element.removeAttribute(attr.name);
      }
    });
  };

  // 工具函数：安全替换标签（避免块级标签嵌套p）
  const replaceTagSafely = (element: Element, newTag: string): Element | null => {
    // p标签不能包含块级元素，提前判断
    if (newTag === 'p' && Array.from(element.children).some(child => child.tagName in BLOCK_TAGS)) {
      return null;
    }
    const newElement = doc.createElement(newTag);
    while (element.firstChild) {
      newElement.appendChild(element.firstChild);
    }
    // 继承白名单属性
    removeInvalidAttributes(newElement);
    element.parentNode?.replaceChild(newElement, element);
    return newElement;
  };

  // 工具函数：转换标题标签为p包裹的strong（处理块级子节点）
  const convertHeadingToStrong = (heading: Element) => {
    const strong = doc.createElement('strong');
    const p = doc.createElement('p');
    // 分离行内/块级子节点：行内放入strong，块级移到p外
    Array.from(heading.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (el.tagName in INLINE_TAGS) {
          strong.appendChild(child);
        } else {
          p.after(child); // 块级节点移到p后面
        }
      } else {
        strong.appendChild(child); // 文本节点直接放入strong
      }
    });
    p.appendChild(strong);
    removeInvalidAttributes(p);
    heading.parentNode?.replaceChild(p, heading);
  };

  // 工具函数：移除危险标签（核心：过滤指定标签）
  const removeDangerTags = () => {
    dangerTags.forEach(tag => {
      Array.from(body.querySelectorAll(tag)).forEach(el => {
        el.parentNode?.removeChild(el);
      });
    });
  };

  // 工具函数：清理空标签（无内容/仅空白的标签）
  const cleanEmptyElements = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    // 递归处理子节点
    Array.from(element.childNodes).forEach(cleanEmptyElements);
    // 判断是否为空标签（排除br、hr等自闭合标签）
    const isEmpty = !element.textContent?.trim() && !['BR', 'HR'].includes(element.tagName);
    if (isEmpty) {
      element.parentNode?.removeChild(element);
    }
  };

  // 工具函数：遍历处理元素属性
  const traverseAndProcessAttrs = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      removeInvalidAttributes(element);
      Array.from(element.childNodes).forEach(traverseAndProcessAttrs);
    }
  };

  // 工具函数：过滤字符串首尾的空白标签（含嵌套空标签、含空白字符的空标签）
  const trimSurroundingEmptyTags = (htmlStr: string): string => {
    if (!htmlStr) return '';
    // 生成匹配首尾空标签的正则（支持配置的标签类型，忽略属性、空白字符）
    const tagPattern = trimEmptyTagTypes.join('|');
    // 正则说明：匹配首尾的 <tag...>（含空白）</tag>，支持嵌套空标签
    const emptyTagRegex = new RegExp(
      `^(<(${tagPattern})[^>]*?>\\s*(?:<(${tagPattern})[^>]*?>\\s*<\/\\3>\\s*)*<\/\\2>\\s*)+|(\\s*<(${tagPattern})[^>]*?>\\s*(?:<(${tagPattern})[^>]*?>\\s*<\/\\6>\\s*)*<\/\\5>\\s*)+$`,
      'gi'
    );
    // 循环替换，直到首尾无空标签（处理多层嵌套）
    let trimmed = htmlStr.trim();
    let prev: string;
    do {
      prev = trimmed;
      trimmed = trimmed.replace(emptyTagRegex, '').trim();
    } while (trimmed !== prev);
    return trimmed;
  };

  // 块级/行内标签映射（简化版，可根据需求扩展）
  const BLOCK_TAGS = {
    DIV: true, P: true, H1: true, H2: true, H3: true, H4: true, H5: true, H6: true,
    UL: true, OL: true, LI: true, TABLE: true, TR: true, TD: true
  };
  const INLINE_TAGS = {
    STRONG: true, EM: true, A: true, SPAN: true, BR: true // 已过滤img，故从行内标签中移除
  };

  // 2. 先移除危险标签（优先处理，避免XSS/媒体标签残留）
  removeDangerTags();

  // 3. 遍历所有元素，保留白名单属性
  traverseAndProcessAttrs(body);

  // 4. 安全替换div为p标签（跳过会导致嵌套的情况）
  const divs = Array.from(body.querySelectorAll('div'));
  divs.forEach(div => replaceTagSafely(div, 'p'));

  // 5. 转换h1-h6为p+strong结构
  const headings = Array.from(body.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  headings.forEach(heading => convertHeadingToStrong(heading));

  // 6. 清理空标签
  if (cleanEmptyTags) {
    cleanEmptyElements(body);
  }

  // 7. 获取处理后的HTML并过滤首尾空白标签
  const rawResult = body.innerHTML.trim();
  const finalResult = trimSurroundingEmptyTags(rawResult);

  // 8. 返回最终处理后的字符串
  return finalResult;
}

/**
 * 图片信息类型定义
 */
export interface ImageInfo {
  // 图片地址（核心属性）
  src: string;
  // 图片替代文本
  alt: string;
  // 图片宽度（可能为字符串/数字）
  width?: string | number;
  // 图片高度（可能为字符串/数字）
  height?: string | number;
  // 响应式图片地址集合
  srcset?: string;
  // 图片懒加载属性
  loading?: 'lazy' | 'eager' | 'auto';
  // 图片原始 DOM 元素（可选，便于后续操作）
  element?: HTMLImageElement;
}

/**
 * 判断 HTML 字符串中是否包含图片，并返回图片信息
 * @param html 待解析的 HTML 字符串
 * @returns 无图片返回 false，有图片返回 ImageInfo 数组
 */
export function getImagesFromHtml(html: string): ImageInfo[] | false {
  // 校验入参
  if (!html || typeof html !== 'string') {
    return false;
  }

  // 创建 DOMParser 解析 HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgElements = doc.querySelectorAll('img');

  // 无图片标签时返回 false
  if (imgElements.length === 0) {
    return false;
  }

  // 遍历图片标签，提取信息
  const imageInfoList: ImageInfo[] = Array.from(imgElements).map((img) => {
    const imageInfo: ImageInfo = {
      src: img.src || img.getAttribute('src') || '',
      alt: img.alt || img.getAttribute('alt') || '',
    };

    // 提取宽度和高度（优先取 DOM 属性，再取标签属性）
    if (img.width) {
      imageInfo.width = img.width;
    } else if (img.hasAttribute('width')) {
      imageInfo.width = img.getAttribute('width')!;
    }

    if (img.height) {
      imageInfo.height = img.height;
    } else if (img.hasAttribute('height')) {
      imageInfo.height = img.getAttribute('height')!;
    }

    // 提取响应式图片、懒加载等属性
    if (img.hasAttribute('srcset')) {
      imageInfo.srcset = img.getAttribute('srcset')!;
    }
    if (img.hasAttribute('loading')) {
      imageInfo.loading = img.getAttribute('loading') as ImageInfo['loading'];
    }

    // 可选：保留原始 DOM 元素（如需后续操作）
    imageInfo.element = img as HTMLImageElement;

    return imageInfo;
  });

  return imageInfoList;
}
