/**
 * 纹理加载工具类
 * 专门处理NASA纹理和其他天体纹理的加载和管理
 */

import * as THREE from 'three';
import { PERFORMANCE_CONFIG } from './Constants.js';

export class TextureLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
    this.loadingManager = new THREE.LoadingManager();

    this.setupLoadingManager();
  }

  setupLoadingManager() {
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
    };

    this.loadingManager.onLoad = () => {
      console.log('All textures loaded successfully');
    };

    this.loadingManager.onError = (url) => {
      console.error(`Failed to load texture: ${url}`);
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${progress.toFixed(2)}%`);
    };

    // 更新纹理加载器
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
  }

  /**
   * 加载单个纹理
   * @param {string} url - 纹理URL
   * @param {Object} options - 加载选项
   * @returns {Promise<THREE.Texture>} 纹理对象
   */
  async loadTexture(url, options = {}) {
    if (this.loadedTextures.has(url)) {
      return this.loadedTextures.get(url);
    }

    try {
      const texture = await new Promise((resolve, reject) => {
        this.textureLoader.load(
          url,
          (texture) => {
            this.configureTexture(texture, options);
            resolve(texture);
          },
          undefined,
          (error) => reject(error)
        );
      });

      this.loadedTextures.set(url, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture: ${url}`, error);
      return this.createFallbackTexture(options.color || 0xffffff);
    }
  }

  /**
   * 批量加载纹理
   * @param {Object} textureUrls - 纹理URL映射
   * @param {Object} options - 加载选项
   * @returns {Promise<Object>} 纹理映射对象
   */
  async loadTextures(textureUrls, options = {}) {
    const texturePromises = {};

    for (const [key, url] of Object.entries(textureUrls)) {
      texturePromises[key] = this.loadTexture(url, options);
    }

    const textures = {};
    const results = await Promise.allSettled(Object.values(texturePromises));

    Object.keys(texturePromises).forEach((key, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        textures[key] = result.value;
      } else {
        console.warn(`Failed to load ${key}:`, result.reason);
        textures[key] = this.createFallbackTexture();
      }
    });

    return textures;
  }

  /**
   * 配置纹理参数
   * @param {THREE.Texture} texture - 纹理对象
   * @param {Object} options - 配置选项
   */
  configureTexture(texture, options = {}) {
    const quality = options.quality || 'high';
    const qualityConfig = PERFORMANCE_CONFIG.TEXTURE_QUALITY[quality];

    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(qualityConfig.anisotropy, 16);

    if (options.repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }

    if (options.flipY !== undefined) {
      texture.flipY = options.flipY;
    }

    texture.needsUpdate = true;
  }

  /**
   * 创建备用纹理
   * @param {number} color - 颜色值
   * @returns {THREE.Texture} 备用纹理
   */
  createFallbackTexture(color = 0xffffff) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext('2d');
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 创建渐变纹理
   * @param {string} color1 - 起始颜色
   * @param {string} color2 - 结束颜色
   * @returns {THREE.Texture} 渐变纹理
   */
  createGradientTexture(color1 = '#000000', color2 = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 创建噪点纹理
   * @param {number} size - 纹理大小
   * @returns {THREE.Texture} 噪点纹理
   */
  createNoiseTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    const imageData = context.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 预加载常用纹理
   * @returns {Promise<Object>} 预加载的纹理对象
   */
  async preloadCommonTextures() {
    const commonTextures = {
      white: this.createFallbackTexture(0xffffff),
      black: this.createFallbackTexture(0x000000),
      gray: this.createFallbackTexture(0x808080),
      blue: this.createFallbackTexture(0x0000ff),
      red: this.createFallbackTexture(0xff0000),
      green: this.createFallbackTexture(0x00ff00),
      yellow: this.createFallbackTexture(0xffff00),
      cyan: this.createFallbackTexture(0x00ffff),
      magenta: this.createFallbackTexture(0xff00ff)
    };

    return commonTextures;
  }

  /**
   * 清除已加载的纹理
   */
  clearCache() {
    this.loadedTextures.forEach((texture) => {
      if (texture.dispose) {
        texture.dispose();
      }
    });
    this.loadedTextures.clear();
  }

  /**
   * 获取加载进度
   * @returns {Object} 加载进度信息
   */
  getProgress() {
    return {
      loaded: this.loadingManager.itemsLoaded,
      total: this.loadingManager.itemsTotal,
      progress: this.loadingManager.itemsTotal > 0
        ? (this.loadingManager.itemsLoaded / this.loadingManager.itemsTotal) * 100
        : 0
    };
  }
}

// 创建单例实例
export const textureLoader = new TextureLoader();
export default TextureLoader;
