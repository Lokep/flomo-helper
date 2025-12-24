<template>
  <editor-content class="size-full" :editor="editor" @click="onEditorContentClick" />
</template>

<script setup>
import { useEditor, EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Placeholder } from '@tiptap/extensions'
import { Hashtag } from '@/plugins/hashtag'
import Link from '@tiptap/extension-link'


const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue', 'change'])

const editor = useEditor({
  extensions: [
    Hashtag,
    StarterKit.configure({
      heading: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      hardBreak: false,
    }),
    Placeholder.configure({
      placeholder: '划词选中同步文字，粘贴或输入内容 \r\n按Shift+Enter保存 🎉',
    }),
    Link.configure({
      openOnClick: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'tiptap-link',
      },
    }),
  ],

  editorProps: {
    attributes: {
      class: 'prose prose-sm focus:outline-none dark:prose-invert max-w-none',
    },
  },

  onUpdate() {
    console.log('update', editor.value.getJSON())
    emit('update:modelValue', editor.value.getHTML())
  }
})


function onEditorContentClick() {
  editor.value.commands.focus()
}

watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value

  if (isSame) {
    return
  }

  editor.value.commands.setContent(value)
})



onBeforeUnmount(() => {
  editor.value.destroy()
})


defineExpose({
  editor
})

</script>

<style scoped lang="scss">
.ProseMirror-focused {
  outline: none;
  border: none;
}

:deep(.ProseMirror) {

  & p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
    font-size: 14px;
  }
}
</style>


<style lang="scss">
.prose :where(.prose > ol > li > p:last-child):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-bottom: 8px !important;
  user-select: none;
}

.prose :where(.prose > ol > li > p:first-child):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-top: 8px !important;
  user-select: none;
}

.prose-sm :where(.prose-sm > ul > li > p:last-child):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-bottom: 8px !important;
  user-select: none;
}

.prose-sm :where(.prose-sm > ul > li > p:first-child):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-top: 8px !important;
  user-select: none;
}

span[data-type="hashtag"] {
  background-color: #eef3fe;
  border-radius: 3px;
  color: #5783f7;
  cursor: pointer;
  padding: 2px 4px;
  margin-right: 2px;
}

.tiptap-link {
  @apply mx-1 p-1;
  cursor: pointer!important;
  color: #30cf79!important;

  &:hover {
    @apply bg-slate-200 rounded-sm;
  }
}
</style>
