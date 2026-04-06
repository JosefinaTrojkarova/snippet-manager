import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import SlashCommandList from './SlashCommandList.vue'
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListTodo, Quote, Code, Minus
} from 'lucide-vue-next'

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Heading 1',
      icon: Heading1,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: 'Heading 2',
      icon: Heading2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      icon: Heading3,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'To-do List',
      icon: ListTodo,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: 'Bullet List',
      icon: List,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      icon: ListOrdered,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'Blockquote',
      icon: Quote,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: 'Code Block',
      icon: Code,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: 'Divider',
      icon: Minus,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
}

export const renderItems = () => {
  let component: VueRenderer
  let popup: any

  return {
    onStart: (props: any) => {
      component = new VueRenderer(SlashCommandList, {
        props,
        editor: props.editor,
      })

      if (!props.clientRect) {
        return
      }

      popup = tippy(document.body, {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element as Element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'slash-command',
      })
    },

    onUpdate(props: any) {
      component.updateProps(props)

      if (!props.clientRect) {
        return
      }

      popup.setProps({
        getReferenceClientRect: props.clientRect,
      })
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup.hide()
        return true
      }

      return component.ref?.onKeyDown(props)
    },

    onExit() {
      if (popup) {
        popup.destroy()
      }
      if (component) {
        component.destroy()
      }
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
