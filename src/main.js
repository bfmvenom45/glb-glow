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
  this.currentModelName = 'class-out_emision-inside 14.glb';
    
    this.init();
  }
  
  async init() {
    // Ініціалізація сцени
    this.sceneManager.init();
    this.bloomManager.init();
    
  // Loading initial model
    await this.loadModel(this.currentModelName);
    
  // Setup UI
    this.setupUI();
    // Do NOT auto-load saved settings on startup — settings should reset on reload.
    // Saved settings are applied only when user clicks Save Settings.
    
    // Запуск анімації
    this.animate();
    
    // Обробники подій
    this.setupEventListeners();

    // Hook up Save / Reset buttons
    const saveBtn = document.getElementById('save-settings');
    const resetBtn = document.getElementById('reset-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.uiManager.saveSettings();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Confirm before reset
        if (confirm('Reset settings to defaults?')) {
          this.uiManager.resetSettings();
        }
      });
    }
    
    // Drag & Drop функціональність
    this.setupDragAndDrop();
  }
  
  async loadModel(modelPath) {
    try {
      this.showLoading();
  this.uiManager.showNotification(`Loading model ${modelPath}...`, 'info');
      
      // Видалення попередньої моделі
      if (this.currentModel) {
        this.sceneManager.scene.remove(this.currentModel);
        this.glowManager.clearGlowMeshes();
      }
      
  // Loading a new model
      const model = await this.modelLoader.load(modelPath);
      this.currentModel = model;
      
      // Enable shadows on meshes where appropriate to prevent light leaking
      this.currentModel.traverse((node) => {
        if (node.isMesh) {
          try {
            // Skip enabling cast/receive on transmissive/transparent indoor glass to avoid artifacts
            const mat = node.material;
            const isTransmissive = mat && ((mat.transmission && mat.transmission > 0) || mat.transparent);
            node.castShadow = !isTransmissive;
            node.receiveShadow = true;
          } catch (e) {
            // ignore materials we can't access
          }
        }
      });

      // Застосування всіх ефектів
      this.applyAllEffects(model, modelPath);
      // If model is House 17, show house17 UI button
      const name = (modelPath || '').toLowerCase();
      if (name.includes('house 17') || name.includes('house17') || name.includes('house-17')) {
        this.uiManager.setHouse17ButtonVisible(true);
        // Sync controls with current light values if available
        const light = this.sceneManager.getHouse17Light();
        if (light) {
          const intensityEl = document.getElementById('house17-intensity');
          const distEl = document.getElementById('house17-distance');
          const intensityVal = document.getElementById('house17-intensity-value');
          const distVal = document.getElementById('house17-distance-value');
          if (intensityEl && intensityVal) {
            intensityEl.value = light.intensity;
            intensityVal.textContent = light.intensity.toFixed(2);
          }
          if (distEl && distVal) {
            distEl.value = light.distance;
            distVal.textContent = light.distance.toFixed(2);
          }
        }
      } else {
        this.uiManager.setHouse17ButtonVisible(false);
      }
      
    } catch (error) {
  console.error('Error loading model:', error);
      this.hideLoading();
  this.uiManager.showNotification(`Error loading ${modelPath}: ${error.message}`, 'error');
    }
  }
  
  async loadModelFromFile(file) {
    try {
      this.showLoading();
  this.uiManager.showNotification(`Loading file ${file.name}...`, 'info');
      
      // Видалення попередньої моделі
      if (this.currentModel) {
        this.sceneManager.scene.remove(this.currentModel);
        this.glowManager.clearGlowMeshes();
      }
      
  // Load model from file
      const model = await this.modelLoader.loadFromFile(file);
      this.currentModel = model;
      
      // Застосування всіх ефектів
      this.applyAllEffects(model, file.name);
      
    } catch (error) {
  console.error('Error loading file:', error);
      this.hideLoading();
  this.uiManager.showNotification(`Error loading ${file.name}: ${error.message}`, 'error');
    }
  }
  
  applyAllEffects(model, modelName) {
    try {
      // Додавання до сцени
      this.sceneManager.scene.add(model);
      
  // Додавання власного освітлення (містить optional modelName)
  this.sceneManager.addCustomLighting(model, modelName);
      
  // Add glow effect with default settings
      this.glowManager.addInnerGlow(model);
      
      // Оновлення bloom шарів
      this.bloomManager.setupModelLayers(model);
      
      this.hideLoading();
  this.uiManager.showNotification(`${modelName} successfully loaded and configured!`, 'success');
  console.log(`Model ${modelName} successfully loaded and configured`);
      
    } catch (error) {
  console.error('Error applying effects:', error);
      this.hideLoading();
  this.uiManager.showNotification(`Error applying effects to ${modelName}`, 'error');
    }
  }
  
  setupUI() {
  // Setup bloom controls
    this.uiManager.setupBloomControls((params) => {
      this.bloomManager.updateParams(params);
    });
    
  // Setup glow controls
    this.uiManager.setupGlowControls((params) => {
      this.glowManager.updateParams(params);
    });
    
    // Setup pulse controls
    this.uiManager.setupPulseControl((enabled) => {
      this.glowManager.setPulseEnabled(enabled);
    });

    // Pulsing controls removed from UI — no hookup
    
  // Setup bloom mode selection
    this.uiManager.setupBloomModeControl((mode) => {
      this.bloomManager.setMode(mode);
    });
    
  // Setup glow mode selection
    this.uiManager.setupGlowModeControl((mode) => {
      this.glowManager.setGlowMode(mode);
      // Перезастосовуємо glow з новим режимом
      if (this.currentModel) {
        this.glowManager.addInnerGlow(this.currentModel);
      }
    });
    
  // Setup model selection
    this.uiManager.setupModelSelector(
      (modelPath) => {
        this.currentModelName = modelPath;
        this.loadModel(modelPath);
      },
      (file) => {
        this.loadModelFromFile(file);
      }
    );
    
  // Setup object glow settings
    this.uiManager.setupGlowSettings((settings) => {
      this.glowManager.updateGlowSettings(settings);
  // Reapply glow with new settings
      if (this.currentModel) {
        this.glowManager.addInnerGlow(this.currentModel);
  this.uiManager.showNotification('Glow settings updated!', 'success');
      }
    });
    
  // Setup custom lighting
    this.uiManager.setupCustomLightingControls((params) => {
      this.sceneManager.updateCustomLighting(params);
    });

    // Кнопка вкл/викл базового освітлення сцени
    this.uiManager.setupSceneLightToggle((enabled) => {
      this.sceneManager.toggleSceneLights(enabled);
    });

    // House17 button hookup — toggle pulsing on click
    this.uiManager.setupHouse17Button(() => {
      const isPulsing = this.sceneManager.isHouse17Pulsing();
      if (!isPulsing) {
        // start pulsing with reasonable defaults; distance pulses from 0 to 25
        this.sceneManager.startHouse17Pulse({ speed: 1.0, amplitude: 1.2, distanceMin: 0, distanceMax: 25 });
        this.uiManager.updateHouse17ButtonLabel(true);
      } else {
        this.sceneManager.stopHouse17Pulse();
        this.uiManager.updateHouse17ButtonLabel(false);
      }
    });

    // House17 controls (intensity/distance)
    this.uiManager.setupHouse17Controls({
      onIntensity: (v) => this.sceneManager.setHouse17Intensity(v),
      onDistance: (v) => this.sceneManager.setHouse17Distance(v)
    });

    // Info button (modal)
    this.uiManager.setupInfoButton();

    // Ініціалізація кнопки відповідно до поточного стану
    const sceneLightBtn = document.getElementById('scene-light-toggle');
    if (sceneLightBtn) {
      const isOn = this.sceneManager.isSceneLightsEnabled();
      if (isOn) {
        sceneLightBtn.classList.add('active');
  sceneLightBtn.textContent = '🔆 Disable Light';
      } else {
        sceneLightBtn.classList.remove('active');
  sceneLightBtn.textContent = '🔆 Enable Light';
      }
    }
    // set initial label for house17 button according to current pulse state
    const housePulsing = this.sceneManager.isHouse17Pulsing();
    this.uiManager.updateHouse17ButtonLabel(!!housePulsing);
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
          this.uiManager.showNotification('Only .glb and .gltf files are supported', 'error');
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
  console.log('🎬 Creating emissive pulse animation for export...');
      
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
            const scale = 1.0 + Math.sin(t) * 0.1; // Pulse 0.9 - 1.1
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
  // Base animation settings
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
          console.log('🧹 Cleaning temporary model (error)...');
          ultraCleanModel.traverse((child) => {
            if (child.material) child.material.dispose();
            if (child.geometry) child.geometry.dispose();
          });
        },
        simpleOptions
      );
      
    } catch (error) {
  console.error('❌ Export error:', error);
  this.uiManager.showNotification('❌ Failed to export model', 'error');
    }
  }
}

// Запуск програми
const app = new App();

// Зробити app доступним глобально для UI
window.app = app;
