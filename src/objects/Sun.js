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
    
    // 重新计算太阳尺寸，使其与轨道比例协调
    // 地球轨道8单位 = 1AU，太阳应该看起来合理
    const sunRadius = 0.5; // 将太阳缩小到0.5单位，这样看起来不会过大

    super('Sun', {
      radius: sunRadius,
      mass: sunData.mass,
      color: sunData.color,
      textureUrl: TEXTURE_PATHS.SUN.surface,
      emissive: sunData.color,
      emissiveIntensity: 0.3,
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
    this.debugMode = options.debugMode || false;

    // 异步初始化将在外部调用
  }

  async initializeSun() {
    try {
      console.log('🌞 Starting Sun initialization...');
      console.log('🌞 Current mesh status:', this.mesh ? 'Mesh exists' : 'No mesh');
      console.log('🌞 Current material status:', this.material ? 'Material exists' : 'No material');
      console.log('🌞 Current texture status:', this.texture ? 'Texture exists' : 'No texture');
      
      await this.loadCoronaTexture();
      this.createSunVisuals();
      this.createLighting();
      this.createCorona();
      
      console.log('🌞 Sun initialization completed successfully');
      console.log('🌞 Final mesh status:', this.mesh ? 'Mesh ready' : 'Mesh missing');
      console.log('🌞 Final material emissive:', this.mesh?.material?.emissive);
      console.log('🌞 Final material map:', this.mesh?.material?.map ? 'Texture applied' : 'No texture');
    } catch (error) {
      console.error('❌ Failed to initialize sun visuals:', error);
      throw error;
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
    console.log('🌞 Creating sun visuals...');
    console.log('🌞 Sun radius:', this.radius);
    console.log('🌞 Debug mode:', this.debugMode);
    
    if (this.debugMode) {
      // Debug模式：使用红色球体
      console.log('🌞 Debug mode enabled - creating red sphere instead of textured sun');
      
      if (this.mesh && this.mesh.material) {
        // 使用标准材质红色
        this.mesh.material = new THREE.MeshBasicMaterial({
          color: 0xFF0000,
          transparent: false,
          wireframe: false
        });
        console.log('🌞 Debug material applied - red sphere');
      }
    } else {
      // 正常模式：使用纹理和发光效果
      if (this.mesh && this.mesh.material) {
        console.log('🌞 Updating main material emissive properties...');
        this.mesh.material.emissive.setHex(0xFF8800);
        this.mesh.material.emissiveIntensity = 0.2; // 降低强度让纹理更清楚
        console.log('🌞 Main material emissive set to:', this.mesh.material.emissive);
        console.log('🌞 Main material emissive intensity:', this.mesh.material.emissiveIntensity);
      }

      // 创建太阳光晕
      console.log('🌞 Creating glow effect...');
      const glowGeometry = new THREE.SphereGeometry(this.radius * 1.5, 32, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });

      this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      if (this.mesh) {
        this.mesh.add(this.glowMesh);
        console.log('🌞 Glow mesh added to sun');
      }

      // 创建太阳表面动画
      this.createSurfaceAnimation();
    }
  }

  createLighting() {
    if (this.debugMode) {
      // Debug模式下使用简化的光照
      this.sunLight = new THREE.PointLight(0xffffff, 1, 1000);
      this.sunLight.position.set(0, 0, 0);
      this.sunLight.castShadow = false; // 关闭阴影以提高性能
    } else {
      // 正常模式：完整光照系统
      this.sunLight = new THREE.PointLight(0xffffff, 2, 1000);
      this.sunLight.position.set(0, 0, 0);
      this.sunLight.castShadow = true;

      // 阴影配置
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 500;
      this.sunLight.shadow.bias = -0.0001;

      // 环境光补充
      this.ambientLight = new THREE.AmbientLight(0x404040, 0.2);
      this.mesh.add(this.ambientLight);
    }
    
    this.mesh.add(this.sunLight);
  }

  createCorona() {
    if (this.debugMode || !this.coronaTexture) return;

    // 正常模式下创建日冕效果
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
    if (this.debugMode) return; // Debug模式下不创建粒子动画

    console.log('🌞 Creating surface animation particles...');
    
    // 创建太阳表面粒子的动画
    const particleCount = 500; // 减少粒子数量以提高性能
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = this.radius * (0.95 + Math.random() * 0.1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFAA00,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.surfaceParticles = new THREE.Points(particles, particleMaterial);
    if (this.mesh) {
      this.mesh.add(this.surfaceParticles);
      console.log('🌞 Surface particles added to sun');
    }
  }

  updateRotation(deltaTime) {
    super.updateRotation(deltaTime);

    if (this.debugMode) return; // Debug模式下不更新特效

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
