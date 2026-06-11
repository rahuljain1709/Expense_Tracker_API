const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/users/me
const getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check email uniqueness if being changed
    if (email) {
      const conflict = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.userId]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    const result = await db.query(
      `UPDATE users
       SET name        = COALESCE($1, name),
           email       = COALESCE($2, email),
           updated_at  = NOW()
       WHERE id = $3
       RETURNING id, name, email, created_at, updated_at`,
      [name || null, email || null, req.userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { user: result.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me/password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    const user = result.rows[0];
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.userId]
    );

    // Revoke all refresh tokens to force re-login on all devices
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.userId]);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
