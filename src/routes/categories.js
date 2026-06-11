const router = require('express').Router();
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { validate, createCategorySchema, updateCategorySchema } = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Default and custom categories
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories (defaults + user's custom ones)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', authenticate, listCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a custom category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Subscriptions
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Category name already exists
 */
router.post('/', authenticate, validate(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update a custom category (cannot update default categories)
 *     tags: [Categories]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         description: Cannot modify default category or another user's category
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, validate(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a custom category (cannot delete default categories)
 *     tags: [Categories]
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
 *         description: Category deleted
 *       403:
 *         description: Cannot delete default categories or another user's category
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;
