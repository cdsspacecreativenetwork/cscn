'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Columns2,
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
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value);

  const normalizedValue = useMemo(() => normalizeArticleHtml(value), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (lastHtmlRef.current === value) return;
    editorRef.current.innerHTML = normalizedValue;
    lastHtmlRef.current = value;
  }, [normalizedValue, value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = normalizeArticleHtml(editorRef.current.innerHTML);
    lastHtmlRef.current = html;
    onChange(html);
  };

  const command = (name: string, commandValue?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    emitChange();
  };

  const formatBlock = (tag: 'p' | 'h1' | 'h2' | 'blockquote' | 'pre') => {
    command('formatBlock', tag);
  };

  const addLink = () => {
    const href = window.prompt('Paste a URL');
    if (!href) return;
    if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) return;
    command('createLink', href);
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
  };

  const shell = (
    <div className={`bg-white border border-[#E3E8F4] rounded-[8px] overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
      <div className="flex flex-col gap-3 border-b border-[#E3E8F4] bg-[#F8FAFF] p-3">
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
            <button type="button" className={toolbarButton} disabled={disabled} onClick={addLink} title="Link"><LinkIcon size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('undo')} title="Undo"><Undo2 size={16} /></button>
            <button type="button" className={toolbarButton} disabled={disabled} onClick={() => command('redo')} title="Redo"><Redo2 size={16} /></button>
          </div>

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
          Paste from Markdown, Google Docs, or Word. CSCN keeps structure and normalizes messy styling.
        </p>
      </div>

      <div className={`grid ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'} ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'border-r border-[#E3E8F4]' : ''} ${isFullscreen ? 'min-h-0 overflow-y-auto' : ''}`}>
            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={emitChange}
              onBlur={emitChange}
              onPaste={handlePaste}
              className={`article-editor-canvas min-h-[440px] p-6 lg:p-8 outline-none ${disabled ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white'}`}
              dangerouslySetInnerHTML={{ __html: normalizedValue || '<p></p>' }}
            />
          </div>
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div className={`bg-white ${isFullscreen ? 'min-h-0 overflow-y-auto' : 'min-h-[440px]'}`}>
            <div className="p-6 lg:p-8">
              <ArticleContent body={value} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isFullscreen) return shell;

  return (
    <div className="fixed inset-0 z-[80] bg-[#F4F6FB] p-4 lg:p-8">
      {shell}
    </div>
  );
}
