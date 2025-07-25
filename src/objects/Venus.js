/**
 * 金星类 - 金星的三维模型实现
 * 包含金星的大气层和表面特征
 */

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { CELESTIAL_BODIES, SCALE_FACTORS, TEXTURE_PATHS } from '../utils/Constants.js';
import { AstronomyUtils } from '../utils/AstronomyUtils.js';

export class Venus extends CelestialBody {
  constructor(options = {}) {
    const venusData = CELESTIAL_BODIES.VENUS;

    super('Venus', {
      radius: 0.125, // 金星半径设置为太阳半径的1/4（太阳半径为0.5单位）
      mass: venusData.mass,
      color: venusData.color,
      textureUrl: TEXTURE_PATHS.VENUS.surface,
      rotationSpeed: (2 * Math.PI) / (Math.abs(venusData.rotationPeriod) * 86400), // 逆向自转
      orbitElements: {
        ...venusData.orbitElements,
        semiMajorAxis: 8.0 * 0.723, // 金星轨道半径 = 0.723 * 地球轨道
        inclination: THREE.MathUtils.degToRad(venusData.orbitElements.inclination),
        longitudeOfAscendingNode: THREE.MathUtils.degToRad(venusData.orbitElements.longitudeOfAscendingNode),
        argumentOfPeriapsis: THREE.MathUtils.degToRad(venusData.orbitElements.argumentOfPeriapsis),
        meanAnomaly0: THREE.MathUtils.degToRad(venusData.orbitElements.meanAnomaly0),
        meanMotion: THREE.MathUtils.degToRad(venusData.orbitElements.meanMotion)
      },
      ...options
    });

    console.log(`♀️ 金星构造函数：半径=${this.radius}，轨道半径=${this.orbitElements.semiMajorAxis}`);

    this.type = 'venus';
    this.atmosphereHeight = this.radius * 0.05;
    this.cloudRotationSpeed = 0.002;
    this.cloudAngle = 0;

    // 金星逆向自转
    this.rotationSpeed *= -1;

    // 异步初始化将在外部调用
  }

  async initializeVenus() {
    try {
      console.log(`♀️ 开始初始化金星...`);
      await this.loadVenusTextures();
      this.createDenseAtmosphere();
      this.createSulfuricClouds();
      this.createSurfaceFeatures();
      console.log('♀️ 金星已初始化，具有浓密大气层和云层');
      console.log(`♀️ 金星位置：(${this.position.x}, ${this.position.y}, ${this.position.z})`);
      console.log(`♀️ 金星网格对象：${this.mesh ? '已创建' : '未创建'}`);
      if (this.mesh) {
        console.log(`♀️ 金星网格位置：(${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z})`);
        console.log(`♀️ 金星材质：${this.mesh.material ? this.mesh.material.type : '未设置'}`);
        console.log(`♀️ 金星可见性：${this.mesh.visible}`);
        console.log(`♀️ 金星父对象：${this.mesh.parent ? this.mesh.parent.name || '未命名对象' : '无父对象'}`);
      }
    } catch (error) {
      console.warn('❌ 金星视觉效果初始化失败:', error);
    }
  }

