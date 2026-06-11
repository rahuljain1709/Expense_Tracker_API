const router = require('express').Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate, updateProfileSchema, changePasswordSchema } = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get currently logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, getProfile);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update profile (name and/or email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: janesmith@example.com
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed. All sessions invalidated.
 *       400:
 *         description: Current password is incorrect
 */
router.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
