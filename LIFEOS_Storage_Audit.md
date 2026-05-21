# LIFEOS — Полный аудит хранения данных
**Senior Frontend Architect / Storage Architecture Audit**  
Дата: 20 мая 2026 · Версия 1.0

---

## КРИТИЧЕСКАЯ НАХОДКА (Прочти первым)

> **Приложение LIFEOS в текущем состоянии не сохраняет НИКАКИЕ пользовательские данные.**  
> Все данные (`CATEGORIES`, `WEEK_BLOCKS`, `ALL_DAY`) жёстко прописаны в `data.jsx`.  
> `QuickAdd` создаёт блоки только визуально — при закрытии они пропадают.  
> Чекбоксы в чеклисте сбрасываются при закрытии оверлея.  
> `useTweaks` отправляет настройки через `postMessage` в родительский iframe (редактор FleetView/Cowork) — в реальном браузере это не работает.  
>
> **LIFEOS сейчас — это UI-прототип без единой строки персистентности.**

---

## ЭТАП 1 — Карта данных приложения

### 1.1 Полный реестр сущностей

| Сущность | Файл | Тип | Объём | Критичность | Частота изменений |
|---|---|---|---|---|---|
| `CATEGORIES` (7 категорий) | data.jsx | Конфиг + пользовательские данные | ~15 KB JSON | 🔴 КРИТИЧНО | Редко (1-2×/месяц) |
| `goals[]` (17 целей) | data.jsx → CATEGORIES | Структурированные данные | ~3 KB | 🔴 КРИТИЧНО | Еженедельно |
| `goal.progress` (%) | data.jsx | Числовое состояние | ~200 байт | 🔴 КРИТИЧНО | Ежедневно |
| `category.notes` | data.jsx | Текст | ~2 KB | 🟠 ВАЖНО | Еженедельно |
| `category.links[]` | data.jsx | Массив ссылок | ~2 KB | 🟠 ВАЖНО | Иногда |
| `category.history[]` | data.jsx | 12-недельные массивы | ~1 KB | 🟠 ВАЖНО | Еженедельно |
| `WEEK_BLOCKS` (~70 блоков) | data.jsx | Основные данные | ~25 KB | 🔴 КРИТИЧНО | Ежедневно |
| `block.checklist` | data.jsx | Массив строк | ~5 KB | 🟠 ВАЖНО | Ежедневно |
| `checkedItems` (состояние) | overlays.jsx (useState) | Эфемерное состояние | ~100 байт | 🟡 УМЕРЕННО | Ежедневно |
| `ALL_DAY` ремайндеры | data.jsx | Задачи без времени | ~500 байт | 🟠 ВАЖНО | Ежедневно |
| `TWEAK_DEFAULTS` (тема/палитра) | app.jsx | UI-настройки | ~100 байт | 🟢 НИЗКО | Редко |
| `catFilters` | app.jsx (useState) | UI-состояние | ~50 байт | 🟢 НИЗКО | Сессия |
| `view` / `selectedDay` | app.jsx (useState) | UI-состояние | ~20 байт | 🟢 НИЗКО | Сессия |

### 1.2 Жизненный цикл каждой сущности

```
WEEK_BLOCKS (основные календарные данные)
  ├── Создаются: через QuickAdd (пока не работает)
  ├── Изменяются: открытие блока → редактирование notes/checklist
  ├── Повторяющиеся (recur:true): копируются на следующую неделю автоматически
  └── Удаляются: редко, только по желанию пользователя

CATEGORIES.goals[].progress
  ├── Обновляется: вручную при выполнении milestone
  ├── Привязан к категории (7 сущностей)
  └── Не должен теряться НИКОГДА (стрики, прогресс года)

checkedItems (чеклист в BlockOverlay)
  ├── Создаётся: клик по пункту чеклиста
  ├── Должен: сохраняться как минимум на день (ежедневные задачи)
  └── СЕЙЧАС: сбрасывается при закрытии оверлея (критический баг)

TWEAK_DEFAULTS
  ├── Изменяется: Tweaks Panel (palette, theme, density)
  └── СЕЙЧАС: postMessage в parent iframe — не работает в браузере
```

### 1.3 Оценка объёма данных

```
Текущий снимок:          ~45 KB JSON
За 1 год (блоки):        ~1.3 MB (70 блоков/неделя × 52 недели)
За 3 года:               ~4 MB
С историей активности:   ~6 MB
Медиа/вложения:          не реализованы (только ссылки)
ИТОГО максимум:          ~10 MB за 5 лет
```

