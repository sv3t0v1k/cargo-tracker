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
            showNotification('Ошибка при сохранении данных', 'error');
        }
    }

    async addShipment(shipment) {
        shipment.id = Date.now().toString();
        shipment.status = shipment.deliveryDate ? 'delivered' : 'pending';
        this.shipments.push(shipment);
        await this.saveShipments();
        return shipment;
    }

    async updateShipment(id, updatedShipment) {
        const index = this.shipments.findIndex(s => s.id === id);
        if (index !== -1) {
            updatedShipment.status = updatedShipment.deliveryDate ? 'delivered' : 'pending';
            this.shipments[index] = { ...this.shipments[index], ...updatedShipment };
            await this.saveShipments();
            return true;
        }
        return false;
    }

    async deleteShipment(id) {
        const index = this.shipments.findIndex(s => s.id === id);
        if (index !== -1) {
            this.shipments.splice(index, 1);
            await this.saveShipments();
            return true;
        }
        return false;
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
let currentFilters = {
    dateFrom: '',
    dateTo: '',
    status: '',
    city: '',
    search: ''
};

// Утилиты
function formatDate(dateString) {
    if (!dateString) return '';
    
    if (typeof dateString === 'string' && dateString.includes('.')) {
        return dateString;
    }
    
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
function renderShipments(shipments) {
    // Рендеринг для десктопа
    const tbody = document.querySelector('#shipmentsTable tbody');
    
    if (tbody.children.length > 0) {
        Array.from(tbody.children).forEach((row, index) => {
            row.style.animation = `slideInUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse`;
            row.style.animationDelay = `${index * 0.03}s`;
        });
        
        setTimeout(() => {
            tbody.innerHTML = '';
            addNewRows();
        }, Math.min(shipments.length * 30 + 150, 400));
    } else {
        addNewRows();
    }

    function addNewRows() {
        shipments.forEach((shipment, index) => {
            const tr = document.createElement('tr');
            tr.style.opacity = '0';
            tr.innerHTML = `
                <td>${formatDate(shipment.shippingDate)}</td>
                <td>${shipment.shippingCity}</td>
                <td>${shipment.shipperName}</td>
                <td>${formatDate(shipment.deliveryDate)}</td>
                <td>${shipment.deliveryCity || ''}</td>
                <td>${shipment.receiverName || ''}</td>
                <td>${shipment.carrier}</td>
                <td>${shipment.packages}</td>
                <td>${shipment.description}</td>
                <td><span class="status-${shipment.status}">${shipment.status === 'delivered' ? 'Доставлен' : 'В пути'}</span></td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="editShipment('${shipment.id}')">✏️</button>
                    <button class="btn btn-danger" onclick="deleteShipment('${shipment.id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
            
            setTimeout(() => {
                tr.style.animation = `slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                tr.style.opacity = '1';
            }, index * 60);
        });
    }

    // Рендеринг для мобильных
    const mobileCards = document.getElementById('mobileCards');
    
    if (mobileCards.children.length > 0) {
        Array.from(mobileCards.children).forEach((card, index) => {
            card.style.animation = `slideInUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse`;
            card.style.animationDelay = `${index * 0.04}s`;
        });
        
        setTimeout(() => {
            mobileCards.innerHTML = '';
            addNewCards();
        }, Math.min(shipments.length * 40 + 200, 500));
    } else {
        addNewCards();
    }

    function addNewCards() {
        shipments.forEach((shipment, index) => {
            const card = document.createElement('div');
            card.className = 'mobile-card';
            card.style.opacity = '0';
            
            const statusClass = shipment.status === 'delivered' ? 'delivered' : 'pending';
            const statusText = shipment.status === 'delivered' ? 'Доставлен' : 'В пути';
            
            card.innerHTML = `
                <div class="mobile-field">
                    <div class="mobile-field-label">Дата отправки:</div>
                    <div class="mobile-field-value">${formatDate(shipment.shippingDate)}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Город отправления:</div>
                    <div class="mobile-field-value">${shipment.shippingCity}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Отправитель:</div>
                    <div class="mobile-field-value">${shipment.shipperName}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Дата получения:</div>
                    <div class="mobile-field-value">${formatDate(shipment.deliveryDate)}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Город получения:</div>
                    <div class="mobile-field-value">${shipment.deliveryCity || ''}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Получатель:</div>
                    <div class="mobile-field-value">${shipment.receiverName || ''}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Перевозчик:</div>
                    <div class="mobile-field-value">${shipment.carrier}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Мест:</div>
                    <div class="mobile-field-value">${shipment.packages}</div>
                </div>
                <div class="mobile-field description">
                    <div class="mobile-field-label">Описание:</div>
                    <div class="mobile-field-value">${shipment.description}</div>
                </div>
                <div class="mobile-field">
                    <div class="mobile-field-label">Статус:</div>
                    <div class="mobile-field-value">
                        <span class="mobile-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="mobile-field actions">
                    <div class="mobile-actions">
                        <button class="btn btn-secondary" onclick="editShipment('${shipment.id}')">✏️ Изменить</button>
                        <button class="btn btn-danger" onclick="deleteShipment('${shipment.id}')">🗑️ Удалить</button>
                    </div>
                </div>
            `;
            mobileCards.appendChild(card);
            
            setTimeout(() => {
                card.style.animation = `slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                card.style.opacity = '1';
            }, index * 100);
        });
    }
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
        filtered = filtered.filter(s => s.shippingDate >= currentFilters.dateFrom);
    }
    if (currentFilters.dateTo) {
        filtered = filtered.filter(s => s.shippingDate <= currentFilters.dateTo);
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

function editShipment(id) {
    const shipment = store.getShipments().find(s => s.id === id);
    if (shipment) {
        document.getElementById('modalTitle').textContent = 'Редактировать отправку';
        document.getElementById('shipmentId').value = id;
        
        const fields = [
            { id: 'shippingDate', value: convertToInputDate(shipment.shippingDate) },
            { id: 'shippingCity', value: shipment.shippingCity },
            { id: 'shipperName', value: shipment.shipperName },
            { id: 'deliveryDate', value: convertToInputDate(shipment.deliveryDate) },
            { id: 'deliveryCity', value: shipment.deliveryCity || '' },
            { id: 'receiverName', value: shipment.receiverName || '' },
            { id: 'carrier', value: shipment.carrier },
            { id: 'packages', value: shipment.packages },
            { id: 'description', value: shipment.description }
        ];
        
        const modal = document.getElementById('shipmentModal');
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.animation = 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            modal.style.opacity = '1';
            
            fields.forEach((field, index) => {
                setTimeout(() => {
                    const element = document.getElementById(field.id);
                    element.style.animation = 'pulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    element.value = field.value;
                }, index * 120);
            });
        }, 10);
    }
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
    
    const formData = {
        shippingDate: document.getElementById('shippingDate').value,
        shippingCity: document.getElementById('shippingCity').value,
        shipperName: document.getElementById('shipperName').value,
        deliveryDate: document.getElementById('deliveryDate').value,
        deliveryCity: document.getElementById('deliveryCity').value,
        receiverName: document.getElementById('receiverName').value,
        carrier: document.getElementById('carrier').value,
        packages: parseInt(document.getElementById('packages').value),
        description: document.getElementById('description').value
    };
    
    const shipmentId = document.getElementById('shipmentId').value;
    
    try {
        if (shipmentId) {
            await store.updateShipment(shipmentId, formData);
            showNotification('Отправка обновлена');
        } else {
            await store.addShipment(formData);
            showNotification('Отправка добавлена');
        }
        
        closeModal();
        filterShipments();
    } catch (error) {
        showNotification('Ошибка при сохранении', 'error');
    }
}

// Удаление данных
async function deleteShipment(id) {
    if (confirm('Вы уверены, что хотите удалить эту отправку?')) {
        try {
            await store.deleteShipment(id);
            showNotification('Отправка удалена');
            filterShipments();
        } catch (error) {
            showNotification('Ошибка при удалении', 'error');
        }
    }
}

async function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
        try {
            await store.clearAllShipments();
            showNotification('Все данные удалены');
            filterShipments();
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

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeButton').textContent = '☀️';
    }
    
    // Устанавливаем фильтр на последние 7 дней
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
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
    
    console.log('Приложение инициализировано');
}); 