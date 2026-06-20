const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-admin-key']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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