/**
 * 性能优化系统
 * 针对3D天文模拟的加载速度、内存使用和运行性能优化
 */

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
    lod.name = body.name + '_lod';
    
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