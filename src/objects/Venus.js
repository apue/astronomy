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
      radius: venusData.radius / SCALE_FACTORS.SIZE_SCALE,
      mass: venusData.mass,
      color: venusData.color,
      textureUrl: TEXTURE_PATHS.VENUS.surface,
      rotationSpeed: (2 * Math.PI) / (Math.abs(venusData.rotationPeriod) * 86400), // 逆向自转
      orbitElements: {
        ...venusData.orbitElements,
        semiMajorAxis: venusData.orbitElements.semiMajorAxis * SCALE_FACTORS.DISTANCE_SCALE,
        inclination: THREE.MathUtils.degToRad(venusData.orbitElements.inclination),
        longitudeOfAscendingNode: THREE.MathUtils.degToRad(venusData.orbitElements.longitudeOfAscendingNode),
        argumentOfPeriapsis: THREE.MathUtils.degToRad(venusData.orbitElements.argumentOfPeriapsis),
        meanAnomaly0: THREE.MathUtils.degToRad(venusData.orbitElements.meanAnomaly0),
        meanMotion: THREE.MathUtils.degToRad(venusData.orbitElements.meanMotion)
      },
      ...options
    });
    
    this.type = 'venus';
    this.atmosphereHeight = this.radius * 0.05;
    this.cloudRotationSpeed = 0.002;
    this.cloudAngle = 0;
    
    // 金星逆向自转
    this.rotationSpeed *= -1;
    
    this.initializeVenus();
  }

  async initializeVenus() {
    try {
      await this.loadVenusTextures();
      this.createDenseAtmosphere();
      this.createSulfuricClouds();
      this.createSurfaceFeatures();
      console.log('Venus initialized with dense atmosphere and clouds');
    } catch (error) {
      console.warn('Failed to initialize venus visuals:', error);
    }
  }

  async loadVenusTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    try {
      this.surfaceTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.VENUS.surface, resolve, undefined, reject);
      });
      
      this.cloudTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.VENUS.clouds, resolve, undefined, reject);
      });
      
      // 优化纹理
      [this.surfaceTexture, this.cloudTexture].forEach(texture => {
        if (texture) {
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16;
        }
      });
      
    } catch (error) {
      console.warn('Failed to load venus textures:', error);
    }
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
    return AstronomyUtils.calculateVenusPosition(julianDate)
      .multiplyScalar(SCALE_FACTORS.DISTANCE_SCALE);
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