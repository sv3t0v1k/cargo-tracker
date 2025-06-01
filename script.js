// JavaScript Version: 4.0 - Clean Restructured

// Модель данных
class ShipmentStore {
    constructor() {
        this.shipments = [];
        this.loadShipments();
    }

    async loadShipments() {
        try {
            const response = await fetch('/api/shipments');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            this.shipments = await response.json();
            filterShipments();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showNotification('Ошибка при загрузке данных', 'error');
        }
    }

    async saveShipments() {
        try {
            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.shipments)
            });
            if (!response.ok) throw new Error('Ошибка сохранения данных');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            showNotification('Ошибка при сохранении данных', 'error');
        }
    }

    async addShipment(shipment) {
        try {
            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shipment)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при сохранении');
            }
            
            await this.loadShipments();
            return true;
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message || 'Ошибка при сохранении груза', 'error');
            return false;
        }
    }

    async updateShipment(id, updatedShipment) {
        try {
            const response = await fetch(`/api/shipments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedShipment)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при обновлении');
            }
            
            await this.loadShipments();
            return true;
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message || 'Ошибка при обновлении груза', 'error');
            return false;
        }
    }

    async deleteShipment(id) {
        try {
            const response = await fetch(`/api/shipments/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении');
            }

            await this.loadShipments();
            return true;
        } catch (error) {
            console.error('Error:', error);
            showNotification('Ошибка при удалении отправки', 'error');
            return false;
        }
    }

    async clearAllShipments() {
        try {
            const response = await fetch('/api/shipments', {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка очистки данных');
            this.shipments = [];
            return true;
        } catch (error) {
            showNotification('Ошибка при очистке данных', 'error');
            return false;
        }
    }

    getShipments() {
        return this.shipments;
    }
}

// Глобальные переменные
const store = new ShipmentStore();
let currentShipmentId = null;
let currentFilters = {
    dateFrom: '',
    dateTo: '',
    status: '',
    city: '',
    search: ''
};

let cargoItemCounter = 1;

// Утилиты
function formatDate(dateString) {
    if (!dateString) return '';
    
    let date;
    
    if (typeof dateString === 'string') {
        if (dateString.includes('.')) {
            const parts = dateString.split('.');
            if (parts.length === 3) {
                date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            }
        } else {
            date = new Date(dateString);
        }
    } else {
        date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return dateString || '';
    }
    
    return date.toLocaleDateString('ru-RU');
}

function convertToInputDate(dateString) {
    if (!dateString) return '';
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    if (dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    return '';
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    notification.style.background = type === 'error' ? 
        getComputedStyle(document.documentElement).getPropertyValue('--danger-color') : 
        getComputedStyle(document.documentElement).getPropertyValue('--success-color');
    
    notification.style.animation = 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400);
    }, 3000);
}

// Рендеринг данных
function formatCargoItems(items) {
    if (!items || !Array.isArray(items)) return '';
    
    return items.map(item => {
        // Проверяем существование типа
        const typeKey = Object.keys(DESTINATION_TYPES).find(key => 
            DESTINATION_TYPES[key].id === item.destinationType
        );
        
        // Если тип не найден, используем тип "Продажа" по умолчанию
        const type = typeKey ? DESTINATION_TYPES[typeKey] : DESTINATION_TYPES.SALE;
        
        let text = `<div class="cargo-item-row" data-type="${type.id}">`;
        text += `${item.description} (${item.quantity} шт.) - ${type.name}`;
        text += '</div>';
        return text;
    }).join('');
}

