import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../services/token.service.js";
import { ACCESS_COOKIE } from "../services/token.service.js";
import { getCache, setCache } from "../utils/cache.js";
import { User } from "../models/user.model.js";

const USER_CACHE_TTL = 5 * 60; // 5 minutes

/**
 * Protect routes: reads accessToken from httpOnly cookie,
 * verifies it, hydrates req.user from cache or DB.
 */
export const protect = async (req, _res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return next(new ApiError(401, "Authentication required."));

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new ApiError(401, "Invalid or expired access token."));
    }

    const userId = payload.sub;

    // Try cache first
    const cacheKey = `user:${userId}`;
    let user = await getCache(cacheKey);

    if (!user) {
      user = await User.findById(userId).lean();
      if (!user) return next(new ApiError(401, "User not found."));
      await setCache(cacheKey, user, USER_CACHE_TTL);
    }

    req.user = user; // full user object (no password — select:false)
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize routes by role.
 * Must be used AFTER protect middleware.
 * @param {...string} roles
 */
export const authorizeRoles = (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };

/**
 * Optional authentication middleware:
 * Populates req.user if a valid access token cookie is present.
 * Treats missing, invalid, or expired access cookies as an unauthenticated
 * public viewer (never throws 401).
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return next();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      // Invalid or expired token: proceed as public viewer (no 401)
      return next();
    }

    const userId = payload.sub;
    const cacheKey = `user:${userId}`;
    let user = await getCache(cacheKey);

    if (!user) {
      user = await User.findById(userId).lean();
      if (user) {
        await setCache(cacheKey, user, USER_CACHE_TTL);
      }
    }

    if (user) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
