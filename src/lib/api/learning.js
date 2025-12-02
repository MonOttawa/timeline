import { getDataClient } from './client';

const REVIEWS_COLLECTION = 'flashcard_reviews';
const CACHE_COLLECTION = 'learning_cache';

/**
 * Get the count of flashcards due for review
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export async function getDueFlashcardsCount(userId) {
    if (!userId) return 0;
    const client = getDataClient();
    const now = new Date().toISOString();
    try {
        const dueReviews = await client.collection(REVIEWS_COLLECTION).getList(1, 1, {
            filter: `user = "${userId}" && next_review <= "${now}"`,
        });
        return dueReviews.totalItems || 0;
    } catch (e) {
        console.warn('Failed to fetch due cards count', e);
        return 0;
    }
}

/**
 * Get flashcards due for review
 * @param {string} userId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getDueFlashcards(userId, limit = 50) {
    if (!userId) return [];
    const client = getDataClient();
    const now = new Date().toISOString();
    try {
        const dueReviews = await client.collection(REVIEWS_COLLECTION).getList(1, limit, {
            filter: `user = "${userId}" && next_review <= "${now}"`,
            sort: 'next_review'
        });
        return dueReviews.items;
    } catch (e) {
        console.error('Error fetching due cards:', e);
        throw e;
    }
}

/**
 * Get the last review for a specific card
 * @param {string} userId 
 * @param {string} cardId 
 * @returns {Promise<Object|null>}
 */
export async function getLastReview(userId, cardId) {
    const client = getDataClient();
    try {
        const existingReviews = await client.collection(REVIEWS_COLLECTION).getList(1, 1, {
            filter: `user = "${userId}" && card_id = "${cardId}"`,
            sort: '-created'
        });
        return existingReviews.items.length > 0 ? existingReviews.items[0] : null;
    } catch (e) {
        console.warn('Could not fetch previous review', e);
        return null;
    }
}

/**
 * Create a new flashcard review record
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function createFlashcardReview(data) {
    const client = getDataClient();
    return client.collection(REVIEWS_COLLECTION).create(data);
}

/**
 * Update an existing flashcard review record
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function updateFlashcardReview(id, data) {
    const client = getDataClient();
    return client.collection(REVIEWS_COLLECTION).update(id, data);
}

/**
 * Check the learning cache for a topic and mode
 * @param {string} topic 
 * @param {string} mode 
 * @returns {Promise<string|null>} content
 */
export async function checkLearningCache(topic, mode) {
    const client = getDataClient();
    try {
        const normalizedTopic = topic.trim().toLowerCase();
        const records = await client.collection(CACHE_COLLECTION).getList(1, 1, {
            filter: `topic = "${normalizedTopic}" && mode = "${mode}"`,
            sort: '-created'
        });

        if (records.items.length > 0) {
            return records.items[0].content;
        }
    } catch (err) {
        console.warn('Cache lookup failed:', err);
    }
    return null;
}

/**
 * Save content to the learning cache
 * @param {string} topic 
 * @param {string} mode 
 * @param {string} content 
 */
export async function saveLearningCache(topic, mode, content) {
    const client = getDataClient();
    try {
        const normalizedTopic = topic.trim().toLowerCase();
        await client.collection(CACHE_COLLECTION).create({
            topic: normalizedTopic,
            mode: mode,
            content: content
        });
    } catch (err) {
        console.warn('Failed to save to cache:', err);
    }
}
