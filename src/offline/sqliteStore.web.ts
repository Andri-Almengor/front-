import AsyncStorage from '@react-native-async-storage/async-storage';

export type ResourceKey = 'productos' | 'noticias' | 'eventos' | 'restaurantes' | 'manifest';

const WEB_PREFIX = 'kosher-web-store:';

function key(name: string) {
  return `${WEB_PREFIX}${name}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function safeGet(rawKey: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(rawKey);
  } catch {
    return null;
  }
}

async function safeSet(rawKey: string, value: string | null): Promise<void> {
  try {
    if (value == null) await AsyncStorage.removeItem(rawKey);
    else await AsyncStorage.setItem(rawKey, value);
  } catch {}
}

export async function initOfflineDb() {
  // Web build: no expo-sqlite/wasm. AsyncStorage uses browser storage.
  return;
}

export async function setKv(name: string, value: string | null) {
  await safeSet(key(`kv:${name}`), value);
}

export async function getKv(name: string): Promise<string | null> {
  return safeGet(key(`kv:${name}`));
}

export async function saveResourceSnapshot<T = any>(
  resource: ResourceKey,
  items: T[],
  meta?: { etag?: string | null; lastUpdatedAt?: string | null }
) {
  const payload = {
    payload: Array.isArray(items) ? items : [],
    etag: meta?.etag ?? null,
    lastUpdatedAt: meta?.lastUpdatedAt ?? null,
    savedAt: nowIso(),
    itemCount: Array.isArray(items) ? items.length : 0,
  };
  await safeSet(key(`resource:${resource}`), JSON.stringify(payload));
}

export async function getResourceSnapshot<T = any>(resource: ResourceKey): Promise<{
  value: T[];
  etag: string | null;
  lastUpdatedAt: string | null;
  savedAt: string | null;
  itemCount: number;
} | null> {
  const raw = await safeGet(key(`resource:${resource}`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      value: Array.isArray(parsed?.payload) ? parsed.payload : [],
      etag: parsed?.etag ?? null,
      lastUpdatedAt: parsed?.lastUpdatedAt ?? null,
      savedAt: parsed?.savedAt ?? null,
      itemCount: Number(parsed?.itemCount ?? 0),
    };
  } catch {
    return null;
  }
}

export async function getResourceItems<T = any>(resource: ResourceKey): Promise<T[]> {
  return (await getResourceSnapshot<T>(resource))?.value ?? [];
}

export async function saveI18nDict(lang: 'es' | 'en', dict: Record<string, string>, etag?: string | null) {
  await safeSet(key(`i18n:${lang}`), JSON.stringify({ payload: dict ?? {}, etag: etag ?? null, savedAt: nowIso() }));
}

export async function getI18nDict(lang: 'es' | 'en'): Promise<{ dict: Record<string, string>; etag: string | null } | null> {
  const raw = await safeGet(key(`i18n:${lang}`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return { dict: parsed?.payload ?? {}, etag: parsed?.etag ?? null };
  } catch {
    return null;
  }
}

export async function purgeOfflineCache(opts?: { keepI18n?: boolean }) {
  const keepI18n = opts?.keepI18n ?? true;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) =>
      k.startsWith(key('resource:')) ||
      k.startsWith(key('kv:')) ||
      (!keepI18n && k.startsWith(key('i18n:')))
    );
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {}
}
