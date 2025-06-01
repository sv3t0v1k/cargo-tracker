// Типы назначения груза
const DESTINATION_TYPES = {
    SALE: {
        id: 'sale',
        name: 'Продажа'
    },
    RENT_RETURN: {
        id: 'rent_return',
        name: 'Аренда с возвратом'
    },
    RENT_NO_RETURN: {
        id: 'rent_no_return',
        name: 'Аренда без возврата'
    },
    SERVICE: {
        id: 'service',
        name: 'Сервисное обслуживание'
    }
};

// Экспортируем константы
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DESTINATION_TYPES };
} 