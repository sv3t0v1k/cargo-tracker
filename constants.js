// Типы назначения груза
const DESTINATION_TYPES = {
    SALE: {
        id: 'sale',
        name: 'Продажа',
        requiresReturn: false
    },
    RENT_RETURN: {
        id: 'rent_return',
        name: 'Аренда с возвратом',
        requiresReturn: true
    },
    RENT_NO_RETURN: {
        id: 'rent_no_return',
        name: 'Аренда без возврата',
        requiresReturn: false
    },
    SERVICE: {
        id: 'service',
        name: 'Сервисное обслуживание',
        requiresReturn: true
    },
    WARRANTY: {
        id: 'warranty',
        name: 'Гарантийная замена',
        requiresReturn: true
    }
};

// Экспортируем константы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DESTINATION_TYPES };
} 