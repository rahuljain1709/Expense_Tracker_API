# Expense Tracker API

A secure, well-structured REST API for managing personal income and expenses — built with Node.js, Express, and PostgreSQL.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js + Express | Lightweight, fast I/O, massive ecosystem |
| Database | PostgreSQL | Relational integrity suits transactional financial data; UUID support, rich aggregation for analytics |
| Auth | JWT (access + refresh) | Stateless access tokens + DB-backed refresh tokens enable true logout/revocation without sessions |
| Validation | Joi | Declarative, composable schema validation with clean error messages |
| Docs | swagger-jsdoc + swagger-ui-express | Inline JSDoc annotations keep docs close to route definitions |
| Password hashing | bcryptjs | Industry standard, configurable work factor |

---

## Project Structure

```
expense-tracker-api/
├── src/
│   ├── config/
│   │   ├── db.js            # PostgreSQL connection pool
│   │   └── swagger.js       # Swagger/OpenAPI spec config
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication middleware
│   │   └── errorHandler.js  # Global error handler
│   ├── validators/
│   │   └── index.js         # Joi schemas + validate() helper
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   ├── categoryController.js
│   │   └── analyticsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   └── analytics.js
│   └── app.js               # Express app (middleware, routes)
├── migrations/
│   └── init.sql             # Database schema + default categories
├── seed.js                  # Sample data script
├── server.js                # Entry point
├── .env.example
└── package.json
```

---

## Prerequisites

- Node.js v18+
- PostgreSQL 14+

---

## Local Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd expense-tracker-api
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/expense_tracker
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 3. Create the database

```bash
createdb expense_tracker
```

Or in `psql`:

```sql
CREATE DATABASE expense_tracker;
```

### 4. Run migrations

```bash
npm run migrate
```

This creates all tables and seeds the 8 default categories (Food, Transport, Bills, Health, Shopping, Travel, Leisure, Other).

### 5. (Optional) Seed sample data

```bash
npm run seed
```

Creates two users with sample transactions:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

### 6. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000`.

---

## API Docs

Swagger UI is live at: **`http://localhost:3000/docs`**

Raw OpenAPI spec (JSON): `http://localhost:3000/docs.json`

---

## Endpoints Overview

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user's profile |
| PATCH | `/api/users/me` | Update name/email |
| PATCH | `/api/users/me/password` | Change password |

### Transactions
| Method | Path | Description |
|---|---|---|
| GET | `/api/transactions` | List transactions (filters, pagination, sorting) |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

**Query params for list:** `type`, `category_id`, `start_date`, `end_date`, `sort_by` (date/amount), `order` (asc/desc), `page`, `limit`

### Categories
| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | List all (default + custom) |
| POST | `/api/categories` | Create custom category |
| PATCH | `/api/categories/:id` | Update custom category |
| DELETE | `/api/categories/:id` | Delete custom category |

### Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/summary` | Total income, expenses, net balance |
| GET | `/api/analytics/categories` | Spending breakdown by category |
| GET | `/api/analytics/monthly` | Month-over-month summary |

---

## Auth Flow

1. **Register or Login** → receive `access_token` (15m) + `refresh_token` (7d)
2. **Protected requests** → `Authorization: Bearer <access_token>`
3. **Access token expires** → `POST /api/auth/refresh` with `refresh_token` → new token pair (rotation)
4. **Logout** → `POST /api/auth/logout` with `refresh_token` → token deleted from DB

---

## Trade-offs & Assumptions

- **No ORM** — Raw `pg` queries were chosen for transparency and control. An ORM like Prisma would be a clean upgrade for a larger team.
- **Token rotation** on refresh — every refresh issues a new refresh token and invalidates the old one, providing better security at the cost of slightly more DB writes.
- **Soft category constraint** — deleting a custom category sets `category_id` to NULL on existing transactions (via `ON DELETE SET NULL`) rather than blocking deletion, preserving transaction history.
- **Password change revokes all sessions** — changing a password deletes all stored refresh tokens, requiring re-login on all devices.

---

## What I'd Improve With More Time

- [ ] Integration tests with Jest + Supertest for auth and transaction flows
- [ ] Docker + docker-compose for zero-config local setup
- [ ] Pagination cursor-based (keyset) instead of offset for large datasets
- [ ] Email verification on registration
- [ ] Soft-delete for transactions (allow undo)
- [ ] Export transactions to CSV endpoint

---

## Deployment (Render / Railway)

1. Push repo to GitHub
2. Create a new Web Service on [Render](https://render.com) pointing to your repo
3. Add a PostgreSQL database (free tier available)
4. Set all environment variables from `.env.example`
5. Set **Build Command**: `npm install && npm run migrate`
6. Set **Start Command**: `npm start`
7. Add `API_BASE_URL=https://your-app.onrender.com` to env vars for correct Swagger server URL
