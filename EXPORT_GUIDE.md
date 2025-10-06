# 📖 Інструкції по експорту та деплою

## 🎯 3 способи використання ефектів emission/glow

### 1️⃣ GLTFExporter - Експорт з Three.js (найшвидший)

**Що це:**
Експорт моделі з усіма застосованими emission ефектами прямо з веб-додатку.

**Як використовувати:**
1. Завантажте модель у веб-додаток
2. Налаштуйте bloom/glow ефекти як потрібно
3. Натисніть кнопку **"💾 Експортувати з ефектами"**
4. Завантажиться GLB файл з назвою `[модель]_with_effects.glb`

**Обмеження:**
- Експортує emission властивості матеріалів (emissiveColor, emissiveIntensity)
- Bloom ефект НЕ експортується (це пост-процесінг в Three.js)
- Файл буде працювати в будь-якому GLTF viewer з підтримкою emission

**Коли використовувати:**
- Потрібно швидко поділитися моделлю з emission
- Модель буде використовуватись в іншому Three.js проєкті
- Потрібен компактний файл без додаткових текстур

---

### 2️⃣ Vercel Deploy - Розгортання веб-додатку

**Що це:**
Повноцінний деплой Three.js додатку на Vercel з усіма ефектами.

**Налаштування:**
Файли вже готові:
- ✅ `vercel.json` - конфігурація SPA
- ✅ `.vercelignore` - виключення непотрібних файлів
- ✅ Оптимізовані headers для GLB файлів

**Як задеплоїти:**

**Варіант A: Через GitHub (рекомендовано)**
```bash
# 1. Закомітити зміни
git add .
git commit -m "Add export functionality"
git push origin main

# 2. Відкрити vercel.com
# 3. Import Git Repository
# 4. Вибрати ваш репозиторій threejs-emmision
# 5. Deploy - Vercel автоматично визначить Vite проєкт
```

**Варіант B: Через Vercel CLI**
```bash
# Встановити Vercel CLI (один раз)
npm i -g vercel

# Логін
vercel login

# Деплой
vercel

# Production деплой
vercel --prod
```

**Після деплою:**
- Отримаєте URL типу `https://threejs-emmision.vercel.app`
- Всі ефекти працюватимуть так само як локально
- Користувачі зможуть завантажувати свої моделі
- Кнопка експорту працюватиме онлайн

**Коли використовувати:**
- Потрібно поділитися повним додатком з іншими
- Хочете онлайн портфоліо з 3D моделями
- Потрібна можливість завантажувати різні моделі

---

### 3️⃣ Blender Baking - Запікання emission в текстури

**Що це:**
Python скрипт для Blender, який "запікає" emission в реальні текстури.
Результат буде працювати в БУДЬ-ЯКОМУ 3D viewer без підтримки emission.

**Файл:** `bake_emission.py`

**Як використовувати:**

**Метод 1: В Blender GUI**
```
1. Відкрийте Blender
2. File > Import > glTF 2.0 (.glb/.gltf)
3. Виберіть вашу модель
4. Перейдіть у Scripting workspace (Tab вгорі)
5. Відкрийте файл bake_emission.py
6. Натисніть Run Script (▶️)
7. Чекайте завершення (консоль покаже прогрес)
8. Готовий файл: [модель]_baked.glb
```

**Метод 2: Командний рядок**
```bash
# Один файл
blender --background --python bake_emission.py -- input.glb output_baked.glb

# Пакетна обробка папки
blender --background --python bake_emission.py -- /path/to/models/ /path/to/output/
```

**Метод 3: З Python Console в Blender**
```python
# Відкрийте Python Console в Blender
import sys
sys.path.append('/path/to/your/project')
import bake_emission

# Один файл
bake_emission.import_and_bake('/path/to/model.glb', '/path/to/output.glb')

# Вся папка
bake_emission.batch_bake('/path/to/models/', '/path/to/output/')
```

**Що робить скрипт:**
1. 🔍 Сканує всі матеріали на наявність emission
2. 📐 Створює UV розгортку (якщо немає)
3. 🔥 Запікає emission в texture (1024x1024)
4. 🎨 Замінює emission shader на запечену текстуру
5. 💾 Експортує GLB з текстурами

**Переваги:**
- Працює в БУДЬ-ЯКОМУ viewer (навіть без підтримки emission)
- Emission стає частиною текстури
- Оптимально для Unity, Unreal, WebXR

**Недоліки:**
- Збільшується розмір файлу (додаються текстури)
- Потрібен Blender
- Довше по часу

**Коли використовувати:**
- Модель буде у Unity/Unreal/інших движках
- Потрібна максимальна сумісність
- Viewer не підтримує emission
- Потрібен "запечений" результат

---

## 🎮 Порівняння методів

| Метод | Швидкість | Якість | Сумісність | Розмір файлу |
|-------|-----------|--------|------------|--------------|
| **GLTFExporter** | ⚡⚡⚡ Миттєво | 🌟🌟🌟 Emission | 🌐 GLTF viewers | 📦 Малий |
| **Vercel Deploy** | ⚡⚡ Швидко | 🌟🌟🌟 Всі ефекти | 🌐 Будь-який браузер | ☁️ Онлайн |
| **Blender Baking** | ⚡ Повільно | 🌟🌟 Texture | 🌐🌐🌐 100% | 📦📦 Великий |

---

## 🚀 Швидкий старт

**Для демо:**
```bash
npm run dev
# Відкрийте http://localhost:5173
# Натисніть "💾 Експортувати з ефектами"
```

**Для продакшену:**
```bash
npm run build
vercel --prod
```

**Для Blender:**
```
Blender > Scripting > Open bake_emission.py > Run Script
```

---

## ❓ FAQ

**Q: Чому bloom не експортується?**
A: Bloom - це пост-процесінг ефект в Three.js, він не є частиною GLTF формату. 
   Для збереження bloom використовуйте Vercel deploy (метод 2).

**Q: Який метод найкращий?**
A: Залежить від цілі:
- Швидко поділитись → GLTFExporter
- Онлайн портфоліо → Vercel
- Максимальна сумісність → Blender Baking

**Q: Чи можна комбінувати методи?**
A: Так! Наприклад:
1. Blender Baking для основної текстури
2. GLTFExporter для додаткового emission
3. Vercel Deploy для показу обох варіантів

---

## 📝 Примітки

- **Файл House15.glb**: 584 KB (оригінал)
- **Файл House16.glb**: 1.7 MB (оригінал)
- **З GLTFExporter**: +5-10% до розміру
- **З Blender Baking**: +200-300% (через текстури)

---

## 🔗 Корисні посилання

- [Three.js GLTFExporter Docs](https://threejs.org/docs/#examples/en/exporters/GLTFExporter)
- [Vercel Deployment](https://vercel.com/docs)
- [Blender Python API](https://docs.blender.org/api/current/)
- [GLTF Specification](https://www.khronos.org/gltf/)

---

Створено з ❤️ для AEstAR 3D Viewer
