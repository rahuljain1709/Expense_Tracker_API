const db = require('../config/db');

// GET /api/categories
// Returns default categories + user's own custom ones
const listCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, is_default, user_id, created_at
       FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [req.userId]
    );

    res.status(200).json({ success: true, data: { categories: result.rows } });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    // Check for name conflict within the user's own categories
    const conflict = await db.query(
      `SELECT id FROM categories
       WHERE LOWER(name) = LOWER($1) AND (user_id = $2 OR user_id IS NULL)`,
      [name, req.userId]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    }

    const result = await db.query(
      `INSERT INTO categories (name, user_id, is_default)
       VALUES ($1, $2, FALSE)
       RETURNING id, name, is_default, user_id, created_at`,
      [name, req.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: { category: result.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Fetch category — must be owned by user and not default
    const found = await db.query(
      'SELECT id, is_default, user_id FROM categories WHERE id = $1',
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const cat = found.rows[0];
    if (cat.is_default) {
      return res.status(403).json({ success: false, message: 'Default categories cannot be modified' });
    }
    if (cat.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'You do not own this category' });
    }

    // Name conflict check
    const conflict = await db.query(
      `SELECT id FROM categories
       WHERE LOWER(name) = LOWER($1) AND (user_id = $2 OR user_id IS NULL) AND id != $3`,
      [name, req.userId, id]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    }

    const result = await db.query(
      `UPDATE categories SET name = $1 WHERE id = $2
       RETURNING id, name, is_default, user_id, created_at`,
      [name, id]
    );

    res.status(200).json({
      success: true,
      message: 'Category updated',
      data: { category: result.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const found = await db.query(
      'SELECT id, is_default, user_id FROM categories WHERE id = $1',
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const cat = found.rows[0];
    if (cat.is_default) {
      return res.status(403).json({ success: false, message: 'Default categories cannot be deleted' });
    }
    if (cat.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'You do not own this category' });
    }

    await db.query('DELETE FROM categories WHERE id = $1', [id]);

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