**Вывод: объём данных минимальный.** Любое браузерное хранилище справится.

---

## ЭТАП 2 — Анализ механизмов хранения

### 2.1 LocalStorage

| Параметр | Значение |
|---|---|
| Лимит | 5-10 MB (строки, JSON.stringify) |
| Скорость | Мгновенно (синхронный, блокирует поток) |
| API | `localStorage.setItem(key, JSON.stringify(data))` |
| Устойчивость к очистке кэша | ❌ Удаляется вместе с "Site Data" |
| Устойчивость к переустановке браузера | ❌ Полная потеря |
| Устойчивость к смене устройства | ❌ Только на одном устройстве |

**Плюсы:** Простейший API, моментальная запись, нет async/await, работает на `file://`.  
**Минусы:** Синхронный (блокирует UI при больших данных), нет транзакций, 5-10 MB лимит, JSON-only.  
**Для LIFEOS:** ✅ Подходит для UI-настроек (tweaks, catFilters, lastView). ❌ Ненадёжен для основных данных — слишком легко потерять при "Clear site data".

---

### 2.2 SessionStorage

| Параметр | Значение |
|---|---|
| Лимит | 5-10 MB |
| Скорость | Мгновенно |
| Устойчивость | ❌ Удаляется при закрытии вкладки |

**Для LIFEOS:** ❌ Полностью не подходит. Теряет данные при каждом закрытии браузера.

---

### 2.3 IndexedDB

| Параметр | Значение |
|---|---|
| Лимит | Сотни MB / ГБ (квота от объёма диска) |
| Скорость | Быстро (асинхронный, не блокирует UI) |
| API | Промисы / async-await (через idb-keyval или Dexie.js) |
| Транзакции | ✅ Полные ACID-транзакции |
| Структура | Объектные хранилища (как таблицы), индексы |
| Устойчивость к обычной очистке кэша | ⚠️ Иногда удаляется (зависит от браузера) |
| Устойчивость к "Clear site data" | ❌ Удаляется |
| Работа на `file://` | ✅ Работает |
| Service Workers | ✅ Доступен из SW |

**Плюсы:** Мощный, большой лимит, транзакционность, индексы, работает офлайн, доступен из Service Worker.  
**Минусы:** Удаляется при "Clear All Site Data", сложный нативный API (решается Dexie.js/idb).  
**Для LIFEOS:** ✅ **Основное хранилище данных.** Идеально для WEEK_BLOCKS, CATEGORIES, goals.

---

### 2.4 Cache API (Service Worker Cache)

| Параметр | Значение |
|---|---|
| Лимит | Сотни MB |
| Назначение | Кэш HTTP-ответов (HTML, JS, CSS, API) |
| Устойчивость к очистке кэша | ❌ Удаляется при "Clear cache" |
| Работа на `file://` | ❌ Service Workers не работают на `file://` |

**Для LIFEOS:** ❌ Не подходит для хранения данных. Используется для офлайн-доступа к самому приложению (при PWA), но не для пользовательских данных.

---

### 2.5 Service Worker Storage

| Параметр | Значение |
|---|---|
| Что хранит | Только через Cache API или IndexedDB из SW |
| Работа на `file://` | ❌ Не поддерживается |
| Ценность | Офлайн-работа приложения, фоновая синхронизация |

**Для LIFEOS:** ⚠️ Полезен только при переводе на PWA (HTTPS + доменное имя). Не для хранения данных напрямую.

---

### 2.6 File System Access API (FSAA)

| Параметр | Значение |
|---|---|
| Что делает | Читает/пишет реальные файлы на диске пользователя |
| API | `showOpenFilePicker()`, `showSaveFilePicker()` — требует жеста пользователя |
| Устойчивость | ✅✅✅ Максимальная — файл на диске, не трогается браузером |
| Работа на `file://` | ❌ Только на HTTPS / localhost |
| Постоянное разрешение | ✅ `FileSystemFileHandle` можно сохранить в IndexedDB |

**Плюсы:** Данные живут в реальном файле на диске. Никакая очистка браузера не тронет. Пользователь может бэкапировать файл как угодно. Открывается в любом редакторе.  
**Минусы:** Требует однократного выбора файла пользователем. Только HTTPS/localhost. Нет Safari < 15.2.  
**Для LIFEOS:** ✅✅ **Золотой стандарт устойчивости.** Идеально как слой записи на диск (`lifeos-data.json` на рабочем столе пользователя).

---

### 2.7 Browser Persistent Storage (StorageManager.persist())

