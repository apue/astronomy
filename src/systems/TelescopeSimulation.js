/**
 * 望远镜观测模拟系统
 * 提供真实的18世纪望远镜观测体验
 * 包括视差效果、大气折射、观测误差等
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { astronomyCalculator } from '../utils/AstronomyCalculator.js';

export class TelescopeSimulation {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.camera = null;
    this.telescopeFOV = 0.5; // 0.5 degrees
    this.magnification = 50;
    this.atmosphericEffects = true;
    this.observationError = 0.1; // degrees

    this.currentView = {
      target: null,
      position: { lat: 0, lon: 0, elevation: 0 },
      time: new Date(),
      telescope: null
    };

    this.telescopePresets = {
      '18th_century_refractor': {
        name: '18世纪折射望远镜',
        type: 'refractor',
        aperture: 0.075, // 75mm
        focalLength: 1.2, // 1.2m
        magnification: 50,
        fieldOfView: 0.8,
        chromaticAberration: 0.001,
        description: '典型的18世纪天文折射望远镜'
      },
      'quadrant_telescope': {
        name: '象限仪望远镜',
        type: 'quadrant',
        aperture: 0.05,
        focalLength: 1.5,
        magnification: 30,
        fieldOfView: 1.2,
        chromaticAberration: 0.002,
        description: '用于精确测量的象限仪望远镜'
      },
      'achromatic_refractor': {
        name: '消色差折射望远镜',
        type: 'achromatic',
        aperture: 0.09,
        focalLength: 1.8,
        magnification: 60,
        fieldOfView: 0.6,
        chromaticAberration: 0.0005,
        description: 'Dollond消色差望远镜'
      }
    };

    this.atmosphericConditions = {
      clear: {
        name: '晴朗',
        turbulence: 0.001,
        refraction: 0.002,
        visibility: 1.0
      },
      hazy: {
        name: '薄雾',
        turbulence: 0.002,
        refraction: 0.003,
        visibility: 0.8
      },
      cloudy: {
        name: '多云',
        turbulence: 0.005,
        refraction: 0.008,
        visibility: 0.5
      }
    };

    this.initialize();
  }

  initialize() {
    this.createTelescopeCamera();
    this.setupEventListeners();
    this.createObservationInterface();
  }

  /**
   * 创建望远镜相机
   */
  createTelescopeCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.telescopeFOV * 180 / Math.PI,
      1,
      0.1,
      1000
    );

    this.camera.position.set(0, 0, 0);
    this.camera.name = 'telescope-camera';
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.updateTelescopeView(data.time);
    });

    eventSystem.subscribe('observationPointSelected', (data) => {
      this.setObservationPosition(data.point);
    });

    eventSystem.subscribe('telescopeChanged', (data) => {
      this.changeTelescope(data.telescope);
    });
  }

  /**
   * 创建观测界面
   */
  createObservationInterface() {
    this.reticle = this.createReticle();
    this.measurementMarks = [];
    this.fieldOverlay = this.createFieldOverlay();
  }

  /**
   * 创建望远镜十字线
   */
  createReticle() {
    const reticleGroup = new THREE.Group();

    // 水平线
    const horizontalLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, 0, 0),
        new THREE.Vector3(0.5, 0, 0)
      ]),
      new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.7, transparent: true })
    );

    // 垂直线
    const verticalLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.5, 0),
        new THREE.Vector3(0, 0.5, 0)
      ]),
      new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.7, transparent: true })
    );

    // 刻度标记
    for (let i = -4; i <= 4; i++) {
      if (i !== 0) {
        const mark = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i * 0.1, -0.02, 0),
            new THREE.Vector3(i * 0.1, 0.02, 0)
          ]),
          new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true })
        );
        reticleGroup.add(mark);
      }
    }

    reticleGroup.add(horizontalLine, verticalLine);
    return reticleGroup;
  }

  /**
   * 创建视场覆盖层
   */
  createFieldOverlay() {
    const geometry = new THREE.RingGeometry(0.48, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * 设置观测位置
   */
  setObservationPosition(observationPoint) {
    this.currentView.position = {
      lat: observationPoint.location.latitude,
      lon: observationPoint.location.longitude,
      elevation: observationPoint.location.elevation
    };

    this.currentView.telescope = observationPoint.telescope || '18th_century_refractor';

    eventSystem.emit('telescopePositionChanged', {
      position: this.currentView.position,
      telescope: this.currentView.telescope
    });
  }

  /**
   * 切换望远镜
   */
  changeTelescope(telescopeType) {
    const telescope = this.telescopePresets[telescopeType];
    if (telescope) {
      this.telescopeFOV = telescope.fieldOfView;
      this.magnification = telescope.magnification;

      this.camera.fov = this.telescopeFOV * 180 / Math.PI;
      this.camera.updateProjectionMatrix();

      eventSystem.emit('telescopeChanged', { telescope });
    }
  }

  /**
   * 更新望远镜视图
   */
  updateTelescopeView(currentTime) {
    this.currentView.time = currentTime;

    // 计算天体位置
    const earthPos = astronomyCalculator.getCelestialPosition('earth', currentTime);
    const venusPos = astronomyCalculator.getCelestialPosition('venus', currentTime);
    const sunPos = astronomyCalculator.getCelestialPosition('sun', currentTime);

    // 计算视差偏移
    const parallaxOffset = this.calculateParallaxOffset(
      earthPos,
      venusPos,
      sunPos
    );

    // 应用大气折射
    const refractionOffset = this.calculateAtmosphericRefraction(currentTime);

    // 综合偏移
    const totalOffset = new THREE.Vector2(
      parallaxOffset.x + refractionOffset.x,
      parallaxOffset.y + refractionOffset.y
    );

    // 应用观测误差
    const observationError = this.generateObservationError();

    this.currentView.offset = {
      parallax: parallaxOffset,
      refraction: refractionOffset,
      error: observationError,
      total: totalOffset
    };

    eventSystem.emit('telescopeViewUpdated', {
      positions: { earth: earthPos, venus: venusPos, sun: sunPos },
      offsets: this.currentView.offset,
      time: currentTime
    });
  }

  /**
   * 计算视差偏移
   */
  calculateParallaxOffset(earthPos, venusPos, sunPos) {
    if (!this.currentView.position) return new THREE.Vector2(0, 0);

    // 计算观测者位置对天空的影响
    const observerLat = this.currentView.position.lat * (Math.PI / 180);
    const observerLon = this.currentView.position.lon * (Math.PI / 180);

    // 简化的视差计算
    const parallaxFactor = 8.794 / 206265; // 太阳视差角

    const deltaX = Math.cos(observerLat) * Math.cos(observerLon) * parallaxFactor;
    const deltaY = Math.cos(observerLat) * Math.sin(observerLon) * parallaxFactor;

    return new THREE.Vector2(deltaX, deltaY);
  }

  /**
   * 计算大气折射
   */
  calculateAtmosphericRefraction(currentTime) {
    // 基于观测者位置和时间的折射计算
    if (!this.currentView.position) return new THREE.Vector2(0, 0);

    const hour = currentTime.getUTCHours();
    const zenithDistance = Math.abs((hour - 12) / 12) * 60; // 简化模型

    // 大气折射公式(简化)
    const refraction = 58.294 * Math.tan(zenithDistance * Math.PI / 180);

    return new THREE.Vector2(
      Math.random() * refraction * 0.0001,
      Math.random() * refraction * 0.0001
    );
  }

  /**
   * 生成观测误差
   */
  generateObservationError() {
    // 基于18世纪观测技术的随机误差
    const errorRange = this.observationError / 60; // 转换为度
    return new THREE.Vector2(
      (Math.random() - 0.5) * errorRange * 2,
      (Math.random() - 0.5) * errorRange * 2
    );
  }

  /**
   * 获取望远镜参数
   */
  getTelescopeParameters() {
    const telescopeType = this.currentView.telescope || '18th_century_refractor';
    return this.telescopePresets[telescopeType];
  }

  /**
   * 创建测量标记
   */
  createMeasurementMark(position, label) {
    const mark = new THREE.Group();

    // 十字标记
    const crossGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.02, 0, 0), new THREE.Vector3(0.02, 0, 0),
      new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0, 0.02, 0)
    ]);
    const crossMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const cross = new THREE.LineSegments(crossGeometry, crossMaterial);

    mark.add(cross);
    mark.position.copy(position);
    mark.userData = { label, type: 'measurement' };

    this.measurementMarks.push(mark);
    return mark;
  }

  /**
   * 清除所有测量标记
   */
  clearMeasurementMarks() {
    this.measurementMarks.forEach(mark => {
      if (mark.parent) {
        mark.parent.remove(mark);
      }
    });
    this.measurementMarks = [];
  }

  /**
   * 获取当前观测数据
   */
  getObservationData() {
    return {
      position: this.currentView.position,
      telescope: this.getTelescopeParameters(),
      time: this.currentView.time,
      offsets: this.currentView.offset,
      atmosphericConditions: 'clear', // 可配置
      measurementMarks: this.measurementMarks.map(mark => ({
        position: mark.position,
        label: mark.userData.label
      }))
    };
  }

  /**
   * 设置大气条件
   */
  setAtmosphericConditions(condition) {
    const conditions = this.atmosphericConditions[condition];
    if (conditions) {
      this.observationError = conditions.turbulation * 10;
      eventSystem.emit('atmosphericConditionsChanged', { conditions });
    }
  }

  /**
   * 模拟观测记录
   */
  simulateObservation(contactTime) {
    const error = this.generateObservationError();
    const atmosphericDelay = this.calculateAtmosphericRefraction(this.currentView.time);

    return {
      observedTime: new Date(contactTime.getTime() +
        (error.x + atmosphericDelay.x) * 3600000),
      actualTime: contactTime,
      error,
      atmosphericDelay,
      telescope: this.getTelescopeParameters()
    };
  }

  /**
   * 创建观测报告
   */
  createObservationReport() {
    const data = this.getObservationData();

    return {
      observer: data.position ? `${data.position.lat}°, ${data.position.lon}°` : 'Unknown',
      telescope: data.telescope.name,
      date: data.time.toISOString(),
      weather: 'Clear',
      measurements: data.measurementMarks,
      notes: '18世纪观测条件模拟'
    };
  }

  /**
   * 重置望远镜
   */
  reset() {
    this.clearMeasurementMarks();
    this.changeTelescope('18th_century_refractor');
    this.setAtmosphericConditions('clear');

    eventSystem.emit('telescopeReset');
  }
}

// 导出类（已在上面的类定义中导出）
