const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Простая защита паролем
function checkAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// GET /admin/users — список всех игроков
router.get('/users', checkAdmin, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM users ORDER BY coins DESC LIMIT 100'
    );
    res.json(result.rows);
});

// GET /admin/user/:id — данные конкретного игрока
router.get('/user/:id', checkAdmin, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
});

// POST /admin/user/:id — изменить данные игрока
router.post('/user/:id', checkAdmin, async (req, res) => {
    const { coins, level, xp, total_kills, current_skin, owned_skins } = req.body;

    try {
        await pool.query(
            `UPDATE users SET
                coins        = COALESCE($2, coins),
                level        = COALESCE($3, level),
                xp           = COALESCE($4, xp),
                total_kills  = COALESCE($5, total_kills),
                current_skin = COALESCE($6, current_skin),
                owned_skins  = COALESCE($7, owned_skins),
                updated_at   = NOW()
             WHERE telegram_id = $1`,
            [req.params.id, coins, level, xp, total_kills, current_skin, owned_skins]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
