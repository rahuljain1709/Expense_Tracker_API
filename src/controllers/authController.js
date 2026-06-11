const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ── Token helpers ─────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Persist refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Check token exists in DB (not revoked)
    const result = await db.query(
      'SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
      [refresh_token, decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Refresh token not found or expired' });
    }

    // Rotate: delete old, issue new
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [decoded.userId, newRefreshToken, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
