# Деплой сайта «Понятная еда» на свой сервер

Инструкция по установке сайта на собственный VPS/сервер **без Neon и без Vercel Blob** — с вашей собственной базой PostgreSQL и хранением файлов на диске сервера.

---

## 1. Что нужно на сервере

- **Node.js 20+** и **npm** (или pnpm)
- **PostgreSQL 14+**
- **nginx** (реверс-прокси + HTTPS) — рекомендуется
- Доменное имя, направленное на IP сервера (например `ponyatnayaeda.ru`)

---

## 2. Поднимаем базу данных PostgreSQL

Да, базу вы поднимаете сами на сервере. Пример для Ubuntu/Debian:

```bash
# Установка
sudo apt update && sudo apt install -y postgresql

# Создаём пользователя и базу
sudo -u postgres psql <<'SQL'
CREATE USER ponyatnaya WITH PASSWORD 'СЛОЖНЫЙ_ПАРОЛЬ';
CREATE DATABASE ponyatnaya OWNER ponyatnaya;
GRANT ALL PRIVILEGES ON DATABASE ponyatnaya TO ponyatnaya;
SQL
```

Строка подключения будет такой:
```
postgresql://ponyatnaya:СЛОЖНЫЙ_ПАРОЛЬ@localhost:5432/ponyatnaya
```

> Локальный Postgres на том же сервере обычно **без SSL** — оставьте `DATABASE_SSL=false`.

---

## 3. Загружаем код и зависимости

```bash
git clone <ваш-репозиторий> ponyatnaya
cd ponyatnaya
npm install
```

---

## 4. Настраиваем переменные окружения

```bash
cp .env.example .env
nano .env
```

### Обязательные переменные

| Переменная | Назначение | Пример |
|---|---|---|
| `DATABASE_URL` | Подключение к вашему PostgreSQL | `postgresql://ponyatnaya:пароль@localhost:5432/ponyatnaya` |
| `DATABASE_SSL` | SSL для БД (локальная — `false`) | `false` |
| `ADMIN_PHONES` | Телефоны админов через запятую (роль по номеру) | `+79001234567` |
| `ADMIN_PASSWORD` | Пароль для входа в режим «Админ» | `ваш_пароль_админа` |

### Необязательные переменные

| Переменная | Назначение |
|---|---|
| `STAFF_PHONES` | Телефоны сотрудников (доступ в панель без прав администратора) |
| `STAFF_PASSWORD` | Пароль для входа в панель (режим «Сотрудник»). Пусто — вход без пароля |
| `UPLOAD_DIR` | Куда сохранять загруженные картинки (по умолчанию `./public/uploads`) |
| `UPLOAD_PUBLIC_BASE` | URL, по которому отдаются картинки (по умолчанию `/uploads`) |
| `BOT_SERVICE_URL` | Адрес Telegram-бота (для рассылок и регистрации через ТГ) |
| `BOT_SERVICE_API_KEY` | Общий секрет с ботом (= `API_SECRET` в боте) |
| `DADATA_API_KEY` | Ключ DaData для автоподсказок адреса |

---

## 5. Что НЕ нужно на своём сервере (лишнее из версии для Vercel)

Эти переменные использовались только в облачной версии и **на вашем сервере не нужны** — их можно не задавать:

| Больше не нужно | Чем заменено |
|---|---|
| `POSTGRES_URL` / `NEON_*` / любые переменные Neon | `DATABASE_URL` (ваш Postgres) |
| `BLOB_READ_WRITE_TOKEN` и всё, что связано с Vercel Blob | Хранение файлов на диске (`UPLOAD_DIR`) |
| `KV_*` / Upstash / Vercel-специфичные ключи | Не используются |

Пакет `@vercel/blob` из зависимостей удалён — загрузка файлов теперь идёт на локальный диск.

---

## 6. Создаём таблицы в базе

Схема создаётся одной командой (Drizzle прочитает `DATABASE_URL` из `.env`):

```bash
npm run db:push
```

Эта команда создаст все таблицы (товары, категории, заказы, пользователи, рассылки и т.д.). Повторный запуск после обновлений кода безопасно применяет изменения схемы.

---

## 7. Готовим папку для загрузок

По умолчанию картинки сохраняются в `public/uploads` и раздаются самим сайтом.

```bash
mkdir -p public/uploads
```

> Совет: чтобы картинки не терялись при передеплое, задайте `UPLOAD_DIR` на постоянную папку вне проекта, например `/var/www/ponyatnaya-uploads`, и раздавайте её через nginx (см. п. 9).

---

## 8. Сборка и запуск

```bash
npm run build
npm run start   # запускает сайт на порту 3000
```

Для постоянной работы используйте PM2:

```bash
sudo npm install -g pm2
pm2 start npm --name ponyatnaya -- start
pm2 save
pm2 startup    # выполните команду, которую предложит pm2
```

---

## 9. nginx + HTTPS

Пример конфигурации `/etc/nginx/sites-available/ponyatnaya`:

```nginx
server {
    server_name ponyatnayaeda.ru www.ponyatnayaeda.ru;

    client_max_body_size 20M;   # чтобы проходили загрузки картинок

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # (необязательно) если вынесли загрузки в отдельную папку через UPLOAD_DIR:
    # location /uploads/ {
    #     alias /var/www/ponyatnaya-uploads/;
    # }
}
```

Включаем сайт и выпускаем сертификат:

```bash
sudo ln -s /etc/nginx/sites-available/ponyatnaya /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ponyatnayaeda.ru -d www.ponyatnayaeda.ru
```

---

## 10. Первый вход в админку

1. Откройте сайт, зарегистрируйтесь по номеру, который вы указали в `ADMIN_PHONES`.
   Роль администратора выдаётся автоматически при входе/регистрации с этого номера.
2. Откройте панель управления. Если задан `STAFF_PASSWORD` — введите его для входа в панель
   (если переменная пуста, вход в панель будет без пароля).
3. Для доступа к настройкам переключитесь в режим «Админ» и введите `ADMIN_PASSWORD`.

> Оба пароля задаются только в `.env` (не в базе). Личные пароли аккаунтов для входа
> в панель больше не используются — панель защищена этими двумя паролями из `.env`.

---

## 11. Telegram-бот (необязательно)

Бот — отдельный сервис в папке `telegram-bot/`. Его инструкция в `telegram-bot/README.md`.
Главное: значение `API_SECRET` в боте должно **совпадать** с `BOT_SERVICE_API_KEY` на сайте, а `BOT_SERVICE_URL` — указывать на публичный адрес бота.

---

## Обновление сайта в будущем

```bash
git pull
npm install
npm run db:push   # если менялась схема БД
npm run build
pm2 restart ponyatnaya
```

---

## Чеклист

- [ ] PostgreSQL создан, `DATABASE_URL` заполнен
- [ ] `.env` заполнен (обязательные переменные)
- [ ] `npm run db:push` выполнен без ошибок
- [ ] `public/uploads` существует и доступна на запись
- [ ] `npm run build` прошёл, сайт запущен через PM2
- [ ] nginx настроен, HTTPS выпущен
- [ ] Вход в админку под номером из `ADMIN_PHONES` работает
