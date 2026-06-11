const router = require('express').Router();
const { getSummary, getCategoryBreakdown, getMonthlySummary } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { validate, periodSchema, monthlySchema } = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Financial summaries and insights
 */

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Total income, expenses, and net balance for a period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start_date: { type: string }
 *                         end_date: { type: string }
 *                     total_income: { type: number }
 *                     total_expenses: { type: number }
 *                     net_balance: { type: number }
 *       400:
 *         description: Validation error — start_date and end_date required
 */
router.get('/summary', authenticate, validate(periodSchema, 'query'), getSummary);

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     summary: Spending breakdown by category for a given period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category breakdown with amounts and percentages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     expense_total: { type: number }
 *                     income_total: { type: number }
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category: { type: string }
 *                           type: { type: string }
 *                           total: { type: number }
 *                           percentage: { type: number }
 *                           transaction_count: { type: integer }
 */
router.get('/categories', authenticate, validate(periodSchema, 'query'), getCategoryBreakdown);

/**
 * @swagger
 * /api/analytics/monthly:
 *   get:
 *     summary: Month-over-month income and expenses summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *           minimum: 1
 *           maximum: 24
 *         description: Number of past months to include
 *     responses:
 *       200:
 *         description: Monthly summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     months_requested: { type: integer }
 *                     monthly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month: { type: string, example: "2024-01" }
 *                           income: { type: number }
 *                           expenses: { type: number }
 *                           net: { type: number }
 */
router.get('/monthly', authenticate, validate(monthlySchema, 'query'), getMonthlySummary);

module.exports = router;
