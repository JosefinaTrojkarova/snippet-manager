import { generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { marked } from 'marked'; 

const extensions = [
  StarterKit, TaskList, TaskItem.configure({ nested: true }), Markdown
];

console.log("JSON generated from Markdown:");
const htmlFromMD = Markdown.name; // Tiptap Markdown handles parsing? Wait, tiptap-markdown creates prosemirror blocks from markdown...
// Let's cheat by creating an editor? 
// No, we can just use the Editor class.
import { Editor } from '@tiptap/core';
const testEditor = new Editor({
  content: '- [ ] Test list item\n- [x] Done',
  extensions,
});

console.log('HTML Output:\n', testEditor.getHTML());
console.log('JSON Output:\n', JSON.stringify(testEditor.getJSON(), null, 2));

testEditor.destroy();