| Параметр | Значение |
|---|---|
| Что делает | Запрашивает "стойкий" статус для IndexedDB/Cache |
| API | `await navigator.storage.persist()` |
| Эффект | Браузер не удаляет данные автоматически при нехватке места |
| Устойчивость к "Clear site data" | ❌ Всё равно удаляется при явной очистке пользователем |

**Для LIFEOS:** ✅ Нужно вызывать при первом запуске. Защищает от автоматической эвикции IndexedDB браузером. Не защищает от "Clear site data" пользователем.

---

### 2.8 PWA Storage (Web App Manifest + Service Worker)

| Параметр | Значение |
|---|---|
| Что даёт | Установка на устройство, офлайн-работа, иконка |
| Хранение | Использует Cache API + IndexedDB |
| Требования | HTTPS, manifest.json, Service Worker |
| Устойчивость данных | Та же, что у IndexedDB |

**Для LIFEOS:** ⚠️ Полезно для UX (установка как приложение), но не решает проблему хранения. Требует перехода с `file://` на `localhost` или хостинг.

---

### 2.9 SQLite WASM (sqlite3 в браузере)

| Параметр | Значение |
|---|---|
| Что такое | SQLite, скомпилированный в WebAssembly |
| Хранение | В памяти или через OPFS |
| Лимит | Ограничен OPFS (гигабайты) |
| Скорость | Очень быстро, SQL-запросы |
| Сложность реализации | Высокая (1.5 MB WASM, инициализация) |

**Для LIFEOS:** ❌ Избыточно. Данные LIFEOS — простые JSON-документы, не реляционные таблицы. SQLite WASM оправдан для 50+ таблиц и сложных JOIN-запросов. Здесь это пушка по воробьям.

---

### 2.10 OPFS (Origin Private File System)

| Параметр | Значение |
|---|---|
| Что такое | Приватная файловая система браузера (не видна пользователю в проводнике) |
| Лимит | Гигабайты (квота от объёма диска) |
| Скорость | Очень быстро (синхронный доступ из Worker) |
| API | `navigator.storage.getDirectory()` |
| Устойчивость к очистке кэша | ⚠️ Удаляется с "Clear site data" |
| Устойчивость к автоматической эвикции | ✅ Более стойкий, чем обычный IndexedDB |
| Работа на `file://` | ❌ Только HTTPS / localhost |

**Плюсы:** Очень быстрый, большой объём, подходит для файловых снапшотов.  
**Минусы:** Файлы не видны пользователю. Удаляется с "Clear site data" (так же, как IndexedDB).  
**Для LIFEOS:** ✅ Отличен для автоматических JSON-снапшотов резервных копий. Не для основного хранилища (нет гарантий при очистке).

---

### 2.11 Локальные файлы (File System Access API + реальный диск)

| Параметр | Значение |
|---|---|
| Устойчивость к очистке браузера | ✅✅✅ АБСОЛЮТНАЯ |
| Устойчивость к переустановке браузера | ✅✅✅ АБСОЛЮТНАЯ |
| Устойчивость к смене устройства | ⚠️ Только при ручном копировании файла |
| UX | Однократный выбор файла / папки при первом запуске |
| Сложность реализации | Средняя |

**Для LIFEOS:** ✅✅ **Лучший вариант для устойчивости к браузерным очисткам.** Пользователь один раз выбирает файл `lifeos-data.json` (например, на рабочем столе или в Dropbox-папке), приложение запоминает handle в IndexedDB и далее читает/пишет автоматически.

---

### 2.12 GitHub Gist

| Параметр | Значение |
|---|---|
| Что такое | Приватный JSON-файл в GitHub, доступный через API |
| Требования | GitHub-аккаунт + Personal Access Token (PAT) |
| Лимит файла | 100 MB на Gist |
| Устойчивость к смене устройства | ✅✅✅ |
| Устойчивость к очистке браузера | ✅✅✅ |
| Offline-работа | ❌ Нужен интернет для sync |
| Backend | ❌ Нет (GitHub API — чужой) |
| Сложность реализации | Низкая (один fetch()) |

**Для LIFEOS:** ✅✅ **Лучший вариант cloud-бэкапа без своего сервера.** PAT вводится один раз, хранится в localStorage. Синхронизация — один PUT-запрос. Бесплатно навсегда.

---

### 2.13 Telegram Saved Messages

| Параметр | Значение |
|---|---|
| Что такое | Отправка JSON в "Избранное" через Telegram Bot API |
| Требования | Telegram Bot Token + chat_id |
| Устойчивость | ✅ (история Telegram) |
| Offline | ❌ |
| Сложность | Средняя |

