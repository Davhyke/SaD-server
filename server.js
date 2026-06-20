const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Роуты
app.use('/api', userRoutes);
app.use('/admin', adminRoutes);

// Запуск
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Сервер запущен на порту ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Ошибка подключения к БД:', err);
    process.exit(1);
});
