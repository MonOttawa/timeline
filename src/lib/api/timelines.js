import { getDataClient } from './client';
import { pbFilterString } from '../pocketbaseFilter';

const TIMELINES_COLLECTION = 'timelines';

export async function listTimelinesByUser(userId, { page = 1, perPage = 50, sort = '-title' } = {}) {
  if (!userId) return { items: [], totalItems: 0, totalPages: 0 };
  const client = getDataClient();
  const normalizedSort = sort?.startsWith('+') ? sort.slice(1) : sort;
  try {
    const records = await client.collection(TIMELINES_COLLECTION).getList(page, perPage, {
      sort: normalizedSort,
      filter: `user = ${pbFilterString(userId)}`,
      requestKey: null, // Disable auto-cancellation
    });
    return records;
  } catch {
    // Fallback: drop sort if PocketBase rejects the query (e.g., invalid sort field).
    const records = await client.collection(TIMELINES_COLLECTION).getList(page, perPage, {
      filter: `user = ${pbFilterString(userId)}`,
      requestKey: null, // Disable auto-cancellation
    });
    return records;
  }
}

export async function deleteTimeline(timelineId) {
  const client = getDataClient();
  return client.collection(TIMELINES_COLLECTION).delete(timelineId);
}

export async function createTimeline(data) {
  const client = getDataClient();
  try {
    // requestKey: null ensures we don't auto-cancel strictly
    return await client.collection(TIMELINES_COLLECTION).create(data, { requestKey: null });
  } catch (err) {
    // Retry with minimal payload on 400 to handle schema strictness issues (e.g. extra fields)
    if (err.status === 400) {
      try {
        console.warn('Create failed, retrying with minimal payload...');
        const minimal = {
          user: data.user,
          title: data.title,
          content: data.content
        };
        return await client.collection(TIMELINES_COLLECTION).create(minimal, { requestKey: null });
      } catch (retryErr) {
        console.warn('Minimal retry also failed', retryErr);
      }
    }

    if (import.meta.env.DEV) {
      console.error('[createTimeline] Error:', err);
      try { console.error('[createTimeline] Data:', JSON.stringify(data)); } catch (e) {}
      if (err.response) {
         try { console.error('[createTimeline] Response:', JSON.stringify(err.response)); } catch (e) {}
      }
    }
    throw err;
  }
}

export async function updateTimeline(timelineId, data) {
  const client = getDataClient();
  try {
    return await client.collection(TIMELINES_COLLECTION).update(timelineId, data, { requestKey: null });
  } catch (err) {
    // Retry with minimal payload
    if (err.status === 400) {
      try {
        console.warn('Update failed, retrying with minimal payload...');
        const minimal = {
          title: data.title,
          content: data.content
        };
        // Only include user if present (usually not needed for update but good for safety)
        if (data.user) minimal.user = data.user;
        
        return await client.collection(TIMELINES_COLLECTION).update(timelineId, minimal, { requestKey: null });
      } catch (retryErr) {
        console.warn('Minimal update retry also failed', retryErr);
      }
    }

    if (import.meta.env.DEV) {
      console.error('[updateTimeline] Error:', err);
      try { console.error('[updateTimeline] Data:', JSON.stringify(data)); } catch (e) {}
      if (err.response) {
         try { console.error('[updateTimeline] Response:', JSON.stringify(err.response)); } catch (e) {}
      }
    }
    throw err;
  }
}

export async function findTimelineByTitle(userId, title) {
  if (!userId || !title) return null;
  const client = getDataClient();
  const records = await client.collection(TIMELINES_COLLECTION).getList(1, 1, {
    filter: `user = ${pbFilterString(userId)} && title = ${pbFilterString(title)}`,
  });
  return records.items.length > 0 ? records.items[0] : null;
}

export async function getPublicTimeline(slug, recordId = null) {
  const client = getDataClient();
  try {
    const safeSlug = typeof slug === 'string' ? slug : '';
    const timeline = await client
      .collection(TIMELINES_COLLECTION)
      .getFirstListItem(`slug=${pbFilterString(safeSlug)} && public=true`);
    return timeline;
  } catch (error) {
    console.warn('Public timeline lookup by slug failed, trying fallbacks', error);
    if (recordId) {
      try {
        const timeline = await client.collection(TIMELINES_COLLECTION).getOne(recordId);
        if (timeline.public) return timeline;
        throw new Error('Timeline is not public');
      } catch {
        // fall through
      }
    } else if (slug) {
      try {
        const timeline = await client.collection(TIMELINES_COLLECTION).getOne(slug);
        if (timeline.public) return timeline;
      } catch {
        // ignore
      }
    }
    throw new Error('Timeline not found');
  }
}

export async function incrementViewCount(timelineId) {
  const client = getDataClient();
  try {
    const timeline = await client.collection(TIMELINES_COLLECTION).getOne(timelineId);
    await client.collection(TIMELINES_COLLECTION).update(timelineId, {
      viewCount: (timeline.viewCount || 0) + 1,
    });
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}
