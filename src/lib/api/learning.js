import { getDataClient } from './client';
import { pbFilterString } from '../pocketbaseFilter';

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
        const dueReviews = await client.collection(REVIEWS_COLLECTION).getFullList({
            filter: `user = ${pbFilterString(userId)} && next_review <= ${pbFilterString(now)}`,
            fields: 'card_id',
        });
        const unique = new Set((dueReviews || []).map(r => r.card_id));
        return unique.size || 0;
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
        const dueReviews = await client.collection(REVIEWS_COLLECTION).getFullList({
            filter: `user = ${pbFilterString(userId)} && next_review <= ${pbFilterString(now)}`,
            sort: 'next_review',
        });

        // Deduplicate by card_id to avoid showing the same card multiple times in one session
        const deduped = [];
        const seen = new Set();
        for (const review of dueReviews) {
            if (seen.has(review.card_id)) continue;
            seen.add(review.card_id);
            deduped.push(review);
            if (deduped.length >= limit) break;
        }
        return deduped;
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
            filter: `user = ${pbFilterString(userId)} && card_id = ${pbFilterString(cardId)}`,
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
 * Update all due reviews for a specific card to the new SRS schedule
 * Useful to avoid duplicate due entries from older runs
 */
export async function snoozeDueReviewsForCard(userId, cardId, srsData) {
    const client = getDataClient();
    const now = new Date().toISOString();
    const due = await client.collection(REVIEWS_COLLECTION).getFullList({
        filter: `user = ${pbFilterString(userId)} && card_id = ${pbFilterString(cardId)} && next_review <= ${pbFilterString(now)}`,
    });

    for (const review of due) {
        await client.collection(REVIEWS_COLLECTION).update(review.id, {
            interval: srsData.interval,
            repetitions: srsData.repetitions,
            ease_factor: srsData.ease_factor,
            next_review: srsData.next_review,
            rating: srsData.rating ?? review.rating,
        });
    }
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
            filter: `topic = ${pbFilterString(normalizedTopic)} && mode = ${pbFilterString(mode)}`,
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
