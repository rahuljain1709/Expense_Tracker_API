const db = require('../config/db');

// GET /api/analytics/summary?start_date=&end_date=
const getSummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const result = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
       FROM transactions
       WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [req.userId, start_date, end_date]
    );

    const { total_income, total_expenses } = result.rows[0];
    const net_balance = parseFloat(total_income) - parseFloat(total_expenses);

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        total_income: parseFloat(total_income),
        total_expenses: parseFloat(total_expenses),
        net_balance: parseFloat(net_balance.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/categories?start_date=&end_date=
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const result = await db.query(
      `SELECT
         c.name AS category,
         t.type,
         SUM(t.amount) AS total,
         COUNT(*) AS transaction_count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
       GROUP BY c.name, t.type
       ORDER BY total DESC`,
      [req.userId, start_date, end_date]
    );

    // Calculate totals per type for percentage computation
    const expenseTotal = result.rows
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + parseFloat(r.total), 0);
    const incomeTotal = result.rows
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + parseFloat(r.total), 0);

    const breakdown = result.rows.map((row) => {
      const base = row.type === 'expense' ? expenseTotal : incomeTotal;
      const pct = base > 0 ? ((parseFloat(row.total) / base) * 100).toFixed(2) : '0.00';
      return {
        category: row.category || 'Uncategorised',
        type: row.type,
        total: parseFloat(row.total),
        percentage: parseFloat(pct),
        transaction_count: parseInt(row.transaction_count),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        expense_total: expenseTotal,
        income_total: incomeTotal,
        breakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/monthly?months=6
const getMonthlySummary = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;

    const result = await db.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE user_id = $1
         AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' * ($2 - 1)
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month ASC`,
      [req.userId, months]
    );

    const monthly = result.rows.map((row) => ({
      month: row.month,
      income: parseFloat(row.income),
      expenses: parseFloat(row.expenses),
      net: parseFloat((parseFloat(row.income) - parseFloat(row.expenses)).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      data: {
        months_requested: months,
        monthly,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlySummary };
