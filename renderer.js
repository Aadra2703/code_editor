const monaco = require('monaco-editor');

// Create Monaco Editor instance
const editor = monaco.editor.create(document.getElementById('editor-container'), {
  value: '// Type your code here\nconsole.log("Hello World!");\n',
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
});

// Example: Get editor content
function getEditorContent() {
  return editor.getValue();
}

// Example: Set editor content
function setEditorContent(content) {
  editor.setValue(content);
}

// Example: Change language mode
function changeLanguage(language) {
  monaco.editor.setModelLanguage(editor.getModel(), language);
}