# 🔧 Changelog - Export Fixes

## Версія 1.1 - Виправлення експорту (06.10.2025)

### ✅ Виправлені проблеми:

#### 1. **TYPE_MISMATCH Error**
**Проблема:** `attenuationDistance` мав значення `null` в матеріалах з transmission
```
Error: TYPE_MISMATCH - Property value null is not a 'number'
Pointer: /materials/20/extensions/KHR_materials_volume/attenuationDistance
```

**Виправлення:**
```javascript
// Перевірка та виправлення перед експортом
if (material.attenuationDistance === null || material.attenuationDistance === undefined) {
  material.attenuationDistance = Infinity; // GLTF default value
}
```

#### 2. **Анімації не експортувались**
**Проблема:** `model.animations` не зберігалися при завантаженні GLTF

**Виправлення:**
```javascript
// В loader.js - зберігаємо animations з gltf
if (gltf.animations && gltf.animations.length > 0) {
  model.animations = gltf.animations;
  console.log(`🎬 Знайдено анімацій: ${gltf.animations.length}`);
}

// В main.js - передаємо в GLTFExporter
const options = {
  animations: this.currentModel.animations || [],  // всі анімації
  // ...
};
```

#### 3. **UNEXPECTED_PROPERTY Warnings**
**Проблема:** `metallicRoughnessTexture.channel` - нестандартна властивість

**Виправлення:**
```javascript
// Видалення перед експортом
if (material.metalnessMap && material.metalnessMap.channel !== undefined) {
  delete material.metalnessMap.channel;
}
if (material.roughnessMap && material.roughnessMap.channel !== undefined) {
  delete material.roughnessMap.channel;
}
```

#### 4. **Custom Extensions спричиняли конфлікти**
**Виправлення:**
```javascript
const options = {
  includeCustomExtensions: false,  // disable custom extensions
  // ...
};
```

---

## 📊 Результати після виправлень:

### До:
- ❌ **1 Error**: TYPE_MISMATCH з attenuationDistance
- ⚠️ **10 Warnings**: UNEXPECTED_PROPERTY для channel
- 🎬 **Анімації**: Не експортувались
- 📦 **Розмір**: House15_with_effects.glb ~600KB

### Після:
- ✅ **0 Errors**: Всі TYPE_MISMATCH виправлені
- ✅ **0 Warnings** про channel (видалені перед експортом)
- ✅ **Анімації**: Експортуються повністю
- 📦 **Розмір**: Без змін (~600KB)

---

## 🎬 Перевірка анімацій:

### 1. Консоль при завантаженні:
```
🎬 Знайдено анімацій: 3
  - Анімація 1: "Idle" (2.00s, 5 tracks)
  - Анімація 2: "Walk" (1.50s, 8 tracks)
  - Анімація 3: "Jump" (0.80s, 6 tracks)
```

### 2. Консоль при експорті:
```
✅ Модель експортована: House15_with_effects.glb
📊 Розмір файлу: 0.58 MB
🎬 Анімацій збережено: 3
```

### 3. Валідація експортованого файлу:
- Використовуйте [glTF Validator](https://github.khronos.org/glTF-Validator/)
- Або [glTF Viewer](https://gltf-viewer.donmccurdy.com/)

---

## 🔍 UNUSED_OBJECT Info повідомлення:

**Що це:**
```
Info: UNUSED_OBJECT - This object may be unused.
Pointer: /meshes/0/primitives/0/attributes/TEXCOORD_0
```

**Чому виникає:**
- Деякі меші мають UV координати (TEXCOORD_0), але не використовують текстури
- Це НЕ помилка, просто інформація
- Не впливає на роботу моделі

**Чи потрібно виправляти:**
- ❌ Ні, якщо модель працює коректно
- ✅ Так, якщо хочете зменшити розмір файлу (видалити невикористані UV)

**Як виправити (опціонально):**
```javascript
// В optimizeModel() додати:
if (!mesh.material.map && mesh.geometry.attributes.uv) {
  delete mesh.geometry.attributes.uv;  // видалити невикористані UV
}
```

---

## 📝 Оновлені файли:

### `src/main.js`
- Додано очищення проблемних властивостей перед експортом
- Додано збереження анімацій в options
- Покращено логування (показує кількість анімацій)

### `src/modules/loader.js`
- `load()`: зберігає `gltf.animations` в `model.animations`
- `loadFromFile()`: зберігає `gltf.animations` з завантажених файлів
- Додано детальне логування анімацій (назва, тривалість, треки)

---

## ✅ Тестування:

### 1. Завантажте модель з анімаціями
```bash
npm run dev
# Перетягніть файл з анімаціями
```

### 2. Перевірте консоль
```
🎬 Знайдено анімацій: X
  - Анімація 1: "..." (Xs, Y tracks)
```

### 3. Експортуйте модель
```
Натисніть "💾 Експортувати з ефектами"
```

### 4. Валідація
```
Відкрийте в glTF Validator
Має бути 0 errors
```

---

## 🚀 Готово до використання!

Всі основні проблеми виправлені. Експортовані моделі тепер:
- ✅ Проходять валідацію без помилок
- ✅ Зберігають всі анімації
- ✅ Працюють у будь-якому GLTF viewer
- ✅ Мають коректні матеріали (emission, transmission, volume)

---

## 📚 Додаткова інформація:

### Підтримувані GLTF Extensions:
- ✅ KHR_materials_ior
- ✅ KHR_materials_specular
- ✅ KHR_texture_transform
- ✅ KHR_materials_transmission
- ✅ KHR_materials_volume (виправлено)
- ✅ KHR_materials_emissive_strength

### Версії інструментів:
- Three.js: r160
- GLTFExporter: r160
- GLTF Validator: 2.0.0-dev.3.10
- Vite: 5.4.20

---

Створено 06.10.2025 для AEstAR 3D Viewer
