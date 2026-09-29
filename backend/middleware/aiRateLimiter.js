const rateLimitMap = new Map();

const aiRateLimiter = (req, res, next) => {
  const userId = req.user.userId;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10;

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap.get(userId);
  const filtered = timestamps.filter(t => now - t < windowMs);
  
  if (filtered.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'AI analysis rate limit exceeded. Please try again later.' }
    });
  }

  filtered.push(now);
  rateLimitMap.set(userId, filtered);
  next();
};

module.exports = aiRateLimiter;
