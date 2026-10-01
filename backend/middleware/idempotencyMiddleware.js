const crypto = require("crypto");
const { IdempotencyKeyModel } = require("../models/IdempotencyKeyModel");

const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];
  if (!idempotencyKey) {
    return next();
  }

  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }

  const cleanKey = String(idempotencyKey).trim();
  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body || {}))
    .digest("hex");

  try {
    const existing = await IdempotencyKeyModel.findOne({
      key: cleanKey,
      user: userId
    });

    if (existing) {
      if (existing.status === "COMPLETED") {
        if (existing.requestHash !== requestHash) {
          return res.status(422).json({
            success: false,
            data: null,
            error: {
              code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
              message: "Idempotency key has already been used with a different request payload."
            }
          });
        }
        res.setHeader("X-Idempotent-Replay", "true");
        return res.status(existing.responseStatus || 200).json(existing.responseBody);
      }

      if (existing.status === "IN_PROGRESS") {
        return res.status(409).json({
          success: false,
          data: null,
          error: {
            code: "OPERATION_IN_PROGRESS",
            message: "A request with this Idempotency-Key is currently being processed."
          }
        });
      }
    }

    // Reserve new key atomically
    const record = await IdempotencyKeyModel.create({
      key: cleanKey,
      user: userId,
      endpoint: req.originalUrl || req.path,
      requestHash,
      status: "IN_PROGRESS"
    });

    // Intercept response to store result
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode || 200;
      IdempotencyKeyModel.updateOne(
        { _id: record._id },
        {
          $set: {
            status: statusCode < 400 ? "COMPLETED" : "FAILED",
            responseStatus: statusCode,
            responseBody: body
          }
        }
      ).catch(() => {});

      return originalJson(body);
    };

    await next();
  } catch (err) {
    if (err.code === 11000) {
      // Race condition caught by unique index
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: "OPERATION_IN_PROGRESS",
          message: "Concurrent duplicate request detected with identical Idempotency-Key."
        }
      });
    }
    next(err);
  }
};

module.exports = idempotencyMiddleware;
