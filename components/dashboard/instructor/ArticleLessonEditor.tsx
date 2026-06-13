'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { mergeAttributes, Node as TiptapNode } from '@tiptap/core';
import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  ChevronDown,
  Code2,
  Columns2,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  PenLine,
  Quote,
  Redo2,
  ALargeSmall,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadLessonMediaImageAction } from '@/actions/instructor';
import { ArticleContent, normalizeArticleHtml } from '@/components/dashboard/courses/ArticleContent';

type Mode = 'edit' | 'split';

interface ArticleLessonEditorProps {
  value: string;
  onChange: (value: string) => void;
  courseId: string;
  lessonId: string;
  disabled?: boolean;
}

const lowlight = createLowlight(common);

const toolbarButton =
  'h-9 min-w-9 px-2 rounded-[8px] border border-[#E3E8F4] bg-white text-[#4B5563] hover:text-[#1C4ED1] hover:border-[#1C4ED1]/30 hover:bg-[#F4F6FB] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors';

const activeToolbarButton = 'border-[#1C4ED1]/40 bg-[#EEF3FF] text-[#1C4ED1]';

const codeLanguages = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
];

function getLanguageLabel(value: string) {
  return codeLanguages.find((item) => item.value === value)?.label ?? 'Plain text';
}

function normalizeImageWidth(value: unknown) {
  const width = String(value ?? '100').replace('%', '');
  return ['50', '75', '100'].includes(width) ? width : '100';
}

