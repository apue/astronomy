/**
 * 纹理生成工具类
 * 为没有NASA纹理的情况生成占位符纹理
 */

import * as THREE from 'three';

export class TextureGenerator {
  static createSunTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    
    // 创建太阳表面纹理
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFA500');
    gradient.addColorStop(0.7, '#FF8C00');
    gradient.addColorStop(1, '#FF6347');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // 添加太阳表面细节
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 20 + 5;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 69, 0, ${Math.random() * 0.3})`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createEarthTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    
    const context = canvas.getContext('2d');
    
    // 创建地球纹理（简化版）
    // 大陆
    context.fillStyle = '#228B22';
    context.fillRect(0, 0, size, size / 2);
    
    // 海洋
    context.fillStyle = '#4169E1';
    context.fillRect(0, size / 4, size, size / 4);
    
    // 添加一些细节
    context.fillStyle = '#8FBC8F';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * (size / 2);
      const width = Math.random() * 50 + 10;
      const height = Math.random() * 30 + 5;
      
      context.fillRect(x, y, width, height);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createVenusTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    
    const context = canvas.getContext('2d');
    
    // 创建金星表面纹理
    const gradient = context.createLinearGradient(0, 0, size, size / 2);
    gradient.addColorStop(0, '#DAA520');
    gradient.addColorStop(0.3, '#CD853F');
    gradient.addColorStop(0.7, '#D2691E');
    gradient.addColorStop(1, '#8B4513');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size / 2);
    
    // 添加表面细节
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * (size / 2);
      const radius = Math.random() * 15 + 3;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.3})`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createCloudTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    
    // 创建云层纹理
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, size, size);
    
    // 添加云纹理
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 30 + 10;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`;
      context.fill();
    }
    
    // 添加一些暗部
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 20 + 5;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(200, 200, 200, ${Math.random() * 0.2})`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createNightTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    
    const context = canvas.getContext('2d');
    
    // 创建夜晚灯光纹理
    context.fillStyle = '#000011';
    context.fillRect(0, 0, size, size / 2);
    
    // 添加城市灯光
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * (size / 2);
      const radius = Math.random() * 2 + 1;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 200, ${Math.random() * 0.8 + 0.2})`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createBumpTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    
    const context = canvas.getContext('2d');
    
    // 创建高程纹理
    const imageData = context.createImageData(size, size / 2);
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

  static createStarFieldTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    
    // 星空背景
    context.fillStyle = '#000011';
    context.fillRect(0, 0, size, size);
    
    // 添加星星
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 2;
      const brightness = Math.random();
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  static createAllPlaceholderTextures() {
    return {
      sun: {
        surface: this.createSunTexture(512),
        corona: this.createSunTexture(256),
        normal: this.createBumpTexture(256)
      },
      earth: {
        day: this.createEarthTexture(512),
        night: this.createNightTexture(512),
        clouds: this.createCloudTexture(512),
        bump: this.createBumpTexture(512),
        normal: this.createBumpTexture(256),
        specular: this.createBumpTexture(256)
      },
      venus: {
        surface: this.createVenusTexture(512),
        clouds: this.createCloudTexture(512),
        normal: this.createBumpTexture(256),
        atmosphere: this.createCloudTexture(256)
      },
      stars: {
        milkyWay: this.createStarFieldTexture(1024),
        starField: this.createStarFieldTexture(512),
        starAlpha: this.createStarFieldTexture(256)
      }
    };
  }
}

export default TextureGenerator;