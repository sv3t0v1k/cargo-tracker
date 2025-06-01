const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'shipments.json');

// Валидация данных груза
function validateShipment(shipment) {
    const requiredFields = ['shippingDate', 'shippingCity', 'shipperName', 'carrier', 'packages', 'description'];
    const missingFields = requiredFields.filter(field => !shipment[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    if (!Array.isArray(shipment.cargoItems) || shipment.cargoItems.length === 0) {
        throw new Error('At least one cargo item is required');
    }
    
    const { DESTINATION_TYPES } = require('./constants');
    
    shipment.cargoItems.forEach((item, index) => {
        if (!item.description || !item.quantity || !item.destinationType) {
            throw new Error(`Invalid cargo item at position ${index + 1}`);
        }
        
        const destinationType = Object.values(DESTINATION_TYPES)
            .find(type => type.id === item.destinationType);
            
        if (!destinationType) {
            throw new Error(`Invalid destination type at position ${index + 1}`);
        }
    });
}

// Получение данных
app.get('/api/shipments', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading shipments:', error);
        res.status(500).json({ error: 'Failed to read shipments' });
    }
});

// Создание новой отправки
app.post('/api/shipments', async (req, res) => {
    try {
        validateShipment(req.body);
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const shipments = JSON.parse(data);
        
        const newShipment = {
            ...req.body,
            id: req.body.id || Date.now().toString()
        };
        
        shipments.push(newShipment);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(shipments, null, 2));
        res.json(newShipment);
    } catch (error) {
        console.error('Error adding shipment:', error);
        res.status(400).json({ error: error.message });
    }
});

// Обновление существующей отправки
app.put('/api/shipments', async (req, res) => {
    try {
        validateShipment(req.body);
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        let shipments = JSON.parse(data);
        
        const index = shipments.findIndex(s => s.id === req.body.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        
        shipments[index] = req.body;
        
        await fs.writeFile(DATA_FILE, JSON.stringify(shipments, null, 2));
        res.json(req.body);
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(400).json({ error: error.message });
    }
});

// Удаление отправки
app.delete('/api/shipments/:id', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        let shipments = JSON.parse(data);
        
        shipments = shipments.filter(s => s.id !== req.params.id);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(shipments, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting shipment:', error);
        res.status(500).json({ error: 'Failed to delete shipment' });
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