const db = require('../config/db');

// GET /api/transactions
const listTransactions = async (req, res, next) => {
  try {
    const { type, category_id, start_date, end_date, sort_by, order, page, limit } =
      req.query;

    const conditions = ['t.user_id = $1'];
    const values = [req.userId];
    let paramIndex = 2;

    if (type) {
      conditions.push(`t.type = $${paramIndex++}`);
      values.push(type);
    }
    if (category_id) {
      conditions.push(`t.category_id = $${paramIndex++}`);
      values.push(category_id);
    }
    if (start_date) {
      conditions.push(`t.date >= $${paramIndex++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`t.date <= $${paramIndex++}`);
      values.push(end_date);
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = sort_by === 'amount' ? 't.amount' : 't.date';
    const sortOrder = (order || 'desc').toUpperCase();
    const pageNum = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageLimit;

    // Total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Paginated data
    const result = await db.query(
      `SELECT t.id, t.user_id, t.type, t.amount, t.category_id,
              c.name AS category_name, t.date, t.note, t.created_at, t.updated_at
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, pageLimit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: pageLimit,
          total_pages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT t.id, t.user_id, t.type, t.amount, t.category_id,
              c.name AS category_name, t.date, t.note, t.created_at, t.updated_at
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, data: { transaction: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category_id, date, note } = req.body;

    // Validate category belongs to user or is default (if provided)
    if (category_id) {
      const catCheck = await db.query(
        'SELECT id FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
        [category_id, req.userId]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or inaccessible category' });
      }
    }

    const result = await db.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, type, amount, category_id, date, note, created_at, updated_at`,
      [req.userId, type, amount, category_id || null, date, note || null]
    );

    // Fetch with category name
    const fullResult = await db.query(
      `SELECT t.id, t.user_id, t.type, t.amount, t.category_id,
              c.name AS category_name, t.date, t.note, t.created_at, t.updated_at
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaction created',
      data: { transaction: fullResult.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, category_id, date, note } = req.body;

    // Ownership check
    const existing = await db.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (category_id) {
      const catCheck = await db.query(
        'SELECT id FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
        [category_id, req.userId]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or inaccessible category' });
      }
    }

    const result = await db.query(
      `UPDATE transactions
       SET type        = COALESCE($1, type),
           amount      = COALESCE($2, amount),
           category_id = CASE WHEN $3::text IS NOT NULL THEN $3::uuid ELSE category_id END,
           date        = COALESCE($4, date),
           note        = COALESCE($5, note),
           updated_at  = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id`,
      [type || null, amount || null, category_id || null, date || null, note !== undefined ? note : null, id, req.userId]
    );

    const fullResult = await db.query(
      `SELECT t.id, t.user_id, t.type, t.amount, t.category_id,
              c.name AS category_name, t.date, t.note, t.created_at, t.updated_at
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated',
      data: { transaction: fullResult.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
