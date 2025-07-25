/**
 * 天体基类 - 所有天体的抽象基类
 * 提供统一的天体对象接口和行为
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from '../core/EventSystem.js';

export class CelestialBody {
  constructor(name, options = {}) {
    this.name = name;
    this.type = 'celestial';

    // 基本属性
    this.radius = options.radius || 1;
    this.mass = options.mass || 1;
    this.color = options.color || 0xffffff;
    this.textureUrl = options.textureUrl || null;
    this.emissive = options.emissive || 0x000000;
    this.emissiveIntensity = options.emissiveIntensity || 0;

    // 轨道参数
    this.orbitElements = options.orbitElements || this.getDefaultOrbitElements();
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.rotationAxis = options.rotationAxis || new THREE.Vector3(0, 1, 0);
    this.rotationSpeed = options.rotationSpeed || 0;

    // 3D对象
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.texture = null;

    // 动画状态
    this.rotationAngle = 0;
    this.orbitAngle = 0;
    this.isVisible = true;
    this.detailLevel = 1;

    // 交互状态
    this.isSelected = false;
    this.isHovered = false;

    // 性能优化
    this.lodDistances = options.lodDistances || [10, 50, 200];
    this.textureQuality = options.textureQuality || 'high';

    // 异步初始化将在外部调用
  }

  /**
   * 初始化天体
   */
  async initialize() {
    try {
      await this.loadTexture();
      this.createGeometry();
      this.createMaterial();
      this.createMesh();
      this.setupInteraction();

      console.log(`${this.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      eventSystem.emit(EventTypes.ERROR_OCCURRED, {
        error,
        source: this,
        context: 'initialization'
      });
    }
  }

  /**
   * 加载纹理
   */
  async loadTexture() {
    if (!this.textureUrl) {
      console.log(`No texture URL provided for ${this.name}, using placeholder`);
      this.texture = this.generatePlaceholderTexture();
      return;
    }

    try {
      console.log(`Loading texture for ${this.name}: ${this.textureUrl}`);
      const textureLoader = new THREE.TextureLoader();
      this.texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          this.textureUrl,
          texture => {
            console.log(`✅ Successfully loaded texture for ${this.name}`);
            resolve(texture);
          },
          undefined,
          error => {
            console.warn(`❌ Failed to load texture for ${this.name}:`, error);
            reject(error);
          }
        );
      });

      // 优化纹理设置
      this.optimizeTexture();
    } catch (error) {
      console.warn(`🔄 Using placeholder texture for ${this.name} due to loading error:`, error.message);
      // 使用改进的占位符纹理
      this.texture = this.generatePlaceholderTexture();
    }
  }

  /**
   * 生成占位符纹理
   */
  generatePlaceholderTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    // 根据天体类型创建不同的占位符纹理
    if (this.name.toLowerCase() === 'sun') {
      // 为太阳创建特殊的占位符纹理
      this.generateSunPlaceholderTexture(context, canvas.width, canvas.height);
    } else {
      // 为其他天体创建基础占位符纹理
      this.generateBasicPlaceholderTexture(context, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.optimizeTexture();
    return texture;
  }

  /**
   * 生成太阳占位符纹理
   */
  generateSunPlaceholderTexture(context, width, height) {
    // 创建径向渐变，模拟太阳外观
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;

    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#FFFF99');    // 中心亮黄色
    gradient.addColorStop(0.3, '#FFD700');  // 金黄色
    gradient.addColorStop(0.6, '#FF8C00');  // 橙色
    gradient.addColorStop(0.8, '#FF4500');  // 红橙色
    gradient.addColorStop(1, '#8B0000');    // 深红色边缘

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    // 添加一些随机的太阳黑子效果
    context.fillStyle = 'rgba(139, 0, 0, 0.6)';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const spotRadius = 3 + Math.random() * 8;
      context.beginPath();
      context.arc(x, y, spotRadius, 0, Math.PI * 2);
      context.fill();
    }

    // 添加标签
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.shadowColor = '#000000';
    context.shadowBlur = 4;
    context.fillText('☀️ 太阳 (占位符)', centerX, centerY + 8);
  }

  /**
   * 生成基础占位符纹理
   */
  generateBasicPlaceholderTexture(context, width, height) {
    // 创建渐变背景
    const gradient = context.createLinearGradient(0, 0, width, height);
    const colorHex = `#${this.color.toString(16).padStart(6, '0')}`;
    gradient.addColorStop(0, colorHex);
    gradient.addColorStop(0.5, this.adjustBrightness(colorHex, -0.3));
    gradient.addColorStop(1, this.adjustBrightness(colorHex, -0.6));

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    // 添加一些纹理效果
    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 2 + Math.random() * 6;
      context.fillRect(x, y, size, size);
    }

    // 添加标签
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.shadowColor = '#000000';
    context.shadowBlur = 2;
    context.fillText(`${this.name} (占位符)`, width / 2, height / 2 + 8);
  }

  /**
   * 调整颜色亮度
   */
  adjustBrightness(hexColor, factor) {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * factor * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }

  /**
   * 优化纹理设置
   */
  optimizeTexture() {
    if (!this.texture) return;

    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = 16;
  }

  /**
   * 创建几何体
   */
  createGeometry() {
    const segments = this.getGeometrySegments();
    this.geometry = new THREE.SphereGeometry(
      this.radius,
      segments.widthSegments,
      segments.heightSegments
    );
  }

  /**
   * 获取几何体细分参数
   */
  getGeometrySegments() {
    const baseSegments = {
      widthSegments: 32,
      heightSegments: 16
    };

    switch (this.detailLevel) {
    case 3: // 高质量
      return { widthSegments: 64, heightSegments: 32 };
    case 2: // 中等质量
      return { widthSegments: 32, heightSegments: 16 };
    case 1: // 低质量
      return { widthSegments: 16, heightSegments: 8 };
    default:
      return baseSegments;
    }
  }

  /**
   * 创建材质
   */
  createMaterial() {
    console.log(`🎨 Creating material for ${this.name}...`);
    console.log(`🎨 Color: 0x${this.color.toString(16)}`);
    console.log(`🎨 Emissive: 0x${this.emissive.toString(16)}`);
    console.log(`🎨 Emissive intensity: ${this.emissiveIntensity}`);
    console.log(`🎨 Has texture: ${this.texture ? 'Yes' : 'No'}`);

    const baseOptions = {
      color: this.color
    };

    if (this.texture) {
      baseOptions.map = this.texture;
      console.log('🎨 Texture applied to material');
    }

    // 根据天体类型选择材质
    if (this.emissiveIntensity > 0) {
      // 发光天体使用MeshStandardMaterial支持emissive属性
      console.log('🎨 Creating emissive material (MeshStandardMaterial)');
      this.material = new THREE.MeshStandardMaterial({
        ...baseOptions,
        emissive: this.emissive,
        emissiveIntensity: this.emissiveIntensity,
        roughness: 1.0,
        metalness: 0.0
      });

      // 对于太阳，确保纹理不被发光效果完全覆盖
      if (this.name.toLowerCase() === 'sun') {
        console.log('🎨 Applying special Sun material settings');
        this.material.emissiveIntensity = Math.min(this.emissiveIntensity, 0.3);
        // 确保纹理可见
        if (this.texture) {
          this.material.map = this.texture;
        }
      }
    } else {
      // 非发光天体使用MeshPhongMaterial
      console.log('🎨 Creating non-emissive material (MeshPhongMaterial)');
      this.material = new THREE.MeshPhongMaterial({
        ...baseOptions,
        shininess: 30,
        specular: 0x111111
      });
    }

    console.log(`🎨 Material created for ${this.name}:`, this.material.type);
  }

  /**
   * 创建网格对象
   */
  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = this.name;
    this.mesh.userData = {
      type: this.type,
      celestialBody: this
    };
  }

  /**
   * 设置交互
   */
  setupInteraction() {
    if (!this.mesh) return;

    this.mesh.userData.celestialBody = this;
  }

  /**
   * 更新位置
   * @param {number} julianDate - 儒略日
   */
  updatePosition(julianDate) {
    const position = this.calculatePosition(julianDate);
    this.position.copy(position);

    if (this.mesh) {
      this.mesh.position.copy(position);
    }
  }

  /**
   * 计算位置（使用精密轨道计算）
   * @param {number} julianDate - 儒略日
   * @returns {THREE.Vector3} 位置向量
   */
  async calculatePosition(julianDate) {
    try {
      // 动态导入精密计算模块
      const { orbitalMechanics } = await import('../utils/OrbitalMechanics.js');
      const { SCALE_FACTORS } = await import('../utils/Constants.js');

      // 使用开普勒轨道计算
      const orbitalData = orbitalMechanics.calculateOrbitalPosition(this.orbitElements, julianDate);

      // 应用缩放因子（将AU转换为可视化单位）
      const scaledPosition = orbitalData.position.multiplyScalar(SCALE_FACTORS.DISTANCE_SCALE);

      return scaledPosition;
    } catch (error) {
      console.warn(`Failed to calculate precise position for ${this.name}:`, error);

      // 回退到基础圆形轨道
      const t = (julianDate - 2451545.0) / 365.25;
      const angle = t * Math.PI * 2;

      return new THREE.Vector3(
        Math.cos(angle) * this.orbitElements.semiMajorAxis,
        0,
        Math.sin(angle) * this.orbitElements.semiMajorAxis
      );
    }
  }

  /**
   * 更新旋转
   * @param {number} deltaTime - 时间增量（秒）
   */
  updateRotation(deltaTime) {
    if (this.rotationSpeed === 0) return;

    this.rotationAngle += this.rotationSpeed * deltaTime;

    if (this.mesh) {
      this.mesh.rotation.y = this.rotationAngle;
    }
  }

  /**
   * 更新LOD（细节层次）
   * @param {THREE.Vector3} cameraPosition - 相机位置
   */
  updateLOD(cameraPosition) {
    if (!this.mesh || !cameraPosition) return;

    const distance = this.position.distanceTo(cameraPosition);
    let newDetailLevel = 1;

    for (let i = 0; i < this.lodDistances.length; i++) {
      if (distance < this.lodDistances[i]) {
        newDetailLevel = i + 1;
        break;
      }
    }

    if (newDetailLevel !== this.detailLevel) {
      this.detailLevel = newDetailLevel;
      this.updateGeometry();
    }
  }

  /**
   * 更新几何体
   */
  updateGeometry() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    this.createGeometry();

    if (this.mesh) {
      this.mesh.geometry = this.geometry;
    }
  }

  /**
   * 设置可见性
   * @param {boolean} visible - 是否可见
   */
  setVisible(visible) {
    this.isVisible = visible;
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }

  /**
   * 设置选中状态
   * @param {boolean} selected - 是否选中
   */
  setSelected(selected) {
    this.isSelected = selected;

    if (this.material) {
      if (selected) {
        this.material.emissive.setHex(0x444444);
      } else {
        this.material.emissive.setHex(this.emissive);
      }
    }

    eventSystem.emit(EventTypes.CELESTIAL_BODY_CLICKED, {
      body: this,
      isSelected: selected
    });
  }

  /**
   * 设置悬停状态
   * @param {boolean} hovered - 是否悬停
   */
  setHovered(hovered) {
    this.isHovered = hovered;

    if (this.material) {
      if (hovered) {
        this.material.emissive.setHex(0x222222);
      } else if (!this.isSelected) {
        this.material.emissive.setHex(this.emissive);
      }
    }

    eventSystem.emit(EventTypes.CELESTIAL_BODY_HOVERED, {
      body: this,
      isHovered: hovered
    });
  }

  /**
   * 获取默认轨道参数
   */
  getDefaultOrbitElements() {
    return {
      semiMajorAxis: 10,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly0: 0,
      meanMotion: 0.017201423, // 地球公转角速度，弧度/天
      epoch: 2451545.0 // J2000.0
    };
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      name: this.name,
      type: this.type,
      position: this.position.clone(),
      rotation: this.rotationAngle,
      isVisible: this.isVisible,
      isSelected: this.isSelected,
      isHovered: this.isHovered,
      detailLevel: this.detailLevel
    };
  }

  /**
   * 获取详细信息
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      radius: this.radius,
      mass: this.mass,
      distance: this.position.length(),
      rotationSpeed: this.rotationSpeed,
      orbitElements: { ...this.orbitElements },
      textureUrl: this.textureUrl
    };
  }

  /**
   * 销毁天体对象
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    if (this.texture) {
      this.texture.dispose();
    }

    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh);
    }

    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.texture = null;
  }

  /**
   * 复制天体对象
   */
  clone() {
    return new CelestialBody(this.name, {
      radius: this.radius,
      mass: this.mass,
      color: this.color,
      textureUrl: this.textureUrl,
      emissive: this.emissive,
      emissiveIntensity: this.emissiveIntensity,
      orbitElements: { ...this.orbitElements },
      rotationAxis: this.rotationAxis.clone(),
      rotationSpeed: this.rotationSpeed
    });
  }
}

// 导出默认实例
export default CelestialBody;
