/**
 * 性能优化系统
 * 针对3D天文模拟的加载速度、内存使用和运行性能优化
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { resourceCache } from './ResourceCache.js';

export class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      loadingTime: 0,
      memoryUsage: 0,
      fps: 0,
      textureMemory: 0,
      geometryMemory: 0,
      drawCalls: 0
    };

    this.settings = {
      quality: 'adaptive', // 'low', 'medium', 'high', 'adaptive'
      textureResolution: 512, // 256, 512, 1024, 2048
      maxTextureSize: 2048,
      geometryDetail: 'medium',
      shadowsEnabled: true,
      antialiasing: 'FXAA',
      maxFPS: 60,
      memoryLimit: 512 // MB
    };

    this.cache = new Map();
    this.loadedTextures = new Set();
    this.loadedModels = new Set();
    this.isInitialized = false;
    this.performanceObserver = null;
    this.frameStats = {
      lastFrameTime: 0,
      frameCount: 0,
      fps: 0,
      frameTime: 0
    };

    this.initialize();
  }

  async initialize() {
    console.log('⚡ Initializing Performance Optimizer...');

    this.setupPerformanceMonitoring();
    this.setupQualityAdaptation();
    this.setupMemoryManagement();
    this.setupCachingSystem();
    this.setupLazyLoading();

    this.isInitialized = true;
    console.log('✅ Performance Optimizer initialized');
    this.startPerformanceMonitoring();
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    // 使用 Performance API 监控
    if (window.performance) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'mark', 'navigation'] });
    }

    // 内存监控
    if (window.performance.memory) {
      setInterval(() => {
        this.updateMemoryMetrics();
      }, 1000);
    }

    // FPS监控
    this.setupFPSCounter();
  }

  /**
   * 开始性能监控
   */
  startPerformanceMonitoring() {
    if (!this.performanceObserver) {
      console.warn('Performance Observer not available');
      return;
    }

    // 开始监控
    try {
      this.performanceObserver.observe({
        entryTypes: ['measure', 'mark', 'navigation', 'resource']
      });
      console.log('🔍 Performance monitoring started');
    } catch (error) {
      console.warn('Failed to start performance monitoring:', error);
    }
  }

  /**
   * 处理性能条目
   */
  processPerformanceEntries(entries) {
    entries.forEach(entry => {
      switch (entry.entryType) {
      case 'measure':
        this.processMeasureEntry(entry);
        break;
      case 'mark':
        this.processMarkEntry(entry);
        break;
      case 'navigation':
        this.processNavigationEntry(entry);
        break;
      case 'resource':
        this.processResourceEntry(entry);
        break;
      default:
        console.log('Unknown performance entry type:', entry.entryType);
      }
    });
  }

  /**
   * 处理测量条目
   */
  processMeasureEntry(entry) {
    console.log(`📊 Measure: ${entry.name} took ${entry.duration.toFixed(2)}ms`);

    // 记录长时间运行的操作
    if (entry.duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    }
  }

  /**
   * 处理标记条目
   */
  processMarkEntry(entry) {
    console.log(`🏷️ Mark: ${entry.name} at ${entry.startTime.toFixed(2)}ms`);
  }

  /**
   * 处理导航条目
   */
  processNavigationEntry(entry) {
    this.metrics.loadingTime = entry.loadEventEnd - entry.navigationStart;
    console.log(`🔄 Navigation completed in ${this.metrics.loadingTime.toFixed(2)}ms`);
  }

  /**
   * 处理资源条目
   */
  processResourceEntry(entry) {
    if (entry.duration > 1000) {
      console.warn(`⚠️ Slow resource load: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    }
  }

  /**
   * 更新内存指标
   */
  updateMemoryMetrics() {
    if (window.performance.memory) {
      this.metrics.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
      this.metrics.textureMemory = this.getTextureMemoryEstimate();
      this.metrics.geometryMemory = this.getGeometryMemoryEstimate();
    }
  }

  /**
   * 获取纹理内存估算
   */
  getTextureMemoryEstimate() {
    let textureMemory = 0;

    // 基于已加载纹理的估算
    this.loadedTextures.forEach(textureName => {
      textureMemory += this.settings.textureResolution * this.settings.textureResolution * 4; // RGBA
    });

    return Math.round(textureMemory / 1024 / 1024); // MB
  }

  /**
   * 获取几何体内存估算
   */
  getGeometryMemoryEstimate() {
    let geometryMemory = 0;

    // 基于缓存的几何体估算
    this.cache.forEach((geometry, key) => {
      if (geometry.attributes) {
        Object.values(geometry.attributes).forEach(attr => {
          geometryMemory += attr.array.byteLength;
        });
      }
    });

    return Math.round(geometryMemory / 1024 / 1024); // MB
  }

  /**
   * 设置FPS计数器
   */
  setupFPSCounter() {
    let lastTime = performance.now();
    let frameCount = 0;

    const updateFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.frameStats.fps = this.metrics.fps;
        this.frameStats.frameTime = (currentTime - lastTime) / frameCount;

        frameCount = 0;
        lastTime = currentTime;

        // 更新内存指标
        this.updateMemoryMetrics();

        // 触发性能事件
        eventSystem.emit('performanceMetrics', {
          fps: this.metrics.fps,
          memoryUsage: this.metrics.memoryUsage,
          drawCalls: this.metrics.drawCalls
        });

        // 自适应质量调整
        this.adaptQualityBasedOnPerformance();
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * 设置质量自适应
   */
  setupQualityAdaptation() {
    this.qualityLevels = {
      low: {
        textureResolution: 256,
        geometryDetail: 'low',
        shadowsEnabled: false,
        antialiasing: 'none',
        maxFPS: 30
      },
      medium: {
        textureResolution: 512,
        geometryDetail: 'medium',
        shadowsEnabled: true,
        antialiasing: 'FXAA',
        maxFPS: 45
      },
      high: {
        textureResolution: 1024,
        geometryDetail: 'high',
        shadowsEnabled: true,
        antialiasing: 'MSAA',
        maxFPS: 60
      },
      ultra: {
        textureResolution: 2048,
        geometryDetail: 'ultra',
        shadowsEnabled: true,
        antialiasing: 'SSAA',
        maxFPS: 60
      }
    };

    // 检测设备能力
    this.detectDeviceCapabilities();
  }

  /**
   * 检测设备能力
   */
  detectDeviceCapabilities() {
    const capabilities = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenSize: window.screen.width * window.screen.height,
      deviceMemory: navigator.deviceMemory || 4,
      maxTextureSize: 2048, // 默认，会在WebGL初始化后更新
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };

    // 根据设备能力设置初始质量
    if (capabilities.isMobile || capabilities.deviceMemory < 4) {
      this.settings.quality = 'low';
    } else if (capabilities.deviceMemory < 8) {
      this.settings.quality = 'medium';
    } else {
      this.settings.quality = 'high';
    }

    console.log('📱 Device capabilities detected:', capabilities);
    console.log('🎯 Initial quality setting:', this.settings.quality);
  }

  /**
   * 设置内存管理
   */
  setupMemoryManagement() {
    this.memoryMonitor = {
      lastCheck: 0,
      checkInterval: 5000,
      cleanupThreshold: 0.8,
      maxMemory: this.settings.memoryLimit * 1024 * 1024
    };

    // 定期内存清理
    setInterval(() => {
      this.performMemoryCleanup();
    }, this.memoryMonitor.checkInterval);

    // 监听内存警告
    window.addEventListener('memorypressure', () => {
      this.handleMemoryPressure();
    });
  }

  /**
   * 设置缓存系统
   */
  setupCachingSystem() {
    this.cacheConfig = {
      maxTextureCacheSize: 50, // 最多缓存50个纹理
      maxGeometryCacheSize: 20, // 最多缓存20个几何体
      textureCacheTTL: 300000, // 5分钟TTL
      geometryCacheTTL: 600000, // 10分钟TTL
      compressionEnabled: true
    };

    // 定期清理过期缓存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 设置延迟加载
   */
  setupLazyLoading() {
    this.lazyLoadConfig = {
      textureDistance: 1000, // 距离阈值
      geometryDistance: 2000,
      loadDelay: 100, // 延迟加载时间
      unloadDelay: 5000 // 延迟卸载时间
    };

    // 观察器用于视口内加载
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
  }

  /**
   * 设置Intersection Observer
   */
  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadResource(entry.target);
        } else {
          this.scheduleResourceUnload(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1
    });
  }

  /**
   * 加载资源
   */
  loadResource(element) {
    const resourceUrl = element.dataset.src || element.dataset.resource;
    if (!resourceUrl) return;

    console.log(`🔄 Loading resource: ${resourceUrl}`);

    // 防止重复加载
    if (element.dataset.loaded === 'true') return;
    element.dataset.loaded = 'true';

    // 根据元素类型加载资源
    if (element.tagName === 'IMG') {
      this.loadImageResource(element, resourceUrl);
    } else if (element.dataset.type === 'texture') {
      this.loadTextureResource(element, resourceUrl);
    } else if (element.dataset.type === 'model') {
      this.loadModelResource(element, resourceUrl);
    }
  }

  /**
   * 加载图片资源
   */
  loadImageResource(element, url) {
    const img = new Image();
    img.onload = () => {
      element.src = url;
      element.classList.add('loaded');
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${url}`);
      element.classList.add('error');
    };
    img.src = url;
  }

  /**
   * 加载纹理资源
   */
  async loadTextureResource(element, url) {
    try {
      const optimizedTexture = await this.optimizeTexture(url);
      element.dispatchEvent(new CustomEvent('textureLoaded', {
        detail: { texture: optimizedTexture, url }
      }));
    } catch (error) {
      console.warn(`Failed to load texture: ${url}`, error);
      element.dispatchEvent(new CustomEvent('textureError', {
        detail: { error, url }
      }));
    }
  }

  /**
   * 加载模型资源
   */
  async loadModelResource(element, url) {
    try {
      const model = await this.loadOptimizedModel(url);
      element.dispatchEvent(new CustomEvent('modelLoaded', {
        detail: { model, url }
      }));
    } catch (error) {
      console.warn(`Failed to load model: ${url}`, error);
      element.dispatchEvent(new CustomEvent('modelError', {
        detail: { error, url }
      }));
    }
  }

  /**
   * 计划资源卸载
   */
  scheduleResourceUnload(element) {
    // 延迟卸载，避免频繁加载/卸载
    setTimeout(() => {
      if (!this.isElementVisible(element)) {
        this.unloadResource(element);
      }
    }, this.lazyLoadConfig.unloadDelay);
  }

  /**
   * 检查元素是否可见
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }

  /**
   * 卸载资源
   */
  unloadResource(element) {
    console.log('🗑️ Unloading resource for element:', element);

    // 重置加载状态
    element.dataset.loaded = 'false';

    // 清理资源
    if (element.tagName === 'IMG') {
      element.src = '';
    }

    // 触发卸载事件
    element.dispatchEvent(new CustomEvent('resourceUnloaded'));
  }

  /**
   * 自适应质量调整
   */
  adaptQualityBasedOnPerformance() {
    if (this.settings.quality !== 'adaptive') return;

    const currentFPS = this.metrics.fps;
    const targetFPS = this.settings.maxFPS;

    if (currentFPS < targetFPS * 0.7) {
      this.lowerQuality();
    } else if (currentFPS > targetFPS * 0.9) {
      this.raiseQuality();
    }
  }

  /**
   * 降低质量
   */
  lowerQuality() {
    const levels = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = levels.indexOf(this.settings.quality);

    if (currentIndex < levels.length - 1) {
      const newQuality = levels[currentIndex + 1];
      this.setQuality(newQuality);
      console.log(`📉 Quality lowered to: ${newQuality}`);
    }
  }

  /**
   * 提高质量
   */
  raiseQuality() {
    const levels = ['ultra', 'high', 'medium', 'low'];
    const currentIndex = levels.indexOf(this.settings.quality);

    if (currentIndex > 0) {
      const newQuality = levels[currentIndex - 1];
      this.setQuality(newQuality);
      console.log(`📈 Quality raised to: ${newQuality}`);
    }
  }

  /**
   * 设置质量级别
   */
  setQuality(quality) {
    if (!this.qualityLevels[quality]) return;

    const newSettings = this.qualityLevels[quality];
    Object.assign(this.settings, newSettings);
    this.settings.quality = quality;

    // 触发质量变更事件
    eventSystem.emit('qualityChanged', {
      quality,
      settings: newSettings
    });

    this.applyQualitySettings();
  }

  /**
   * 应用质量设置
   */
  applyQualitySettings() {
    // 更新纹理质量
    this.updateTextureQuality();

    // 更新几何体细节
    this.updateGeometryDetail();

    // 更新阴影设置
    this.updateShadowSettings();

    // 更新抗锯齿设置
    this.updateAntialiasing();
  }

  /**
   * 更新纹理质量
   */
  updateTextureQuality() {
    const targetResolution = this.settings.textureResolution;
    console.log(`🖼️ Updating texture quality to ${targetResolution}px`);

    // 通知场景管理器更新纹理质量
    eventSystem.emit('textureQualityChanged', {
      resolution: targetResolution,
      quality: this.settings.quality
    });
  }

  /**
   * 更新几何体细节
   */
  updateGeometryDetail() {
    const detail = this.settings.geometryDetail;
    console.log(`🔺 Updating geometry detail to ${detail}`);

    eventSystem.emit('geometryDetailChanged', {
      detail,
      quality: this.settings.quality
    });
  }

  /**
   * 更新阴影设置
   */
  updateShadowSettings() {
    const shadowsEnabled = this.settings.shadowsEnabled;
    console.log(`🌒 ${shadowsEnabled ? 'Enabling' : 'Disabling'} shadows`);

    eventSystem.emit('shadowSettingsChanged', {
      enabled: shadowsEnabled,
      quality: this.settings.quality
    });
  }

  /**
   * 更新抗锯齿设置
   */
  updateAntialiasing() {
    const antialiasing = this.settings.antialiasing;
    console.log(`🔧 Setting antialiasing to ${antialiasing}`);

    eventSystem.emit('antialiasingChanged', {
      type: antialiasing,
      quality: this.settings.quality
    });
  }

  /**
   * 纹理压缩和优化
   */
  async optimizeTexture(texture, options = {}) {
    const defaultOptions = {
      maxWidth: this.settings.textureResolution,
      maxHeight: this.settings.textureResolution,
      format: 'webp', // 使用WebP格式减小文件大小
      quality: 0.8
    };

    const opts = { ...defaultOptions, ...options };

    // 如果纹理已经优化过，直接返回缓存
    const cacheKey = `texture_${texture}_${opts.maxWidth}_${opts.maxHeight}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 计算合适的尺寸（保持宽高比）
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = texture;
      });

      const aspectRatio = img.width / img.height;
      let width = opts.maxWidth;
      let height = opts.maxHeight;

      if (aspectRatio > 1) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }

      width = Math.min(width, opts.maxWidth);
      height = Math.min(height, opts.maxHeight);

      // 确保尺寸是2的幂次方（优化WebGL性能）
      width = Math.pow(2, Math.floor(Math.log2(width)));
      height = Math.pow(2, Math.floor(Math.log2(height)));

      canvas.width = width;
      canvas.height = height;

      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为WebP格式（如果浏览器支持）
      let optimizedTexture;
      if (canvas.toBlob && opts.format === 'webp') {
        optimizedTexture = await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
          }, 'image/webp', opts.quality);
        });
      } else {
        optimizedTexture = canvas.toDataURL('image/jpeg', opts.quality);
      }

      // 缓存优化后的纹理
      this.cache.set(cacheKey, optimizedTexture);
      this.loadedTextures.add(cacheKey);

      return optimizedTexture;
    } catch (error) {
      console.warn('Texture optimization failed:', error);
      return texture; // 返回原始纹理
    }
  }

  /**
   * 几何体优化
   */
  optimizeGeometry(geometry, detail = 'medium') {
    const detailLevels = {
      low: { sphereSegments: 8, cylinderSegments: 8 },
      medium: { sphereSegments: 16, cylinderSegments: 16 },
      high: { sphereSegments: 32, cylinderSegments: 32 },
      ultra: { sphereSegments: 64, cylinderSegments: 64 }
    };

    const level = detailLevels[detail] || detailLevels.medium;

    // 简化几何体
    if (geometry.simplify) {
      return geometry.simplify(level);
    }

    return geometry;
  }

  /**
   * 预加载关键资源
   */
  async preloadCriticalResources() {
    const criticalResources = [
      '/textures/sun_optimized.webp',
      '/textures/earth_optimized.webp',
      '/textures/venus_optimized.webp',
      '/textures/starfield.webp'
    ];

    const preloadPromises = criticalResources.map(async (resource) => {
      try {
        const optimized = await this.optimizeTexture(resource);

        // 缓存优化后的纹理
        await resourceCache.set(`optimized_${resource}`, optimized, {
          priority: 'critical',
          ttl: 15 * 60 * 1000, // 15分钟
          metadata: { original: resource, type: 'texture' }
        });

        return { resource, optimized, status: 'success' };
      } catch (error) {
        console.warn('Failed to preload:', resource, error);
        return { resource, error, status: 'failed' };
      }
    });

    const results = await Promise.allSettled(preloadPromises);
    console.log('🚀 Critical resources preloaded:', results);
  }

  /**
   * 内存清理
   */
  performMemoryCleanup() {
    if (!window.performance.memory) return;

    const memory = window.performance.memory;
    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const memoryRatio = usedMemory / totalMemory;

    this.metrics.memoryUsage = usedMemory / (1024 * 1024); // MB

    if (memoryRatio > this.memoryMonitor.cleanupThreshold) {
      this.cleanupUnusedResources();
    }
  }

  /**
   * 清理未使用资源
   */
  cleanupUnusedResources() {
    // 清理纹理缓存
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp && (now - value.timestamp) > this.cacheConfig.textureCacheTTL) {
        this.cache.delete(key);
        this.loadedTextures.delete(key);

        // 清理WebGL纹理
        if (value.glTexture) {
          value.glTexture.dispose();
        }
      }
    }

    // 清理几何体缓存
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith('geometry_') && (now - value.timestamp) > this.cacheConfig.geometryCacheTTL) {
        this.cache.delete(key);
        this.loadedModels.delete(key);

        // 清理WebGL几何体
        if (value.glGeometry) {
          value.glGeometry.dispose();
        }
      }
    }

    // 触发垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }

    console.log('🧹 Memory cleanup performed');
  }

  /**
   * 处理内存压力
   */
  handleMemoryPressure() {
    console.log('⚠️ Memory pressure detected');

    // 立即降低质量
    this.setQuality('low');

    // 清理所有缓存
    this.cache.clear();
    this.loadedTextures.clear();
    this.loadedModels.clear();

    // 通知系统
    eventSystem.emit('memoryPressure', {
      action: 'quality_lowered',
      newQuality: 'low'
    });
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp && (now - value.timestamp) > this.cacheConfig.textureCacheTTL) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * 优化3D场景
   */
  optimizeScene(scene) {
    if (!scene) return;

    // 启用视锥体剔除
    scene.frustumCulled = true;

    // 优化光照
    this.optimizeLighting(scene);

    // 启用LOD（细节层次）
    this.setupLOD(scene);

    // 合并静态几何体
    this.mergeStaticMeshes(scene);

    // 优化材质
    this.optimizeMaterials(scene);
  }

  /**
   * 优化光照
   */
  optimizeLighting(scene) {
    // 限制光源数量
    const lights = scene.children.filter(child => child.isLight);
    if (lights.length > 4) {
      // 移除多余光源
      lights.slice(4).forEach(light => {
        scene.remove(light);
      });
    }

    // 使用环境光代替多个方向光
    const ambientLight = lights.find(light => light.isAmbientLight);
    if (!ambientLight) {
      // 创建环境光
      const newAmbientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(newAmbientLight);
    }
  }

  /**
   * 设置LOD（细节层次）
   */
  setupLOD(scene) {
    // 为大型天体创建LOD系统
    const celestialBodies = scene.children.filter(child =>
      child.isMesh && (child.name === 'sun' || child.name === 'earth' || child.name === 'venus')
    );

    celestialBodies.forEach(body => {
      this.createLODForBody(body);
    });
  }

  /**
   * 为特定天体创建LOD
   */
  createLODForBody(body) {
    const lod = new THREE.LOD();

    // 创建不同细节层次的版本
    const distances = [0, 50, 200, 500];
    const geometries = [
      new THREE.SphereGeometry(body.geometry.parameters.radius, 64, 64),
      new THREE.SphereGeometry(body.geometry.parameters.radius, 32, 32),
      new THREE.SphereGeometry(body.geometry.parameters.radius, 16, 16),
      new THREE.SphereGeometry(body.geometry.parameters.radius, 8, 8)
    ];

    geometries.forEach((geometry, index) => {
      const mesh = new THREE.Mesh(geometry, body.material);
      lod.addLevel(mesh, distances[index]);
    });

    lod.position.copy(body.position);
    lod.name = `${body.name}_lod`;

    return lod;
  }

  /**
   * 合并静态几何体
   */
  mergeStaticMeshes(scene) {
    // 识别静态对象
    const staticObjects = scene.children.filter(child =>
      child.isMesh && child.userData.isStatic
    );

    if (staticObjects.length > 1) {
      // 合并几何体以减少绘制调用
      const mergedGeometry = this.mergeGeometries(staticObjects);
      const mergedMaterial = this.createMergedMaterial(staticObjects);

      const mergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
      mergedMesh.name = 'merged_static_objects';
      scene.add(mergedMesh);

      // 移除原始对象
      staticObjects.forEach(obj => {
        scene.remove(obj);
        obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  }

  /**
   * 合并几何体
   */
  mergeGeometries(objects) {
    const geometries = [];

    objects.forEach(obj => {
      if (obj.geometry) {
        const clonedGeometry = obj.geometry.clone();
        clonedGeometry.applyMatrix4(obj.matrixWorld);
        geometries.push(clonedGeometry);
      }
    });

    if (geometries.length === 0) return new THREE.BufferGeometry();

    // 简化的几何体合并（实际实现需要更复杂的逻辑）
    const mergedGeometry = geometries[0];
    for (let i = 1; i < geometries.length; i++) {
      // 这里应该实现真正的几何体合并算法
      // 由于Three.js的BufferGeometry合并比较复杂，这里只返回第一个
      console.log('合并几何体功能需要完整实现');
    }

    return mergedGeometry;
  }

  /**
   * 创建合并材质
   */
  createMergedMaterial(objects) {
    // 简化实现：使用第一个对象的材质
    if (objects.length > 0 && objects[0].material) {
      return objects[0].material.clone();
    }

    // 默认材质
    return new THREE.MeshBasicMaterial({ color: 0x888888 });
  }

  /**
   * 优化材质
   */
  optimizeMaterials(scene) {
    const materials = new Map();

    scene.traverse((object) => {
      if (object.isMesh && object.material) {
        const materialKey = this.getMaterialKey(object.material);

        if (materials.has(materialKey)) {
          // 重用现有材质
          object.material = materials.get(materialKey);
        } else {
          // 存储新材质
          materials.set(materialKey, object.material);
        }
      }
    });
  }

  /**
   * 获取材质的唯一标识
   */
  getMaterialKey(material) {
    return `${material.type}_${material.color?.getHexString() || 'default'}`;
  }

  /**
   * 加载优化策略
   */
  async loadWithOptimization(resources) {
    const startTime = performance.now();

    // 并行加载关键资源
    const criticalResources = resources.filter(r => r.priority === 'critical');
    const nonCriticalResources = resources.filter(r => r.priority !== 'critical');

    // 优先加载关键资源
    await this.loadResourcesInBatches(criticalResources, 3);

    // 延迟加载非关键资源
    setTimeout(() => {
      this.loadResourcesInBatches(nonCriticalResources, 2);
    }, 1000);

    const endTime = performance.now();
    this.metrics.loadingTime = endTime - startTime;

    console.log(`⚡ Loading completed in ${this.metrics.loadingTime.toFixed(2)}ms`);
  }

  /**
   * 分批加载资源
   */
  async loadResourcesInBatches(resources, batchSize) {
    const batches = [];
    for (let i = 0; i < resources.length; i += batchSize) {
      batches.push(resources.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(resource => this.loadResourceWithOptimization(resource));
      await Promise.allSettled(batchPromises);

      // 每批之间添加小延迟，避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * 优化加载单个资源
   */
  async loadResourceWithOptimization(resource) {
    const cacheKey = `resource_${resource.url}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let loadedResource;

      switch (resource.type) {
      case 'texture':
        loadedResource = await this.optimizeTexture(resource.url, resource.options);
        break;
      case 'geometry':
        loadedResource = await this.optimizeGeometry(resource.data, resource.options);
        break;
      case 'model':
        loadedResource = await this.loadOptimizedModel(resource.url);
        break;
      default:
        loadedResource = await this.loadGenericResource(resource);
      }

      // 缓存结果
      this.cache.set(cacheKey, {
        data: loadedResource,
        timestamp: Date.now(),
        type: resource.type
      });

      return loadedResource;
    } catch (error) {
      console.warn('Failed to load resource:', resource.url, error);
      throw error;
    }
  }

  /**
   * 加载优化模型
   */
  async loadOptimizedModel(url) {
    console.log(`🎯 Loading optimized model: ${url}`);

    return new Promise((resolve, reject) => {
      // 简化的模型加载器
      const loader = new THREE.ObjectLoader();
      loader.load(
        url,
        (object) => {
          // 优化加载的模型
          if (object.traverse) {
            object.traverse((child) => {
              if (child.isMesh) {
                // 优化几何体
                if (child.geometry) {
                  child.geometry = this.optimizeGeometry(child.geometry, this.settings.geometryDetail);
                }

                // 优化材质
                if (child.material) {
                  child.material = this.optimizeMaterial(child.material);
                }
              }
            });
          }

          resolve(object);
        },
        (progress) => {
          console.log(`Loading progress: ${progress.loaded / progress.total * 100}%`);
        },
        (error) => {
          console.error('Model loading failed:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * 优化材质
   */
  optimizeMaterial(material) {
    // 创建材质的优化副本
    const optimizedMaterial = material.clone();

    // 根据质量设置调整材质属性
    switch (this.settings.quality) {
    case 'low':
      optimizedMaterial.roughness = Math.max(optimizedMaterial.roughness || 0.5, 0.8);
      optimizedMaterial.metalness = Math.min(optimizedMaterial.metalness || 0.0, 0.2);
      break;
    case 'medium':
      // 保持默认值
      break;
    case 'high':
    case 'ultra':
      // 提高材质质量
      if (optimizedMaterial.map) {
        optimizedMaterial.map.anisotropy = Math.min(16, this.getMaxAnisotropy());
      }
      break;
    }

    return optimizedMaterial;
  }

  /**
   * 获取最大各向异性
   */
  getMaxAnisotropy() {
    if (window.renderer && window.renderer.capabilities) {
      return window.renderer.capabilities.getMaxAnisotropy();
    }
    return 4; // 默认值
  }

  /**
   * 加载通用资源
   */
  async loadGenericResource(resource) {
    console.log(`📦 Loading generic resource: ${resource.url}`);

    return new Promise((resolve, reject) => {
      fetch(resource.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        })
        .catch(error => {
          console.error('Generic resource loading failed:', error);
          reject(error);
        });
    });
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const cacheStats = resourceCache.getStats();

    return {
      loadingTime: this.metrics.loadingTime,
      currentFPS: this.metrics.fps,
      memoryUsage: this.metrics.memoryUsage,
      textureMemory: this.metrics.textureMemory,
      geometryMemory: this.metrics.geometryMemory,
      drawCalls: this.metrics.drawCalls,
      cacheSize: this.cache.size,
      quality: this.settings.quality,
      cacheStats,
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * 获取优化建议
   */
  getOptimizationRecommendations() {
    const recommendations = [];

    if (this.metrics.fps < 30) {
      recommendations.push('降低渲染质量以提高帧率');
    }

    if (this.metrics.memoryUsage > this.settings.memoryLimit * 0.8) {
      recommendations.push('清理缓存以减少内存使用');
    }

    if (this.metrics.loadingTime > 5000) {
      recommendations.push('使用更小的纹理尺寸');
    }

    if (this.metrics.drawCalls > 100) {
      recommendations.push('合并静态几何体以减少绘制调用');
    }

    return recommendations;
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // 清理所有缓存
    this.cache.clear();
    this.loadedTextures.clear();
    this.loadedModels.clear();

    // 清理WebGL资源
    this.cleanupWebGLResources();

    console.log('🗑️ Performance Optimizer disposed');
  }

  /**
   * 清理WebGL资源
   */
  cleanupWebGLResources() {
    // 清理纹理
    this.loadedTextures.forEach(texture => {
      if (texture.dispose) texture.dispose();
    });

    // 清理几何体
    this.loadedModels.forEach(model => {
      if (model.dispose) model.dispose();
    });
  }

  /**
   * 获取当前性能状态
   */
  getCurrentStatus() {
    return {
      metrics: this.metrics,
      settings: this.settings,
      isOptimized: this.metrics.fps >= 30 && this.metrics.memoryUsage < this.settings.memoryLimit
    };
  }
}

// 创建全局实例
export const performanceOptimizer = new PerformanceOptimizer();
export default PerformanceOptimizer;
