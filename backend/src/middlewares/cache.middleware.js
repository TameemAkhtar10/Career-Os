import { getCache, setCache } from "../utils/cache.js";

/**
 * Cache middleware for GET routes.
 *
 * @param {{ ttl: number, keyBuilder?: (req) => string }} options
 *   ttl         - seconds to cache the response
 *   keyBuilder  - optional fn to derive the cache key from req.
 *                 Defaults to "cache:" + req.originalUrl.
 *                 For user-specific routes pass: (req) => `cache:${req.originalUrl}:${req.user?._id}`
 */
const cacheResponse = ({ ttl, keyBuilder } = {}) =>
  async (req, res, next) => {
    const key = keyBuilder ? keyBuilder(req) : `cache:${req.originalUrl}`;

    // ── Cache HIT ────────────────────────────────────────────────────────────
    const cached = await getCache(key);
    if (cached !== null) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    // ── Cache MISS — intercept res.json to store the response ────────────────
    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        setCache(key, body, ttl); // fire-and-forget; errors swallowed inside setCache
      }
      return originalJson(body);
    };

    next();
  };

export default cacheResponse;
