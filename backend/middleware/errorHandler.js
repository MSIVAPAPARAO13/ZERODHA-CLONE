const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const requestId = req.requestId || (req.headers && req.headers["x-request-id"]) || null;

  // Clean error code
  let errorCode = err.code || err.name || "SERVER_ERROR";
  if (typeof errorCode === "number") errorCode = `ERROR_${errorCode}`;

  // Sanitize internal details in production
  let message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "An unexpected server error occurred.";
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message,
      ...(requestId && { requestId })
    }
  });
};

module.exports = { errorHandler };