**Для LIFEOS:** ⚠️ Нестандартно. Надёжность зависит от Telegram. Неудобно при восстановлении (надо искать сообщение). Не рекомендуется как основной вариант.

---

### 2.14 Google Drive

| Параметр | Значение |
|---|---|
| Требования | Google-аккаунт, OAuth 2.0 |
| Устойчивость | ✅✅✅ |
| Сложность реализации | Высокая (OAuth flow, token refresh) |
| Offline | ✅ (кэш + фоновая синхронизация) |

**Для LIFEOS:** ⚠️ Слишком сложный OAuth для одного пользователя. GitHub Gist проще при сопоставимой надёжности.

---

### 2.15 Dropbox

Аналогично Google Drive. OAuth сложнее, чем GitHub PAT. ⚠️ Не рекомендуется.

---

### 2.16 Краткая сравнительная таблица

| Механизм | Объём | Надёжность | Устойчивость к Clear Cache | Смена устройства | Сложность | Для LIFEOS |
|---|---|---|---|---|---|---|
| LocalStorage | 5 MB | Средняя | ❌ | ❌ | Минимальная | ✅ Только UI-настройки |
| SessionStorage | 5 MB | Низкая | ❌ | ❌ | Минимальная | ❌ |
| IndexedDB | ГБ | Высокая | ❌ | ❌ | Низкая (Dexie) | ✅ Основной store |
| Storage.persist() | — | +бонус | ❌ | ❌ | Минимальная | ✅ Вызвать при старте |
| OPFS | ГБ | Высокая | ❌ | ❌ | Средняя | ✅ Автоснапшоты |
| File System Access API | Неограничен | ✅✅✅ | ✅✅✅ | ❌ | Средняя | ✅✅ Слой записи на диск |
| SQLite WASM | ГБ | Высокая | ❌ | ❌ | Высокая | ❌ Избыточно |
| Service Worker | — | — | ❌ | ❌ | Высокая | ⚠️ Только PWA |
| GitHub Gist | 100 MB | ✅✅✅ | ✅✅✅ | ✅✅✅ | Низкая | ✅✅ Cloud-бэкап |
| Google Drive | ГБ | ✅✅✅ | ✅✅✅ | ✅✅✅ | Высокая | ⚠️ Слишком сложно |
| Telegram | — | Средняя | ✅ | ✅ | Средняя | ❌ |

---

## ЭТАП 3 — Оптимальная архитектура

### Принцип: Three-Layer Resilience (Три слоя защиты)

```
┌─────────────────────────────────────────────────────┐
│  СЛОЙ 1: IndexedDB  (Первичное хранилище)           │
│  • Все данные приложения (Dexie.js)                 │
│  • Быстрое чтение/запись без UI-задержек            │
│  • + Storage.persist() при первом запуске           │
├─────────────────────────────────────────────────────┤
│  СЛОЙ 2: Реальный файл на диске  (Защита от кэша)   │
│  • File System Access API → lifeos-data.json        │
│  • Запись при каждом изменении (debounced, 2s)      │
│  • FileSystemFileHandle сохранён в IndexedDB        │
│  • Папка может быть Dropbox / iCloud / OneDrive     │
├─────────────────────────────────────────────────────┤
│  СЛОЙ 3: GitHub Gist  (Cloud backup)                │
│  • Автосинхронизация каждые 15 минут               │
│  • Personal Access Token в localStorage             │
│  • Восстановление на любом устройстве              │
└─────────────────────────────────────────────────────┘

localStorage: UI-настройки (theme, palette, density) — только они
```

### Поток данных

```
Пользователь создаёт/изменяет данные
    │
    ▼
React State (немедленный отклик UI)
    │
    ├──► IndexedDB (Dexie) ─────► немедленно, async
    │        │
    │        └──► Storage.persist() при первом запуске
    │
    ├──► File System Access API ─► debounced 2 сек
    │        └─► lifeos-data.json (реальный файл на диске)
    │
    └──► GitHub Gist ────────────► debounced 15 мин
             └─► PUT /gists/{id}  (один JSON-файл)

При открытии приложения:
    1. Попытка загрузить из IndexedDB (быстро, офлайн)
    2. Если пусто → загрузить из File System (если файл выбран)
    3. Если файл недоступен → загрузить из GitHub Gist
    4. Если всё недоступно → показать данные по умолчанию + предложить импорт
```

---

## ЭТАП 4 — План реализации

### 4.1 Файловая структура

