import * as THREE from 'three';

export class GlowManager {
  constructor() {
    this.glowMeshes = [];
  this.originalMaterials = new Map(); // Store original materials
  this.pulseEnabled = true;  // Enable pulse by default
  this.pulseSpeed = 3.0;  // Pulse speed (restored)
  this.pulseIntensity = 1.0;  // Pulse intensity (restored)
    this.glowMode = 'emissive'; // 'separate' або 'emissive'
    
    this.params = {
      intensity: 2.0,  // Bright glow
      hue: 0.06
    };

    // 🎯 Glow settings
    this.glowSettings = {
      eyes: true,
      lights: true,
      transparent: true,
      emissive: true,
      all: false
    };
  }
  
  addInnerGlow(model) {
    this.clearGlowMeshes();
    
    if (!model) return;
    
    if (this.glowMode === 'emissive') {
      this.addEmissiveGlow(model);
    } else {
      this.addSeparateGlow(model);
    }
  }
  
  addEmissiveGlow(model) {
    // Модифікація оригінальних матеріалів для додання emissive glow
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        // 🎯 НАЛАШТУВАННЯ ДЛ�я SUSANNA1 - що має світитися:
        const shouldGlow = this.shouldMeshGlow(child);
        
        if (shouldGlow) {
          // Save the original material
          if (!this.originalMaterials.has(child.uuid)) {
            this.originalMaterials.set(child.uuid, child.material.clone());
          }

          // Apply emissive properties
          if (child.material.emissive) {
            const glowColor = new THREE.Color().setHSL(this.params.hue, 1, 0.3);
            child.material.emissive.copy(glowColor);
            child.material.emissiveIntensity = this.params.intensity * 0.1;
          }

          // Add to bloom layer
          child.layers.enable(1);
          this.glowMeshes.push(child); // Keep reference for updates

          console.log(`✨ Added glow to: ${child.name || 'unnamed mesh'}`);
        }
      }
    });
    
  console.log(`Added emissive glow to ${this.glowMeshes.length} materials`);
  }
  
  addSeparateGlow(model) {
    const meshesToProcess = [];
    
    // Збір тільки тих мешів, що мають світитися
    model.traverse((child) => {
      if (child.isMesh && this.shouldMeshGlow(child)) {
        meshesToProcess.push(child);
      }
    });
    
    // Створення окремих glow мешів
    meshesToProcess.forEach(mesh => {
      try {
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(this.params.hue, 1, 0.5),
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(mesh.geometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.02);
        glowMesh.layers.enable(1); // Bloom шар
        
        model.add(glowMesh);
        this.glowMeshes.push(glowMesh);
        
  console.log(`✨ Created separate glow for: ${mesh.name || 'unnamed mesh'}`);
        
      } catch (error) {
  console.warn('Failed to create glow for mesh:', error);
      }
    });
    
  console.log(`Added separate glow to ${this.glowMeshes.length} meshes`);
  }
  
  clearGlowMeshes() {
    if (this.glowMode === 'emissive') {
  // Restore original materials
      this.glowMeshes.forEach(mesh => {
        const originalMaterial = this.originalMaterials.get(mesh.uuid);
        if (originalMaterial && mesh.material) {
          mesh.material = originalMaterial;
        }
        mesh.layers.disable(1);
      });
      this.originalMaterials.clear();
    } else {
  // Remove separate glow meshes
      this.glowMeshes.forEach(mesh => {
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          mesh.material.dispose();
        }
      });
    }
  this.glowMeshes = [];
  }
  
  updateParams(params) {
    Object.assign(this.params, params);
    
    if (this.glowMode === 'emissive') {
      // Update emissive color
      this.glowMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.emissive) {
          const glowColor = new THREE.Color().setHSL(this.params.hue, 1, 0.3);
          mesh.material.emissive.copy(glowColor);
          mesh.material.emissiveIntensity = this.params.intensity * 0.1;
        }
      });
    } else {
      // Update color of separate glow meshes
      this.glowMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.color.setHSL(this.params.hue, 1, 0.5);
        }
      });
    }
  }
  
  setGlowMode(mode) {
    this.glowMode = mode;
  console.log('Glow mode changed to:', mode);
  }
  
  getGlowMode() {
    return this.glowMode;
  }
  
  setPulseEnabled(enabled) {
    this.pulseEnabled = enabled;
  console.log('Pulse', enabled ? 'enabled' : 'disabled');
  }
  
  update() {
    if (!this.pulseEnabled || this.glowMeshes.length === 0) {
      return;
    }
    
    const time = Date.now() * 0.001;
    const pulse = Math.sin(time * this.pulseSpeed) * 0.5 + 0.5;
    const intensity = this.params.intensity * (0.5 + pulse * this.pulseIntensity);
    
    if (this.glowMode === 'emissive') {
      // Оновлення emissive властивостей
      this.glowMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.emissive) {
          // 🎨 PULSE SETTINGS:
          // Base brightness: 0.3 (0.0-1.0) - higher means brighter base
          // Pulse amplitude: intensity * 0.2 - larger multiplier = stronger pulse
          const glowColor = new THREE.Color().setHSL(this.params.hue, 1, 0.3 + intensity * 0.2);
          mesh.material.emissive.copy(glowColor);
          // Emissive intensity: intensity * 0.3 - increased for brighter glow
          mesh.material.emissiveIntensity = intensity * 0.3;
        }
      });
    } else {
      // Оновлення окремих glow мешів
      this.glowMeshes.forEach(mesh => {
        if (mesh.material) {
          const lightness = 0.3 + intensity * 0.2;
          mesh.material.color.setHSL(this.params.hue, 1, lightness);
          mesh.material.opacity = 0.4 + intensity * 0.2;
        }
      });
    }
  }
  
  // 🎯 MAIN CONFIG FUNCTION - WHAT SHOULD GLOW
  shouldMeshGlow(mesh) {
  // If "all" is enabled - everything glows
    if (this.glowSettings.all) {
      return true;
    }
    
  // ========== SETTINGS FOR SUSANNA1 ==========
    
    // 1️⃣ По назві об'єкта (найточніший спосіб)
    if (mesh.name && this.glowSettings.eyes) {
      const name = mesh.name.toLowerCase();
      
  // Elements with these names will glow:
      const eyeNames = ['eye', 'pupil', 'iris'];
      const hasEyeName = eyeNames.some(keyword => name.includes(keyword));
      if (hasEyeName) {
  console.log(`👁️ Found eyes for glow: ${mesh.name}`);
        return true;
      }
    }
    
    if (mesh.name && this.glowSettings.lights) {
      const name = mesh.name.toLowerCase();
      
  // Light elements that should glow:
      const lightNames = [
        'light', 'glow', 'emission', 'lamp', 'bulb', 
        'neon', 'screen', 'display', 'led', 'torch'
      ];
      const hasLightName = lightNames.some(keyword => name.includes(keyword));
      if (hasLightName) {
  console.log(`💡 Found light for glow: ${mesh.name}`);
        return true;
      }
    }
    
    // 2️⃣ По матеріалу (прозорі або emissive)
    if (mesh.material) {
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      
      // Transparent materials glow
      if (this.glowSettings.transparent && material.transparent && material.opacity < 0.9) {
        console.log(`🔍 Found transparent material for glow: ${mesh.name || 'unnamed'}`);
        return true;
      }
      
      // Materials with emissive color glow
      if (this.glowSettings.emissive && material.emissive && material.emissive.getHex() > 0) {
        console.log(`✨ Found emissive material for glow: ${mesh.name || 'unnamed'}`);
        return true;
      }
    }
    
    // 3️⃣ За замовчуванням - НЕ світиться
    return false;
  }
  
  // 🔧 Update glow settings
  updateGlowSettings(settings) {
    this.glowSettings = { ...this.glowSettings, ...settings };
    console.log('🎯 Updated glow settings:', this.glowSettings);
  }
  
  dispose() {
    this.clearGlowMeshes();
  }
}