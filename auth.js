const crypto = require('crypto');

function verifyTelegramData(initData) {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        if (!hash) return null;

        // Убираем hash из строки
        params.delete('hash');

        // Сортируем параметры и собираем строку
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        // Создаём секретный ключ
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(process.env.BOT_TOKEN)
            .digest();

        // Проверяем подпись
        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (expectedHash !== hash) return null;

        // Возвращаем данные пользователя
        const userStr = params.get('user');
        return userStr ? JSON.parse(userStr) : null;

    } catch (e) {
        return null;
    }
}

module.exports = { verifyTelegramData };
