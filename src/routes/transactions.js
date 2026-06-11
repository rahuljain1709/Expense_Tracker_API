const router = require('express').Router();
const {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsSchema,
} = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Manage income and expense transactions
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List all transactions for the logged-in user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [expense, income]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [date, amount]
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total_pages: { type: integer }
 */
router.get('/', authenticate, validate(listTransactionsSchema, 'query'), listTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { $ref: '#/components/schemas/Transaction' }
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, getTransaction);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [expense, income]
 *               amount:
 *                 type: number
 *                 example: 42.50
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-01"
 *               note:
 *                 type: string
 *                 example: Lunch at hawker centre
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, validate(createTransactionSchema), createTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   patch:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [expense, income]
 *               amount:
 *                 type: number
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, validate(updateTransactionSchema), updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, deleteTransaction);

module.exports = router;