  async loadVenusTextures() {
    const textureLoader = new THREE.TextureLoader();

    // 尝试加载主要纹理
    try {
      this.surfaceTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.VENUS.surface, resolve, undefined, reject);
      });
      console.log(`♀️ 金星表面纹理加载成功: ${TEXTURE_PATHS.VENUS.surface}`);
    } catch (error) {
      console.warn('❌ 金星表面纹理加载失败:', error);
    }

    // 尝试加载可选纹理（静默处理失败）
    const loadOptionalTexture = async (path, name) => {
      try {
        return await new Promise((resolve, reject) => {
          textureLoader.load(path, resolve, undefined, reject);
        });
      } catch (error) {
        console.log(`可选纹理 ${name} 不可用:`, path);
        return null;
      }
    };

    this.cloudTexture = await loadOptionalTexture(TEXTURE_PATHS.VENUS.clouds, 'clouds');
    this.normalTexture = await loadOptionalTexture(TEXTURE_PATHS.VENUS.normal, 'normal');
    this.atmosphereTexture = await loadOptionalTexture(TEXTURE_PATHS.VENUS.atmosphere, 'atmosphere');

    // 优化已加载的纹理
    [this.surfaceTexture, this.cloudTexture, this.normalTexture, this.atmosphereTexture]
      .filter(texture => texture !== null)
      .forEach(texture => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
      });
  }

  createDenseAtmosphere() {
    // 金星浓密的大气层
    const atmosphereGeometry = new THREE.SphereGeometry(
      this.radius + this.atmosphereHeight,
      32,
      16
    );

    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFA500,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.mesh.add(this.atmosphereMesh);

    // 大气层辉光
    const glowGeometry = new THREE.SphereGeometry(
      this.radius + this.atmosphereHeight * 0.8,
      32,
      16
    );

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });

    this.atmosphereGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.atmosphereGlow);
  }

  createSulfuricClouds() {
    if (!this.cloudTexture) return;

    // 硫酸云层
    const cloudGeometry = new THREE.SphereGeometry(
      this.radius + 0.002,
      32,
      16
    );

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.mesh.add(this.cloudMesh);

    // 创建多层云层效果
    const innerCloudGeometry = new THREE.SphereGeometry(
      this.radius + 0.001,
      32,
      16
    );

    const innerCloudMaterial = new THREE.MeshPhongMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.innerCloudMesh = new THREE.Mesh(innerCloudGeometry, innerCloudMaterial);
    this.mesh.add(this.innerCloudMesh);
  }

  createSurfaceFeatures() {
    if (!this.surfaceTexture) return;

    // 金星表面特征
    this.material = new THREE.MeshPhongMaterial({
      map: this.surfaceTexture,
      color: this.color,
      shininess: 10,
      specular: 0x222222,
      emissive: 0x663300,
      emissiveIntensity: 0.1
    });

    if (this.mesh) {
      this.mesh.material = this.material;
    }
  }

  updateRotation(deltaTime) {
    super.updateRotation(deltaTime);

    // 云层旋转（比地球快）
    if (this.cloudMesh) {
      this.cloudAngle += this.cloudRotationSpeed * deltaTime;
      this.cloudMesh.rotation.y = this.cloudAngle;
    }

    if (this.innerCloudMesh) {
      this.innerCloudMesh.rotation.y = this.cloudAngle * 0.8;
    }
  }

  calculatePosition(julianDate) {
    // 从AstronomyUtils获取金星位置（天文单位）
    const position = AstronomyUtils.calculateVenusPosition(julianDate);
    
    // 使用轨道半径8.0 * 0.723（而不是DISTANCE_SCALE=1000）来匹配轨道
    const earthOrbitRadius = 8.0;
    const venusOrbitRatio = 0.723; // 金星轨道半径与地球轨道半径的比例
    const scaledPosition = position.clone().multiplyScalar(earthOrbitRadius * venusOrbitRatio);
    
    console.log(`♀️ 金星位置计算 [JD=${julianDate}]: (${scaledPosition.x.toFixed(2)}, ${scaledPosition.y.toFixed(2)}, ${scaledPosition.z.toFixed(2)})`);
    return scaledPosition;
  }

  updatePosition(julianDate) {
    super.updatePosition(julianDate);
    console.log(`♀️ 金星位置已更新 [JD=${julianDate}]: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`);
    if (this.mesh) {
      console.log(`♀️ 金星网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
    } else {
      console.log(`❌ 金星网格对象不存在!`);
    }
  }

  updateLOD(cameraPosition) {
    super.updateLOD(cameraPosition);

    // 根据距离调整大气层透明度
    if (this.atmosphereMesh) {
      const distance = this.position.distanceTo(cameraPosition);
      const opacity = Math.min(0.4, Math.max(0.1, 30 / distance));
      this.atmosphereMesh.material.opacity = opacity;
    }
  }

  setVisible(visible) {
    super.setVisible(visible);

    if (this.atmosphereMesh) {
      this.atmosphereMesh.visible = visible;
    }

    if (this.cloudMesh) {
      this.cloudMesh.visible = visible;
    }

    if (this.innerCloudMesh) {
      this.innerCloudMesh.visible = visible;
    }

    if (this.atmosphereGlow) {
      this.atmosphereGlow.visible = visible;
    }
  }

  getInfo() {
    const baseInfo = super.getInfo();
    const venusData = CELESTIAL_BODIES.VENUS;

    return {
      ...baseInfo,
      type: 'Planet',
      rotationPeriod: Math.abs(venusData.rotationPeriod),
      orbitalPeriod: venusData.orbitalPeriod,
      atmosphere: 'Carbon Dioxide',
      moons: 0,
      surfaceTemp: '462°C (average)',
      atmospherePressure: '92 atm',
      hasClouds: !!this.cloudMesh,
      hasDenseAtmosphere: true,
      retrogradeRotation: true
    };
  }

  dispose() {
    super.dispose();

    if (this.atmosphereMesh) {
      this.atmosphereMesh.geometry.dispose();
      this.atmosphereMesh.material.dispose();
    }

    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      this.cloudMesh.material.dispose();
    }

    if (this.innerCloudMesh) {
      this.innerCloudMesh.geometry.dispose();
      this.innerCloudMesh.material.dispose();
    }

    if (this.atmosphereGlow) {
      this.atmosphereGlow.geometry.dispose();
      this.atmosphereGlow.material.dispose();
    }

    [this.surfaceTexture, this.cloudTexture].forEach(texture => {
      if (texture) texture.dispose();
    });
  }
}