function renderShipments(shipments) {
    const tbody = document.querySelector('#shipmentsTable tbody');
    tbody.innerHTML = '';
    
    shipments.forEach(shipment => {
        const tr = document.createElement('tr');
        const shipmentJson = JSON.stringify(shipment).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        tr.innerHTML = `
            <td>${formatDate(shipment.shippingDate)}</td>
            <td>${shipment.shippingCity}</td>
            <td>${shipment.shipperName}</td>
            <td>${formatDate(shipment.deliveryDate) || '-'}</td>
            <td>${shipment.deliveryCity || '-'}</td>
            <td>${shipment.receiverName || '-'}</td>
            <td>${shipment.carrier}</td>
            <td>${shipment.packages}</td>
            <td>
                <div class="cargo-details">
                    <div class="cargo-items-list">${formatCargoItems(shipment.cargoItems)}</div>
                </div>
            </td>
            <td><span class="status-${shipment.status}">${shipment.status === 'delivered' ? 'Доставлен' : 'В пути'}</span></td>
            <td>
                <button onclick='openEditModal(${shipmentJson})' class="btn btn-primary btn-sm">✏️</button>
                <button onclick="deleteShipment('${shipment.id}')" class="btn btn-danger btn-sm">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Обновляем мобильное представление
    const mobileCards = document.getElementById('mobileCards');
    mobileCards.innerHTML = '';
    
    shipments.forEach(shipment => {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        const shipmentJson = JSON.stringify(shipment).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        card.innerHTML = `
            <div class="mobile-field">
                <div class="mobile-field-label">Дата отправки</div>
                <div class="mobile-field-value">${formatDate(shipment.shippingDate)}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Город отправления</div>
                <div class="mobile-field-value">${shipment.shippingCity}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Отправитель</div>
                <div class="mobile-field-value">${shipment.shipperName}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Дата получения</div>
                <div class="mobile-field-value">${formatDate(shipment.deliveryDate) || '-'}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Город получения</div>
                <div class="mobile-field-value">${shipment.deliveryCity || '-'}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Получатель</div>
                <div class="mobile-field-value">${shipment.receiverName || '-'}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Перевозчик</div>
                <div class="mobile-field-value">${shipment.carrier}</div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Мест</div>
                <div class="mobile-field-value">${shipment.packages}</div>
            </div>
            <div class="mobile-field description">
                <div class="mobile-field-label">Описание</div>
                <div class="mobile-field-value">
                    <div class="cargo-items-list">${formatCargoItems(shipment.cargoItems)}</div>
                </div>
            </div>
            <div class="mobile-field">
                <div class="mobile-field-label">Статус</div>
                <div class="mobile-field-value">
                    <span class="mobile-status ${shipment.status}">${shipment.status === 'delivered' ? 'Доставлен' : 'В пути'}</span>
                </div>
            </div>
            <div class="mobile-field actions">
                <div class="mobile-actions">
                    <button onclick='openEditModal(${shipmentJson})' class="btn btn-primary">✏️ Изменить</button>
                    <button onclick="deleteShipment('${shipment.id}')" class="btn btn-danger">🗑️ Удалить</button>
                </div>
            </div>
        `;
        mobileCards.appendChild(card);
    });
}

// Фильтрация
function filterShipments() {
    currentFilters = {
        dateFrom: document.getElementById('dateFrom').value,
        dateTo: document.getElementById('dateTo').value,
        status: document.getElementById('statusFilter').value,
        city: document.getElementById('cityFilter').value.toLowerCase(),
        search: document.getElementById('searchInput').value.toLowerCase()
    };

    let filtered = store.getShipments();

    if (currentFilters.dateFrom) {
        filtered = filtered.filter(s => {
            const shipDate = convertToInputDate(s.shippingDate);
            return shipDate >= currentFilters.dateFrom;
        });
    }
    if (currentFilters.dateTo) {
        filtered = filtered.filter(s => {
            const shipDate = convertToInputDate(s.shippingDate);
            return shipDate <= currentFilters.dateTo;
        });
    }
    if (currentFilters.status) {
        filtered = filtered.filter(s => s.status === currentFilters.status);
    }
    if (currentFilters.city) {
        filtered = filtered.filter(s => 
            s.shippingCity.toLowerCase().includes(currentFilters.city) ||
            s.deliveryCity?.toLowerCase().includes(currentFilters.city)
        );
    }
    if (currentFilters.search) {
        filtered = filtered.filter(s => 
            s.shippingCity.toLowerCase().includes(currentFilters.search) ||
            s.deliveryCity?.toLowerCase().includes(currentFilters.search) ||
            s.shipperName.toLowerCase().includes(currentFilters.search) ||
            s.receiverName?.toLowerCase().includes(currentFilters.search) ||
            s.carrier.toLowerCase().includes(currentFilters.search) ||
            s.description.toLowerCase().includes(currentFilters.search)
        );
    }

    renderShipments(filtered);
}

// Модальные окна
function openNewShipmentModal() {
    document.getElementById('modalTitle').textContent = 'Новая отправка';
    document.getElementById('shipmentForm').reset();
    document.getElementById('shipmentId').value = '';
    
    const modal = document.getElementById('shipmentModal');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.animation = 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        modal.style.opacity = '1';
    }, 10);
}

function openEditModal(shipment = null) {
    currentShipmentId = shipment ? shipment.id : null;
    const modal = document.getElementById('shipmentModal');
    const form = modal.querySelector('form');
    
    // Обновляем заголовок модального окна
    document.getElementById('modalTitle').textContent = shipment ? 'Редактировать отправку' : 'Новая отправка';
    
    // Очищаем существующие позиции груза
    document.getElementById('cargoItems').innerHTML = '';
    cargoItemCounter = 1;
    
    if (shipment) {
        // Заполняем основные поля
        Object.keys(shipment).forEach(key => {
            const input = document.getElementById(key);
            if (input && key !== 'cargoItems' && key !== 'id' && key !== 'status') {
                if (key.includes('Date')) {
                    input.value = convertToInputDate(shipment[key]);
                } else {
                    input.value = shipment[key];
                }
            }
        });
        
        // Добавляем позиции груза
        if (shipment.cargoItems && Array.isArray(shipment.cargoItems)) {
            shipment.cargoItems.forEach(item => {
                addCargoItem();
                const lastItem = document.querySelector('.cargo-item:last-child');
                lastItem.querySelector('.cargo-description').value = item.description;
                lastItem.querySelector('.cargo-quantity').value = item.quantity;
                lastItem.querySelector('.cargo-destination-type').value = item.destinationType;
                handleDestinationTypeChange(lastItem.querySelector('.cargo-destination-type'));
            });
        }
    } else {
        form.reset();
        // Добавляем первую пустую позицию груза
        addCargoItem();
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('shipmentModal');
    modal.style.animation = 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
}

// Сохранение данных
async function saveShipment(event) {
    event.preventDefault();
    
    try {
        const shipment = {
            shippingDate: document.getElementById('shippingDate').value,
            shippingCity: document.getElementById('shippingCity').value,
            shipperName: document.getElementById('shipperName').value,
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryCity: document.getElementById('deliveryCity').value,
            receiverName: document.getElementById('receiverName').value,
            carrier: document.getElementById('carrier').value,
            packages: parseInt(document.getElementById('packages').value),
            description: document.getElementById('description').value,
            cargoItems: getCargoItems(),
            id: currentShipmentId || Date.now().toString(),
            status: document.getElementById('deliveryDate').value ? 'delivered' : 'pending'
        };

        // Проверяем обязательные поля
        if (!shipment.shippingDate || !shipment.shippingCity || !shipment.shipperName || 
            !shipment.carrier || !shipment.packages || !shipment.description) {
            throw new Error('Пожалуйста, заполните все обязательные поля');
        }

        // Проверяем наличие позиций груза
        if (!shipment.cargoItems || shipment.cargoItems.length === 0) {
            throw new Error('Добавьте хотя бы одну позицию груза');
        }

        let success;
        if (currentShipmentId) {
            success = await store.updateShipment(currentShipmentId, shipment);
        } else {
            success = await store.addShipment(shipment);
        }

        if (success) {
            showNotification('Груз успешно сохранен', 'success');
            closeModal();
            filterShipments();
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Ошибка при сохранении груза', 'error');
    }
}

async function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
        try {
            await store.clearAllShipments();
            showNotification('Все данные удалены');
            await store.loadShipments();
        } catch (error) {
            showNotification('Ошибка при очистке данных', 'error');
        }
    }
}

// Тема
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? null : 'dark';
    
    body.setAttribute('data-theme', newTheme || '');
    
    const themeButton = document.getElementById('themeButton');
    themeButton.textContent = newTheme === 'dark' ? '☀️' : '🌞';
    
    localStorage.setItem('theme', newTheme || 'light');
}

// Мобильные фильтры
function toggleMobileFilters() {
    const filterBar = document.getElementById('filterBar');
    const button = document.getElementById('mobileFilterButton');
    
    if (filterBar.classList.contains('show')) {
        filterBar.classList.remove('show');
        button.innerHTML = '<span>🔍</span> Показать фильтры';
    } else {
        filterBar.classList.add('show');
        button.innerHTML = '<span>🔽</span> Скрыть фильтры';
    }
}

// Делаем функции глобальными
window.openNewShipmentModal = openNewShipmentModal;
window.editShipment = openEditModal;
window.closeModal = closeModal;
window.saveShipment = saveShipment;
window.deleteShipment = deleteShipment;
window.clearAllData = clearAllData;
window.toggleTheme = toggleTheme;
window.toggleMobileFilters = toggleMobileFilters;
window.filterShipments = filterShipments;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeButton').textContent = '☀️';
    }
    
    // Устанавливаем фильтр на последние 7 дней (включая сегодня)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // -6 дней от сегодня = 7 дней включая сегодня
    
    // Форматируем даты в YYYY-MM-DD с учетом локального времени
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;
    
    document.getElementById('dateFrom').value = sevenDaysAgoStr;
    document.getElementById('dateTo').value = todayStr;
    
    // Закрытие модального окна по клику вне его
    document.getElementById('shipmentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

function addCargoItem() {
    const template = document.getElementById('cargoItemTemplate');
    const cargoItems = document.getElementById('cargoItems');
    const clone = template.content.cloneNode(true);
    
    // Установка номера позиции
    clone.querySelector('.item-number').textContent = cargoItemCounter++;
    
    // Заполнение select опциями типов назначения
    const select = clone.querySelector('.cargo-destination-type');
    Object.values(DESTINATION_TYPES).forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        select.appendChild(option);
    });
    
    cargoItems.appendChild(clone);
}

function removeCargoItem(button) {
    const cargoItem = button.closest('.cargo-item');
    cargoItem.classList.add('removing');
    setTimeout(() => cargoItem.remove(), 300);
}

function handleDestinationTypeChange(select) {
    // Функция оставлена для совместимости и возможных будущих расширений
    console.log('Тип назначения изменен:', select.value);
}

function getCargoItems() {
    const items = [];
    document.querySelectorAll('.cargo-item').forEach(item => {
        items.push({
            description: item.querySelector('.cargo-description').value,
            quantity: parseInt(item.querySelector('.cargo-quantity').value),
            destinationType: item.querySelector('.cargo-destination-type').value
        });
    });
    return items;
} 