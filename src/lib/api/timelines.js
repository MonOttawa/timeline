import { getDataClient } from './client';

const TIMELINES_COLLECTION = 'timelines';

export async function listTimelinesByUser(userId, { page = 1, perPage = 50, sort = '-title' } = {}) {
  if (!userId) return { items: [], totalItems: 0, totalPages: 0 };
  const client = getDataClient();
  try {
    const records = await client.collection(TIMELINES_COLLECTION).getList(page, perPage, {
      sort: sort,
      filter: `user = "${userId}"`,
      // Ask for system fields explicitly so created/updated are available
      fields: '*,created,updated',
      requestKey: null, // Disable auto-cancellation
    });
    return records;
  } catch {
    // Fallback: drop sort if PocketBase rejects the query (e.g., invalid sort field).
    const records = await client.collection(TIMELINES_COLLECTION).getList(page, perPage, {
      filter: `user = "${userId}"`,
      fields: '*,created,updated',
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
  const now = new Date().toISOString();
  return client.collection(TIMELINES_COLLECTION).create({
    updated: now,
    ...data,
  });
}

export async function updateTimeline(timelineId, data) {
  const client = getDataClient();
  const now = new Date().toISOString();
  return client.collection(TIMELINES_COLLECTION).update(timelineId, {
    updated: now,
    ...data,
  });
}

export async function findTimelineByTitle(userId, title) {
  const client = getDataClient();
  const safeTitle = title.replace(/"/g, '\\"');
  const records = await client.collection(TIMELINES_COLLECTION).getList(1, 1, {
    filter: `user = "${userId}" && title = "${safeTitle}"`,
  });
  return records.items.length > 0 ? records.items[0] : null;
}

export async function getPublicTimeline(slug, recordId = null) {
  const client = getDataClient();
  try {
    const safeSlug = slug?.replace(/"/g, '\\"') || '';
    const timeline = await client
      .collection(TIMELINES_COLLECTION)
      .getFirstListItem(`slug="${safeSlug}" && public=true`);
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
