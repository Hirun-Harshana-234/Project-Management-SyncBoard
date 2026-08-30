const env = require("../config/env");

function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} was not found.` });
}

function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || "An unexpected error occurred.";

  if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use.`;
  }
  if (error.name === "ValidationError") {
    status = 422;
    message = Object.values(error.errors).map((item) => item.message).join(" ");
  }
  if (error.name === "CastError") {
    status = 404;
    message = "The requested record was not found.";
  }

  if (status >= 500 && env.nodeEnv !== "test") console.error(error);
  res.status(status).json({
    message,
    ...(error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === "development" && status >= 500 ? { stack: error.stack } : {})
  });
}

module.exports = { notFound, errorHandler };

