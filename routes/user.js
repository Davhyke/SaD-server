const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyTelegramData } = require('../auth');

// GET /api/getUser — загрузить данные игрока
router.post('/getUser', async (req, res) => {
    const { initData } = req.body;

    const user = verifyTelegramData(initData);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE telegram_id = $1',
            [user.id]
        );

        if (result.rows.length === 0) {
            // Новый игрок — создаём запись
            const newUser = await pool.query(
                `INSERT INTO users (telegram_id, username, first_name)
                 VALUES ($1, $2, $3) RETURNING *`,
                [user.id, user.username || '', user.first_name || '']
            );
            return res.json(newUser.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/saveUser — сохранить данные игрока
router.post('/saveUser', async (req, res) => {
    const { initData, gameState } = req.body;

    const user = verifyTelegramData(initData);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { coins, totalKills, level, xp, ownedSkins, currentSkin, dailyRewardDate } = gameState;

    try {
        await pool.query(
            `UPDATE users SET
                coins             = $2,
                total_kills       = $3,
                level             = $4,
                xp                = $5,
                owned_skins       = $6,
                current_skin      = $7,
                daily_reward_date = $8,
                updated_at        = NOW()
             WHERE telegram_id = $1`,
            [user.id, coins, totalKills, level, xp, ownedSkins, currentSkin, dailyRewardDate]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
