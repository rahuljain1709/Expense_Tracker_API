require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./src/config/db');

const seed = async () => {
  console.log('🌱 Seeding database...');

  // Create two demo users
  const users = [
    { name: 'Alice Tan', email: 'alice@example.com', password: 'password123' },
    { name: 'Bob Lim', email: 'bob@example.com', password: 'password123' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email`,
      [u.name, u.email, hash]
    );
    createdUsers.push(res.rows[0]);
    console.log(`  ✅ User: ${res.rows[0].email}`);
  }

  // Fetch default category IDs
  const catRes = await db.query('SELECT id, name FROM categories WHERE is_default = TRUE');
  const catMap = {};
  catRes.rows.forEach((c) => (catMap[c.name] = c.id));

  // Add a custom category for Alice
  await db.query(
    `INSERT INTO categories (name, user_id, is_default)
     VALUES ($1, $2, FALSE)
     ON CONFLICT (name, user_id) DO NOTHING`,
    ['Subscriptions', createdUsers[0].id]
  );

  // Create sample transactions for Alice
  const aliceId = createdUsers[0].id;
  const transactions = [
    { type: 'income',  amount: 4500.00, category: 'Other',     date: '2024-05-01', note: 'Monthly salary' },
    { type: 'expense', amount: 85.50,   category: 'Food',       date: '2024-05-03', note: 'Weekly groceries' },
    { type: 'expense', amount: 2.10,    category: 'Transport',  date: '2024-05-04', note: 'Bus fare' },
    { type: 'expense', amount: 120.00,  category: 'Bills',      date: '2024-05-05', note: 'Electricity bill' },
    { type: 'expense', amount: 34.90,   category: 'Food',       date: '2024-05-08', note: 'Dinner out' },
    { type: 'expense', amount: 250.00,  category: 'Shopping',   date: '2024-05-10', note: 'New shoes' },
    { type: 'income',  amount: 500.00,  category: 'Other',     date: '2024-05-15', note: 'Freelance project' },
    { type: 'expense', amount: 45.00,   category: 'Health',     date: '2024-05-18', note: 'Clinic visit' },
    { type: 'expense', amount: 19.90,   category: 'Leisure',    date: '2024-05-20', note: 'Movie tickets' },
    { type: 'expense', amount: 780.00,  category: 'Travel',     date: '2024-05-22', note: 'Weekend trip to JB' },
    { type: 'income',  amount: 4500.00, category: 'Other',     date: '2024-06-01', note: 'Monthly salary' },
    { type: 'expense', amount: 95.00,   category: 'Food',       date: '2024-06-02', note: 'Groceries' },
    { type: 'expense', amount: 120.00,  category: 'Bills',      date: '2024-06-05', note: 'Electricity bill' },
  ];

  for (const t of transactions) {
    await db.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, date, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [aliceId, t.type, t.amount, catMap[t.category] || null, t.date, t.note]
    );
  }
  console.log(`  ✅ ${transactions.length} transactions created for Alice`);

  console.log('\n🎉 Seed complete!');
  console.log('   alice@example.com / password123');
  console.log('   bob@example.com   / password123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
