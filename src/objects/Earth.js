/**
 * 地球类 - 地球的三维模型实现
 * 包含地球的大气层、云层和地理特征
 */

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { CELESTIAL_BODIES, SCALE_FACTORS, TEXTURE_PATHS } from '../utils/Constants.js';
import { AstronomyUtils } from '../utils/AstronomyUtils.js';

export class Earth extends CelestialBody {
  constructor(options = {}) {
    const earthData = CELESTIAL_BODIES.EARTH;

    super('Earth', {
      radius: 0.25, // 地球半径设置为太阳半径的1/2（太阳半径为0.5单位）
      mass: earthData.mass,
      color: earthData.color,
      textureUrl: TEXTURE_PATHS.EARTH.day,
      rotationSpeed: (2 * Math.PI) / (earthData.rotationPeriod * 86400), // 弧度/秒
      orbitElements: {
        ...earthData.orbitElements,
        semiMajorAxis: 8.0, // 固定地球轨道半径为8单位
        inclination: THREE.MathUtils.degToRad(earthData.orbitElements.inclination),
        longitudeOfAscendingNode: THREE.MathUtils.degToRad(earthData.orbitElements.longitudeOfAscendingNode),
        argumentOfPeriapsis: THREE.MathUtils.degToRad(earthData.orbitElements.argumentOfPeriapsis),
        meanAnomaly0: THREE.MathUtils.degToRad(earthData.orbitElements.meanAnomaly0),
        meanMotion: THREE.MathUtils.degToRad(earthData.orbitElements.meanMotion)
      },
      ...options
    });

    console.log(`🌍 地球构造函数：半径=${this.radius}，轨道半径=${this.orbitElements.semiMajorAxis}`);
    
    this.type = 'earth';
    this.atmosphereHeight = this.radius * 0.1;
    this.cloudRotationSpeed = 0.001;
    this.cloudAngle = 0;

    // 异步初始化将在外部调用
  }

  async initializeEarth() {
    try {
      console.log(`🌍 开始初始化地球...`);
      await this.loadEarthTextures();
      this.createAtmosphere();
      this.createClouds();
      this.createNightSide();
      console.log('🌍 地球已初始化，具有大气层和云层');
      console.log(`🌍 地球位置：(${this.position.x}, ${this.position.y}, ${this.position.z})`);
      console.log(`🌍 地球网格对象：${this.mesh ? '已创建' : '未创建'}`);
      if (this.mesh) {
        console.log(`🌍 地球网格位置：(${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z})`);
        console.log(`🌍 地球材质：${this.mesh.material ? this.mesh.material.type : '未设置'}`);
        console.log(`🌍 地球可见性：${this.mesh.visible}`);
        console.log(`🌍 地球父对象：${this.mesh.parent ? this.mesh.parent.name || '未命名对象' : '无父对象'}`);
      }
    } catch (error) {
      console.warn('❌ 地球视觉效果初始化失败:', error);
    }
  }

