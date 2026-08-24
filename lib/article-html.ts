import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "br", "strong", "em", "s", "blockquote", "ul", "ol", "li",
  "h2", "h3", "h4", "a", "code", "pre", "hr",
];

export function sanitizeArticleHtml(value: string | null | undefined) {
  if (!value?.trim()) return "";

  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  });
}
