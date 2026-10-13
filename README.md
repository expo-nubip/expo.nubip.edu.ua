# EXPO NUBIP — сайт виставки

Статичний односторінковий сайт (HTML + CSS + JS), без бази даних і без збірки. Працює на GitHub Pages.

## Структура

```
index.html            — уся сторінка
css/style.css         — стилі
js/config.js          — НАЛАШТУВАННЯ (дата, логотипи, посилання, GitHub-авто)
js/main.js            — логіка (меню, таймер, логотипи, галерея)
images/logo/          — логотип сайту (logo.svg)
images/hero/          — фонові зображення верхнього екрана (див. README у папці)
images/gallery/       — фото для галереї
images/team/          — фото команди
images/social/        — (резерв) власні іконки соцмереж
logos/general-partners/ — генеральні партнери
logos/partners/         — партнери
logos/sponsors/         — спонсори
logos/participants/     — учасники
logos/info-partners/    — інформаційні партнери
```

## Як додати логотип

1. Покладіть файл (PNG/SVG/JPG/WebP) у потрібну папку `logos/...`.
2. Додайте рядок у `js/config.js`:
   `{ file: "company.png", name: "Назва", url: "https://company.com" }`

Або увімкніть автопідхоплення: у `config.js` встановіть `github.enabled: true`, вкажіть `owner`, `repo`, `branch` — тоді всі зображення з папок підтягуватимуться самі (публічний репозиторій).

## Публікація на GitHub Pages

1. Створіть репозиторій на github.com і завантажте вміст цієї папки в корінь.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Сайт буде за адресою `https://<owner>.github.io/<repo>/`.

## Що потрібно замінити

У `index.html` позначено `TODO`: цифри, опис, експозиція, програма, команда, адреса, телефон.
Дату таймера задайте в `js/config.js` (`eventDate`).
Іконки соцмереж — спрощені вбудовані SVG; за потреби замініть на офіційні.
