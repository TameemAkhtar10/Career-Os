import { getRedis } from "../config/redis.js";

// ── Internal helper ───────────────────────────────────────────────────────────

const client = () => getRedis(); // re-evaluated on each call so lazy init works

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Get a cached JSON value. Returns null on miss, Redis error, or when
 * Redis is unavailable.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  try {
    const r = client();
    if (!r) return null;
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null; // swallow — caching is best-effort
  }
};

/**
 * Store a JSON-serialised value with a TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
export const setCache = async (key, value, ttlSeconds) => {
  try {
    const r = client();
    if (!r) return;
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // swallow
  }
};

/**
 * Delete a single key.
 * @param {string} key
 */
export const delCache = async (key) => {
  try {
    const r = client();
    if (!r) return;
    await r.del(key);
  } catch {
    // swallow
  }
};

/**
 * Delete all keys matching a prefix using SCAN (never KEYS).
 * Safe on large keyspaces.
 * @param {string} prefix  e.g. "user:", "jobs:"
 */
export const delByPrefix = async (prefix) => {
  try {
    const r = client();
    if (!r) return;

    let cursor = "0";
    do {
      const [nextCursor, keys] = await r.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length) await r.del(...keys);
    } while (cursor !== "0");
  } catch {
    // swallow
  }
};

/*
 * ── Cache-invalidation convention ────────────────────────────────────────────
 *
 * Key namespaces (add to this list as features grow):
 *
 *   user:<id>          → cached User document (TTL 5 min)
 *                        Invalidated by: login, logout, verify-email, reset-password,
 *                        any profile/settings update.
 *
 *   jobs:<id>          → single job listing (future)
 *                        Invalidated by: job create/update/delete.
 *
 *   jobs:list:*        → paginated job list queries (future)
 *                        Use delByPrefix("jobs:list:") on any job mutation.
 *
 *   company:<id>       → company profile (future)
 *                        Invalidated by: company profile update.
 *
 *   applications:<id>  → single application (future)
 *
 * Rules:
 *   - NEVER cache OTPs, tokens, passwords, or any secret.
 *   - Every write endpoint MUST call delCache/delByPrefix for its key namespace.
 *   - Public read-heavy lists (jobs, companies) are the primary cache targets.
 *   - User-specific data is cached per user-id, never shared across users.
 */
