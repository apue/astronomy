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

    // 精确定义金星轨道半径参数，确保统一
    const earthOrbitRadius = 8.0; // 地球轨道半径
    const venusOrbitRatio = 0.723; // 金星轨道比例
    const venusOrbitRadius = earthOrbitRadius * venusOrbitRatio;

    super('Venus', {
      radius: 0.125, // 金星半径设置为太阳半径的1/4（太阳半径为0.5单位）
      mass: venusData.mass,
      color: venusData.color,
      textureUrl: TEXTURE_PATHS.VENUS.surface,
      rotationSpeed: (2 * Math.PI) / (Math.abs(venusData.rotationPeriod) * 86400), // 逆向自转
      orbitElements: {
        ...venusData.orbitElements,
        semiMajorAxis: venusOrbitRadius, // 明确使用与轨道绘制相同的参数
        inclination: THREE.MathUtils.degToRad(venusData.orbitElements.inclination),
        longitudeOfAscendingNode: THREE.MathUtils.degToRad(venusData.orbitElements.longitudeOfAscendingNode),
        argumentOfPeriapsis: THREE.MathUtils.degToRad(venusData.orbitElements.argumentOfPeriapsis),
        meanAnomaly0: THREE.MathUtils.degToRad(venusData.orbitElements.meanAnomaly0),
        meanMotion: THREE.MathUtils.degToRad(venusData.orbitElements.meanMotion)
      },
      ...options
    });

    console.log('♀️ 金星构造函数:');
    console.log(`♀️ - 半径: ${this.radius} 单位`);
    console.log(`♀️ - 轨道半径: ${this.orbitElements.semiMajorAxis} 单位 (= ${earthOrbitRadius} × ${venusOrbitRatio})`);
    console.log(`♀️ - 轨道比例: ${venusOrbitRatio}`);

    this.type = 'venus';
    this.atmosphereHeight = this.radius * 0.05;
    this.cloudRotationSpeed = 0.002;
    this.cloudAngle = 0;

    // 金星逆向自转
    this.rotationSpeed *= -1;

    // 标志表示使用自定义材质创建
    this.hasCustomMaterial = true;

    // 异步初始化将在外部调用
  }

  async initializeVenus() {
    try {
      console.log('♀️ 开始初始化金星...');
      await this.loadVenusTextures();
      
      // 创建材质（由于hasCustomMaterial=true，基类不会创建）
      this.createSurfaceFeatures();
      
      // 创建网格（如果还没有创建）
      if (!this.mesh) {
        this.createMesh();
      }
      
      this.createDenseAtmosphere();
      this.createSulfuricClouds();
      
      // 立即设置金星到轨道位置（简化位置，便于调试）
      const venusPosition = new THREE.Vector3(5.8, 0, 0); // 约5.8单位距离的简单位置
      this.position.copy(venusPosition);
      if (this.mesh) {
        this.mesh.position.copy(venusPosition);
      }
      
      console.log('♀️ 金星已初始化，具有浓密大气层和云层');
      console.log(`♀️ 金星位置：(${this.position.x}, ${this.position.y}, ${this.position.z})`);
      console.log(`♀️ 金星网格对象：${this.mesh ? '已创建' : '未创建'}`);
      if (this.mesh) {
        console.log(`♀️ 金星网格位置：(${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z})`);
        console.log(`♀️ 金星材质：${this.mesh.material ? this.mesh.material.type : '未设置'}`);
        console.log(`♀️ 金星材质颜色：${this.mesh.material ? '0x' + this.mesh.material.color.getHex().toString(16) : '未设置'}`);
        console.log(`♀️ 金星可见性：${this.mesh.visible}`);
        console.log(`♀️ 金星父对象：${this.mesh.parent ? this.mesh.parent.name || '未命名对象' : '无父对象'}`);
      }

      // 调试监控已暂时禁用，以减少控制台输出
      // this.startRenderingDebugMonitor();
    } catch (error) {
      console.warn('❌ 金星视觉效果初始化失败:', error);
    }
  }

  /**
   * 启动渲染和光照调试监控器
   */
  startRenderingDebugMonitor() {
    setInterval(() => {
      if (this.mesh) {
        console.log('💡 金星渲染和光照检查:');
        
        // 获取场景中的光源信息（简化版，避免重复）
        const scene = this.mesh.parent;
        if (scene) {
          let lightCount = 0;
          let sunLightIntensity = 0;
          scene.traverse((child) => {
            if (child.isLight) {
              lightCount++;
              if (child.type === 'PointLight' && child.position.length() < 1) {
                sunLightIntensity = child.intensity;
                const lightToVenus = child.position.distanceTo(this.mesh.position);
                console.log(`💡 - 太阳光源强度: ${sunLightIntensity}`);
                console.log(`💡 - 太阳到金星距离: ${lightToVenus.toFixed(2)}`);
              }
            }
          });
          console.log(`💡 - 场景光源总数: ${lightCount}`);
        }
        
        // 检查几何体和渲染状态
        console.log(`🎨 - 网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
        console.log(`🎨 - 网格可见: ${this.mesh.visible}`);
        console.log(`🎨 - 材质接受光照: ${this.mesh.material.type !== 'MeshBasicMaterial'}`);
        
        console.log('💡 ==================');
      }
    }, 8000); // 每8秒检查一次，错开时间
  }

  async loadVenusTextures() {
    const textureLoader = new THREE.TextureLoader();

    // 尝试加载主要纹理
    try {
      this.surfaceTexture = await new Promise((resolve, reject) => {
        textureLoader.load(
          TEXTURE_PATHS.VENUS.surface,
          (texture) => {
            console.log(`♀️ 金星表面纹理加载成功: ${TEXTURE_PATHS.VENUS.surface}`);
            console.log(`♀️ 纹理尺寸: ${texture.image.width}x${texture.image.height}`);
            resolve(texture);
          },
          (progress) => {
            console.log(`♀️ 金星纹理加载进度: ${Math.round(progress.loaded / progress.total * 100)}%`);
          },
          (error) => {
            console.error('❌ 金星表面纹理加载失败:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.warn('❌ 金星表面纹理加载失败，将使用占位符:', error);
      this.surfaceTexture = null;
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
    // 创建金星材质，确保总是有可用的材质
    const materialOptions = {
      emissive: 0x663300,
      emissiveIntensity: 0.1,
      // 确保至少有一个基础颜色
      color: this.color
    };

    // 优先使用专用的表面纹理
    if (this.surfaceTexture) {
      materialOptions.map = this.surfaceTexture;
      console.log('♀️ 金星表面纹理已应用');
      console.log('♀️ 纹理对象:', this.surfaceTexture);
    } else if (this.texture) {
      materialOptions.map = this.texture;
      console.log('♀️ 金星使用基础纹理');
    } else {
      console.log('♀️ 金星使用纯色材质 (颜色: 0x' + this.color.toString(16) + ')');
      // 确保颜色是明亮的，便于调试
      materialOptions.color = 0xff8800; // 临时使用橙色便于识别
      console.log('♀️ 临时使用橙色便于调试');
    }

    // 使用MeshBasicMaterial确保可见性，暂时跳过光照问题
    this.material = new THREE.MeshBasicMaterial(materialOptions);
    console.log('♀️ 金星材质创建完成 (MeshBasicMaterial)');

    // 更新网格材质
    if (this.mesh) {
      this.mesh.material = this.material;
      console.log('♀️ 金星材质已更新到网格');
      
      // 确保mesh可见并且材质正确设置
      this.mesh.visible = true;
      console.log('♀️ 金星网格可见性已确认');
    } else {
      console.warn('❌ 金星网格对象不存在，无法应用材质');
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
    // 直接计算轨道位置，确保金星严格位于轨道上
    // 不再依赖AstronomyUtils的计算结果

    // 参数
    const earthOrbitRadius = 8.0;
    const venusOrbitRatio = 0.723; // 金星轨道比例
    const venusOrbitRadius = earthOrbitRadius * venusOrbitRatio; // 5.784

    // 计算金星在轨道上的角度
    // 从J2000.0开始计算天数
    const daysSinceJ2000 = julianDate - 2451545.0;

    // 金星公转周期224.701天，角速度约0.0279弧度/天
    // 角度 = (天数 * 角速度) % (2π)
    const angularVelocity = (2 * Math.PI) / 224.701;
    const angle = (daysSinceJ2000 * angularVelocity) % (2 * Math.PI);

    // 计算轨道位置
    const x = venusOrbitRadius * Math.cos(angle);
    const z = venusOrbitRadius * Math.sin(angle);
    const position = new THREE.Vector3(x, 0, z);

    // 日志输出
    console.log('♀️ 金星直接计算位置:');
    console.log(`♀️ - 公转角度: ${(angle * 180 / Math.PI).toFixed(2)}°`);
    console.log(`♀️ - 轨道半径: ${venusOrbitRadius.toFixed(2)} 单位`);
    console.log(`♀️ - 计算位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);

    // 验证距离
    const distance = Math.sqrt(position.x * position.x + position.z * position.z);
    console.log(`♀️ - 实际距离: ${distance.toFixed(4)} (目标: ${venusOrbitRadius.toFixed(4)})`);

    return position;
  }

  updatePosition(julianDate) {
    super.updatePosition(julianDate);
    console.log(`♀️ 金星位置已更新 [JD=${julianDate}]: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`);
    if (this.mesh) {
      console.log(`♀️ 金星网格位置: (${this.mesh.position.x.toFixed(2)}, ${this.mesh.position.y.toFixed(2)}, ${this.mesh.position.z.toFixed(2)})`);
    } else {
      console.log('❌ 金星网格对象不存在!');
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