```
LIFEOS/
├── index.html
├── app.jsx           ← добавить StorageManager
├── data.jsx          ← удалить хардкод, заменить defaultData
├── views.jsx
├── overlays.jsx      ← QuickAdd теперь реально сохраняет
├── tweaks-panel.jsx
├── styles.css
│
└── storage/          ← НОВЫЕ ФАЙЛЫ
    ├── db.js         ← Dexie.js schema + helper functions
    ├── sync.js       ← GitHub Gist sync + File System Access
    ├── migrations.js ← схема версий базы данных
    └── defaults.js   ← начальные данные (из data.jsx)
```

### 4.2 Схема базы данных (Dexie.js)

```javascript
// storage/db.js
import Dexie from 'https://esm.sh/dexie@4';

export const db = new Dexie('LIFEOS');

db.version(1).stores({
  // Категории жизни (business, health, etc.)
  categories: 'id, name',
  
  // Временные блоки
  blocks: 'id, day, cat, start, [day+cat]',
  
  // Состояние чеклистов (ключ: blockId → Set завершённых индексов)
  checklistState: 'blockId',
  
  // Задачи без времени (All-Day)
  allDay: 'id, day, cat, type',
  
  // UI-настройки (один объект)
  settings: 'key',
  
  // Метаданные синхронизации
  syncMeta: 'key',
  
  // Версионные снапшоты (для отката)
  snapshots: '++id, createdAt',
});

// Хелперы для удобной работы

export async function loadAllData() {
  const [categories, blocks, allDay] = await Promise.all([
    db.categories.toArray(),
    db.blocks.toArray(),
    db.allDay.toArray(),
  ]);
  return { categories, blocks, allDay };
}

export async function saveBlock(block) {
  await db.blocks.put(block);
  onDataChanged(); // триггер синхронизации
}

export async function saveCategory(category) {
  await db.categories.put(category);
  onDataChanged();
}

export async function saveChecklistState(blockId, checkedSet) {
  await db.checklistState.put({ blockId, items: [...checkedSet] });
  // Чеклисты не триггерят cloud-синхронизацию (слишком часто)
}

export async function loadChecklistState(blockId) {
  const record = await db.checklistState.get(blockId);
  return record ? new Set(record.items) : new Set();
}

export async function getSetting(key, defaultValue) {
  const record = await db.settings.get(key);
  return record ? record.value : defaultValue;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
```

### 4.3 Слой синхронизации

