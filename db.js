const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Создаём таблицу если не существует
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            telegram_id BIGINT PRIMARY KEY,
            username    TEXT,
            first_name  TEXT,
            coins       INTEGER DEFAULT 0,
            total_kills INTEGER DEFAULT 0,
            level       INTEGER DEFAULT 1,
            xp          INTEGER DEFAULT 0,
            owned_skins TEXT[]  DEFAULT ARRAY['default'],
            current_skin TEXT   DEFAULT 'default',
            daily_reward_date TEXT DEFAULT '',
            updated_at  TIMESTAMP DEFAULT NOW()
        );
    `);
    console.log('✅ База данных готова');
}

module.exports = { pool, initDB };