function CodeLanguageDropdown({
  value,
  onChange,
  disabled,
  variant = 'toolbar',
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: 'toolbar' | 'codeblock';
}) {
  const [open, setOpen] = useState(false);
  const isCodeBlock = variant === 'codeblock';

  const buttonClass = isCodeBlock
    ? 'h-7 min-w-[116px] max-w-[136px] rounded-[8px] border border-[#93C5FD]/35 bg-[#0F172A]/90 px-2.5 text-[#BFDBFE] text-[11px] font-extrabold flex items-center justify-between gap-2 hover:border-[#93C5FD] focus:outline-none focus:ring-2 focus:ring-[#93C5FD]/20 disabled:opacity-60'
    : 'h-9 w-[128px] border-l border-[#E3E8F4] bg-white pl-3 pr-2 text-xs font-semibold text-[#040B37] flex items-center justify-between gap-2 outline-none hover:text-[#1C4ED1] disabled:opacity-50';

  const menuClass = isCodeBlock
    ? 'absolute left-0 top-8 z-30 w-[150px] max-h-[212px] overflow-y-auto rounded-[8px] border border-[#93C5FD]/30 bg-[#111827] p-1 shadow-2xl'
    : 'absolute right-0 top-10 z-30 w-[150px] max-h-[220px] overflow-y-auto rounded-[8px] border border-[#D8E1F2] bg-white p-1 shadow-2xl';

  return (
    <div className="relative" onBlur={() => window.setTimeout(() => setOpen(false), 120)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{getLanguageLabel(value)}</span>
        <ChevronDown size={14} className="shrink-0 text-current opacity-70" />
      </button>

      {open && (
        <div className={menuClass} role="listbox">
          {codeLanguages.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`w-full rounded-[8px] px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                  isCodeBlock
                    ? selected ? 'bg-[#1C4ED1] text-white' : 'text-[#DBEAFE] hover:bg-[#1F2937]'
                    : selected ? 'bg-[#EEF3FF] text-[#1C4ED1]' : 'text-[#040B37] hover:bg-[#F4F6FB]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CodeBlockNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const language = typeof node.attrs.language === 'string' && node.attrs.language
    ? node.attrs.language
    : 'plaintext';

  return (
    <NodeViewWrapper className="article-code-block-node" data-language={language}>
      <div contentEditable={false} className="article-code-block-toolbar">
        <CodeLanguageDropdown
          value={language}
          disabled={!editor.isEditable}
          onChange={(nextLanguage) => updateAttributes({ language: nextLanguage })}
          variant="codeblock"
        />
      </div>
      <pre>
        <NodeViewContent as={'code' as 'div'} className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
}

const ArticleImage = TiptapNode.create({
  name: 'articleImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      width: { default: '100' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const width = normalizeImageWidth(HTMLAttributes.width);
    return [
      'figure',
      {
        class: 'article-image-block',
        'data-width': width,
      },
      [
        'img',
        mergeAttributes(HTMLAttributes, {
          style: `width: ${width}%;`,
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

function ImageNodeView({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const width = normalizeImageWidth(node.attrs.width);
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';

  return (
    <NodeViewWrapper className={`article-image-node ${selected ? 'is-selected' : ''}`} data-width={width}>
      {editor.isEditable && (
        <div contentEditable={false} className="article-image-toolbar">
          {['50', '75', '100'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => updateAttributes({ width: value })}
              className={width === value ? 'is-active' : ''}
            >
              {value}%
            </button>
          ))}
        </div>
      )}
      <img src={src} alt={alt} style={{ width: `${width}%` }} />
    </NodeViewWrapper>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(?<!["'=])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inCode = false;
  let codeLines: string[] = [];
  let codeLanguage = 'plaintext';

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      closeList();
      if (inCode) {
        html.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        codeLanguage = 'plaintext';
        inCode = false;
      } else {
        codeLanguage = trimmed.replace(/^```/, '').trim() || 'plaintext';
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s*(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  if (inCode) html.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return html.join('');
}

function sanitizePastedHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allowedTags = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
    'FIGURE', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'UL',
  ]);

  const cleanNode = (node: globalThis.Node): globalThis.Node | null => {
    if (node.nodeType === globalThis.Node.TEXT_NODE) return document.createTextNode(node.textContent ?? '');
    if (node.nodeType !== globalThis.Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const tag = allowedTags.has(element.tagName) ? element.tagName.toLowerCase() : 'p';
    const clean = document.createElement(tag);

    if (tag === 'a') {
      const href = element.getAttribute('href') ?? '';
      if (/^https?:\/\//i.test(href) || href.startsWith('/')) {
        clean.setAttribute('href', href);
        clean.setAttribute('target', '_blank');
        clean.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tag === 'img') {
      const src = element.getAttribute('src') ?? '';
      if (!/^https?:\/\//i.test(src) && !src.startsWith('/')) return null;
      clean.setAttribute('src', src);
      clean.setAttribute('alt', element.getAttribute('alt') ?? '');
      clean.setAttribute('width', normalizeImageWidth(element.getAttribute('width')));
    }

    if (tag === 'pre') {
      const language = element.getAttribute('data-language') ?? element.querySelector('code')?.className.replace(/^language-/, '');
      if (language) clean.setAttribute('data-language', language);
    }

    element.childNodes.forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) clean.appendChild(cleaned);
    });

    return clean;
  };

  const fragment = document.createElement('div');
  doc.body.childNodes.forEach((node) => {
    const cleaned = cleanNode(node);
    if (cleaned) fragment.appendChild(cleaned);
  });

  return normalizeArticleHtml(fragment.innerHTML);
}

function looksLikeMarkdown(value: string) {
  return /(^#{1,3}\s*\S)|(^[-*]\s)|(^\d+\.\s)|(^>\s)|(```)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\(https?:\/\/)/m.test(value);
}

function getPlainText(html: string) {
  if (!html) return '';
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export default function ArticleLessonEditor({ value, onChange, courseId, lessonId, disabled = false }: ArticleLessonEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [editorHtml, setEditorHtml] = useState(() => normalizeArticleHtml(value));
  const [activeSignature, setActiveSignature] = useState(0);
  const [uploadingImage, startImageUpload] = useTransition();

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        languageClassPrefix: 'language-',
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView);
        },
      }),
      ArticleImage,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing this lesson...',
      }),
    ],
    content: normalizeArticleHtml(value) || '<p></p>',
    editorProps: {
      attributes: {
        class: 'article-editor-canvas tiptap-editor min-h-full max-w-[860px] mx-auto p-6 lg:p-10 outline-none',
      },
      handlePaste(view, event) {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        const plain = clipboard.getData('text/plain');
        const html = clipboard.getData('text/html');
        const { state } = view;
        const parent = state.selection.$from.parent;

        if (parent.type.name === 'codeBlock') {
          event.preventDefault();
          editor?.commands.insertContent(plain);
          return true;
        }

        if (plain && looksLikeMarkdown(plain)) {
          event.preventDefault();
          editor?.commands.insertContent(markdownToHtml(plain));
          return true;
        }

        if (html) {
          event.preventDefault();
          editor?.commands.insertContent(sanitizePastedHtml(html));
          return true;
        }

        return false;
      },
    },
    onUpdate({ editor: currentEditor }) {
      const html = normalizeArticleHtml(currentEditor.getHTML());
      setEditorHtml(html);
      onChange(html);
    },
    onSelectionUpdate({ editor: currentEditor }) {
      const language = currentEditor.getAttributes('codeBlock').language;
      if (typeof language === 'string' && language) setCodeLanguage(language);
      setActiveSignature((value) => value + 1);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeArticleHtml(value);
    if (normalized === editorHtml || normalized === normalizeArticleHtml(editor.getHTML())) return;
    editor.commands.setContent(normalized || '<p></p>', { emitUpdate: false });
    setEditorHtml(normalized);
  }, [editor, editorHtml, value]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFullscreen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isFullscreen]);

  const plainText = useMemo(() => getPlainText(editorHtml), [editorHtml]);
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  const isActive = (name: string, attrs?: Record<string, unknown>) => {
    activeSignature;
    return !!editor?.isActive(name, attrs);
  };

  const applyLink = () => {
    if (!editor) return;
    const href = linkHref.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
      setShowLinkEditor(false);
      return;
    }
    const normalizedHref = /^https?:\/\//i.test(href) || href.startsWith('/') ? href : `https://${href}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedHref }).run();
    setShowLinkEditor(false);
    setLinkHref('');
  };

  const openLinkEditor = () => {
    if (!editor || disabled) return;
    const href = editor.getAttributes('link').href;
    setLinkHref(typeof href === 'string' ? href : '');
    setShowLinkEditor((value) => !value);
  };

  const applyCodeLanguage = (language: string) => {
    setCodeLanguage(language);
    if (editor?.isActive('codeBlock')) {
      editor.chain().focus().updateAttributes('codeBlock', { language }).run();
    }
  };

  const toggleCodeBlock = () => {
    editor?.chain().focus().toggleCodeBlock({ language: codeLanguage }).run();
  };

  const transformSelectionText = (variant: 'title' | 'upper' | 'lower' | 'sentence') => {
    if (!editor || disabled) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      toast.info('Highlight text first, then choose a text case.');
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    const transformWord = (word: string) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;

    const nextText =
      variant === 'upper'
        ? selectedText.toUpperCase()
        : variant === 'lower'
          ? selectedText.toLowerCase()
          : variant === 'sentence'
            ? selectedText.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase())
            : selectedText.replace(/\S+/g, transformWord);

    editor.chain().focus().insertContentAt({ from, to }, nextText).run();
  };

  const uploadImage = (file: File | null) => {
    if (!file || !editor || disabled) return;
    startImageUpload(async () => {
      try {
        const formData = new FormData();
        formData.set('file', file);
        const result = await uploadLessonMediaImageAction(courseId, lessonId, formData);
        if (result.error || !result.url) {
          toast.error(result.error ?? 'Image upload failed.');
          return;
        }
        editor.chain().focus().insertContent({
          type: 'articleImage',
          attrs: { src: result.url, alt: file.name, width: '100' },
        }).run();
      } catch {
        toast.error('Image upload failed.');
      } finally {
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    });
  };

  const ModeSwitcher = () => (
    <div className="flex items-center gap-2">
      {([
        { id: 'edit', label: 'Write', icon: PenLine },
        { id: 'split', label: 'Split', icon: Columns2 },
      ] as const).map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`h-9 px-3 rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === item.id ? 'bg-[#1C4ED1] text-white' : 'bg-white border border-[#E3E8F4] text-[#4B5563] hover:text-[#1C4ED1]'
            }`}
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const shell = (
    <div className={`bg-white border border-[#E3E8F4] rounded-[8px] overflow-hidden ${isFullscreen ? 'h-full min-h-0 flex flex-col shadow-2xl' : 'h-[640px] flex flex-col'}`}>
      <div className="flex flex-col gap-3 border-b border-[#E3E8F4] bg-[#F8FAFF] p-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={`${toolbarButton} ${isActive('paragraph') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().setParagraph().run()} title="Paragraph"><Type size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('heading', { level: 1 }) ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('heading', { level: 2 }) ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('bold') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold"><Bold size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('italic') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><Italic size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('bulletList') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('orderedList') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={16} /></button>
            <button type="button" className={`${toolbarButton} ${isActive('blockquote') ? activeToolbarButton : ''}`} disabled={disabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={16} /></button>
            <div className="group relative">
              <button type="button" className={toolbarButton} disabled={disabled} title="Change selected text case">
                <ALargeSmall size={17} />
              </button>
              <div className="invisible absolute left-0 top-10 z-30 w-[180px] rounded-[10px] border border-[#D8E1F2] bg-white p-1.5 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {[
                  { id: 'title', label: 'Title Case' },
                  { id: 'upper', label: 'UPPERCASE' },
                  { id: 'lower', label: 'lowercase' },
                  { id: 'sentence', label: 'Sentence case' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => transformSelectionText(item.id as 'title' | 'upper' | 'lower' | 'sentence')}
                    className="w-full rounded-[8px] px-3 py-2 text-left text-xs font-bold text-[#040B37] transition-colors hover:bg-[#EEF3FF] hover:text-[#1C4ED1]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => uploadImage(event.target.files?.[0] ?? null)}
            />
            <button type="button" className={toolbarButton} disabled={disabled || uploadingImage} onClick={() => imageInputRef.current?.click()} title="Insert image"><ImageIcon size={16} /></button>
            <div className="relative flex items-center rounded-[8px] border border-[#E3E8F4] bg-white">
              <button type="button" className={`h-9 min-w-9 px-2 flex items-center justify-center transition-colors ${isActive('codeBlock') ? 'bg-[#EEF3FF] text-[#1C4ED1]' : 'text-[#4B5563] hover:text-[#1C4ED1]'}`} disabled={disabled} onClick={toggleCodeBlock} title="Code block"><Code2 size={16} /></button>
              <CodeLanguageDropdown
                value={codeLanguage}
                disabled={disabled}
                onChange={applyCodeLanguage}
              />
            </div>
            <div className="relative">
              <button type="button" className={`${toolbarButton} ${isActive('link') ? activeToolbarButton : ''}`} disabled={disabled} onClick={openLinkEditor} title="Link"><LinkIcon size={16} /></button>
              {showLinkEditor && (
                <div className="absolute left-0 top-11 z-20 w-[320px] rounded-[8px] border border-[#E3E8F4] bg-white p-3 shadow-xl flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-mute">Link URL</label>
                  <input
                    value={linkHref}
                    onChange={(event) => setLinkHref(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') applyLink();
                      if (event.key === 'Escape') setShowLinkEditor(false);
                    }}
                    placeholder="https://example.com"
                    className="w-full rounded-[8px] border border-[#E3E8F4] px-3 py-2 text-sm font-medium text-[#040B37] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        editor?.chain().focus().unsetLink().run();
                        setShowLinkEditor(false);
                        setLinkHref('');
                      }}
                      className="px-3 py-2 rounded-[8px] text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                    <button type="button" onClick={() => setShowLinkEditor(false)} className="px-3 py-2 rounded-[8px] text-xs font-semibold text-text-mute hover:bg-[#F4F6FB]">Cancel</button>
                    <button type="button" onClick={applyLink} className="px-3 py-2 rounded-[8px] text-xs font-semibold bg-primary text-white">Apply</button>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className={toolbarButton} disabled={disabled || !editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled || !editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></button>
          </div>

          <div className="flex items-center gap-2">
            <ModeSwitcher />
            {isFullscreen ? (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="h-9 px-3 rounded-[8px] bg-[#040B37] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#060e44] transition-colors"
              >
                <X size={14} />
                Exit fullscreen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className={toolbarButton}
                title="Full view"
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs font-medium text-text-mute">
          Paste from Markdown, Google Docs, Word, or code. CSCN keeps structure and normalizes messy styling. {wordCount} words - {readTime} min read
        </p>
      </div>

      <div className={`grid ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'} flex-1 min-h-0`}>
        <div className={`${mode === 'split' ? 'border-r border-[#E3E8F4]' : ''} min-h-0 overflow-y-auto custom-scrollbar`}>
          <EditorContent editor={editor} />
        </div>

        {mode === 'split' && (
          <div className="bg-white min-h-0 overflow-y-auto custom-scrollbar">
            <div className="max-w-[860px] mx-auto p-6 lg:p-10">
              <ArticleContent body={editorHtml} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isFullscreen) return shell;

  const fullscreen = (
    <div className="fixed inset-0 z-[2147483647] bg-[#F4F6FB] p-3 lg:p-4">
      {shell}
    </div>
  );

  return isMounted ? createPortal(fullscreen, document.body) : null;
}
