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

    // 标志表示使用自定义材质创建
    this.hasCustomMaterial = true;

    // 异步初始化将在外部调用
  }

  async initializeEarth() {
    try {
      console.log('🌍 开始初始化地球...');
      await this.loadEarthTextures();
      
      // 创建材质（由于hasCustomMaterial=true，基类不会创建）
      this.createNightSide();
      
      // 创建网格（如果还没有创建）
      if (!this.mesh) {
        this.createMesh();
      }
      
      this.createAtmosphere();
      this.createClouds();
      
      // 立即设置地球到轨道位置（简化位置，便于调试）
      const earthPosition = new THREE.Vector3(8, 0, 0); // 8单位距离的简单位置
      this.position.copy(earthPosition);
      if (this.mesh) {
        this.mesh.position.copy(earthPosition);
      }
      
      console.log('🌍 地球已初始化，具有大气层和云层');
      console.log(`🌍 地球位置：(${this.position.x}, ${this.position.y}, ${this.position.z})`);
      console.log(`🌍 地球网格对象：${this.mesh ? '已创建' : '未创建'}`);
      if (this.mesh) {
        console.log(`🌍 地球网格位置：(${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z})`);
        console.log(`🌍 地球材质：${this.mesh.material ? this.mesh.material.type : '未设置'}`);
        console.log(`🌍 地球材质颜色：${this.mesh.material ? '0x' + this.mesh.material.color.getHex().toString(16) : '未设置'}`);
        console.log(`🌍 地球可见性：${this.mesh.visible}`);
        console.log(`🌍 地球父对象：${this.mesh.parent ? this.mesh.parent.name || '未命名对象' : '无父对象'}`);
      }

      // 调试监控已暂时禁用，以减少控制台输出
      // this.startRenderingDebugMonitor();
    } catch (error) {
      console.warn('❌ 地球视觉效果初始化失败:', error);
    }
  }

  /**
   * 启动渲染和光照调试监控器
   */
  startRenderingDebugMonitor() {
    setInterval(() => {
      if (this.mesh) {
        console.log('💡 地球渲染和光照检查:');
        
        // 获取场景中的光源
        const scene = this.mesh.parent;
        if (scene) {
          const lights = [];
          scene.traverse((child) => {
            if (child.isLight) {
              lights.push({
                type: child.type,
                position: child.position.clone(),
                intensity: child.intensity,
                color: child.color.getHex(),
                distance: child.distance || '无限制'
              });
            }
          });
          
          console.log(`💡 - 场景中的光源数量: ${lights.length}`);
          lights.forEach((light, index) => {
            console.log(`💡 - 光源${index + 1}: ${light.type}`);
            console.log(`💡   位置: (${light.position.x}, ${light.position.y}, ${light.position.z})`);
            console.log(`💡   强度: ${light.intensity}`);
            console.log(`💡   颜色: 0x${light.color.toString(16)}`);
            console.log(`💡   距离: ${light.distance}`);
            
            // 计算光源到地球的距离
            const lightToEarth = light.position.distanceTo(this.mesh.position);
            console.log(`💡   到地球距离: ${lightToEarth.toFixed(2)}`);
          });
        }
        
        // 检查几何体和渲染状态
        console.log(`🎨 - 几何体存在: ${this.mesh.geometry ? '是' : '否'}`);
        console.log(`🎨 - 几何体顶点数: ${this.mesh.geometry ? this.mesh.geometry.attributes.position.count : 'N/A'}`);
        console.log(`🎨 - 网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
        console.log(`🎨 - 网格缩放: (${this.mesh.scale.x}, ${this.mesh.scale.y}, ${this.mesh.scale.z})`);
        console.log(`🎨 - 网格可见: ${this.mesh.visible}`);
        console.log(`🎨 - 网格图层: ${this.mesh.layers.mask}`);
        
        // 检查材质的光照相关属性
        if (this.mesh.material) {
          console.log(`🎨 - 材质接受光照: ${this.mesh.material.type !== 'MeshBasicMaterial'}`);
          console.log(`🎨 - 材质需要更新: ${this.mesh.material.needsUpdate}`);
        }
        
        console.log('💡 ==================');
      }
    }, 6000); // 每6秒检查一次
  }

  async loadEarthTextures() {
    const textureLoader = new THREE.TextureLoader();

    // 尝试加载主要纹理
    try {
      this.dayTexture = await new Promise((resolve, reject) => {
        textureLoader.load(
          TEXTURE_PATHS.EARTH.day, 
          (texture) => {
            console.log(`🌍 地球日间纹理加载成功: ${TEXTURE_PATHS.EARTH.day}`);
            console.log(`🌍 纹理尺寸: ${texture.image.width}x${texture.image.height}`);
            resolve(texture);
          },
          (progress) => {
            console.log(`🌍 地球纹理加载进度: ${Math.round(progress.loaded / progress.total * 100)}%`);
          },
          (error) => {
            console.error('❌ 地球日间纹理加载失败:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.warn('❌ 地球日间纹理加载失败，将使用占位符:', error);
      this.dayTexture = null;
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
    // 简化的大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(
      this.radius + this.atmosphereHeight,
      32,
      16
    );

    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.mesh.add(this.atmosphereMesh);
  }

  createClouds() {
    if (!this.cloudTexture) return;

    // 简化的云层
    const cloudGeometry = new THREE.SphereGeometry(
      this.radius + 0.002, // 略高于地表
      32,
      16
    );

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.mesh.add(this.cloudMesh);
  }

  createNightSide() {
    // 创建地球材质，确保总是有可用的材质
    const materialOptions = {
      bumpScale: 0.02,
      // 确保至少有一个基础颜色
      color: this.color
    };

    // 确保使用日间纹理作为主纹理
    if (this.dayTexture) {
      materialOptions.map = this.dayTexture;
      console.log('🌍 地球日间纹理已应用');
      console.log('🌍 纹理对象:', this.dayTexture);
    } else if (this.texture) {
      materialOptions.map = this.texture;
      console.log('🌍 地球使用基础纹理');
    } else {
      console.log('🌍 地球使用纯色材质 (颜色: 0x' + this.color.toString(16) + ')');
      // 确保颜色是明亮的，便于调试
      materialOptions.color = 0x00ff00; // 临时使用绿色便于识别
      console.log('🌍 临时使用绿色便于调试');
    }

    // 添加凹凸贴图
    if (this.bumpTexture) {
      materialOptions.bumpMap = this.bumpTexture;
      console.log('🌍 地球凹凸纹理已应用');
    }

    // 如果有夜间纹理，添加发光效果
    if (this.nightTexture) {
      materialOptions.emissiveMap = this.nightTexture;
      materialOptions.emissive = 0x222222;
      materialOptions.emissiveIntensity = 0.5;
      console.log('🌍 地球夜间纹理已应用');
    }

    // 使用MeshBasicMaterial确保可见性，暂时跳过光照问题
    this.material = new THREE.MeshBasicMaterial(materialOptions);
    console.log('🌍 地球材质创建完成 (MeshBasicMaterial)');

    // 更新网格材质
    if (this.mesh) {
      this.mesh.material = this.material;
      console.log('🌍 地球材质已更新到网格');
      
      // 确保mesh可见并且材质正确设置
      this.mesh.visible = true;
      console.log('🌍 地球网格可见性已确认');
    } else {
      console.warn('❌ 地球网格对象不存在，无法应用材质');
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
    // 直接计算轨道位置，确保地球严格位于轨道上
    // 不再依赖AstronomyUtils的计算结果

    // 参数
    const earthOrbitRadius = 8.0;

    // 计算地球在轨道上的角度
    // 从J2000.0开始计算天数
    const daysSinceJ2000 = julianDate - 2451545.0;

    // 地球公转周期365.256天，角速度约0.0172弧度/天
    // 角度 = (天数 * 角速度) % (2π)
    const angularVelocity = (2 * Math.PI) / 365.256363004;
    const angle = (daysSinceJ2000 * angularVelocity) % (2 * Math.PI);

    // 计算轨道位置
    const x = earthOrbitRadius * Math.cos(angle);
    const z = earthOrbitRadius * Math.sin(angle);
    const position = new THREE.Vector3(x, 0, z);

    // 日志输出
    console.log('🌍 地球直接计算位置:');
    console.log(`🌍 - 公转角度: ${(angle * 180 / Math.PI).toFixed(2)}°`);
    console.log(`🌍 - 轨道半径: ${earthOrbitRadius.toFixed(2)} 单位`);
    console.log(`🌍 - 计算位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);

    // 验证距离
    const distance = Math.sqrt(position.x * position.x + position.z * position.z);
    console.log(`🌍 - 实际距离: ${distance.toFixed(4)} (目标: ${earthOrbitRadius.toFixed(4)})`);

    return position;
  }

  updateLOD(cameraPosition) {
    super.updateLOD(cameraPosition);

    // 根据距离调整大气层透明度
    if (this.atmosphereMesh) {
      const distance = this.position.distanceTo(cameraPosition);
      const opacity = Math.min(0.2, Math.max(0.05, 30 / distance));
      this.atmosphereMesh.material.opacity = opacity;
    }
  }

  updatePosition(julianDate) {
    super.updatePosition(julianDate);
    console.log(`🌍 地球位置已更新 [JD=${julianDate}]: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`);
    if (this.mesh) {
      console.log(`🌍 地球网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
    } else {
      console.log('❌ 地球网格对象不存在!');
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

    [this.dayTexture, this.nightTexture, this.cloudTexture, this.bumpTexture]
      .forEach(texture => {
        if (texture) texture.dispose();
      });
  }
}
