/**
 * 场景管理器 - 负责管理整个3D场景
 * 包括渲染器、相机、光照、天体对象等核心组件
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { eventSystem, EventTypes } from './EventSystem.js';
import { Sun, Earth, Venus } from '../objects/index.js';

export class SceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.celestialBodies = new Map();
    this.animationId = null;
    this.clock = new THREE.Clock();

    // 性能监控
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.currentFPS = 0;

    // 时间相关
    this.lastTimeUpdate = 0;
    this.timeUpdateInterval = 1000; // 1秒更新一次

    // 天体管理
    this.celestialBodies = new Map();
    this.orbitalPaths = new Map();

    // 相机状态
    this.cameraStates = {
      overview: { position: [0, 50, 100], target: [0, 0, 0] },
      earth: { position: [15, 5, 15], target: [0, 0, 0] },
      telescope: { position: [2, 0, 2], target: [0, 0, 0] }
    };

    this.setupEventListeners();
  }

  async initialize() {
    try {
      this.setupRenderer();
      this.setupCamera();
      this.setupControls();
      this.setupLighting();
      this.setupScene();
      this.handleResize();

      // 创建基础场景元素（轨道线等）
      await this.createSceneElements();

      console.log('SceneManager initialized successfully');
      return this;
    } catch (error) {
      console.error('Failed to initialize SceneManager:', error);
      throw error;
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 启用阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 设置背景为星空色调
    this.renderer.setClearColor(0x000011, 1.0);

    console.log('Renderer setup complete');
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // 设置初始相机位置
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 0, 0);

    console.log('Camera setup complete');
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);

    // 配置控制参数
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;

    // 设置控制速度
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;

    console.log('Controls setup complete');
  }

  setupLighting() {
    // 环境光 - 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);

    // 主光源 - 模拟太阳光
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;

    // 配置阴影
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;

    this.scene.add(sunLight);

    // 添加辅助方向光，模拟反射光
    const fillLight = new THREE.DirectionalLight(0x404080, 0.3);
    fillLight.position.set(-10, 10, 5);
    this.scene.add(fillLight);

    console.log('Lighting setup complete');
  }

  setupEventListeners() {
    // 监听时间变化
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.updateCelestialPositions(data.time);
    });

    // 监听重置相机视角事件
    eventSystem.subscribe('resetCameraView', () => {
      this.resetCamera();
    });

    // 监听聚焦天体事件
    eventSystem.subscribe('focusCelestialBody', (data) => {
      this.focusOnCelestialBody(data.target);
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.handleResize());
  }

  setupScene() {
    // 设置雾效果，增加深度感
    this.scene.fog = new THREE.Fog(0x000011, 50, 200);

    // 添加星空背景
    this.createStarField();

    console.log('Scene setup complete');
  }

  createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: false,
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(starField);
  }

  async createSceneElements() {
    try {
      console.log('🎬 === CREATING SCENE ELEMENTS ===');
      
      // 只创建轨道线等场景元素，天体由main.js创建
      console.log('🪐 Creating orbit lines...');
      this.createOrbitLines();
      console.log('🪐 Orbit lines COMPLETED ✅');

      console.log('🎬 === SCENE ELEMENTS CREATION COMPLETED ===');
      console.log(`📊 Current scene stats: ${this.scene.children.length} objects in scene`);
    } catch (error) {
      console.error('❌ Failed to create scene elements:', error);
      throw error;
    }
  }

  createOrbitLines() {
    console.log('🪐 Creating orbit lines...');
    
    // 地球轨道
    console.log('🌍 Creating Earth orbit (blue ring)...');
    const earthOrbitRadius = 8.0; // 基于1 AU = 8 units
    const earthOrbitGeometry = new THREE.RingGeometry(earthOrbitRadius - 0.1, earthOrbitRadius + 0.1, 64);
    const earthOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x6b93d6, // 蓝色
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
    earthOrbit.rotation.x = Math.PI / 2;
    earthOrbit.name = 'EarthOrbit';
    this.scene.add(earthOrbit);
    console.log(`🌍 Earth orbit: radius=${earthOrbitRadius.toFixed(1)} units (1 AU)`);

    // 金星轨道
    console.log('♀️ Creating Venus orbit (yellow ring)...');
    const venusOrbitRadius = 8.0 * 0.723; // 金星轨道半径 = 0.723 AU
    const venusOrbitGeometry = new THREE.RingGeometry(venusOrbitRadius - 0.1, venusOrbitRadius + 0.1, 64);
    const venusOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc649, // 黄色
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
    venusOrbit.rotation.x = Math.PI / 2;
    venusOrbit.name = 'VenusOrbit';
    this.scene.add(venusOrbit);
    console.log(`♀️ Venus orbit: radius=${venusOrbitRadius.toFixed(1)} units (0.723 AU)`);
    
    console.log(`🪐 Orbit lines created. Total scene objects: ${this.scene.children.length}`);
  }

  addCelestialBody(body) {
    if (!body.mesh) {
      console.warn('Cannot add celestial body without mesh');
      return;
    }

    console.log(`🌍 添加天体: ${body.name}`);
    console.log(`🌍 天体网格:`, body.mesh);
    console.log(`🌍 天体材质:`, body.mesh.material);
    console.log(`🌍 天体位置:`, body.mesh.position);
    console.log(`🌍 天体子对象数量:`, body.mesh.children.length);
    console.log(`🌍 天体可见性:`, body.mesh.visible);
    console.log(`🌍 天体缩放:`, body.mesh.scale);

    this.celestialBodies.set(body.name, body);
    this.scene.add(body.mesh);

    console.log(`✅ 已添加天体: ${body.name} 到场景`);
    console.log(`🌍 场景子对象数量:`, this.scene.children.length);
    console.log(`🌍 场景中的天体:`, Array.from(this.celestialBodies.keys()).join(', '));

    // 检查天体是否真的添加到场景中
    setTimeout(() => {
      const bodyInScene = this.scene.getObjectByName(body.name);
      console.log(`🔍 检查天体 ${body.name} 是否在场景中: ${bodyInScene ? '是' : '否'}`);
      if (bodyInScene) {
        console.log(`🔍 场景中的 ${body.name} 可见性: ${bodyInScene.visible}`);
        console.log(`🔍 场景中的 ${body.name} 位置: (${bodyInScene.position.x}, ${bodyInScene.position.y}, ${bodyInScene.position.z})`);
      }
    }, 100);
  }

  /**
   * 更新所有天体位置
   * @param {Date} time - 当前时间
   */
  updateCelestialPositions(time) {
    const julianDate = this.dateToJulian(time);
    console.log(`🕰️ 更新天体位置，儒略日: ${julianDate}`);

    for (const [name, body] of this.celestialBodies) {
      console.log(`🔄 更新天体: ${name}`);
      if (body.updatePosition) {
        body.updatePosition(julianDate);
        console.log(`🔄 ${name} 位置已更新: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)})`);
      }
    }

    // 更新轨道线
    this.updateOrbitalPaths(julianDate);
  }

  /**
   * 添加轨道线
   * @param {string} name - 轨道名称
   * @param {Object} orbitElements - 轨道参数
   */
  addOrbitalPath(name, orbitElements) {
    const points = this.generateOrbitalPoints(orbitElements, 100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });

    const line = new THREE.Line(geometry, material);
    line.name = `${name}_orbit`;

    this.orbitalPaths.set(name, line);
    this.scene.add(line);
  }

  /**
   * 生成轨道点
   * @param {Object} orbitElements - 轨道参数
   * @param {number} segments - 分段数
   * @returns {Array} 轨道点数组
   */
  generateOrbitalPoints(orbitElements, segments = 64) {
    const points = [];
    const { semiMajorAxis, eccentricity, inclination, argumentOfPeriapsis } = orbitElements;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));

      const x = radius * Math.cos(angle + argumentOfPeriapsis);
      const y = radius * Math.sin(angle + argumentOfPeriapsis) * Math.sin(inclination);
      const z = radius * Math.sin(angle + argumentOfPeriapsis) * Math.cos(inclination);

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }

  /**
   * 更新轨道线
   * @param {number} julianDate - 儒略日
   */
  updateOrbitalPaths(_julianDate) {
    // 轨道线通常是静态的，这里可以添加动态效果
  }

  /**
   * 日期转儒略日
   * @param {Date} date - 日期
   * @returns {number} 儒略日
   */
  dateToJulian(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

    return jd;
  }

  removeCelestialBody(name) {
    const body = this.celestialBodies.get(name);
    if (body && body.mesh) {
      this.scene.remove(body.mesh);
      this.celestialBodies.delete(name);
      console.log(`Removed celestial body: ${name}`);
    }
  }

  startRenderLoop() {
    this.render();
  }

  render() {
    const deltaTime = this.clock.getDelta();

    // 更新控制器
    this.controls.update();

    // 简单的动画：让天体旋转
    this.animateTestObjects(deltaTime);

    // 更新FPS计数
    this.updateFPS();


    // 渲染场景
    this.renderer.render(this.scene, this.camera);

    // 继续动画循环
    this.animationId = requestAnimationFrame(() => this.render());
  }

  animateTestObjects(deltaTime) {
    // 注释：这个方法是临时动画测试，应该删除或修改它以不覆盖天体的真实位置
    console.log(`⏱️ 动画帧调用，deltaTime=${deltaTime}`);
    
    const earth = this.celestialBodies.get('Earth');
    const venus = this.celestialBodies.get('Venus');
    const sun = this.celestialBodies.get('Sun');

    console.log(`🔎 动画中找到天体: 地球=${!!earth}, 金星=${!!venus}, 太阳=${!!sun}`);

    // 只更新天体的自转，不覆盖位置
    if (earth?.mesh) {
      // 只保留自转动画，不改变位置
      earth.mesh.rotation.y += deltaTime * 0.5;
      console.log(`🌍 地球只更新自转: ${earth.mesh.rotation.y.toFixed(2)}`);
      console.log(`🌍 地球当前位置: (${earth.mesh.position.x.toFixed(2)}, ${earth.mesh.position.y.toFixed(2)}, ${earth.mesh.position.z.toFixed(2)})`);
    }

    if (venus?.mesh) {
      // 只保留自转动画，不改变位置
      venus.mesh.rotation.y += deltaTime * 0.3;
      console.log(`♀️ 金星只更新自转: ${venus.mesh.rotation.y.toFixed(2)}`);
      console.log(`♀️ 金星当前位置: (${venus.mesh.position.x.toFixed(2)}, ${venus.mesh.position.y.toFixed(2)}, ${venus.mesh.position.z.toFixed(2)})`);
    }

    if (sun?.mesh) {
      sun.mesh.rotation.y += deltaTime * 0.1;
      console.log(`☀️ 太阳旋转更新: ${sun.mesh.rotation.y.toFixed(2)}`);
    }
  }

  updateFPS() {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.currentFPS = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastFPSUpdate)
      );
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;

      // 在开发模式下显示FPS
      if (process.env.NODE_ENV === 'development') {
        console.log(`FPS: ${this.currentFPS}`);
      }
    }
  }

  handleResize() {
    window.addEventListener('resize', () => {
      // 更新相机宽高比
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      // 更新渲染器尺寸
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      console.log('Scene resized to:', window.innerWidth, 'x', window.innerHeight);
    });
  }

  // 获取场景中的对象
  getObjectByName(name) {
    return this.scene.getObjectByName(name);
  }

  // 设置相机位置
  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
    this.controls.update();
  }

  // 重置相机到默认位置
  resetCamera() {
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  // 聚焦到指定天体
  focusOnCelestialBody(targetName) {
    const body = this.celestialBodies.get(targetName);
    if (body && body.mesh) {
      const position = body.mesh.position;
      let distance = 10; // 默认距离

      // 根据天体大小调整距离
      if (targetName === 'sun') {
        distance = 15;
      } else if (targetName === 'earth') {
        distance = 8;
      } else if (targetName === 'venus') {
        distance = 8;
      }

      // 设置相机位置
      this.camera.position.set(
        position.x + distance,
        position.y + distance * 0.3,
        position.z + distance
      );
      
      // 让相机看向天体
      this.controls.target.copy(position);
      this.controls.update();

      console.log(`Camera focused on ${targetName}`);
    } else {
      console.warn(`Celestial body '${targetName}' not found`);
    }
  }

  // 获取性能信息
  getPerformanceInfo() {
    return {
      fps: this.currentFPS,
      renderCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }

  /**
   * 更新纹理质量
   * @param {string} quality - 质量等级 ('low', 'medium', 'high')
   */
  updateTextureQuality(quality) {
    const qualityMap = {
      low: 512,
      medium: 1024,
      high: 2048
    };

    const maxResolution = qualityMap[quality] || 1024;

    console.log(`Updating texture quality to ${quality} (${maxResolution}px)`);

    // 遍历所有天体并更新纹理质量
    this.celestialBodies.forEach(body => {
      if (body.mesh && body.mesh.material) {
        const material = body.mesh.material;

        // 更新材质纹理
        if (material.map) {
          material.map.needsUpdate = true;
        }

        // 可以在这里添加更复杂的纹理质量调整逻辑
        // 例如：动态加载不同分辨率的纹理
      }
    });

    // 更新渲染器的纹理质量设置
    if (this.renderer) {
      this.renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    }
  }

  // 清理资源
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
    }

    // 清理控制器
    if (this.controls) {
      this.controls.dispose();
    }

    // 清理场景中的几何体和材质
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    console.log('SceneManager disposed');
  }
}
