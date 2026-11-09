import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRateLimitStore } from "../config/redis.js";
import validate from "../middlewares/validate.middleware.js";
import { unsubscribeSchema } from "../validators/notification.schemas.js";
import { unsubscribeWithToken } from "../controllers/notification.controller.js";

const router = Router();

const unsubscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRateLimitStore("rl:notifications:unsubscribe:"),
  message: {
    success: false,
    message: "Too many unsubscribe attempts. Please try again later.",
  },
});

router.post("/unsubscribe", unsubscribeLimiter, validate(unsubscribeSchema), unsubscribeWithToken);

export default router;