  async loadEarthTextures() {
    const textureLoader = new THREE.TextureLoader();

    // 尝试加载主要纹理
    try {
      this.dayTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.EARTH.day, resolve, undefined, reject);
      });
      console.log(`🌍 地球日间纹理加载成功: ${TEXTURE_PATHS.EARTH.day}`);
    } catch (error) {
      console.warn('❌ 地球日间纹理加载失败:', error);
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

    this.nightTexture = await loadOptionalTexture(TEXTURE_PATHS.EARTH.night, 'night');
    this.cloudTexture = await loadOptionalTexture(TEXTURE_PATHS.EARTH.clouds, 'clouds');
    this.bumpTexture = await loadOptionalTexture(TEXTURE_PATHS.EARTH.bump, 'bump');

    // 优化已加载的纹理
    [this.dayTexture, this.nightTexture, this.cloudTexture, this.bumpTexture]
      .filter(texture => texture !== null)
      .forEach(texture => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16;
      });
  }

  createAtmosphere() {
    // 大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(
      this.radius + this.atmosphereHeight,
      32,
      16
    );

    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.mesh.add(this.atmosphereMesh);

    // 大气辉光
    const glowGeometry = new THREE.SphereGeometry(
      this.radius + this.atmosphereHeight * 0.5,
      32,
      16
    );

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });

    this.atmosphereGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.atmosphereGlow);
  }

  createClouds() {
    if (!this.cloudTexture) return;

    // 云层
    const cloudGeometry = new THREE.SphereGeometry(
      this.radius + 0.001, // 略高于地表
      32,
      16
    );

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.mesh.add(this.cloudMesh);
  }

  createNightSide() {
    if (!this.nightTexture) return;

    // 更新主材质以支持昼夜变化
    this.material = new THREE.MeshPhongMaterial({
      map: this.dayTexture,
      bumpMap: this.bumpTexture,
      bumpScale: 0.05,
      emissiveMap: this.nightTexture,
      emissive: 0x444444,
      emissiveIntensity: 0.8,
      shininess: 30,
      specular: 0x111111
    });

    // 更新网格材质
    if (this.mesh) {
      this.mesh.material = this.material;
    }
  }

  updateRotation(deltaTime) {
    super.updateRotation(deltaTime);

    // 云层旋转（相对地球旋转）
    if (this.cloudMesh) {
      this.cloudAngle += this.cloudRotationSpeed * deltaTime;
      this.cloudMesh.rotation.y = this.cloudAngle;
    }
  }

  calculatePosition(julianDate) {
    // 从AstronomyUtils获取地球位置（天文单位）
    const position = AstronomyUtils.calculateEarthPosition(julianDate);
    
    // 使用轨道半径8.0（而不是DISTANCE_SCALE=1000）来匹配轨道
    const earthOrbitRadius = 8.0;
    const scaledPosition = position.clone().multiplyScalar(earthOrbitRadius);
    
    console.log(`🌍 地球位置计算 [JD=${julianDate}]: (${scaledPosition.x.toFixed(2)}, ${scaledPosition.y.toFixed(2)}, ${scaledPosition.z.toFixed(2)})`);
    return scaledPosition;
  }

  updateLOD(cameraPosition) {
    super.updateLOD(cameraPosition);

    // 根据距离调整大气层透明度
    if (this.atmosphereMesh) {
      const distance = this.position.distanceTo(cameraPosition);
      const opacity = Math.min(0.3, Math.max(0.1, 50 / distance));
      this.atmosphereMesh.material.opacity = opacity;
    }
  }

  updatePosition(julianDate) {
    super.updatePosition(julianDate);
    console.log(`🌍 地球位置已更新 [JD=${julianDate}]: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`);
    if (this.mesh) {
      console.log(`🌍 地球网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
    } else {
      console.log(`❌ 地球网格对象不存在!`);
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

    if (this.atmosphereGlow) {
      this.atmosphereGlow.visible = visible;
    }
  }

  getInfo() {
    const baseInfo = super.getInfo();
    const earthData = CELESTIAL_BODIES.EARTH;

    return {
      ...baseInfo,
      type: 'Planet',
      rotationPeriod: earthData.rotationPeriod,
      orbitalPeriod: earthData.orbitalPeriod,
      atmosphere: 'Nitrogen-Oxygen',
      moons: 1,
      surfaceTemp: '15°C (average)',
      atmosphereHeight: this.atmosphereHeight,
      hasClouds: !!this.cloudMesh,
      hasNightSide: !!this.nightTexture
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

    if (this.atmosphereGlow) {
      this.atmosphereGlow.geometry.dispose();
      this.atmosphereGlow.material.dispose();
    }

    [this.dayTexture, this.nightTexture, this.cloudTexture, this.bumpTexture]
      .forEach(texture => {
        if (texture) texture.dispose();
      });
  }
}
