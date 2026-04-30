import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const createRateLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests,
  handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      let retryAfterSec = 60;

      if (resetTime instanceof Date) {
        retryAfterSec = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
      } else if (typeof resetTime === 'number') {
        retryAfterSec = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      }

      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        code: 'RATE_LIMITED',
        message, // keeps your existing custom message
        retryAfterSec,
      });
    },
});

export const securityHeaders = helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const generalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 300),
  message: 'Too many requests from this IP. Please try again later.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  message: 'Too many authentication attempts. Please try again later.',
});

export const adminAuthRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ADMIN_AUTH_MAX || 5),
  message: 'Too many admin authentication attempts. Please try again later.',
});

export const analyticsRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ANALYTICS_MAX || 120),
  message: 'Too many analytics requests. Please slow down.',
});

export const userActionRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_USER_ACTION_MAX || 60),
  message: 'Too many requests. Please try again later.',
});

export const productMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PRODUCT_MUTATION_MAX || 40),
  message: 'Too many product changes. Please try again later.',
});

export const orderRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ORDER_MAX || 30),
  message: 'Too many order requests. Please try again later.',
});

export const notificationRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_NOTIFICATION_MAX || 30),
  message: 'Too many notification requests. Please try again later.',
});

export const reviewRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REVIEW_MAX || 20),
  message: 'Too many review requests. Please try again later.',
});

export const sellerActionRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SELLER_MAX || 20),
  message: 'Too many seller requests. Please try again later.',
});