```javascript
// storage/sync.js

// ─── File System Access API ───────────────────────────────────────────────

const HANDLE_STORE_KEY = 'lifeos_file_handle';

/** Первый запуск: просим пользователя выбрать/создать файл */
export async function initFileSystem() {
  try {
    // Восстановить сохранённый handle из IndexedDB
    const stored = await db.syncMeta.get(HANDLE_STORE_KEY);
    if (stored) {
      const perm = await stored.value.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        window.__lifeosFileHandle = stored.value;
        return { status: 'restored' };
      }
    }
  } catch (e) {}
  return { status: 'not_configured' };
}

/** Пользователь нажал "Сохранить файл" — показываем picker */
export async function pickSaveFile() {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'lifeos-data.json',
      types: [{ description: 'LIFEOS Data', accept: { 'application/json': ['.json'] } }],
    });
    // Запросить постоянное разрешение
    await handle.requestPermission({ mode: 'readwrite' });
    // Сохранить handle в IndexedDB (пережива перезагрузку страницы)
    await db.syncMeta.put({ key: HANDLE_STORE_KEY, value: handle });
    window.__lifeosFileHandle = handle;
    return { status: 'configured', handle };
  } catch (e) {
    return { status: 'cancelled' };
  }
}

/** Запись данных в файл на диске (вызывается с debounce 2000ms) */
export async function writeToFile(data) {
  const handle = window.__lifeosFileHandle;
  if (!handle) return;
  try {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (e) {
    console.warn('[LIFEOS] File write failed:', e);
  }
}

/** Чтение данных из файла при старте */
export async function readFromFile() {
  const handle = window.__lifeosFileHandle;
  if (!handle) return null;
  try {
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// ─── GitHub Gist Sync ─────────────────────────────────────────────────────

const GIST_TOKEN_KEY = 'lifeos_gist_token';
const GIST_ID_KEY = 'lifeos_gist_id';

export async function initGistSync(token) {
  localStorage.setItem(GIST_TOKEN_KEY, token);
  // Ищем существующий Gist или создаём новый
  const existingId = localStorage.getItem(GIST_ID_KEY);
  if (existingId) return { status: 'restored', gistId: existingId };

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'LIFEOS — Personal Data Backup',
      public: false,
      files: { 'lifeos-data.json': { content: '{}' } },
    }),
  });
  const gist = await res.json();
  localStorage.setItem(GIST_ID_KEY, gist.id);
  return { status: 'created', gistId: gist.id };
}

/** Загрузить данные из Gist (при старте на новом устройстве) */
export async function loadFromGist() {
  const token = localStorage.getItem(GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  if (!token || !gistId) return null;
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    const gist = await res.json();
    const content = gist.files['lifeos-data.json']?.content;
    return content ? JSON.parse(content) : null;
  } catch (e) {
    return null;
  }
}

/** Записать данные в Gist (вызывается с debounce 15 мин) */
export async function syncToGist(data) {
  const token = localStorage.getItem(GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  if (!token || !gistId) return;
  try {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'lifeos-data.json': { content: JSON.stringify(data, null, 2) },
        },
      }),
    });
    localStorage.setItem('lifeos_last_sync', new Date().toISOString());
  } catch (e) {
    console.warn('[LIFEOS] Gist sync failed:', e);
  }
}

// ─── Снапшоты (защита от случайной потери) ────────────────────────────────

/** Создать версионный снапшот перед опасной операцией */
export async function createSnapshot(reason = 'auto') {
  const data = await loadAllData();
  const snapshot = {
    createdAt: new Date().toISOString(),
    reason,
    data,
  };
  await db.snapshots.add(snapshot);
  // Оставляем только последние 30 снапшотов
  const all = await db.snapshots.orderBy('id').toArray();
  if (all.length > 30) {
    const toDelete = all.slice(0, all.length - 30).map(s => s.id);
    await db.snapshots.bulkDelete(toDelete);
  }
}

/** Получить список снапшотов для UI восстановления */
export async function listSnapshots() {
  return db.snapshots.orderBy('createdAt').reverse().limit(10).toArray();
}

/** Восстановить из снапшота */
export async function restoreSnapshot(snapshotId) {
  const snapshot = await db.snapshots.get(snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');
  const { categories, blocks, allDay } = snapshot.data;
  await db.transaction('rw', db.categories, db.blocks, db.allDay, async () => {
    await db.categories.clear(); await db.categories.bulkPut(categories);
    await db.blocks.clear();     await db.blocks.bulkPut(blocks);
    await db.allDay.clear();     await db.allDay.bulkPut(allDay);
  });
}
```

### 4.4 Центральный StorageManager (вставить в app.jsx)

```javascript
// StorageManager — вставить в app.jsx, вызвать в useEffect при монтировании

const StorageManager = {
  // Debounce-таймеры
  _fileTimer: null,
  _gistTimer: null,

  /** Инициализация при первом запуске */
  async init() {
    // 1. Запросить постоянное хранилище
    if (navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      console.log('[LIFEOS] Persistent storage:', granted ? '✅' : '⚠️');
    }

    // 2. Восстановить file handle
    await initFileSystem();

    // 3. Загрузить данные (иерархически)
    const fromIDB = await loadAllData();

    if (fromIDB.categories.length > 0) {
      // IndexedDB уже содержит данные — приоритет
      return fromIDB;
    }

    // IndexedDB пустая — попытка загрузить из файла или Gist
    const fromFile = await readFromFile();
    if (fromFile) {
      await this._hydrateDB(fromFile);
      return fromFile;
    }

    const fromGist = await loadFromGist();
    if (fromGist) {
      await this._hydrateDB(fromGist);
      return fromGist;
    }

    // Ничего нет — загружаем дефолтные данные
    await this._hydrateDB(DEFAULT_DATA);
    return DEFAULT_DATA;
  },

  /** Записать изменения (вызывается после каждого saveBlock/saveCategory) */
  async onDataChanged() {
    const data = await loadAllData();

    // Слой 2: файл на диске (2 сек задержка)
    clearTimeout(this._fileTimer);
    this._fileTimer = setTimeout(() => writeToFile(data), 2000);

    // Слой 3: GitHub Gist (15 мин задержка)
    clearTimeout(this._gistTimer);
    this._gistTimer = setTimeout(() => syncToGist(data), 15 * 60 * 1000);
  },

  async _hydrateDB({ categories, blocks, allDay }) {
    await db.transaction('rw', db.categories, db.blocks, db.allDay, async () => {
      await db.categories.bulkPut(categories);
      await db.blocks.bulkPut(blocks);
      await db.allDay.bulkPut(allDay);
    });
  },
};
```

### 4.5 Исправление QuickAdd (реальное сохранение)

