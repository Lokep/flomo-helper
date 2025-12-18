<template>
  <div class="tiptap-editor" :style="{ width: editorWidth, height: editorHeight }">
    <!-- Tiptap 编辑器容器 -->
    <editor-content
      :editor="editor"
      class="tiptap-content"
    />

    <!-- 工具栏（可自定义） -->
    <div class="tiptap-toolbar">
      <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }">
        加粗
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }">
        斜体
      </button>
      <button @click="saveContent">保存</button>
      <button @click="clearContent">清空</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';

// Props
const props = defineProps({
  // 初始内容
  initialContent: {
    type: String,
    default: '<p>请输入内容...</p>',
  },
  // 编辑器尺寸（适配不同上下文）
  editorWidth: {
    type: String,
    default: '100%',
  },
  editorHeight: {
    type: String,
    default: '300px',
  },
  // 是否禁用（Content Script 场景可能需要）
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['content-change', 'save']);

// 编辑器实例
const editor = ref<any>(null);

// 初始化编辑器
onMounted(() => {
  editor.value = useEditor({
    // 基础扩展
    extensions: [
      StarterKit.configure({
        // 禁用不需要的扩展
        blockquote: false,
        codeBlock: false,
      }),
      Bold,
      Italic,
    ],
    // 初始内容
    content: props.initialContent,
    // 禁用状态
    editable: !props.disabled,
    // 内容变更回调
    onUpdate: ({ editor }) => {
      emit('content-change', editor.getHTML());
      // 实时保存到 storage（可选）
      // chrome.storage.local.set({ tiptapContent: editor.getHTML() });
    },
  });
});

// 销毁编辑器（避免内存泄漏）
onUnmounted(() => {
  editor.value?.destroy();
});

// 监听禁用状态
watch(
  () => props.disabled,
  (newVal) => {
    editor.value?.setEditable(!newVal);
  }
);

// 保存内容
const saveContent = () => {
  const content = editor.value?.getHTML() || '';
  emit('save', content);
  // 插件内提示
  // chrome.notifications.create({
  //   type: 'basic',
  //   iconUrl: 'icons/icon48.png',
  //   title: '成功',
  //   message: '内容已保存',
  // });
};

// 清空内容
const clearContent = () => {
  editor.value?.chain().focus().clearContent().run();
};
</script>

<style scoped>

  /* 全局重置 Tiptap 样式，避免继承页面样式 */
.tiptap-editor-inner {
  --color-text: #111827;
  --color-background: #ffffff;
  --color-border: #e5e7eb;

  all: initial;
  display: block;
  width: 100%;
  min-height: 200px;
  padding: 12px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-background);
  border: none;
  outline: none;
}

/* 覆盖 ProseMirror 默认样式 */
.ProseMirror {
  outline: none;
}

.ProseMirror p {
  margin: 0 0 12px 0;
}

.ProseMirror strong {
  font-weight: 700;
}

.ProseMirror em {
  font-style: italic;
}

/* 暗黑模式适配（可选） */
@media (prefers-color-scheme: dark) {
  .tiptap-editor-inner {
    --color-text: #f9fafb;
    --color-background: #1f2937;
    --color-border: #374151;
  }
}

/* ------ 以上为reset样式 ----- */


.tiptap-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  /* 样式隔离：避免继承页面样式 */
  all: initial;
  font-family: system-ui, -apple-system, sans-serif;
}

.tiptap-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tiptap-toolbar button {
  margin-right: 8px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.tiptap-toolbar button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.tiptap-content {
  padding: 12px;
  min-height: 200px;
  outline: none;
}

/* 编辑器内部样式重置 */
.tiptap-editor-inner {
  outline: none;
}

.tiptap-editor-inner p {
  margin: 0 0 8px 0;
}

.tiptap-editor-inner strong {
  font-weight: 700;
}

.tiptap-editor-inner em {
  font-style: italic;
}
</style>