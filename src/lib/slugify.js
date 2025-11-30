/**
 * Convert text to URL-safe slug
 * @param {string} text - Text to slugify
 * @returns {string} - URL-safe slug
 */
export function slugify(text) {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w\-]+/g, '')       // Remove non-word chars (except hyphens)
        .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')             // Trim hyphens from start
        .replace(/-+$/, '');            // Trim hyphens from end
}

/**
 * Generate unique slug by appending random string if needed
 * @param {string} baseSlug - Base slug to make unique
 * @returns {string} - Unique slug
 */
export function makeUniqueSlug(baseSlug) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
}
