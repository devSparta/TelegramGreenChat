# Локальный запуск Telegram Green Chat

## Требования

- Node.js 20 или новее;
- npm;
- авторизованный Telegram-инстанс GREEN-API;
- idInstance и apiTokenInstance из личного кабинета GREEN-API.

## Установка

Клонируйте репозиторий и перейдите в каталог проекта:

```bash
git clone https://github.com/devSparta/TelegramGreenChat
cd telegram-green-chat
```

Установите зависимости из `package-lock.json`:

```bash
npm ci
```

## Запуск в режиме разработки

```bash
npm run dev
```

Откройте адрес, который Vite выведет в терминале. По умолчанию:

```text
http://localhost:5173
```

В форме подключения укажите:

1. idInstance;
2. apiTokenInstance;
3. apiUrl, только если он отличается от стандартного адреса GREEN-API.

После проверки авторизованного инстанса откроется интерфейс чатов.

## Проверка production-сборки

Соберите приложение:

```bash
npm run build
```

Запустите локальный просмотр сборки:

```bash
npm run preview
```

По умолчанию production-сборка будет доступна по адресу:

```text
http://localhost:4173
```
