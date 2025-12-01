import { getDataClient } from './client';

const TIMELINES_COLLECTION = 'timelines';

export async function listTimelinesByUser(userId) {
  if (!userId) return [];
  const client = getDataClient();
  const records = await client.collection(TIMELINES_COLLECTION).getList(1, 50, {
    sort: '-updated',
    filter: `user = "${userId}"`,
    fields: '*',
  });
  return records.items || [];
}

export async function deleteTimeline(timelineId) {
  const client = getDataClient();
  return client.collection(TIMELINES_COLLECTION).delete(timelineId);
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
