import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import katex from 'katex';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Shorter editor area for comments */
  compact?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your thoughts...',
  className = '',
  compact = false
}) => {
  const quillRef = useRef<ReactQuill>(null);
  (window as Window & { katex?: typeof katex }).katex = katex;

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ script: 'super' }, { script: 'sub' }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code', 'formula'],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'script',
    'list',
    'bullet',
    'indent',
    'blockquote',
    'code',
    'code-block',
    'formula',
    'link'
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        localStorage.setItem('draft_content', value);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`rich-editor ${compact ? 'rich-editor-compact' : 'rich-editor-default'} ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .rich-editor .quill {
            display: flex !important;
            flex-direction: column !important;
          }

          .ql-toolbar {
            border: 1px solid #e5e7eb !important;
            border-radius: 8px 8px 0 0 !important;
            background: #f9fafb !important;
          }
          
          .rich-editor .ql-container {
            border: 1px solid #e5e7eb !important;
            border-radius: 0 0 8px 8px !important;
            font-family: inherit !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          .rich-editor .ql-editor {
            font-size: 16px !important;
            line-height: 1.6 !important;
            min-height: ${compact ? '120px' : '220px'} !important;
            max-height: ${compact ? '200px' : '420px'} !important;
            overflow-y: auto !important;
          }

          .rich-editor-default {
            margin-bottom: 16px !important;
          }

          .rich-editor .ql-editor pre.ql-syntax {
            white-space: pre-wrap !important;
            word-break: break-word !important;
          }
          
          .ql-editor.ql-blank::before {
            color: #9ca3af !important;
            font-style: normal !important;
          }
          
          .ql-snow .ql-picker {
            color: #374151 !important;
          }
          
          .ql-snow .ql-stroke {
            stroke: #6b7280 !important;
          }
          
          .ql-snow .ql-fill {
            fill: #6b7280 !important;
          }
          
          .ql-snow .ql-picker-options {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
          
          .ql-editor a {
            color: #2563eb !important;
            text-decoration: underline !important;
          }
          
          .ql-editor a:hover {
            color: #1d4ed8 !important;
          }
        `
        }}
      />
    </div>
  );
};

export default RichTextEditor;
