const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const MAX_LEVEL = 50;

function xpForLevel(level) { return level * 50; }
function rewardForLevel(level) { return level * 50; }

// Логика повышения уровня (серверная копия)
function processXP(level, xp, addXp) {
    let coins = 0;
    xp += addXp;
    while (level < MAX_LEVEL) {
        const needed = xpForLevel(level);
        if (xp >= needed) {
            xp -= needed;
            level++;
            coins += rewardForLevel(level);
        } else break;
    }
    if (level >= MAX_LEVEL) xp = 0;
    return { level, xp, coinsReward: coins };
}

function checkAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// GET /admin/users
router.get('/users', checkAdmin, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM users ORDER BY coins DESC LIMIT 100'
    );
    res.json(result.rows);
});

// GET /admin/user/:id
router.get('/user/:id', checkAdmin, async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
});

// POST /admin/user/:id
router.post('/user/:id', checkAdmin, async (req, res) => {
    const { coins, add_xp, set_level, total_kills, current_skin, owned_skins } = req.body;

    try {
        // Получаем текущие данные игрока
        const cur = await pool.query(
            'SELECT level, xp, coins FROM users WHERE telegram_id = $1',
            [req.params.id]
        );
        if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        let { level, xp, coins: currentCoins } = cur.rows[0];

        // Если задаём уровень вручную — даём награду за все уровни от текущего до нового
        let levelReward = 0;
        if (set_level !== undefined && set_level !== null) {
            const targetLevel = Math.min(parseInt(set_level), MAX_LEVEL);
            if (targetLevel > level) {
                for (let l = level + 1; l <= targetLevel; l++) {
                    levelReward += rewardForLevel(l);
                }
            }
            level = targetLevel;
            xp = 0;
        }

        // Если добавляем XP — обрабатываем повышение уровня
        let xpReward = 0;
        if (add_xp) {
            const result = processXP(level, xp, parseInt(add_xp));
            level = result.level;
            xp = result.xp;
            xpReward = result.coinsReward;
        }

        // Итоговые монеты
        const finalCoins = (coins !== undefined ? parseInt(coins) : currentCoins)
            + levelReward + xpReward;

        await pool.query(
            `UPDATE users SET
                coins        = $2,
                level        = $3,
                xp           = $4,
                total_kills  = COALESCE($5, total_kills),
                current_skin = COALESCE($6, current_skin),
                owned_skins  = COALESCE($7, owned_skins),
                updated_at   = NOW()
             WHERE telegram_id = $1`,
            [req.params.id, finalCoins, level, xp, total_kills, current_skin, owned_skins]
        );

        res.json({ ok: true, level, xp, coins: finalCoins, levelReward, xpReward });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
