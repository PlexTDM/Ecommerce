import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "div",
  "blockquote",
  "h2",
  "h3",
  "h4",
  "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"];

/**
 * Sanitizes scraped/admin-authored product description HTML before it is
 * rendered with `dangerouslySetInnerHTML`.
 */
export const sanitizeProductHtml = (html: string | undefined): string => {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
};
