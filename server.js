const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'shipments.json');

// Создаем директорию data, если её нет
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

// Получение данных
app.get('/api/shipments', async (req, res) => {
    try {
        await ensureDataDirectory();
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Если файл не существует, возвращаем пустой массив
                res.json([]);
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error('Ошибка при чтении данных:', err);
        res.status(500).json({ error: 'Ошибка при чтении данных' });
    }
});

// Сохранение данных
app.post('/api/shipments', async (req, res) => {
    try {
        await ensureDataDirectory();
        await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
        console.log('Данные успешно сохранены');
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка при сохранении данных:', err);
        res.status(500).json({ error: 'Ошибка при сохранении данных' });
    }
});

// Очистка всех данных
app.delete('/api/shipments', async (req, res) => {
    try {
        await ensureDataDirectory();
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
        console.log('Все данные очищены');
        res.json({ success: true, message: 'Все данные очищены' });
    } catch (err) {
        console.error('Ошибка при очистке данных:', err);
        res.status(500).json({ error: 'Ошибка при очистке данных' });
    }
});

// Health check для мониторинга
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Обработка 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Страница не найдена' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Внутренняя ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
    console.log(`📍 Локальный доступ: http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
}); 