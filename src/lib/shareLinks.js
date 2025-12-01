/**
 * Build a shareable timeline URL with optional style override and embed flag.
 * @param {Object} opts
 * @param {string} [opts.slug] - Preferred slug path.
 * @param {string} [opts.id] - Fallback record id (also emitted as `rid` param).
 * @param {string} [opts.style] - Optional style override query param.
 * @param {boolean} [opts.embed=false] - Whether to include embed=1.
 * @param {string} [opts.appUrl] - Base URL override; defaults to VITE_APP_URL or window origin.
 * @returns {string}
 */
export function buildShareUrl({ slug, id, style, embed = false, appUrl } = {}) {
  const base =
    (appUrl || import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '') || '')
      .replace(/\/$/, '');

  if (!base || (!slug && !id)) return '';

  const path = `${base}/timeline/${slug || id}`;
  const params = new URLSearchParams();

  if (id && !slug) params.set('rid', id);
  if (style) params.set('style', style);
  if (embed) params.set('embed', '1');

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
