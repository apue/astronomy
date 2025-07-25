/**
 * 太阳类 - 太阳的三维模型实现
 * 包含太阳的物理特性和视觉效果
 */

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { CELESTIAL_BODIES, SCALE_FACTORS, TEXTURE_PATHS } from '../utils/Constants.js';
import { AstronomyUtils } from '../utils/AstronomyUtils.js';

export class Sun extends CelestialBody {
  constructor(options = {}) {
    const sunData = CELESTIAL_BODIES.SUN;

    super('Sun', {
      radius: sunData.radius / SCALE_FACTORS.SIZE_SCALE,
      mass: sunData.mass,
      color: sunData.color,
      textureUrl: TEXTURE_PATHS.SUN.surface,
      emissive: sunData.color,
      emissiveIntensity: 0.8,
      rotationSpeed: (2 * Math.PI) / (sunData.rotationPeriod * 86400), // 弧度/秒
      orbitElements: {
        semiMajorAxis: 0, // 太阳在原点
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly0: 0,
        meanMotion: 0,
        epoch: 2451545.0
      },
      ...options
    });

    this.type = 'sun';
    this.luminosity = sunData.luminosity;
    this.temperature = sunData.temperature;
    this.coronaTexture = null;

    // 异步初始化将在外部调用
  }

  async initializeSun() {
    try {
      await this.loadCoronaTexture();
      this.createSunVisuals();
      this.createLighting();
      this.createCorona();
      console.log('Sun initialized with enhanced visuals');
    } catch (error) {
      console.warn('Failed to initialize sun visuals:', error);
    }
  }

  async loadCoronaTexture() {
    try {
      const textureLoader = new THREE.TextureLoader();
      this.coronaTexture = await new Promise((resolve, reject) => {
        textureLoader.load(
          TEXTURE_PATHS.SUN.corona,
          texture => resolve(texture),
          undefined,
          reject
        );
      });
    } catch (error) {
      console.log('Optional corona texture not available:', TEXTURE_PATHS.SUN.corona);
      this.coronaTexture = null;
    }
  }

  createSunVisuals() {
    // 创建太阳光晕
    const glowGeometry = new THREE.SphereGeometry(this.radius * 1.5, 32, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });

    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glowMesh);

    // 创建太阳表面动画
    this.createSurfaceAnimation();
  }

  createLighting() {
    // 太阳光源
    this.sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;

    // 阴影配置
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.bias = -0.0001;

    this.mesh.add(this.sunLight);

    // 环境光补充
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.mesh.add(this.ambientLight);
  }

  createCorona() {
    if (!this.coronaTexture) return;

    // 创建日冕效果
    const coronaGeometry = new THREE.SphereGeometry(this.radius * 2.5, 32, 16);
    const coronaMaterial = new THREE.MeshBasicMaterial({
      map: this.coronaTexture,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    this.coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
    this.mesh.add(this.coronaMesh);
  }

  createSurfaceAnimation() {
    // 创建太阳表面粒子的动画
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = this.radius * (0.9 + Math.random() * 0.1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFAA00,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.surfaceParticles = new THREE.Points(particles, particleMaterial);
    this.mesh.add(this.surfaceParticles);
  }

  updateRotation(deltaTime) {
    super.updateRotation(deltaTime);

    // 更新日冕旋转
    if (this.coronaMesh) {
      this.coronaMesh.rotation.y += deltaTime * 0.1;
    }

    // 更新表面粒子动画
    if (this.surfaceParticles) {
      this.surfaceParticles.rotation.y += deltaTime * 0.3;
    }
  }

  calculatePosition(julianDate) {
    // 太阳位置始终在原点
    return new THREE.Vector3(0, 0, 0);
  }

  getInfo() {
    const baseInfo = super.getInfo();
    return {
      ...baseInfo,
      luminosity: this.luminosity,
      temperature: this.temperature,
      rotationPeriod: CELESTIAL_BODIES.SUN.rotationPeriod,
      type: 'Star',
      spectralClass: 'G2V'
    };
  }

  dispose() {
    super.dispose();

    if (this.glowMesh) {
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
    }

    if (this.coronaMesh) {
      this.coronaMesh.geometry.dispose();
      this.coronaMesh.material.dispose();
    }

    if (this.surfaceParticles) {
      this.surfaceParticles.geometry.dispose();
      this.surfaceParticles.material.dispose();
    }

    if (this.coronaTexture) {
      this.coronaTexture.dispose();
    }
  }
}
