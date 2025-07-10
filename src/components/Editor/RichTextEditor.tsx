import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your thoughts...',
  className = ''
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link'
  ];

  useEffect(() => {
    // Auto-save functionality can be added here
    const timer = setTimeout(() => {
      if (value) {
        // Save to localStorage or send to server
        localStorage.setItem('draft_content', value);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: '400px',
          marginBottom: '50px'
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .ql-toolbar {
            border: 1px solid #e5e7eb !important;
            border-radius: 8px 8px 0 0 !important;
            background: #f9fafb !important;
          }
          
          .ql-container {
            border: 1px solid #e5e7eb !important;
            border-radius: 0 0 8px 8px !important;
            font-family: inherit !important;
          }
          
          .ql-editor {
            font-size: 16px !important;
            line-height: 1.6 !important;
            min-height: 400px !important;
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
      }} />
    </div>
  );
};

export default RichTextEditor;