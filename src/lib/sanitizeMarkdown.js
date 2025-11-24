import DOMPurify from 'dompurify';

const sanitize = (dirtyHtml) => {
  if (!dirtyHtml) return '';
  if (typeof window === 'undefined') return dirtyHtml;

  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
};

export const sanitizeMarkdownHtml = (dirtyHtml) => sanitize(dirtyHtml);
