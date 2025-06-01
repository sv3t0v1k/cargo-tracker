# Инструкция по деплою на сервер

## Подготовка сервера

### 1. Установка Node.js (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Создание пользователя для приложения
```bash
sudo useradd -m -s /bin/bash cargo-tracker
sudo mkdir -p /home/cargo-tracker/app
sudo chown cargo-tracker:cargo-tracker /home/cargo-tracker/app
```

## Деплой приложения

### 1. Загрузка кода
```bash
# Переключаемся на пользователя приложения
sudo su - cargo-tracker

# Клонируем репозиторий или загружаем файлы
cd /home/cargo-tracker/app
# Скопируйте все файлы проекта сюда

# Устанавливаем зависимости
npm install --production
```

### 2. Создание systemd сервиса
```bash
sudo nano /etc/systemd/system/cargo-tracker.service
```

Содержимое файла:
```ini
[Unit]
Description=Cargo Tracker
After=network.target

[Service]
Type=simple
User=cargo-tracker
WorkingDirectory=/home/cargo-tracker/app
ExecStart=/usr/bin/node server.js
Environment=PORT=3000
Environment=NODE_ENV=production
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Запуск сервиса
```bash
sudo systemctl daemon-reload
sudo systemctl enable cargo-tracker
sudo systemctl start cargo-tracker
sudo systemctl status cargo-tracker
```

## Настройка Nginx (опционально)

### 1. Установка Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Настройка виртуального хоста
```bash
sudo nano /etc/nginx/sites-available/cargo-tracker
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Активация конфигурации
```bash
sudo ln -s /etc/nginx/sites-available/cargo-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Мониторинг и логи

### Просмотр логов
```bash
sudo journalctl -u cargo-tracker -f
```

### Проверка статуса
```bash
sudo systemctl status cargo-tracker
curl http://localhost:3000/health
```

### Перезапуск сервиса
```bash
sudo systemctl restart cargo-tracker
```

## Резервное копирование

### Создание бэкапа данных
```bash
sudo cp /home/cargo-tracker/app/data/shipments.json /backup/shipments-$(date +%Y%m%d).json
```

### Автоматический бэкап (crontab)
```bash
sudo crontab -e
```

Добавить строку:
```
0 2 * * * cp /home/cargo-tracker/app/data/shipments.json /backup/shipments-$(date +\%Y\%m\%d).json
```

## Обновление приложения

```bash
sudo systemctl stop cargo-tracker
sudo su - cargo-tracker
cd /home/cargo-tracker/app

# Создаем бэкап данных
cp data/shipments.json data/shipments.backup

# Обновляем код
# (загружаем новые файлы)

# Устанавливаем зависимости
npm install --production

# Запускаем сервис
exit
sudo systemctl start cargo-tracker
``` 