const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message: err.message || "Internal Server Error",
      code: err.name || "SERVER_ERROR"
    }
  });
};

module.exports = { errorHandler };
