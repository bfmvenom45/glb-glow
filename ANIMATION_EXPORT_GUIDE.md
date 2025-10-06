# 🎬 Гайд: Експорт Анімації Світла

## 📖 Що було додано

### ✅ Збереження Emissive Властивостей
Тепер при експорті **зберігаються всі emissive параметри матеріалів**:
- `emissive` колір
- `emissiveIntensity` інтенсивність
- Поточні налаштування Glow

### 🎬 Автоматичне Створення Анімації Пульсації
Якщо **пульсація увімкнена** (`💫 Увімкнути пульсацію`), система автоматично створює GLB анімацію:
- **Назва анімації**: `EmissivePulse`
- **Тривалість**: 2 секунди (циклічна)
- **FPS**: 30 кадрів/секунду
- **Тип**: Синусоїдальна хвиля (плавна пульсація)

## 🚀 Як використовувати

### 1. Налаштуйте світло
```
1. Завантажте модель (016.glb завантажується автоматично)
2. Налаштуйте Glow параметри:
   - Glow Intensity (інтенсивність свічення)
   - Glow Hue (колір свічення)
   - Bloom режим (Simple/Selective)
```

### 2. Увімкніть пульсацію (опціонально)
```
Натисніть "💫 Увімкнути пульсацію"
→ Світло почне плавно пульсувати
→ При експорті створюється keyframe анімація
```

### 3. Експортуйте модель
```
Натисніть "💾 Експортувати з ефектами"
→ Файл: 016_with_effects.glb
```

## 📊 Що експортується?

### ✅ Завжди зберігається:
- ✅ **Emissive колір і інтенсивність** для всіх матеріалів
- ✅ **Оригінальні анімації** моделі (якщо є)
- ✅ **Всі текстури** (embedded)
- ✅ **Всі меші і матеріали**

### 🎬 Якщо пульсація увімкнена:
- ✅ **Keyframe анімація** `EmissivePulse`
- ✅ **30 FPS**, 2 секунди, циклічна
- ✅ **Треки для кожного світного матеріалу**

### ❌ Що НЕ експортується (post-processing):
- ❌ Bloom ефект (це shader Three.js)
- ❌ Real-time рендеринг ефекти
- ❌ Камера і освітлення сцени

## 🔍 Перевірка експорту

### Консоль браузера показує:
```
💾 Початок експорту моделі з emission ефектами...
💡 Glow режим: emissive, Intensity: 2.9, Hue: 0.06
🌊 Пульсація увімкнена (speed: 2)
💡 Збереження emissive: "Material_Name" (intensity: 0.29)
✅ Збережено emissive для 5 матеріалів
🎬 Створення анімації пульсації світла...
✅ Створено анімацію пульсації з 5 треками (60 кадрів)
🎬 Всього анімацій для експорту: 1
✅ Модель експортована: 016_with_effects.glb
📊 Розмір файлу: 2.45 MB
🎬 Анімацій експортовано: 1
  1. "EmissivePulse" (2.00s, 5 треків)
💡 Emissive збережено для 5 матеріалів
🌊 Пульсація збережена як анімація "EmissivePulse"
```

## 🎯 Як переглянути результат

### У Blender:
1. File → Import → glTF 2.0
2. Виберіть `016_with_effects.glb`
3. В Shading Editor перевірте emissiveIntensity
4. В Timeline/Dope Sheet перевірте анімацію `EmissivePulse`

### У Three.js Viewer:
1. Завантажте експортований GLB
2. Перевірте `gltf.animations` масив
3. Створіть AnimationMixer і запустіть анімацію:
```javascript
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(gltf.animations[0]); // EmissivePulse
action.play();
```

### У glTF Validator:
```bash
gltf-validator 016_with_effects.glb
```
Має показати:
- ✅ 0 errors
- ✅ Animations: 1
- ✅ Materials with emissive

## 🐛 Troubleshooting

### Питання: Пульсація не грається після завантаження?
**Відповідь**: Потрібно запустити анімацію через AnimationMixer:
```javascript
const mixer = new THREE.AnimationMixer(model);
gltf.animations.forEach(clip => {
  mixer.clipAction(clip).play();
});

// В animation loop:
mixer.update(deltaTime);
```

### Питання: Emissive занадто тьмяне?
**Відповідь**: Збільште:
1. Glow Intensity слайдер (0-5)
2. Exposure слайдер (0.1-2)
3. Renderer.toneMapping (може пригнічувати emissive)

### Питання: Bloom не зберігся?
**Відповідь**: Це нормально! Bloom - це **post-processing ефект**, він не може бути збережений в GLB. Зберігається тільки **emissive свічення матеріалів**.

## 📚 Технічні деталі

### Структура анімації EmissivePulse:
```javascript
{
  name: "EmissivePulse",
  duration: 2.0,
  tracks: [
    {
      type: "NumberKeyframeTrack",
      name: "MeshName.material.emissiveIntensity",
      times: [0, 0.033, 0.066, ..., 2.0],
      values: [0.15, 0.18, 0.21, ..., 0.15], // синусоїда
      interpolation: InterpolateLinear
    }
  ]
}
```

### Формула пульсації:
```javascript
pulse = sin((t / duration) * π * 2 * pulseSpeed) * 0.5 + 0.5
intensity = baseIntensity * (0.5 + pulse * pulseIntensity)
```
- **pulseSpeed**: 2.0 (швидкість пульсації)
- **pulseIntensity**: 0.5 (амплітуда 50%)
- **baseIntensity**: glowParams.intensity * 0.1

## 🎉 Результат

Тепер експортований GLB файл містить:
1. ✅ **Всі оригінальні дані** моделі
2. ✅ **Emissive свічення** з вашими налаштуваннями
3. ✅ **Keyframe анімацію** пульсації (якщо увімкнена)
4. ✅ **Валідний glTF 2.0** файл без помилок

**Файл можна використовувати в будь-якому glTF viewer або 3D редакторі!** 🚀