```javascript
// overlays.jsx — QuickAdd — кнопка "Создать"
const handleCreate = async () => {
  if (!title.trim()) return;

  // Создать снапшот перед изменением
  await createSnapshot('before_quick_add');

  const newBlock = {
    id: `user_${Date.now()}`,
    day: currentDay,        // из props
    start: parsedStart,     // парсинг из title
    end: parsedEnd,
    title: title.trim(),
    cat: cat,
    recur: includeRecur,
  };

  // Сохранить в IndexedDB (триггерит sync через StorageManager)
  await saveBlock(newBlock);

  // Обновить React state через callback
  onBlockCreated(newBlock);

  onClose();
};
```

### 4.6 Исправление чеклистов (персистентное состояние)

```javascript
// overlays.jsx — BlockOverlay — загрузка сохранённого состояния чеклиста

function BlockOverlay({ block, onClose, initialPhase = 'l1' }) {
  const [checkedItems, setCheckedItems] = useStateO(new Set());

  // Загрузить сохранённое состояние при открытии
  useEffectO(() => {
    loadChecklistState(block.id).then(saved => {
      setCheckedItems(saved);
    });
  }, [block.id]);

  const toggleCheck = async (i) => {
    const next = new Set(checkedItems);
    if (next.has(i)) next.delete(i); else next.add(i);
    setCheckedItems(next);
    // Сохранить немедленно (без debounce — маленькие данные)
    await saveChecklistState(block.id, next);
  };
  // ...
}
```

### 4.7 Исправление useTweaks (реальная персистентность)

```javascript
// tweaks-panel.jsx — заменить useTweaks

function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const initialized = React.useRef(false);

  // Загрузить настройки из localStorage при монтировании
  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const saved = localStorage.getItem('lifeos_tweaks');
      if (saved) setValues({ ...defaults, ...JSON.parse(saved) });
    } catch (e) {}
  }, []);

  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' ? keyOrEdits : { [keyOrEdits]: val };
    setValues(prev => {
      const next = { ...prev, ...edits };
      // Сохранить в localStorage (мгновенно, маленькие данные)
      try { localStorage.setItem('lifeos_tweaks', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    // Поддержать совместимость с хостом-редактором
    if (window.parent !== window) {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    }
  }, []);

  return [values, setTweak];
}
```

### 4.8 UI первого запуска (Setup Screen)

```javascript
// Если LIFEOS запущен впервые — показать SetupScreen
function SetupScreen({ onComplete }) {
  const [step, setStep] = React.useState(1); // 1: file, 2: gist, 3: done

  return (
    <div className="setup-screen">
      <h1>Добро пожаловать в LIFEOS</h1>
      <p>Настроим хранение данных — это займёт 1 минуту.</p>

      {step === 1 && (
        <div>
          <h2>Шаг 1/2 · Файл на диске</h2>
          <p>Выберите место для сохранения данных (рекомендуем папку Dropbox или iCloud).</p>
          <button onClick={async () => {
            const result = await pickSaveFile();
            if (result.status === 'configured') setStep(2);
          }}>
            Выбрать место сохранения
          </button>
          <button onClick={() => setStep(2)}>Пропустить</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Шаг 2/2 · Резервная копия в облаке</h2>
          <p>Введите GitHub Personal Access Token для автоматических бэкапов.</p>
          <p><a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank">
            Создать токен (scope: gist) →
          </a></p>
          <input placeholder="ghp_xxxxxxxxxxxx" onChange={e => window.__gistToken = e.target.value} />
          <button onClick={async () => {
            if (window.__gistToken) await initGistSync(window.__gistToken);
            setStep(3);
          }}>
            Подключить
          </button>
          <button onClick={() => setStep(3)}>Пропустить</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>✅ Готово!</h2>
          <p>Ваши данные будут автоматически сохраняться на диск и в облако.</p>
          <button onClick={onComplete}>Открыть LIFEOS</button>
        </div>
      )}
    </div>
  );
}
```

---

## ЭТАП 5 — Стратегия резервного копирования и восстановления

### Автоматические бэкапы (встроены в архитектуру)

```
Тип                   Частота        Место              Хранится
─────────────────────────────────────────────────────────────────────
Запись в реальный файл  2 сек        Ваш диск (FSAA)   Навсегда
GitHub Gist sync        15 мин       GitHub             Навсегда  
IndexedDB snapshot      При измен.   Браузер (OPFS)     30 последних
```

### Ручной экспорт/импорт (UI-кнопки в настройках)

