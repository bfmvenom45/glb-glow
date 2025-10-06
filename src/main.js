import { SceneManager } from './modules/scene.js';
import { BloomManager } from './modules/bloom.js';
import { GlowManager } from './modules/glow.js';
import { ModelLoader } from './modules/loader.js';
import { UIManager } from './modules/ui.js';

class App {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.loadingIndicator = document.getElementById('loading-indicator');
    
    this.sceneManager = new SceneManager(this.canvas);
    this.bloomManager = new BloomManager(this.sceneManager);
    this.glowManager = new GlowManager();
    this.modelLoader = new ModelLoader();
    this.uiManager = new UIManager();
    
    this.currentModel = null;
    this.currentModelName = '016.glb';
    
    this.init();
  }
  
  async init() {
    // Ініціалізація сцени
    this.sceneManager.init();
    this.bloomManager.init();
    
    // Завантаження початкової моделі
    await this.loadModel(this.currentModelName);
    
    // Налаштування UI
    this.setupUI();
    
    // Запуск анімації
    this.animate();
    
    // Обробники подій
    this.setupEventListeners();
    
    // Drag & Drop функціональність
    this.setupDragAndDrop();
  }
  
  async loadModel(modelPath) {
    try {
      this.showLoading();
      this.uiManager.showNotification(`Завантаження моделі ${modelPath}...`, 'info');
      
      // Видалення попередньої моделі
      if (this.currentModel) {
        this.sceneManager.scene.remove(this.currentModel);
        this.glowManager.clearGlowMeshes();
      }
      
      // Завантаження нової моделі
      const model = await this.modelLoader.load(modelPath);
      this.currentModel = model;
      
      // Застосування всіх ефектів
      this.applyAllEffects(model, modelPath);
      
    } catch (error) {
      console.error('Помилка завантаження моделі:', error);
      this.hideLoading();
      this.uiManager.showNotification(`Помилка завантаження ${modelPath}: ${error.message}`, 'error');
    }
  }
  
  async loadModelFromFile(file) {
    try {
      this.showLoading();
      this.uiManager.showNotification(`Завантаження файлу ${file.name}...`, 'info');
      
      // Видалення попередньої моделі
      if (this.currentModel) {
        this.sceneManager.scene.remove(this.currentModel);
        this.glowManager.clearGlowMeshes();
      }
      
      // Завантаження моделі з файлу
      const model = await this.modelLoader.loadFromFile(file);
      this.currentModel = model;
      
      // Застосування всіх ефектів
      this.applyAllEffects(model, file.name);
      
    } catch (error) {
      console.error('Помилка завантаження файлу:', error);
      this.hideLoading();
      this.uiManager.showNotification(`Помилка завантаження ${file.name}: ${error.message}`, 'error');
    }
  }
  
  applyAllEffects(model, modelName) {
    try {
      // Додавання до сцени
      this.sceneManager.scene.add(model);
      
      // Додавання власного освітлення
      this.sceneManager.addCustomLighting(model);
      
      // Додавання glow ефекту з налаштуваннями за замовчуванням
      this.glowManager.addInnerGlow(model);
      
      // Оновлення bloom шарів
      this.bloomManager.setupModelLayers(model);
      
      this.hideLoading();
      this.uiManager.showNotification(`${modelName} успішно завантажено та налаштовано!`, 'success');
      console.log(`Модель ${modelName} успішно завантажена та налаштована`);
      
    } catch (error) {
      console.error('Помилка застосування ефектів:', error);
      this.hideLoading();
      this.uiManager.showNotification(`Помилка застосування ефектів до ${modelName}`, 'error');
    }
  }
  
  setupUI() {
    // Налаштування контролів bloom
    this.uiManager.setupBloomControls((params) => {
      this.bloomManager.updateParams(params);
    });
    
    // Налаштування контролів glow
    this.uiManager.setupGlowControls((params) => {
      this.glowManager.updateParams(params);
    });
    
    // Налаштування пульсації
    this.uiManager.setupPulseControl((enabled) => {
      this.glowManager.setPulseEnabled(enabled);
    });
    
    // Налаштування вибору bloom режиму
    this.uiManager.setupBloomModeControl((mode) => {
      this.bloomManager.setMode(mode);
    });
    
    // Налаштування вибору glow режиму
    this.uiManager.setupGlowModeControl((mode) => {
      this.glowManager.setGlowMode(mode);
      // Перезастосовуємо glow з новим режимом
      if (this.currentModel) {
        this.glowManager.addInnerGlow(this.currentModel);
      }
    });
    
    // Налаштування вибору моделі
    this.uiManager.setupModelSelector(
      (modelPath) => {
        this.currentModelName = modelPath;
        this.loadModel(modelPath);
      },
      (file) => {
        this.loadModelFromFile(file);
      }
    );
    
    // Налаштування свічення об'єктів
    this.uiManager.setupGlowSettings((settings) => {
      this.glowManager.updateGlowSettings(settings);
      // Перезастосовуємо glow з новими налаштуваннями
      if (this.currentModel) {
        this.glowManager.addInnerGlow(this.currentModel);
        this.uiManager.showNotification('Налаштування світіння оновлено!', 'success');
      }
    });
    
    // Налаштування власного освітлення
    this.uiManager.setupCustomLightingControls((params) => {
      this.sceneManager.updateCustomLighting(params);
    });
  }
  
  setupEventListeners() {
    // Обробка зміни розміру вікна
    window.addEventListener('resize', () => {
      this.sceneManager.onWindowResize();
      this.bloomManager.onWindowResize();
    });
  }
  
  setupDragAndDrop() {
    const canvas = this.canvas;
    
    // Запобігаємо стандартній поведінці браузера
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      canvas.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    // Візуальні ефекти при перетягуванні
    ['dragenter', 'dragover'].forEach(eventName => {
      canvas.addEventListener(eventName, () => {
        canvas.style.filter = 'brightness(1.2) saturate(1.3)';
        canvas.style.border = '3px dashed #4f9eff';
      });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      canvas.addEventListener(eventName, () => {
        canvas.style.filter = '';
        canvas.style.border = '';
      });
    });
    
    // Обробка drop події
    canvas.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      
      if (files.length > 0) {
        const file = files[0];
        
        // Перевірка типу файлу
        if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
          this.uiManager.handleFileUpload(file);
        } else {
          this.uiManager.showNotification('Підтримуються тільки .glb та .gltf файли', 'error');
        }
      }
    });
    
    console.log('🎯 Drag & Drop налаштовано для GLB/GLTF файлів');
    
    // 🔧 Секретні гарячі клавіші для налаштувань (Ctrl/Cmd + Shift + S)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) {
          const isHidden = controlsPanel.style.display === 'none';
          controlsPanel.style.display = isHidden ? 'block' : 'none';
          console.log(isHidden ? '🔧 Панель налаштувань відкрита' : '🔒 Панель налаштувань прихована');
        }
      }
    });
  }
  
  showLoading() {
    this.loadingIndicator.classList.remove('hidden');
  }
  
  hideLoading() {
    this.loadingIndicator.classList.add('hidden');
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Оновлення ефектів
    this.glowManager.update();
    this.sceneManager.update();
    
    // Рендеринг
    this.bloomManager.render();
  }
  
  disposeModel(model) {
    // Helper функція для очищення моделі та її ресурсів
    if (!model) return;
    
    model.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (material.map) material.map.dispose();
          if (material.lightMap) material.lightMap.dispose();
          if (material.bumpMap) material.bumpMap.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.specularMap) material.specularMap.dispose();
          if (material.envMap) material.envMap.dispose();
          material.dispose();
        });
      }
    });
  }
  
  async exportModelWithEffects() {
    if (!this.currentModel) {
      this.uiManager.showNotification('❌ Немає моделі для експорту', 'error');
      return;
    }
    
    try {
      console.log('🚀 УЛЬТРА-ПРОСТИЙ GLB ЕКСПОРТ (тільки GLB!)...');
      
      // Динамічний імпорт THREE та GLTFExporter
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const simpleExporter = new GLTFExporter();
      
      console.log('🔧 Створення УЛЬТРА-ПРОСТОЇ моделі...');
      
      // Створюємо модель ТІЛЬКИ з MeshBasicMaterial (без PBR)
      const ultraCleanModel = new THREE.Group();
      ultraCleanModel.name = 'SimpleModel';
      
      let meshCount = 0;
      this.currentModel.traverse((node) => {
        if (node.isMesh && node.geometry) {
          const basicMesh = new THREE.Mesh();
          basicMesh.geometry = node.geometry.clone();
          
          // БЕЗПЕЧНИЙ матеріал з emissive, але БЕЗ volume властивостей
          const originalMat = node.material;
          const originalColor = originalMat && originalMat.color ? 
            originalMat.color.clone() : new THREE.Color(0x888888);
          
          // Перевіряємо чи є emissive властивості
          const hasEmissive = originalMat && (
            (originalMat.emissive && originalMat.emissive.r + originalMat.emissive.g + originalMat.emissive.b > 0) ||
            originalMat.emissiveIntensity > 0
          );
          
          if (hasEmissive) {
            console.log(`  ✨ Зберігаємо emissive для ${node.name}: ${originalMat.emissive.getHexString()}`);
            
            // MeshStandardMaterial з emissive, але БЕЗ volume
            basicMesh.material = new THREE.MeshStandardMaterial({
              name: `EmissiveMaterial_${meshCount}`,
              color: originalColor,
              emissive: originalMat.emissive.clone(),
              emissiveIntensity: originalMat.emissiveIntensity || 1,
              metalness: 0,  // Мінімальний metalness
              roughness: 1,  // Максимальний roughness для простоти
              transparent: originalMat.transparent || false,
              opacity: originalMat.opacity !== undefined ? originalMat.opacity : 1,
              side: THREE.FrontSide
              // КРИТИЧНО: НЕ додаємо transmission, attenuationDistance, thickness!
            });
          } else {
            // Звичайний MeshBasicMaterial для не-emissive об'єктів
            basicMesh.material = new THREE.MeshBasicMaterial({
              name: `BasicMaterial_${meshCount}`,
              color: originalColor,
              transparent: originalMat ? originalMat.transparent : false,
              opacity: originalMat ? (originalMat.opacity !== undefined ? originalMat.opacity : 1) : 1,
              side: THREE.FrontSide
            });
          }
          
          basicMesh.name = `Mesh_${meshCount++}`;
          basicMesh.position.copy(node.position);
          basicMesh.rotation.copy(node.rotation);
          basicMesh.scale.copy(node.scale);
          
          ultraCleanModel.add(basicMesh);
        }
      });
      
      console.log(`✅ Створено ультра-просту модель з ${meshCount} мешів`);
      
      // 🎬 Створення emissive анімації для GLB
      console.log('🎬 Створення emissive пульсації для експорту...');
      
      const animations = [];
      const emissiveMeshes = [];
      
      ultraCleanModel.traverse((child) => {
        if (child.material && child.material.emissiveIntensity > 0) {
          emissiveMeshes.push(child);
          console.log(`  ✨ Знайдено emissive меш: ${child.name}`);
        }
      });
      
      if (emissiveMeshes.length > 0) {
        // Створення keyframe animation для emissiveIntensity
        const times = [0, 1, 2];  // 2 секунди циклу
        const values = [1.0, 2.0, 1.0];  // від 1x до 2x інтенсивності
        
        // Спробуємо SCALE анімацію замість emissive (більш сумісна з glTF)
        const scaleAnimation = () => {
          const scaleValues = [];
          const numFrames = 60; // 60 кадрів для плавності
          
          for (let i = 0; i <= numFrames; i++) {
            const t = (i / numFrames) * Math.PI * 2; // Повний цикл
            const scale = 1.0 + Math.sin(t) * 0.1; // Пульсація 0.9 - 1.1
            scaleValues.push(scale, scale, scale); // x, y, z
          }
          
          const scaleTimes = [];
          for (let i = 0; i <= numFrames; i++) {
            scaleTimes.push((i / numFrames) * 2); // 2 секунди
          }
          
          return { times: scaleTimes, values: scaleValues };
        };
        
        const scaleData = scaleAnimation();
        
        emissiveMeshes.forEach((mesh, index) => {
          // Використовуємо scale анімацію (більш сумісна з glTF)
          const trackName = `${mesh.name}.scale`;
          
          const track = new THREE.VectorKeyframeTrack(
            trackName,
            scaleData.times,
            scaleData.values
          );
          
          const clip = new THREE.AnimationClip(`PulseAnimation_${index}`, 2, [track]);
          animations.push(clip);
          console.log(`  🎵 Створено SCALE анімацію: ${trackName}`);
        });
        
        // Додаємо анімації до моделі
        ultraCleanModel.animations = animations;
        console.log(`✅ Додано ${animations.length} emissive анімацій`);
        
        // Додаткова перевірка
        console.log('🔍 Перевірка animations array:');
        ultraCleanModel.animations.forEach((anim, i) => {
          console.log(`  ${i}: "${anim.name}" (${anim.duration}s, ${anim.tracks.length} tracks)`);
          anim.tracks.forEach((track, j) => {
            console.log(`    Track ${j}: ${track.name} (${track.times.length} keyframes)`);
          });
        });
      } else {
        console.log('ℹ️ Emissive мешів не знайдено');
      }
      
      console.log('🧹 Перевірка матеріалів перед експортом...');
      
      // Додаткова перевірка матеріалів
      ultraCleanModel.traverse((child) => {
        if (child.material) {
          const matType = child.material.constructor.name;
          const hasEmissive = child.material.emissiveIntensity > 0 ? ' ✨' : '';
          console.log(`  📋 ${child.name}: ${matType}${hasEmissive}`);
        }
      });
      
      // Експорт з УЛЬТРА-мінімальними опціями 
      const simpleOptions = {
        binary: true,
        embedImages: false,
        includeCustomExtensions: false,
        onlyVisible: true,
        // МАКСИМАЛЬНЕ блокування extensions
        extensionsUsed: [],
        extensionsRequired: [],
        // Базові налаштування з анімаціями
        animations: ultraCleanModel.animations,  // Передаємо анімації явно
        morphTargets: false,
        // Відключаємо усі можливі проблемні extensions  
        truncateDrawRange: true,
        // Забираємо materials: 'basic' щоб зберегти MeshStandardMaterial
      };
      
      simpleExporter.parse(
        ultraCleanModel,
        (result) => {
          console.log('📦 Успішний простий GLB експорт!');
          
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          const fileName = `${this.currentModelName.replace(/\.[^/.]+$/, '')}_simple.glb`;
          
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          
          setTimeout(() => URL.revokeObjectURL(link.href), 100);
          
          console.log(`✅ Простий GLB експортовано: ${fileName}`);
          console.log(`📊 Розмір файлу: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
          this.uiManager.showNotification(`✅ Простий експорт: ${fileName}`, 'success');
          
          // Очищення тимчасової моделі
          console.log('🧹 Очищення тимчасової моделі...');
          ultraCleanModel.traverse((child) => {
            if (child.material) child.material.dispose();
            if (child.geometry) child.geometry.dispose();
          });
        },
        (error) => {
          console.error('❌ Навіть простий GLB експорт не вдався:', error);
          console.error('📋 Деталі помилки:', error.message, error.stack);
          this.uiManager.showNotification('❌ GLB експорт не вдався', 'error');
          
          // Очищення тимчасової моделі при помилці
          console.log('🧹 Очищення тимчасової моделі (помилка)...');
          ultraCleanModel.traverse((child) => {
            if (child.material) child.material.dispose();
            if (child.geometry) child.geometry.dispose();
          });
        },
        simpleOptions
      );
      
    } catch (error) {
      console.error('❌ Помилка під час експорту:', error);
      this.uiManager.showNotification('❌ Не вдалося експортувати модель', 'error');
    }
  }
}

// Запуск програми
const app = new App();

// Зробити app доступним глобально для UI
window.app = app;
