/**
 * 资源缓存系统
 * 为3D天文模拟提供智能缓存管理
 * 实现Days 62-63的缓存策略
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';

export class ResourceCache {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
    
    this.config = {
      maxSize: 100, // 最大缓存项目数
      maxMemory: 512 * 1024 * 1024, // 512MB内存限制
      defaultTTL: 5 * 60 * 1000, // 5分钟默认TTL
      criticalTTL: 15 * 60 * 1000, // 关键资源15分钟TTL
      compressionEnabled: true,
      preloadEnabled: true
    };
    
    this.memoryUsage = 0;
    this.cacheStrategy = 'lru'; // lru, lfu, fifo
    
    this.initialize();
  }

  initialize() {
    console.log('📦 Initializing Resource Cache System...');
    
    // 设置定期清理
    this.setupPeriodicCleanup();
    
    // 监听内存压力
    this.setupMemoryPressureHandling();
    
    // 预加载关键资源
    if (this.config.preloadEnabled) {
      this.preloadCriticalResources();
    }
    
    console.log('✅ Resource Cache System initialized');
  }

  /**
   * 缓存策略：LRU (Least Recently Used)
   */
  lruEvict() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.lastAccessed < oldestTime) {
        oldestTime = metadata.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.evict(oldestKey);
    }
  }

  /**
   * 缓存策略：LFU (Least Frequently Used)
   */
  lfuEvict() {
    let leastUsedKey = null;
    let minFrequency = Infinity;
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.accessCount < minFrequency) {
        minFrequency = metadata.accessCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.evict(leastUsedKey);
    }
  }

  /**
   * 缓存策略：FIFO (First In First Out)
   */
  fifoEvict() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.created < oldestTime) {
        oldestTime = metadata.created;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.evict(oldestKey);
    }
  }

  /**
   * 设置定期清理
   */
  setupPeriodicCleanup() {
    // 每30秒检查过期资源
    setInterval(() => {
      this.cleanupExpired();
    }, 30000);
    
    // 每5分钟执行完整清理
    setInterval(() => {
      this.performFullCleanup();
    }, 300000);
  }

  /**
   * 设置内存压力处理
   */
  setupMemoryPressureHandling() {
    // 监听内存警告事件
    window.addEventListener('memorypressure', () => {
      this.handleMemoryPressure();
    });
    
    // 监听性能事件
    eventSystem.subscribe('performanceMetrics', (metrics) => {
      if (metrics.memoryUsage > this.config.maxMemory * 0.8) {
        this.handleMemoryPressure();
      }
    });
  }

  /**
   * 处理内存压力
   */
  handleMemoryPressure() {
    console.log('⚠️ Memory pressure detected, aggressive cleanup...');
    
    // 立即清理非关键资源
    this.cleanupNonCritical();
    
    // 降低TTL
    this.reduceTTLs();
    
    // 触发事件
    eventSystem.emit('cachePressure', {
      memoryUsage: this.memoryUsage,
      action: 'aggressive_cleanup'
    });
  }

  /**
   * 缓存资源
   */
  async set(key, value, options = {}) {
    const config = {
      ttl: options.ttl || this.config.defaultTTL,
      priority: options.priority || 'normal', // critical, high, normal, low
      compress: options.compress !== false && this.config.compressionEnabled,
      metadata: options.metadata || {}
    };
    
    this.stats.totalRequests++;
    
    // 计算资源大小
    const size = this.calculateSize(value);
    
    // 检查内存限制
    if (this.memoryUsage + size > this.config.maxMemory) {
      this.evictToMakeRoom(size);
    }
    
    // 压缩数据（如果需要）
    let cachedValue = value;
    if (config.compress) {
      cachedValue = await this.compress(value);
    }
    
    // 存储数据和元数据
    this.cache.set(key, cachedValue);
    this.metadata.set(key, {
      size,
      created: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: config.ttl,
      priority: config.priority,
      ...config.metadata
    });
    
    this.memoryUsage += size;
    
    // 触发事件
    eventSystem.emit('cacheSet', { key, size, priority: config.priority });
  }

  /**
   * 获取资源
   */
  async get(key) {
    const metadata = this.metadata.get(key);
    
    if (!metadata) {
      this.stats.misses++;
      return null;
    }
    
    // 检查是否过期
    if (this.isExpired(key)) {
      this.evict(key);
      this.stats.misses++;
      return null;
    }
    
    // 更新访问统计
    metadata.lastAccessed = Date.now();
    metadata.accessCount++;
    
    this.stats.hits++;
    
    let value = this.cache.get(key);
    
    // 解压缩数据（如果需要）
    if (metadata.compressed) {
      value = await this.decompress(value);
    }
    
    // 触发事件
    eventSystem.emit('cacheGet', { key, hit: true });
    
    return value;
  }

  /**
   * 检查是否存在
   */
  has(key) {
    return this.cache.has(key) && !this.isExpired(key);
  }

  /**
   * 删除资源
   */
  delete(key) {
    if (this.has(key)) {
      this.evict(key);
      return true;
    }
    return false;
  }

  /**
   * 清理过期资源
   */
  cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, metadata] of this.metadata) {
      if (now - metadata.created > metadata.ttl) {
        this.evict(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * 执行完整清理
   */
  performFullCleanup() {
    const beforeSize = this.cache.size;
    
    this.cleanupExpired();
    
    // 清理低优先级资源
    this.cleanupLowPriority();
    
    const afterSize = this.cache.size;
    console.log(`🧹 Full cleanup: ${beforeSize - afterSize} entries removed`);
  }

  /**
   * 清理非关键资源
   */
  cleanupNonCritical() {
    const nonCritical = [];
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.priority === 'low' || metadata.priority === 'normal') {
        nonCritical.push(key);
      }
    }
    
    nonCritical.forEach(key => this.evict(key));
    console.log(`🧹 Cleaned ${nonCritical.length} non-critical resources`);
  }

  /**
   * 清理低优先级资源
   */
  cleanupLowPriority() {
    const lowPriority = [];
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.priority === 'low') {
        lowPriority.push(key);
      }
    }
    
    lowPriority.forEach(key => this.evict(key));
  }

  /**
   * 降低TTL
   */
  reduceTTLs() {
    for (const metadata of this.metadata.values()) {
      if (metadata.priority !== 'critical') {
        metadata.ttl = Math.min(metadata.ttl, 60000); // 1分钟
      }
    }
  }

  /**
   * 预加载关键资源
   */
  async preloadCriticalResources() {
    const criticalResources = [
      {
        key: 'sun_texture',
        url: '/textures/sun_optimized.webp',
        type: 'texture',
        priority: 'critical',
        ttl: this.config.criticalTTL
      },
      {
        key: 'earth_texture',
        url: '/textures/earth_optimized.webp',
        type: 'texture',
        priority: 'critical',
        ttl: this.config.criticalTTL
      },
      {
        key: 'venus_texture',
        url: '/textures/venus_optimized.webp',
        type: 'texture',
        priority: 'critical',
        ttl: this.config.criticalTTL
      },
      {
        key: 'starfield_texture',
        url: '/textures/starfield.webp',
        type: 'texture',
        priority: 'high',
        ttl: this.config.criticalTTL
      }
    ];
    
    for (const resource of criticalResources) {
      try {
        const response = await fetch(resource.url);
        const blob = await response.blob();
        await this.set(resource.key, blob, {
          priority: resource.priority,
          ttl: resource.ttl,
          metadata: { url: resource.url, type: resource.type }
        });
      } catch (error) {
        console.warn(`Failed to preload ${resource.key}:`, error);
      }
    }
    
    console.log('🚀 Critical resources preloaded');
  }

  /**
   * 批量缓存资源
   */
  async setBatch(resources) {
    const promises = resources.map(resource => 
      this.set(resource.key, resource.data, resource.options)
    );
    
    return Promise.allSettled(promises);
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsage: this.memoryUsage,
      maxMemory: this.config.maxMemory
    };
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.metadata.clear();
    this.memoryUsage = 0;
    this.stats.evictions += this.cache.size;
    
    console.log('🗑️ Cache cleared');
  }

  /**
   * 计算资源大小
   */
  calculateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16字符
    }
    if (value instanceof ArrayBuffer) {
      return value.byteLength;
    }
    if (value instanceof Blob) {
      return value.size;
    }
    return 1024; // 默认1KB
  }

  /**
   * 压缩数据
   */
  async compress(data) {
    // 简化的压缩实现
    if (data instanceof Blob && data.type.startsWith('image/')) {
      return data; // 图片数据通常已压缩
    }
    return data;
  }

  /**
   * 解压缩数据
   */
  async decompress(data) {
    return data; // 简化的解压实现
  }

  /**
   * 检查是否过期
   */
  isExpired(key) {
    const metadata = this.metadata.get(key);
    if (!metadata) return true;
    
    return Date.now() - metadata.created > metadata.ttl;
  }

  /**
   * 驱逐资源
   */
  evict(key) {
    const metadata = this.metadata.get(key);
    if (metadata) {
      this.memoryUsage -= metadata.size;
      this.stats.evictions++;
    }
    
    this.cache.delete(key);
    this.metadata.delete(key);
    
    eventSystem.emit('cacheEvicted', { key });
  }

  /**
   * 为腾出空间进行驱逐
   */
  evictToMakeRoom(requiredSize) {
    let freed = 0;
    
    while (freed < requiredSize && this.cache.size > 0) {
      switch (this.cacheStrategy) {
        case 'lru':
          this.lruEvict();
          break;
        case 'lfu':
          this.lfuEvict();
          break;
        case 'fifo':
          this.fifoEvict();
          break;
      }
      
      // 防止无限循环
      freed += 1024 * 1024; // 假设每次驱逐1MB
    }
  }

  /**
   * 获取缓存键列表
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存内容
   */
  getCacheContents() {
    const contents = [];
    
    for (const [key, metadata] of this.metadata) {
      contents.push({
        key,
        size: metadata.size,
        priority: metadata.priority,
        ttl: metadata.ttl,
        accessCount: metadata.accessCount,
        age: Date.now() - metadata.created
      });
    }
    
    return contents.sort((a, b) => b.size - a.size);
  }

  /**
   * 清理资源
   */
  dispose() {
    this.clear();
    console.log('🗑️ Resource Cache disposed');
  }
}

// 创建全局实例
export const resourceCache = new ResourceCache();
export default ResourceCache;