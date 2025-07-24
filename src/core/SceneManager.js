/**
 * 场景管理器 - 负责管理整个3D场景
 * 包括渲染器、相机、光照、天体对象等核心组件
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class SceneManager {
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
  }
  
  async initialize() {
    try {
      this.setupRenderer();
      this.setupCamera();
      this.setupControls();
      this.setupLighting();
      this.setupScene();
      this.handleResize();
      
      // 创建一个简单的测试场景
      await this.createTestScene();
      
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
  
  async createTestScene() {
    // 创建一个测试用的太阳模型
    const sunGeometry = new THREE.SphereGeometry(2, 32, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      emissive: 0xfdb813,
      emissiveIntensity: 0.3,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'sun';
    this.scene.add(sun);
    
    // 创建一个测试用的地球模型
    const earthGeometry = new THREE.SphereGeometry(0.5, 32, 16);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x6b93d6,
      shininess: 10,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(8, 0, 0);
    earth.name = 'earth';
    earth.castShadow = true;
    earth.receiveShadow = true;
    this.scene.add(earth);
    
    // 创建一个测试用的金星模型
    const venusGeometry = new THREE.SphereGeometry(0.48, 32, 16);
    const venusMaterial = new THREE.MeshPhongMaterial({
      color: 0xffc649,
      shininess: 5,
    });
    const venus = new THREE.Mesh(venusGeometry, venusMaterial);
    venus.position.set(5.8, 0, 0);
    venus.name = 'venus';
    venus.castShadow = true;
    venus.receiveShadow = true;
    this.scene.add(venus);
    
    // 创建轨道线
    this.createOrbitLines();
    
    console.log('Test scene created with Sun, Earth, and Venus');
  }
  
  createOrbitLines() {
    // 地球轨道
    const earthOrbitGeometry = new THREE.RingGeometry(7.9, 8.1, 64);
    const earthOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x6b93d6,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
    earthOrbit.rotation.x = Math.PI / 2;
    this.scene.add(earthOrbit);
    
    // 金星轨道
    const venusOrbitGeometry = new THREE.RingGeometry(5.7, 5.9, 64);
    const venusOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc649,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
    venusOrbit.rotation.x = Math.PI / 2;
    this.scene.add(venusOrbit);
  }
  
  addCelestialBody(body) {
    if (!body.mesh) {
      console.warn('Cannot add celestial body without mesh');
      return;
    }
    
    this.celestialBodies.set(body.name, body);
    this.scene.add(body.mesh);
    
    console.log(`Added celestial body: ${body.name}`);
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
    const earth = this.scene.getObjectByName('earth');
    const venus = this.scene.getObjectByName('venus');
    const sun = this.scene.getObjectByName('sun');
    
    if (earth) {
      // 地球绕太阳公转
      earth.rotation.y += deltaTime * 0.5; // 自转
      const earthAngle = Date.now() * 0.0001;
      earth.position.x = Math.cos(earthAngle) * 8;
      earth.position.z = Math.sin(earthAngle) * 8;
    }
    
    if (venus) {
      // 金星绕太阳公转（更快）
      venus.rotation.y += deltaTime * 0.8;
      const venusAngle = Date.now() * 0.00016;
      venus.position.x = Math.cos(venusAngle) * 5.8;
      venus.position.z = Math.sin(venusAngle) * 5.8;
    }
    
    if (sun) {
      // 太阳缓慢自转
      sun.rotation.y += deltaTime * 0.1;
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