```javascript
// Экспорт — скачать JSON-файл
function exportData() {
  loadAllData().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Импорт — восстановить из JSON-файла
async function importData(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  await createSnapshot('before_import'); // защитный снапшот
  await StorageManager._hydrateDB(data);
  window.location.reload();
}
```

### Сценарии восстановления

| Ситуация | Источник | Действие |
|---|---|---|
| Обновил страницу | IndexedDB | Автоматически — пользователь ничего не замечает |
| Закрыл браузер | IndexedDB | Автоматически при следующем открытии |
| "Clear site data" в Chrome | Файл на диске | Приложение загружает из файла при старте |
| Новый компьютер | GitHub Gist | Ввести PAT → автозагрузка всех данных |
| Случайное удаление данных | OPFS snapshot | Меню "Восстановить" → список снапшотов |
| Переустановил браузер | Файл на диске | Открыть LIFEOS → выбрать существующий файл |
| Файл удалён + нет Gist | Ручной .json | Импорт через "Восстановить из файла" |

---

## ЭТАП 5 — Финальное заключение

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ЛУЧШЕЕ РЕШЕНИЕ:                                                        │
│  IndexedDB (Dexie.js) + File System Access API + GitHub Gist           │
│  Three-Layer Resilience Architecture                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ПОЧЕМУ ВЫБРАНО:                                                        │
│  • IndexedDB — быстрое, структурированное, работает офлайн             │
│  • File System Access API — единственный способ пережить "Clear Data"  │
│  • GitHub Gist — минимальный cloud-бэкап без собственного сервера      │
│  • Все три слоя работают автоматически и прозрачно для пользователя    │
├─────────────────────────────────────────────────────────────────────────┤
│  Надёжность хранения             9 / 10                                │
│  Сложность реализации            4 / 10  (Dexie.js упрощает до минимума)│
│  Устойчивость к обновлению стр.  ✅ АБСОЛЮТНАЯ (IndexedDB)             │
│  Устойчивость к "Clear Cache"    ✅ (FSAA → файл на диске)             │
│  Устойчивость к "Clear Site Data"✅ (FSAA → файл на диске)             │
│  Устойчивость к переустановке    ✅ (FSAA + файл)                      │
│  Устойчивость к смене устройства ✅ (GitHub Gist)                      │
│  UX                               Полностью бесшовный после setup      │
│  Backend                          ❌ НЕ НУЖЕН                          │
│  БД                               ❌ НЕ НУЖНА                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ИТОГОВАЯ РЕКОМЕНДАЦИЯ:                                                 │
│                                                                         │
│  1. Добавить Dexie.js через ESM CDN (17 KB gzip, нет сборщика)        │
│  2. Перенести data.jsx из хардкода в IndexedDB (db.js)                 │
│  3. Добавить File System Access API с однократным выбором файла        │
│  4. Добавить GitHub Gist sync (поле токена в настройках)               │
│  5. Исправить QuickAdd, чеклисты и useTweaks                           │
│  6. Добавить UI первого запуска (SetupScreen)                          │
│  7. Добавить меню "Данные" (экспорт / импорт / снапшоты)               │
│                                                                         │
│  Estimated dev time: 2-3 дня для одного разработчика                   │
│  Dependencies: только Dexie.js (опционально idb-keyval для простоты)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Почему не нужен сервер

Объём данных одного пользователя (~10 MB за 5 лет) не требует сервера. GitHub Gist предоставляет бесплатный, надёжный API с историей версий. File System Access API даёт абсолютную устойчивость к браузерным очисткам. IndexedDB обеспечивает мгновенную офлайн-работу. Сервер добавил бы: расходы, сложность деплоя, зависимость от uptime, проблемы авторизации — при нулевой выгоде для одного пользователя.

### Риски и митигация

| Риск | Вероятность | Митигация |
|---|---|---|
| Пользователь не настроил File Handle | Средняя | SetupScreen при первом запуске + напоминание |
| GitHub Gist недоступен | Низкая | Работает офлайн через IndexedDB + файл |
| PAT истёк | Средняя | UI-индикатор статуса синхронизации |
| Файл перемещён / удалён | Низкая | Определяется при старте → предложить выбрать заново |
| Браузер без FSAA support | Очень низкая | Safari 15.2+, Chrome 86+, Firefox 111+ — все современные |

---

*Документ сгенерирован на основе аудита кода LIFEOS: app.jsx, data.jsx, overlays.jsx, tweaks-panel.jsx, views.jsx*  
*Архитектор: Senior Frontend / Storage Architecture Audit · May 2026*
