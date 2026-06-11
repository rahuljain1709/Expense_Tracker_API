const Joi = require('joi');

// ── Auth ──────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

// ── User ──────────────────────────────────────────────
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase(),
}).min(1);

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).max(72).required(),
});

// ── Transaction ───────────────────────────────────────
const createTransactionSchema = Joi.object({
  type: Joi.string().valid('expense', 'income').required(),
  amount: Joi.number().positive().precision(2).required(),
  category_id: Joi.string().uuid().optional().allow(null),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be in YYYY-MM-DD format' }),
  note: Joi.string().max(500).optional().allow('', null),
});

const updateTransactionSchema = Joi.object({
  type: Joi.string().valid('expense', 'income'),
  amount: Joi.number().positive().precision(2),
  category_id: Joi.string().uuid().optional().allow(null),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({ 'string.pattern.base': 'date must be in YYYY-MM-DD format' }),
  note: Joi.string().max(500).optional().allow('', null),
}).min(1);

const listTransactionsSchema = Joi.object({
  type: Joi.string().valid('expense', 'income'),
  category_id: Joi.string().uuid(),
  start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  sort_by: Joi.string().valid('date', 'amount').default('date'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ── Category ──────────────────────────────────────────
const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

// ── Analytics ─────────────────────────────────────────
const periodSchema = Joi.object({
  start_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'start_date must be in YYYY-MM-DD format' }),
  end_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'end_date must be in YYYY-MM-DD format' }),
});

const monthlySchema = Joi.object({
  months: Joi.number().integer().min(1).max(24).default(6),
});

// ── Validate helper ───────────────────────────────────
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((d) => d.message),
    });
  }
  req[property] = value;
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsSchema,
  createCategorySchema,
  updateCategorySchema,
  periodSchema,
  monthlySchema,
};
