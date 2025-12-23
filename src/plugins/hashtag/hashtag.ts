import { Node, mergeAttributes } from '@tiptap/core';

// 匹配规则：# + 任意非空内容 + 第一个空格（捕获#后的内容）
// \s*? 匹配0个或多个空白（避免#后直接空格）
// ([^\\s]+) 捕获#后到第一个空格前的非空内容
// \s 匹配第一个空格（作为触发符）
const HASHTAG_SPACE_REGEX = /(?:^|\s)#([^\s]+)\s/g;

export const Hashtag = Node.create({
  name: 'hashtag',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true, // 独立原子节点

  addAttributes() {
    return {
      value: {
        default: '',
        parseHTML: (element) => element.dataset.value,
        renderHTML: (attributes) => ({ 'data-value': attributes.value }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="hashtag"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'hashtag',
          class: 'inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-sm mr-1',
        },
        HTMLAttributes
      ),
      `#${node.attrs.value}`,
    ];
  },

  // addNodeView() {
  //   return VueNodeViewRenderer(HashtagNodeView);
  // },

  // 输入规则：仅在#内容+第一个空格时触发
  addInputRules() {
    return [
      {
        undoable: true,
        find: HASHTAG_SPACE_REGEX,
        handler: ({ state, match, range }) => {
          const value = match[1]; // 捕获#后到空格前的内容
          if (!value) return;

          const tr = state.tr;
          // 计算实际删除范围：# + 内容 + 空格（总长度 = 1 + value长度 + 1）
          const deleteFrom = range.from;
          const deleteTo = range.to;

          // 删除原输入的#内容和空格
          tr.delete(deleteFrom, deleteTo);
          // 插入Hashtag节点
          const hashtagNode = this.type.create({ value });
          tr.insert(deleteFrom, hashtagNode);

          // 移动光标到标签后方，保持输入连贯性
          // @ts-expect-error
          tr.setSelection(state.selection.constructor.create(tr.doc, deleteFrom + hashtagNode.nodeSize));
          // return tr;
        },
      },
    ];
  },

  // 手动创建标签的命令（可选）
  // @ts-expect-error
  addCommands() {
    return {
      // @ts-expect-error
      createHashtag: (value: string) => ({ tr, dispatch }) => {
        if (!dispatch) return true;
        const node = this.type.create({ value });
        tr.insert(tr.selection.from, node);
        return true;
      },
    };
  },
});

export default Hashtag;
