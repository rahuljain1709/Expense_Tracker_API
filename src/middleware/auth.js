const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // Attach user id to request for downstream use
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Use /api/auth/refresh to get a new one.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid access token',
    });
  }
};

module.exports = { authenticate };
