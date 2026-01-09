import { getDataClient } from './client';
import { pbFilterString } from '../pocketbaseFilter';

const TIMELINES_COLLECTION = 'timelines';

const pick = (obj, keys) => {
  const out = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
};

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
    return await client.collection(TIMELINES_COLLECTION).create(data);
  } catch (error) {
    // Backward-compatible fallback for older PocketBase schemas (e.g. before slug/public/viewCount).
    if (error?.status !== 400 || !data || typeof data !== 'object') throw error;

    const attempts = [
      // Drop any newer/unknown fields first.
      pick(data, ['user', 'title', 'content', 'style', 'slug', 'public', 'viewCount']),
      // Older schema without sharing fields.
      pick(data, ['user', 'title', 'content', 'style']),
      // Minimal schema.
      pick(data, ['user', 'title', 'content']),
    ];

    const originalKeys = Object.keys(data).sort().join(',');
    const attemptedKeySigs = new Set([originalKeys]);
    let lastError = error;
    const summarizePayload = (payload) => ({
      keys: Object.keys(payload),
      contentLength: typeof payload?.content === 'string' ? payload.content.length : undefined,
    });

    for (const attempt of attempts) {
      const keySig = Object.keys(attempt).sort().join(',');
      if (!keySig || attemptedKeySigs.has(keySig)) continue;
      attemptedKeySigs.add(keySig);

      if (import.meta.env.DEV) {
        console.warn('PocketBase create failed; retrying with reduced payload.', {
          original: summarizePayload(data),
          attempt: summarizePayload(attempt),
        });
      }

      try {
        return await client.collection(TIMELINES_COLLECTION).create(attempt);
      } catch (nextError) {
        lastError = nextError;
      }
    }

    const hasValidation = (err) => {
      const response = err?.response || err?.data;
      return response?.data && typeof response.data === 'object' && Object.keys(response.data).length > 0;
    };
    throw hasValidation(lastError) || !hasValidation(error) ? lastError : error;
  }
}

export async function updateTimeline(timelineId, data) {
  const client = getDataClient();
  try {
    return await client.collection(TIMELINES_COLLECTION).update(timelineId, data);
  } catch (error) {
    // Backward-compatible fallback for older PocketBase schemas.
    if (error?.status !== 400 || !data || typeof data !== 'object') throw error;

    const attempts = [
      pick(data, ['title', 'content', 'style', 'slug', 'public', 'viewCount', 'user']),
      pick(data, ['title', 'content', 'style']),
      pick(data, ['title', 'content']),
    ];

    const originalKeys = Object.keys(data).sort().join(',');
    const attemptedKeySigs = new Set([originalKeys]);
    let lastError = error;
    const summarizePayload = (payload) => ({
      keys: Object.keys(payload),
      contentLength: typeof payload?.content === 'string' ? payload.content.length : undefined,
    });

    for (const attempt of attempts) {
      const keySig = Object.keys(attempt).sort().join(',');
      if (!keySig || attemptedKeySigs.has(keySig)) continue;
      attemptedKeySigs.add(keySig);

      if (import.meta.env.DEV) {
        console.warn('PocketBase update failed; retrying with reduced payload.', {
          original: summarizePayload(data),
          attempt: summarizePayload(attempt),
        });
      }

      try {
        return await client.collection(TIMELINES_COLLECTION).update(timelineId, attempt);
      } catch (nextError) {
        lastError = nextError;
      }
    }

    const hasValidation = (err) => {
      const response = err?.response || err?.data;
      return response?.data && typeof response.data === 'object' && Object.keys(response.data).length > 0;
    };
    throw hasValidation(lastError) || !hasValidation(error) ? lastError : error;
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
