import Axios from 'axios';

const CACHE_KEY = 'avatarCacheV1';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCache = (cache) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const getCachedAvatar = (id) => {
  const cache = loadCache();
  const entry = cache[id];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > EXPIRY_MS) {
    delete cache[id];
    saveCache(cache);
    return null;
  }
  return entry.url;
};

export const cacheAvatar = (id, url) => {
  const cache = loadCache();
  cache[id] = { url, timestamp: Date.now() };
  saveCache(cache);
};

export const fetchAvatars = async (ids) => {
  if (!ids.length) return {};
  const res = await Axios.get('/api/users/avatars', {
    params: { ids: ids.join(',') },
  });
  const avatars = res.data.avatars || {};
  Object.entries(avatars).forEach(([id, url]) => cacheAvatar(id, url));
  return avatars;
};
