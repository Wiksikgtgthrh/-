# Оптимизация сервера (nginx) и порядок деплоя

Кодовая оптимизация (карточки, изображения, бандл, кэши API, SEO) живёт в
коммите «Полная оптимизация сайта и карточек товаров». Ниже — серверная часть,
которая применяется один раз вручную на VPS.

## Деплой обновления

```bash
ssh root@<IP>
cd <папка проекта>          # там, где лежит next.config.mjs
git pull
npm ci                       # только если менялся package.json (в этом релизе — нет)
npm run build                # postbuild сам прогонит сид; БД берётся из .env
pm2 restart ponyatnaya       # имя процесса из pm2 ls
```

Проверка после деплоя:

```bash
curl -sI https://ponyatnayaeda.ru/images/products/borsch.png | grep -i cache-control   # public, max-age=86400
curl -sI -H "Accept: image/avif" "https://ponyatnayaeda.ru/_next/image?url=%2Fimages%2Fproducts%2Fborsch.png&w=640&q=75" | grep -iE "content-type|cache-control"
curl -s -o /dev/null -w "%{http_code}\n" https://ponyatnayaeda.ru/images/categories/нет-такого.png   # 404, а не 200
```

## nginx: HTTP/2 и кэш статики

Текущая конфигурация отдаёт всё через HTTP/1.1 и не кэширует статику в браузере
дольше заголовков Next.js. Рекомендуется добавить в server-блок сайта:

```nginx
server {
    listen 443 ssl;
    http2 on;                              # nginx >= 1.25.1 (или `listen 443 ssl http2;` на старых)
    server_name ponyatnayaeda.ru www.ponyatnayaeda.ru;

    client_max_body_size 20M;

    # Статика Next.js: имена файлов содержат хэш — кэш навсегда.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Загрузки админа (имена уникальны: timestamp+random) — тоже immutable.
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Картинки из репозитория — сутки.
    location /images/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Если загрузки вынесены из проекта через `UPLOAD_DIR` (например
`/var/www/ponyatnaya-uploads`), блок `/uploads/` должен раздавать их с диска:

```nginx
    location /uploads/ {
        alias /var/www/ponyatnaya-uploads/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }
```

После правок: `nginx -t && systemctl reload nginx`.

## gzip

gzip в nginx уже включён (HTML и JS уходят сжатые). Убедитесь, что в
конфигурации есть типы для JS/CSS/JSON/SVG:

```nginx
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               image/svg+xml application/xml;
    gzip_min_length 1024;
```

## Что даёт оптимизация (замеры до/после)

| Показатель | До | После |
|---|---|---|
| Картинка карточки товара | ~2 МБ PNG, `max-age=0` | ~26 КБ AVIF, immutable-кэш |
| Запросов `/api/admin/settings` за открытие главной | ~116 (по одному на карточку) | 1 (single-flight + TTL 60 c) |
| Карточек в DOM на главной | все 116 | витрины по 8 + «Показать ещё» по 24 в каталоге |
| Админ-панель в начальном бандле | да (~2000 строк + 12 подмодулей) | отдельный lazy-чанк, грузится при открытии |
| Ассеты `public/images` в репозитории | 24 МБ | 7,2 МБ |
| Несуществующие файлы (`/images/…png`) | 200 + HTML (soft-404) | честный 404 |
| Мета-теги/OG/JSON-LD страниц товаров | общие для всего сайта | генерируются из БД на сервере |
| sitemap.xml / robots.txt | нет | есть, собираются из БД |
