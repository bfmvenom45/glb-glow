export class UIManager {
  constructor() {
    this.bloomCallback = null;
    this.glowCallback = null;
    this.pulseCallback = null;
    this.bloomModeCallback = null;
    this.modelSelectorCallback = null;
    
  this.pulseEnabled = true;  // Enable pulse by default
  this.currentModel = 'class-out_emision-inside 14.glb';
    this.glowMode = 'emissive';
    this.sceneLightEnabled = false; // Scene base lights disabled by default
    this.storageKey = 'aestar_ui_settings_v1';
  }
  
  setupBloomControls(callback) {
    this.bloomCallback = callback;
    
    // Слайдери bloom
    this.setupSlider('strength', 'strength-value', (value) => {
      callback({ bloomStrength: parseFloat(value) });
    });
    
    this.setupSlider('threshold', 'threshold-value', (value) => {
      callback({ bloomThreshold: parseFloat(value) });
    });
    
    this.setupSlider('radius', 'radius-value', (value) => {
      callback({ bloomRadius: parseFloat(value) });
    });
    
    this.setupSlider('exposure', 'exposure-value', (value) => {
      callback({ exposure: parseFloat(value) });
    });
  }
  
  setupGlowControls(callback) {
    this.glowCallback = callback;
    
    this.setupSlider('glow-intensity', 'glow-intensity-value', (value) => {
      callback({ intensity: parseFloat(value) });
    });
    
    this.setupSlider('glow-hue', 'glow-hue-value', (value) => {
      callback({ hue: parseFloat(value) });
    });
  }
  
  setupPulseControl(callback) {
    this.pulseCallback = callback;
    
    const pulseButton = document.getElementById('pulse-button');
    if (pulseButton) {
      pulseButton.addEventListener('click', () => {
        this.pulseEnabled = !this.pulseEnabled;
        this.updatePulseButton();
        // Do not auto-save on toggle; settings are saved explicitly via Save button
        callback(this.pulseEnabled);
      });
    }
  }
  
  setupBloomModeControl(callback) {
    this.bloomModeCallback = callback;
    
    const bloomModeRadios = document.querySelectorAll('input[name=\"bloom-mode\"]');
    bloomModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          callback(e.target.value);
        }
      });
    });
  }
  
  setupGlowModeControl(callback) {
    this.glowModeCallback = callback;
    
    const glowModeRadios = document.querySelectorAll('input[name=\"glow-mode\"]');
    glowModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          callback(e.target.value);
        }
      });
    });
  }
  
  setupModelSelector(callback, fileCallback) {
    this.modelSelectorCallback = callback;
    this.fileUploadCallback = fileCallback;
    
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
      card.addEventListener('click', () => {
        const modelPath = card.dataset.model;
        
        // Оновлення активної карточки
        modelCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        // Приховуємо інформацію про файл
        this.clearFileInfo();
        
        this.currentModel = modelPath;
        callback(modelPath);
      });
    });
    
  // File upload handling
    this.setupFileUpload();
  }
  
  setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const clearButton = document.getElementById('clear-file');
    
    if (uploadButton && fileInput) {
      uploadButton.addEventListener('click', () => {
        fileInput.click();
      });
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleFileUpload(file);
        }
      });
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearFileInfo();
        if (fileInput) fileInput.value = '';
      });
    }
  }
  
  handleFileUpload(file) {
    // Показуємо інформацію про файл
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    
    if (fileInfo && fileName) {
      fileName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      fileInfo.classList.remove('hidden');
    }
    
    // Прибираємо активні карточки
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(c => c.classList.remove('active'));
    
  // Invoke callback for loading
    if (this.fileUploadCallback) {
      this.fileUploadCallback(file);
    }
  }
  
  clearFileInfo() {
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
      fileInfo.classList.add('hidden');
    }
  }
  
  setupGlowSettings(callback) {
    this.glowSettingsCallback = callback;
    
    const applyButton = document.getElementById('apply-glow-settings');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        const settings = {
          eyes: document.getElementById('glow-eyes')?.checked || false,
          lights: document.getElementById('glow-lights')?.checked || false,
          transparent: document.getElementById('glow-transparent')?.checked || false,
          emissive: document.getElementById('glow-emissive')?.checked || false,
          all: document.getElementById('glow-all')?.checked || false
        };
        
  console.log('🎯 Glow settings:', settings);
        callback(settings);
      });
    }
  }

  // Setup controls for pulsing lights (global parameters)
  setupPulsingControls(callback) {
    // Pulsing controls removed from UI — noop to keep callers safe
    this.pulsingCallback = null;
  }

  // Кнопка вкл/викл базового освітлення сцени
  setupSceneLightToggle(callback) {
    this.sceneLightCallback = callback;
    const btn = document.getElementById('scene-light-toggle');
    if (!btn) return;

    // initialize button to current state
    if (this.sceneLightEnabled) btn.classList.add('active');
    else btn.classList.remove('active');
    this.updateSceneLightButton();

    btn.addEventListener('click', () => {
      const isOn = btn.classList.toggle('active');
      this.sceneLightEnabled = isOn;
      this.updateSceneLightButton();
      // Do not auto-save here; user must press Save to persist settings
      if (typeof callback === 'function') callback(isOn);
    });
  }

  // Save current UI settings to localStorage
  saveSettings() {
    try {
      const settings = {
        bloomStrength: document.getElementById('strength')?.value,
        bloomThreshold: document.getElementById('threshold')?.value,
        bloomRadius: document.getElementById('radius')?.value,
        exposure: document.getElementById('exposure')?.value,
        glowIntensity: document.getElementById('glow-intensity')?.value,
        glowHue: document.getElementById('glow-hue')?.value,
        bloomMode: document.querySelector('input[name="bloom-mode"]:checked')?.value,
        glowMode: document.querySelector('input[name="glow-mode"]:checked')?.value,
        pulseEnabled: this.pulseEnabled,
        sceneLightEnabled: this.sceneLightEnabled,
        currentModel: this.currentModel
      };
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
      this.showNotification('Settings saved', 'success');
    } catch (e) {
      console.error('Failed to save settings', e);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  // Load settings from localStorage and apply to controls
  loadSettings() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const settings = JSON.parse(raw);

      if (settings.bloomStrength !== undefined) {
        const s = document.getElementById('strength');
        s.value = settings.bloomStrength;
        document.getElementById('strength-value').textContent = s.value;
        this.bloomCallback && this.bloomCallback({ bloomStrength: parseFloat(s.value) });
      }

      if (settings.bloomThreshold !== undefined) {
        const s = document.getElementById('threshold');
        s.value = settings.bloomThreshold;
        document.getElementById('threshold-value').textContent = s.value;
        this.bloomCallback && this.bloomCallback({ bloomThreshold: parseFloat(s.value) });
      }

      if (settings.bloomRadius !== undefined) {
        const s = document.getElementById('radius');
        s.value = settings.bloomRadius;
        document.getElementById('radius-value').textContent = s.value;
        this.bloomCallback && this.bloomCallback({ bloomRadius: parseFloat(s.value) });
      }

      if (settings.exposure !== undefined) {
        const s = document.getElementById('exposure');
        s.value = settings.exposure;
        document.getElementById('exposure-value').textContent = s.value;
        this.bloomCallback && this.bloomCallback({ exposure: parseFloat(s.value) });
      }

      if (settings.glowIntensity !== undefined) {
        const s = document.getElementById('glow-intensity');
        s.value = settings.glowIntensity;
        document.getElementById('glow-intensity-value').textContent = s.value;
        this.glowCallback && this.glowCallback({ intensity: parseFloat(s.value) });
      }

      if (settings.glowHue !== undefined) {
        const s = document.getElementById('glow-hue');
        s.value = settings.glowHue;
        document.getElementById('glow-hue-value').textContent = s.value;
        this.glowCallback && this.glowCallback({ hue: parseFloat(s.value) });
      }

      if (settings.bloomMode) {
        const radio = document.querySelector(`input[name="bloom-mode"][value="${settings.bloomMode}"]`);
        if (radio) radio.checked = true;
        this.bloomModeCallback && this.bloomModeCallback(settings.bloomMode);
      }

      if (settings.glowMode) {
        const radio = document.querySelector(`input[name="glow-mode"][value="${settings.glowMode}"]`);
        if (radio) radio.checked = true;
        this.glowModeCallback && this.glowModeCallback(settings.glowMode);
      }

      if (settings.pulseEnabled !== undefined) {
        this.pulseEnabled = !!settings.pulseEnabled;
        this.updatePulseButton();
        this.pulseCallback && this.pulseCallback(this.pulseEnabled);
      }

      if (settings.sceneLightEnabled !== undefined) {
        this.sceneLightEnabled = !!settings.sceneLightEnabled;
        this.updateSceneLightButton();
        this.sceneLightCallback && this.sceneLightCallback(this.sceneLightEnabled);
      }

      if (settings.currentModel) {
        this.currentModel = settings.currentModel;
        this.updateModelPreview(this.currentModel);
        this.modelSelectorCallback && this.modelSelectorCallback(this.currentModel);
      }

      this.showNotification('Settings loaded', 'info');
      return true;
    } catch (e) {
      console.error('Failed to load settings', e);
      this.showNotification('Failed to load settings', 'error');
      return false;
    }
  }

  // Reset settings to defaults (and remove from storage)
  resetSettings() {
    try {
      localStorage.removeItem(this.storageKey);
      // Reload page to ensure full reset (safe and simple)
      this.showNotification('Settings reset to defaults', 'success');
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      console.error('Failed to reset settings', e);
      this.showNotification('Failed to reset settings', 'error');
    }
  }

  updateSceneLightButton() {
    const btn = document.getElementById('scene-light-toggle');
    if (!btn) return;
    btn.textContent = this.sceneLightEnabled ? '🔆 Disable Light' : '🔆 Enable Light';
    // Match pulse button visuals exactly (same gradients and text color)
    btn.style.background = this.sceneLightEnabled ?
      'linear-gradient(45deg, #ff6b6b 0%, #ee5a52 100%)' :
      'linear-gradient(45deg, #667eea 0%, #764ba2 100%)';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.boxShadow = this.sceneLightEnabled ? '0 4px 12px #ff6b6b66' : '0 4px 12px #667eea66';
  }
  
  setupCustomLightingControls(callback) {
    this.lightingCallback = callback;
    
    // Перевірка чи існує секція custom lighting (може бути прихована)
    const customLightingSection = document.querySelector('.custom-lighting-section');
    if (!customLightingSection) {
  // Section hidden - skip settings
      console.log('ℹ️ Custom lighting controls приховані');
      return;
    }
    
    // Слайдери освітлення (тільки якщо секція не прихована)
    this.setupSlider('main-light-intensity', 'main-light-value', (value) => {
      callback({ mainIntensity: parseFloat(value) });
    }, true); // silent mode
    
    this.setupSlider('inner-light-intensity', 'inner-light-value', (value) => {
      callback({ innerIntensity: parseFloat(value) });
    }, true);
    
    this.setupSlider('bottom-light-intensity', 'bottom-light-value', (value) => {
      callback({ bottomIntensity: parseFloat(value) });
    }, true);
    
    // Колір внутрішнього світла
    const colorPicker = document.getElementById('inner-light-color');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        callback({ innerColor: e.target.value });
      });
    }
    
    // Кнопка переключення освітлення
    const toggleButton = document.getElementById('toggle-lighting');
    if (toggleButton) {
      let useCustomLighting = true;
      toggleButton.addEventListener('click', () => {
        useCustomLighting = !useCustomLighting;
        callback({ 
          toggleLighting: true, 
          useCustom: useCustomLighting 
        });
        
        toggleButton.textContent = useCustomLighting 
          ? '🔄 Custom/Original Light (Custom)' 
          : '🔄 Custom/Original Light (Original)';
      });
    }
  }
  
  setupSlider(sliderId, valueId, callback, silent = false) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        valueDisplay.textContent = value;
        callback(value);
      });
      
      // Ініціалізація початкового значення
      valueDisplay.textContent = slider.value;
    } else if (!silent) {
      // Показуємо попередження тільки якщо не в silent режимі
      console.warn(`Не знайдено елементи для слайдера: ${sliderId}`);
    }
  }

  // Info modal: show/hide and setup
  setupInfoButton() {
    const btn = document.getElementById('info-button');
    const modal = document.getElementById('info-modal');
    const close = modal ? modal.querySelector('#info-close') : null;

    if (!btn || !modal) return;

    btn.addEventListener('click', () => this.showInfoModal());
    if (close) close.addEventListener('click', () => this.hideInfoModal());

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hideInfoModal();
    });
  }

  // Setup House17 light toggle button: visible only when House 17 model active
  setupHouse17Button(callback) {
    this.house17Callback = callback;
    const btn = document.getElementById('house17-light-toggle');
    if (!btn) return;
    // Click handler
    btn.addEventListener('click', () => {
      if (typeof this.house17Callback === 'function') this.house17Callback();
    });
  }

  // Update label for House17 button (pulse state aware)
  updateHouse17ButtonLabel(pulsing = false) {
    const btn = document.getElementById('house17-light-toggle');
    if (!btn) return;
    btn.textContent = pulsing ? '🔴 Disable House17 Pulse' : '💫 Enable House17 Pulse';
    btn.style.background = pulsing ? 'linear-gradient(45deg, #ff6b6b 0%, #ee5a52 100%)' : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)';
    btn.style.color = '#fff';
  }

  // Setup House17 specific controls (intensity, distance sliders)
  setupHouse17Controls(callbacks = {}) {
    const intensity = document.getElementById('house17-intensity');
    const dist = document.getElementById('house17-distance');
    const intensityVal = document.getElementById('house17-intensity-value');
    const distVal = document.getElementById('house17-distance-value');

    const panel = document.querySelector('.house17-controls');

    if (panel) {
      // ensure hidden by default; visibility controlled by setHouse17ButtonVisible
      panel.classList.add('hidden');
    }

    if (intensity && intensityVal) {
      intensity.addEventListener('input', (e) => {
        intensityVal.textContent = e.target.value;
        if (callbacks.onIntensity) callbacks.onIntensity(Number(e.target.value));
      });
    }

    if (dist && distVal) {
      dist.addEventListener('input', (e) => {
        distVal.textContent = e.target.value;
        if (callbacks.onDistance) callbacks.onDistance(Number(e.target.value));
      });
    }
  }

  // Show/hide the House17 button depending on active model
  setHouse17ButtonVisible(visible = false) {
    const btn = document.getElementById('house17-light-toggle');
    if (!btn) return;
    if (visible) {
      btn.classList.remove('hidden');
      btn.setAttribute('aria-hidden', 'false');
    } else {
      btn.classList.add('hidden');
      btn.setAttribute('aria-hidden', 'true');
    }
    const panel = document.querySelector('.house17-controls');
    if (panel) {
      if (visible) {
        panel.classList.remove('hidden');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.classList.add('hidden');
        panel.setAttribute('aria-hidden', 'true');
      }
    }
  }

  showInfoModal() {
    const modal = document.getElementById('info-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  hideInfoModal() {
    const modal = document.getElementById('info-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  
  updatePulseButton() {
    const pulseButton = document.getElementById('pulse-button');
    if (pulseButton) {
      pulseButton.textContent = this.pulseEnabled ? 
  '🔴 Disable Pulse' : 
  '💫 Enable Pulse';
      
      pulseButton.style.background = this.pulseEnabled ?
        'linear-gradient(45deg, #ff6b6b 0%, #ee5a52 100%)' :
        'linear-gradient(45deg, #667eea 0%, #764ba2 100%)';
    }
  }
  
  setLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      if (isLoading) {
        loadingIndicator.classList.remove('hidden');
      } else {
        loadingIndicator.classList.add('hidden');
      }
    }
  }
  
  showNotification(message, type = 'info') {
    // Створення та показ сповіщення
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стилі для сповіщення
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none'
    });
    
    // Кольори залежно від типу
    const colors = {
      info: 'rgba(79, 158, 255, 0.9)',
      success: 'rgba(76, 175, 80, 0.9)',
      warning: 'rgba(255, 193, 7, 0.9)',
      error: 'rgba(244, 67, 54, 0.9)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Анімація появи
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });
    
    // Автоматичне приховання
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  updateModelPreview(modelPath) {
    // Оновлення превью моделі (якщо потрібно)
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
      if (card.dataset.model === modelPath) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }
  
  getControlValues() {
    return {
      bloomStrength: parseFloat(document.getElementById('strength')?.value || 0.01),
      bloomThreshold: parseFloat(document.getElementById('threshold')?.value || 0.1),
      bloomRadius: parseFloat(document.getElementById('radius')?.value || 0.55),
      exposure: parseFloat(document.getElementById('exposure')?.value || 0.1),
      glowIntensity: parseFloat(document.getElementById('glow-intensity')?.value || 2.9),
      glowHue: parseFloat(document.getElementById('glow-hue')?.value || 0.06),
      bloomMode: document.querySelector('input[name=\"bloom-mode\"]:checked')?.value || 'simple',
      currentModel: this.currentModel
    };
  }
}