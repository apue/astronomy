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
      radius: earthData.radius / SCALE_FACTORS.SIZE_SCALE,
      mass: earthData.mass,
      color: earthData.color,
      textureUrl: TEXTURE_PATHS.EARTH.day,
      rotationSpeed: (2 * Math.PI) / (earthData.rotationPeriod * 86400), // 弧度/秒
      orbitElements: {
        ...earthData.orbitElements,
        semiMajorAxis: earthData.orbitElements.semiMajorAxis * SCALE_FACTORS.DISTANCE_SCALE,
        inclination: THREE.MathUtils.degToRad(earthData.orbitElements.inclination),
        longitudeOfAscendingNode: THREE.MathUtils.degToRad(earthData.orbitElements.longitudeOfAscendingNode),
        argumentOfPeriapsis: THREE.MathUtils.degToRad(earthData.orbitElements.argumentOfPeriapsis),
        meanAnomaly0: THREE.MathUtils.degToRad(earthData.orbitElements.meanAnomaly0),
        meanMotion: THREE.MathUtils.degToRad(earthData.orbitElements.meanMotion)
      },
      ...options
    });
    
    this.type = 'earth';
    this.atmosphereHeight = this.radius * 0.1;
    this.cloudRotationSpeed = 0.001;
    this.cloudAngle = 0;
    
    this.initializeEarth();
  }

  async initializeEarth() {
    try {
      await this.loadEarthTextures();
      this.createAtmosphere();
      this.createClouds();
      this.createNightSide();
      console.log('Earth initialized with atmosphere and clouds');
    } catch (error) {
      console.warn('Failed to initialize earth visuals:', error);
    }
  }

  async loadEarthTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    try {
      this.dayTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.EARTH.day, resolve, undefined, reject);
      });
      
      this.nightTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.EARTH.night, resolve, undefined, reject);
      });
      
      this.cloudTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.EARTH.clouds, resolve, undefined, reject);
      });
      
      this.bumpTexture = await new Promise((resolve, reject) => {
        textureLoader.load(TEXTURE_PATHS.EARTH.bump, resolve, undefined, reject);
      });
      
      // 优化纹理
      [this.dayTexture, this.nightTexture, this.cloudTexture, this.bumpTexture]
        .forEach(texture => {
          if (texture) {
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = 16;
          }
        });
        
    } catch (error) {
      console.warn('Failed to load earth textures:', error);
    }
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
    return AstronomyUtils.calculateEarthPosition(julianDate)
      .multiplyScalar(SCALE_FACTORS.DISTANCE_SCALE);
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