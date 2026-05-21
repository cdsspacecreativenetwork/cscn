'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Columns2,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  PenLine,
  Quote,
  Redo2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { ArticleContent, normalizeArticleHtml } from '@/components/dashboard/courses/ArticleContent';

type Mode = 'edit' | 'preview' | 'split';

interface ArticleLessonEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const toolbarButton =
  'h-9 min-w-9 px-2 rounded-[8px] border border-[#E3E8F4] bg-white text-[#4B5563] hover:text-[#1C4ED1] hover:border-[#1C4ED1]/30 hover:bg-[#F4F6FB] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors';

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
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
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

    if (trimmed.startsWith('### ')) {
      closeList();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      closeList();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      closeList();
      html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
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
  if (inCode) html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return html.join('');
}

function sanitizePastedHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allowedTags = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
    'I', 'LI', 'OL', 'P', 'PRE', 'STRONG', 'UL',
  ]);

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? '');
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

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
  return /(^#{1,3}\s)|(^[-*]\s)|(^\d+\.\s)|(^>\s)|(```)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\(https?:\/\/)/m.test(value);
}

export default function ArticleLessonEditor({ value, onChange, disabled = false }: ArticleLessonEditorProps) {
  const [mode, setMode] = useState<Mode>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef('');

  const normalizedValue = useMemo(() => normalizeArticleHtml(value), [value]);
  const plainText = useMemo(() => {
    if (!value) return '';
    const documentText = typeof window === 'undefined'
      ? value.replace(/<[^>]*>/g, ' ')
      : new DOMParser().parseFromString(normalizeArticleHtml(value), 'text/html').body.textContent ?? '';
    return documentText.replace(/\s+/g, ' ').trim();
  }, [value]);
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (lastHtmlRef.current && editorRef.current.innerHTML.trim()) return;
    editorRef.current.innerHTML = normalizedValue || '<p></p>';
    lastHtmlRef.current = normalizedValue;
  }, [normalizedValue]);

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

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = normalizeArticleHtml(editorRef.current.innerHTML);
    lastHtmlRef.current = html;
    onChange(html);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = savedSelectionRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const command = (name: string, commandValue?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(name, false, commandValue);
    emitChange();
    saveSelection();
  };

  const formatBlock = (tag: 'p' | 'h1' | 'h2' | 'blockquote' | 'pre') => {
    command('formatBlock', tag);
  };

  const openLinkEditor = () => {
    if (disabled) return;
    saveSelection();
    const selection = window.getSelection();
    const selectedNode = selection?.anchorNode?.parentElement;
    const anchor = selectedNode?.closest('a');
    setLinkHref(anchor?.getAttribute('href') ?? '');
    setShowLinkEditor((value) => !value);
  };

  const applyLink = () => {
    const href = linkHref.trim();
    if (!href) return;
    const normalizedHref = /^https?:\/\//i.test(href) || href.startsWith('/') ? href : `https://${href}`;
    command('createLink', normalizedHref);
    setShowLinkEditor(false);
    setLinkHref('');
  };

  const removeLink = () => {
    command('unlink');
    setShowLinkEditor(false);
    setLinkHref('');
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();

    const markdown = event.clipboardData.getData('text/plain');
    const html = event.clipboardData.getData('text/html');
    const insert = markdown && looksLikeMarkdown(markdown)
      ? markdownToHtml(markdown)
      : html
        ? sanitizePastedHtml(html)
        : markdownToHtml(markdown);

    document.execCommand('insertHTML', false, insert);
    emitChange();
    saveSelection();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;

    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      command('undo');
      return;
    }

    if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      command('redo');
    }
  };

  const ModeSwitcher = () => (
    <div className="flex items-center gap-2">
      {([
        { id: 'edit', label: 'Edit', icon: PenLine },
        { id: 'preview', label: 'Preview', icon: Eye },
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
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => formatBlock('p')} title="Paragraph"><Type size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => formatBlock('h1')} title="Heading 1"><Heading1 size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => formatBlock('h2')} title="Heading 2"><Heading2 size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('bold')} title="Bold"><Bold size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('italic')} title="Italic"><Italic size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('insertUnorderedList')} title="Bullet list"><List size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('insertOrderedList')} title="Numbered list"><ListOrdered size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => formatBlock('blockquote')} title="Quote"><Quote size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => formatBlock('pre')} title="Code block"><Code2 size={16} /></button>
            <div className="relative">
              <button type="button" className={toolbarButton} disabled={disabled} onMouseDown={saveSelection} onClick={openLinkEditor} title="Link"><LinkIcon size={16} /></button>
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
                    <button type="button" onClick={removeLink} className="px-3 py-2 rounded-[8px] text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                    <button type="button" onClick={() => setShowLinkEditor(false)} className="px-3 py-2 rounded-[8px] text-xs font-semibold text-text-mute hover:bg-[#F4F6FB]">Cancel</button>
                    <button type="button" onClick={applyLink} className="px-3 py-2 rounded-[8px] text-xs font-semibold bg-primary text-white">Apply</button>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('undo')} title="Undo"><Undo2 size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('redo')} title="Redo"><Redo2 size={16} /></button>
          </div>

          <div className="flex items-center gap-2">
            <ModeSwitcher />
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className={toolbarButton}
              title={isFullscreen ? 'Exit full view' : 'Full view'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
        <p className="text-xs font-medium text-text-mute">
          Paste from Markdown, Google Docs, or Word. CSCN keeps structure and normalizes messy styling. {wordCount} words · {readTime} min read
        </p>
      </div>

      <div className={`grid ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'} flex-1 min-h-0`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'border-r border-[#E3E8F4]' : ''} min-h-0 overflow-y-auto custom-scrollbar`}>
            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={emitChange}
              onBlur={emitChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              className={`article-editor-canvas min-h-full max-w-[860px] mx-auto p-6 lg:p-10 outline-none ${disabled ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white'}`}
            />
          </div>
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div className="bg-white min-h-0 overflow-y-auto custom-scrollbar">
            <div className="max-w-[860px] mx-auto p-6 lg:p-10">
              <ArticleContent body={value} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isFullscreen) return shell;

  const fullscreen = (
    <div className="fixed inset-0 z-[2147483647] bg-[#F4F6FB] p-4 lg:p-6 flex flex-col gap-4">
      <div className="shrink-0 bg-white border border-[#E3E8F4] rounded-[8px] px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-[8px] bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
              Article
            </span>
            <span className="text-xs font-semibold text-text-mute">Esc to exit</span>
          </div>
          <p className="text-base font-bold text-[#040B37] truncate mt-1">Article lesson editor</p>
          <p className="text-xs font-medium text-text-mute">{wordCount} words · {readTime} min read</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeSwitcher />
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="h-9 px-3 rounded-[8px] bg-[#040B37] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#060e44] transition-colors"
          >
            <X size={14} />
            Exit fullscreen
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {shell}
      </div>
    </div>
  );

  return isMounted ? createPortal(fullscreen, document.body) : null;
}
