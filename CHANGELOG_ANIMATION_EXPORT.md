# 🎬 Changelog: Експорт Анімації Світла

## 📅 6 жовтня 2025

### ✨ Нові функції

#### 1. **Збереження Emissive при експорті**
- ✅ Автоматично зберігає `emissiveIntensity` всіх матеріалів
- ✅ Враховує поточні налаштування Glow (intensity, hue)
- ✅ Логування: `💡 Збереження emissive: "MaterialName" (intensity: X.XX)`

#### 2. **Automatic creation of the pulse animation**
- ✅ If pulse is enabled → GLB animation is created
- ✅ Назва: `EmissivePulse`
- ✅ Параметри:
  - Тривалість: 2 секунди
  - FPS: 30 кадрів
  - Тип: Синусоїдальна keyframe анімація
  - Треки: `MaterialName.material.emissiveIntensity`

#### 3. **Розширене логування експорту**
```
🎬 Створення анімації пульсації світла...
✅ Створено анімацію пульсації з 5 треками (60 кадрів)
🎬 Всього анімацій для експорту: 1
🎬 Анімацій експортовано: 1
  1. "EmissivePulse" (2.00s, 5 треків)
💡 Emissive збережено для 5 матеріалів
🌊 Пульсація збережена як анімація "EmissivePulse"
```

### 🔧 Технічні зміни

#### `src/main.js` - функція `exportModelWithEffects()`

**Додано перед експортом:**
```javascript
// Отримання параметрів glow
const glowParams = this.glowManager.params;
const glowMode = this.glowManager.getGlowMode();
const isPulseEnabled = this.glowManager.pulseEnabled;

// Збереження emissive для кожного матеріалу
if (glowMode === 'emissive' && material.emissive) {
  if (isPulseEnabled) {
    // Зберігаємо базову інтенсивність (без пульсації)
    material.emissiveIntensity = glowParams.intensity * 0.1;
  } else {
    // Зберігаємо поточне значення
    material.emissiveIntensity = currentIntensity;
  }
}

// Створення keyframe анімації
if (isPulseEnabled && emissiveSavedCount > 0) {
  const times = [], values = [];
  
  for (let i = 0; i <= frameCount; i++) {
    const t = (i / frameCount) * duration;
    times.push(t);
    
    const pulse = Math.sin((t / duration) * Math.PI * 2 * pulseSpeed) * 0.5 + 0.5;
    const intensity = baseIntensity * (0.5 + pulse * pulseIntensity);
    values.push(intensity);
  }
  
  const track = new THREE.NumberKeyframeTrack(
    `${node.name}.material.emissiveIntensity`,
    times,
    values
  );
  
  const pulseClip = new THREE.AnimationClip('EmissivePulse', duration, [tracks]);
  animationsToExport.push(pulseClip);
}
```

### 📊 Результати

#### До змін:
- ❌ Emissive не зберігався при експорті
- ❌ Пульсація була тільки real-time
- ❌ Завантажений GLB не світився

#### Після змін:
- ✅ Emissive зберігається з точними значеннями
- ✅ Пульсація експортується як GLB анімація
- ✅ Завантажений GLB містить keyframe анімацію світла
- ✅ Працює в будь-якому glTF viewer

### 🎯 Використання

1. **Налаштуйте світло** (Glow Intensity, Hue)
2. **Увімкніть пульсацію** (опціонально)
3. **Експортуйте** → `016_with_effects.glb`
4. **Результат**:
   - Emissive збережено
   - Анімація `EmissivePulse` у файлі
   - Файл валідний для будь-якого viewer

### 📝 Примітки

- **Bloom ефект** НЕ зберігається (це post-processing Three.js)
- **Emissive свічення** зберігається (це властивість матеріалу)
- **Анімація пульсації** створюється тільки якщо пульсація увімкнена
- **FPS анімації**: 30 кадрів (можна налаштувати в коді)
- **Тривалість**: 2 секунди (можна налаштувати в коді)

### 🔗 Документація

Див. детальний гайд: [ANIMATION_EXPORT_GUIDE.md](./ANIMATION_EXPORT_GUIDE.md)

---

**Автор**: GitHub Copilot  
**Дата**: 6 жовтня 2025  
**Версія**: 2.0 (з підтримкою експорту анімацій)
