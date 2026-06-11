require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    // Verify DB connection on startup
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 Swagger docs: http://localhost:${PORT}/docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
};

start();
