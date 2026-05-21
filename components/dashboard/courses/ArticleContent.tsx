'use client';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function normalizeArticleHtml(value: string | null) {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const html = looksLikeHtml ? trimmed : textToHtml(trimmed);

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '');
}

export function ArticleContent({ body }: { body: string | null }) {
  const html = normalizeArticleHtml(body);

  if (!html) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#E3E8F4] bg-[#F4F6FB] p-8 text-center text-sm font-medium text-text-mute">
        This article lesson does not have content yet.
      </div>
    );
  }

  return (
    <article
      className="article-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
