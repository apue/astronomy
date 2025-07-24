/**
 * 性能监控面板
 * 实时显示性能指标和优化建议
 */

import { eventSystem } from '../core/EventSystem.js';
import { performanceOptimizer } from '../systems/PerformanceOptimizer.js';
import { resourceCache } from '../systems/ResourceCache.js';

export class PerformanceMonitor {
  constructor() {
    this.isVisible = false;
    this.container = null;
    this.metrics = {};
    this.updateInterval = null;
    
    this.initialize();
  }

  initialize() {
    this.createContainer();
    this.setupEventListeners();
    
    // 每2秒更新一次性能数据
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 2000);
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'performance-monitor';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(10, 10, 10, 0.95);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #fff;
      z-index: 10000;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      transform: translateX(100%);
      opacity: 0;
    `;
    
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; color: #ffd700; font-size: 14px;">性能监控</h3>
        <button id="close-perf-monitor" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">×</button>
      </div>
      
      <div id="performance-content">
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>FPS:</span>
            <span id="perf-fps" style="color: #00ff00;">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>内存:</span>
            <span id="perf-memory" style="color: #00ff00;">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>缓存:</span>
            <span id="perf-cache" style="color: #00ff00;">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>质量:</span>
            <span id="perf-quality" style="color: #00ff00;">--</span>
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">优化建议:</div>
          <div id="perf-recommendations" style="font-size: 10px; color: #ff9800; line-height: 1.3;">
            加载中...
          </div>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">缓存统计:</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
            <div>命中率: <span id="perf-hit-rate" style="color: #4caf50;">--</span></div>
            <div>大小: <span id="perf-cache-size" style="color: #4caf50;">--</span></div>
            <div>命中: <span id="perf-hits" style="color: #4caf50;">--</span></div>
            <div>未命中: <span id="perf-misses" style="color: #4caf50;">--</span></div>
          </div>
        </div>
        
        <div style="display: flex; gap: 4px; margin-top: 8px;">
          <button id="perf-cleanup" style="flex: 1; padding: 4px 8px; background: #333; border: none; color: #fff; border-radius: 3px; cursor: pointer; font-size: 10px;">清理</button>
          <button id="perf-optimize" style="flex: 1; padding: 4px 8px; background: #ffd700; border: none; color: #000; border-radius: 3px; cursor: pointer; font-size: 10px;">优化</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    
    // 绑定事件
    this.container.querySelector('#close-perf-monitor').addEventListener('click', () => {
      this.hide();
    });
    
    this.container.querySelector('#perf-cleanup').addEventListener('click', () => {
      this.cleanup();
    });
    
    this.container.querySelector('#perf-optimize').addEventListener('click', () => {
      this.optimize();
    });
  }

  setupEventListeners() {
    // 监听性能事件
    eventSystem.subscribe('performanceMetrics', (metrics) => {
      this.updateMetrics(metrics);
    });
    
    // 监听质量变更
    eventSystem.subscribe('qualityChanged', (data) => {
      this.updateQuality(data.quality);
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'q' && event.ctrlKey) {
        this.toggle();
      }
    });
  }

  updateMetrics(externalMetrics = null) {
    try {
      const report = externalMetrics || performanceOptimizer.getPerformanceReport();
      const cacheStats = resourceCache.getStats();
      
      // 更新FPS
      const fpsElement = document.getElementById('perf-fps');
      if (fpsElement) {
        const fps = report.currentFPS || 0;
        fpsElement.textContent = `${fps.toFixed(0)} FPS`;
        fpsElement.style.color = fps > 30 ? '#00ff00' : fps > 15 ? '#ff9800' : '#ff4444';
      }
      
      // 更新内存使用
      const memoryElement = document.getElementById('perf-memory');
      if (memoryElement) {
        const memory = report.memoryUsage || 0;
        memoryElement.textContent = `${memory.toFixed(1)} MB`;
        memoryElement.style.color = memory < 256 ? '#00ff00' : memory < 512 ? '#ff9800' : '#ff4444';
      }
      
      // 更新缓存信息
      const cacheElement = document.getElementById('perf-cache');
      if (cacheElement) {
        cacheElement.textContent = `${cacheStats.cacheSize} 项`;
      }
      
      // 更新质量设置
      const qualityElement = document.getElementById('perf-quality');
      if (qualityElement) {
        qualityElement.textContent = report.quality || 'adaptive';
      }
      
      // 更新缓存统计
      document.getElementById('perf-hit-rate')?.textContent = cacheStats.hitRate;
      document.getElementById('perf-cache-size')?.textContent = `${(cacheStats.memoryUsage / 1024 / 1024).toFixed(1)} MB`;
      document.getElementById('perf-hits')?.textContent = cacheStats.hits;
      document.getElementById('perf-misses')?.textContent = cacheStats.misses;
      
      // 更新建议
      const recommendationsElement = document.getElementById('perf-recommendations');
      if (recommendationsElement && report.recommendations) {
        if (report.recommendations.length > 0) {
          recommendationsElement.innerHTML = report.recommendations
            .slice(0, 3)
            .map(rec => `• ${rec}`)
            .join('<br>');
        } else {
          recommendationsElement.innerHTML = '✅ 性能良好';
        }
      }
      
      this.metrics = report;
    } catch (error) {
      console.warn('Failed to update performance metrics:', error);
    }
  }

  show() {
    if (this.container) {
      this.container.style.transform = 'translateX(0)';
      this.container.style.opacity = '1';
      this.isVisible = true;
      this.updateMetrics();
    }
  }

  hide() {
    if (this.container) {
      this.container.style.transform = 'translateX(100%)';
      this.container.style.opacity = '0';
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  cleanup() {
    performanceOptimizer.performMemoryCleanup();
    resourceCache.performFullCleanup();
    this.updateMetrics();
  }

  optimize() {
    // 自动优化设置
    const currentFPS = this.metrics.currentFPS || 0;
    
    if (currentFPS < 15) {
      performanceOptimizer.setQuality('low');
    } else if (currentFPS < 30) {
      performanceOptimizer.setQuality('medium');
    } else {
      performanceOptimizer.setQuality('high');
    }
    
    this.updateMetrics();
  }

  dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();
export default PerformanceMonitor;