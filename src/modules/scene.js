import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
  }

  // Update defaults for pulsing lights and apply to existing ones
  updatePulsingLightDefaults(newDefaults = {}) {
    this.pulseLightDefaults = Object.assign({}, this.pulseLightDefaults || {}, newDefaults);
    if (this.pulseLights && this.pulseLights.length > 0) {
      this.pulseLights.forEach(item => {
        if (newDefaults.baseIntensity !== undefined) {
          item.baseIntensity = newDefaults.baseIntensity;
          item.light.intensity = item.baseIntensity;
        }
        if (newDefaults.distance !== undefined) item.light.distance = newDefaults.distance;
        if (newDefaults.decay !== undefined) item.light.decay = newDefaults.decay;
        if (newDefaults.color !== undefined) {
          // Normalize and apply color immediately
          const num = (typeof this._normalizeColor === 'function') ? this._normalizeColor(newDefaults.color) : null;
          if (num !== null) {
            item.light.color.setHex(num);
          } else {
            try { item.light.color.set(newDefaults.color); } catch (e) { /* ignore */ }
          }
        }
        if (newDefaults.speed !== undefined) item.speed = newDefaults.speed;
        if (newDefaults.amplitude !== undefined) item.amplitude = newDefaults.amplitude;
      });
    }
  }
  
  init() {
    // Створення сцени
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // Створення камери
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 10); // Камера дивиться на центр з відстані
    this.camera.lookAt(0, 0, 0); // Дивимося на центр сцени
    
    // Створення рендерера
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true 
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Enable shadows globally
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Створення контролів
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0, 0); // Центр обертання - центр сцени
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 20;
    this.controls.update(); // Застосувати зміни target
    
    // Освітлення
    this.setupLighting();

  // Clock for animations (pulsing lights)
  this.clock = new THREE.Clock();
  this.pulseLights = [];
  // Defaults for pulsing lights (can be updated at runtime)
  this.pulseLightDefaults = {
    color: 0xffddaa,
    baseIntensity: 0.5,
    distance: 6,
    decay: 2,
    speed: 1.0,
    amplitude: 1.2
  };
    
    console.log('SceneManager ініціалізовано');
  }

  // Helper: normalize color input ("#rrggbb" or number) to numeric hex
  _normalizeColor(color) {
    if (color === undefined || color === null) return null;
    if (typeof color === 'number') return color;
    if (typeof color === 'string') {
      const s = color.trim();
      if (s.startsWith('#')) return parseInt(s.slice(1), 16);
      if (s.startsWith('0x')) return parseInt(s.slice(2), 16);
      const parsed = parseInt(s, 16);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
  
  setupLighting() {
    // Ambient light (disabled by default)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    // this.scene.add(ambientLight);

    // Directional light (disabled by default)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    // this.scene.add(directionalLight);

    // Point light для додаткового освітлення (disabled by default)
    const pointLight = new THREE.PointLight(0x4f9eff, 0.5, 10);
    pointLight.position.set(-5, 3, -5);
    // this.scene.add(pointLight);

    // Зберігаємо базові лампи щоб керувати ними окремо
    this.baseLights = {
      ambient: ambientLight,
      directional: directionalLight,
      point: pointLight
    };
  }
  
  update() {
    if (this.controls) {
      this.controls.update();
    }
    // Update pulsing lights
    if (this.pulseLights && this.pulseLights.length > 0 && this.clock) {
      const t = this.clock.getElapsedTime();
      this.pulseLights.forEach(cfg => {
        const { light, baseIntensity = 0.8, amplitude = 1.0, speed = 1.0, offset = 0 } = cfg;
        const value = baseIntensity + amplitude * (0.5 + 0.5 * Math.sin((t + offset) * speed * Math.PI * 2));
        light.intensity = value;
      });
    }
  }
  
  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // this.renderer.setSize(width, height);
  }
  
  setExposure(exposure) {
    if (this.renderer) {
      this.renderer.toneMappingExposure = exposure;
    }
  }
  
  addCustomLighting(model, modelName = '') {
  // Remove previous custom lighting
    // this.removeCustomLighting();
    
    // Обчислюємо розміри моделі
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
  // 1. Main lighting (acts like sun) - disabled by default
    const mainLight = new THREE.DirectionalLight(0xffffff, 0);
    mainLight.position.set(
        center.x + size.x * 0.5, 
        center.y + size.y * 1.5, 
        center.z + size.z * 0.5
    );
    mainLight.target.position.copy(center);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    // this.scene.add(mainLight.target);
    
  // 2. Inner model glow - disabled by default
  const innerLight = new THREE.PointLight(0xffffaa, 0, size.length());
  // innerLight.position.copy(center);
  // this.scene.add(innerLight);
    
  // 3. Bottom accent light - disabled by default
    const bottomLight = new THREE.PointLight(0xff8800, 0, size.length() * 0.8);
    bottomLight.position.set(center.x, center.y - size.y * 0.1, center.z);
    this.scene.add(bottomLight);
    
    // 4. Акцентне освітлення
    const accentLight = new THREE.SpotLight(0xff0080, 1.0, size.length() * 1.5, Math.PI * 0.3);
    accentLight.position.set(
      // center.x - size.x * 0.8, 
      // center.y + size.y * 0.8, 
      // center.z + size.z * 0.8
    );
    accentLight.target.position.copy(center);
    // this.scene.add(accentLight);
    // this.scene.add(accentLight.target);
    
  console.log('✨ Added custom lighting to model');
    
    // Зберігаємо посилання для подальшого управління
    this.customLights = {
      main: mainLight,
      inner: innerLight, 
      bottom: bottomLight,
      accent: accentLight
    };

    // Special-case: add a pulsing PointLight inside 'house 17' models
    try {
      const name = (modelName || model.name || '').toLowerCase();
      if (name.includes('house 17') || name.includes('house17') || name.includes('house-17')) {
        // For House 17 create a simple static PointLight (no pulsing)
  const defs = this.pulseLightDefaults || {};
  // Reduce radius and increase intensity for a brighter, tighter light
  const dist = Math.max(size.length() * 0.2, (defs.distance || 6) * 0.8);
  const colorNum = (typeof this._normalizeColor === 'function') ? (this._normalizeColor(defs.color) || 0xffddaa) : (defs.color || 0xffddaa);
  // Increase default brightness: multiply baseIntensity to make House17 noticeably brighter
  const houseLight = new THREE.PointLight(colorNum, (defs.baseIntensity || 1) * 4, dist, defs.decay || 1);
        houseLight.position.copy(center).add(new THREE.Vector3(0, 1, 0));
        // Enable shadow casting for the house light and tune shadow params to avoid light leaking
        houseLight.castShadow = true;
        if (houseLight.shadow) {
          // Increase shadow map resolution for crisper shadows
          houseLight.shadow.mapSize.set(2048, 2048);
          // Small bias to reduce shadow acne but avoid excessive peter-panning
          houseLight.shadow.bias = 0.0005;
          // A small radius softens the shadow; increase if needed
          houseLight.shadow.radius = 20;
          // For point lights the shadow camera is a PerspectiveCamera for each cubemap face;
          // ensure near/far are reasonable to cover the model
          if (houseLight.shadow.camera) {
            houseLight.shadow.camera.near = 0.1;
            houseLight.shadow.camera.far = Math.max(10, dist * 2);
          }
        }
        model.add(houseLight);

        // store as custom house17 light for later control
        this.customLights = this.customLights || {};
        this.customLights.house17 = houseLight;

        console.log('✨ Added static PointLight inside House 17 model:', modelName || model.name);
      }
    } catch (e) {
      console.warn('Failed to add pulsing light for model', modelName, e);
    }
  }
  
  removeCustomLighting() {
    if (this.customLights) {
      Object.values(this.customLights).forEach(light => {
        if (light.target) {
          // this.scene.remove(light.target);
        }
        // this.scene.remove(light);
      });
      // this.customLights = null;
    }
  }

  // Manage base scene lighting (enable/disable)
  toggleSceneLights(enabled) {
    if (!this.baseLights) {
      console.warn('toggleSceneLights: базові лампи не ініціалізовано');
      return;
    }
    Object.values(this.baseLights).forEach(light => {
      if (!light) return;
      if (enabled) {
        if (!light.parent) this.scene.add(light);
        light.visible = true;
      } else {
        light.visible = false;
      }
    });
  console.log(`🔆 Base scene lighting ${enabled ? 'enabled' : 'disabled'}`);
  }

  isSceneLightsEnabled() {
    if (!this.baseLights || !this.baseLights.ambient) return false;
    return !!this.baseLights.ambient.visible;
  }
  
  updateCustomLighting(params) {
    if (params.toggleLighting) {
      if (params.useCustom) {
  // Enable custom lighting
        if (this.customLights) {
          Object.values(this.customLights).forEach(light => {
            light.visible = true;
            if (light.target) light.target.visible = true;
          });
        }
  console.log('🔄 Custom lighting enabled');
      } else {
  // Disable custom lighting (leaves only base from setupLighting)
        if (this.customLights) {
          Object.values(this.customLights).forEach(light => {
            light.visible = false;
            if (light.target) light.target.visible = false;
          });
        }
  console.log('🔄 Restored original lighting');
      }
      return;
    }
    
    if (this.customLights) {
      if (params.mainIntensity !== undefined) {
        this.customLights.main.intensity = params.mainIntensity;
      }
      if (params.innerIntensity !== undefined) {
        this.customLights.inner.intensity = params.innerIntensity;
      }
      if (params.bottomIntensity !== undefined) {
        this.customLights.bottom.intensity = params.bottomIntensity;
      }
      if (params.innerColor !== undefined) {
        this.customLights.inner.color.set(params.innerColor);
      }
    }
  }
  
  addGlassThickness(root, { thickness = 0.02, createInner = true } = {}) {
    if (!root) return;
    root.traverse(child => {
      if (!child.isMesh) return;

      const name = (child.name || '').toLowerCase();
      const mat = child.material;

      const looksLikeGlass =
        (mat && (mat.transmission && mat.transmission > 0)) ||
        /glass|window|pane| стекло|вікно/.test(name);

      if (!looksLikeGlass) return;

      // Создаём физический материал для стекла
      const phys = new THREE.MeshPhysicalMaterial({
        color: mat && mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
        metalness: 0,
        roughness: 0,
        transmission: 0.9,
        transparent: true,
        opacity: 1,
        ior: 1.52,
        thickness: thickness,
        attenuationDistance: 0.5,
        attenuationColor: new THREE.Color(0xffffff),
        envMapIntensity: 1,
        clearcoat: 0,
        reflectivity: 0.5,
        side: THREE.FrontSide
      });

      // сохранить текстуры/эмиссию если есть
      if (mat && mat.map) phys.map = mat.map;
      if (mat && mat.emissive) phys.emissive = mat.emissive.clone();

      child.material = phys;

      // Создаём внутреннюю оболочку — копия геометрии смещённая по нормалям внутрь
      if (createInner) {
        const geo = child.geometry.clone();
        if (geo.attributes.normal && geo.attributes.position) {
          const pos = geo.attributes.position;
          const nrm = geo.attributes.normal;
          const count = pos.count;

          // смещаем позиции по нормалям
          for (let i = 0; i < count; i++) {
            const px = pos.getX(i) - nrm.getX(i) * thickness * 0.5;
            const py = pos.getY(i) - nrm.getY(i) * thickness * 0.5;
            const pz = pos.getZ(i) - nrm.getZ(i) * thickness * 0.5;
            pos.setXYZ(i, px, py, pz);
          }
          pos.needsUpdate = true;
          geo.computeVertexNormals();

          const innerMat = phys.clone();
          innerMat.side = THREE.BackSide;
          // чуть более тусклая внутренняя сторона:
          if (innerMat.emissive) innerMat.emissive.multiplyScalar(0.6);
          if (innerMat.color) innerMat.color.multiplyScalar(0.9);

          const inner = new THREE.Mesh(geo, innerMat);
          inner.name = `${child.name}_inner`;
          // расположить как дочерний (локальные трансформации унаследуются)
          child.add(inner);
        }
      }
    });
  }
  
  getRenderer() {
    return this.renderer;
  }
  
  getScene() {
    return this.scene;
  }
  
  getCamera() {
    return this.camera;
  }

  // Get the stored House17 light, if any
  getHouse17Light() {
    return this.customLights && this.customLights.house17 ? this.customLights.house17 : null;
  }

  // Set intensity for House17 light
  setHouse17Intensity(value) {
    const l = this.getHouse17Light();
    if (!l) return false;
    l.intensity = Number(value) || 0;
    return true;
  }

  // Set distance (radius) for House17 light
  setHouse17Distance(value) {
    const l = this.getHouse17Light();
    if (!l) return false;
    l.distance = Number(value) || l.distance;
    // update shadow camera far accordingly
    if (l.shadow && l.shadow.camera) {
      l.shadow.camera.far = Math.max(10, l.distance * 2);
      if (typeof l.shadow.camera.updateProjectionMatrix === 'function') l.shadow.camera.updateProjectionMatrix();
    }
    return true;
  }

  // Set position of House17 light (x,y,z) — accepts Vector3 or numbers
  setHouse17LightPosition(x, y, z) {
    const light = this.getHouse17Light();
    if (!light) {
      console.warn('House17 light not found');
      return;
    }
    if (x && typeof x === 'object' && x.isVector3) {
      light.position.copy(x);
    } else {
      light.position.set(Number(x) || 0, Number(y) || 0, Number(z) || 0);
    }
  }
}