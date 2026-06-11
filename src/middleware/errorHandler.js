const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Joi validation errors passed manually
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details.map((d) => d.message),
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
    });
  }

  // Default 500
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
