import Redis from "ioredis";
import { env } from "./env.js";

let _client = null;
let _warned = false;

/**
 * Returns a connected ioredis client, or null if Redis is unavailable.
 * The app continues normally without caching when this returns null.
 */
export const getRedis = () => {
  // Already connected
  if (_client) return _client;

  // No URL configured
  if (!env.REDIS_URL) {
    if (!_warned) {
      console.warn("[redis] REDIS_URL not set — caching disabled, using in-memory rate limiting.");
      _warned = true;
    }
    return null;
  }

  _client = new Redis(env.REDIS_URL, {
    connectTimeout: 3000,   // 3s to establish connection
    commandTimeout: 2000,   // 2s per command
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false, // drop commands immediately if not connected
  });

  _client.on("connect", () => console.log("[redis] Connected"));

  _client.on("error", (err) => {
    // Log once per unique error message to avoid log spam
    if (!_warned) {
      console.warn(`[redis] Connection error — caching disabled: ${err.message}`);
      _warned = true;
    }
  });

  _client.on("reconnecting", () => {
    _warned = false; // allow one new warning on reconnect
  });

  // Non-blocking initial connection
  _client.connect().catch(() => {
    // handled by the "error" event above
  });

  return _client;
};
