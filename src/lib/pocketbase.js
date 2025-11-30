import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(pocketbaseUrl)

/**
 * Get public timeline by slug
 * @param {string} slug - Timeline slug
 * @returns {Promise<Object>} - Timeline record
 */
export async function getPublicTimeline(slug) {
    try {
        // Try to find by slug first
        const timeline = await pb.collection('timelines').getFirstListItem(`slug="${slug}" && public=true`);
        return timeline;
    } catch (error) {
        // If not found by slug, try by ID (fallback)
        try {
            const timeline = await pb.collection('timelines').getOne(slug);
            if (timeline.public) {
                return timeline;
            }
            throw new Error('Timeline is not public');
        } catch {
            throw new Error('Timeline not found');
        }
    }
}

/**
 * Increment view count for a timeline
 * @param {string} timelineId - Timeline ID
 */
export async function incrementViewCount(timelineId) {
    try {
        const timeline = await pb.collection('timelines').getOne(timelineId);
        await pb.collection('timelines').update(timelineId, {
            viewCount: (timeline.viewCount || 0) + 1
        });
    } catch (error) {
        console.error('Failed to increment view count:', error);
    }
}

