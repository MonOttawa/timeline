import DOMPurify from 'dompurify';

let hooksInstalled = false;

const ensurePurifyHooks = () => {
  if (hooksInstalled) return;
  if (typeof window === 'undefined') return;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Prevent reverse tabnabbing when user content includes target="_blank" links.
    const target = node.getAttribute('target');
    if (node.tagName === 'A' && target && target.toLowerCase() === '_blank') {
      const rel = (node.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      node.setAttribute('rel', rel.join(' '));
    }
  });

  hooksInstalled = true;
};

const sanitize = (dirtyHtml) => {
  if (!dirtyHtml) return '';
  if (typeof window === 'undefined') return dirtyHtml;

  ensurePurifyHooks();

  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
};

export const sanitizeMarkdownHtml = (dirtyHtml) => sanitize(dirtyHtml);
