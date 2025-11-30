import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(pocketbaseUrl)

/**
 * Get public timeline by slug
 * @param {string} slug - Timeline slug
 * @param {string|null} recordId - Optional record id fallback
 * @returns {Promise<Object>} - Timeline record
 */
export async function getPublicTimeline(slug, recordId = null) {
    try {
        // Try to find by slug first
        const safeSlug = slug?.replace(/"/g, '\\"') || '';
        const timeline = await pb.collection('timelines').getFirstListItem(`slug="${safeSlug}" && public=true`);
        return timeline;
    } catch (error) {
        // If not found by slug, try by ID (fallback)
        if (recordId) {
            try {
                const timeline = await pb.collection('timelines').getOne(recordId);
                if (timeline.public) {
                    return timeline;
                }
                throw new Error('Timeline is not public');
            } catch {
                // fall through to final error
            }
        } else if (slug) {
            // Last resort: treat slug as an ID
            try {
                const timeline = await pb.collection('timelines').getOne(slug);
                if (timeline.public) {
                    return timeline;
                }
            } catch {
                // ignore
            }
        }
        throw new Error('Timeline not found');
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
