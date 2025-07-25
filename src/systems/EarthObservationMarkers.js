/**
 * 地球观测点标记系统
 * 在地球表面显示历史观测点的可视化标记
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { historicalObservationSystem } from './HistoricalObservationSystem.js';

export class EarthObservationMarkers {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.earthBody = null;
    this.markers = new Map();
    this.markerGroup = new THREE.Group();
    this.isVisible = true;
    this.currentYear = 1761;

    // 标记样式配置
    this.markerConfig = {
      size: 0.1,
      height: 0.3,
      color: 0xffd700,
      emissiveIntensity: 0.5,
      opacity: 0.8
    };

    this.initialize();
  }

  async initialize() {
    console.log('🗺️ Initializing Earth Observation Markers...');

    this.setupEventListeners();

    // 等待地球被添加到场景
    this.findEarthBody();

    if (this.earthBody) {
      this.createMarkers();
    }

    console.log('✅ Earth Observation Markers initialized');
  }

  setupEventListeners() {
    // 监听年份变化
    eventSystem.subscribe('observationYearChanged', (data) => {
      this.currentYear = data.year;
      this.updateMarkersVisibility();
    });

    // 监听观测点选择
    eventSystem.subscribe(EventTypes.OBSERVATION_POINT_SELECTED, (data) => {
      this.highlightMarker(data.point.id);
    });

    // 监听地球点击事件
    eventSystem.subscribe('earthClicked', () => {
      this.pulseAllMarkers();
    });
  }

  /**
   * 查找地球天体
   */
  findEarthBody() {
    if (this.sceneManager && this.sceneManager.celestialBodies) {
      this.earthBody = this.sceneManager.celestialBodies.get('Earth') ||
                      this.sceneManager.celestialBodies.get('earth');

      if (this.earthBody && this.earthBody.mesh) {
        // 将标记组添加为地球的子对象，这样它们会跟随地球旋转
        this.earthBody.mesh.add(this.markerGroup);
        console.log('🌍 Earth body found, markers attached');
      } else {
        console.warn('🌍 Earth body not found, will retry...');
        // 如果地球还没有加载，稍后重试
        setTimeout(() => this.findEarthBody(), 1000);
      }
    }
  }

  /**
   * 创建所有观测点标记
   */
  createMarkers() {
    console.log('🎯 Creating observation point markers...');

    // 获取所有年份的观测点
    const points1761 = historicalObservationSystem.getHistoricalObservationPoints(1761);
    const points1769 = historicalObservationSystem.getHistoricalObservationPoints(1769);

    // 创建1761年标记
    points1761.forEach(point => {
      const marker = this.createMarker(point, 1761);
      this.markers.set(`${point.id}_1761`, { marker, point, year: 1761 });
    });

    // 创建1769年标记
    points1769.forEach(point => {
      const marker = this.createMarker(point, 1769);
      this.markers.set(`${point.id}_1769`, { marker, point, year: 1769 });
    });

    // 更新可见性
    this.updateMarkersVisibility();

    console.log(`📍 Created ${this.markers.size} observation markers`);
  }

  /**
   * 创建单个观测点标记
   */
  createMarker(point, year) {
    const markerGroup = new THREE.Group();

    // 计算地球表面位置
    const position = this.latLonToCartesian(
      point.location.latitude,
      point.location.longitude,
      this.earthBody.radius + 0.02 // 稍微高于地表
    );

    // 创建标记几何体（小圆锥或圆柱）
    const markerGeometry = new THREE.ConeGeometry(
      this.markerConfig.size,
      this.markerConfig.height,
      8
    );

    // 创建标记材质
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: year === 1761 ? 0xff6b6b : 0x4ecdc4, // 1761年红色，1769年青色
      transparent: true,
      opacity: this.markerConfig.opacity,
      emissive: year === 1761 ? 0x330000 : 0x003333,
      emissiveIntensity: this.markerConfig.emissiveIntensity
    });

    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    // 设置位置和朝向
    markerMesh.position.copy(position);
    markerMesh.lookAt(position.clone().multiplyScalar(2)); // 指向地心外侧

    // 创建光晕效果
    const glowGeometry = new THREE.SphereGeometry(this.markerConfig.size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: year === 1761 ? 0xff6b6b : 0x4ecdc4,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(position);

    // 创建标签（可选）
    const labelSprite = this.createMarkerLabel(point.name);
    labelSprite.position.copy(position);
    labelSprite.position.multiplyScalar(1.1); // 稍微远离地表

    // 组合所有元素
    markerGroup.add(markerMesh);
    markerGroup.add(glowMesh);
    markerGroup.add(labelSprite);

    // 添加用户数据
    markerGroup.userData = {
      pointId: point.id,
      year,
      point,
      type: 'observationMarker'
    };

    // 添加到标记组
    this.markerGroup.add(markerGroup);

    return markerGroup;
  }

  /**
   * 创建标记标签
   */
  createMarkerLabel(text) {
    // 创建canvas纹理
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');

    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制文字
    context.fillStyle = '#ffffff';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // 创建纹理和材质
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.2, 1);
    sprite.visible = false; // 默认隐藏标签，只在悬停时显示

    return sprite;
  }

  /**
   * 将经纬度转换为3D坐标
   */
  latLonToCartesian(latitude, longitude, radius) {
    const lat = (latitude * Math.PI) / 180;
    const lon = (longitude * Math.PI) / 180;

    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * 更新标记可见性
   */
  updateMarkersVisibility() {
    for (const [markerId, markerData] of this.markers) {
      const shouldBeVisible = markerData.year === this.currentYear;
      markerData.marker.visible = shouldBeVisible && this.isVisible;
    }

    console.log(`📍 Updated markers visibility for year ${this.currentYear}`);
  }

  /**
   * 高亮指定标记
   */
  highlightMarker(pointId) {
    // 重置所有标记
    this.resetAllMarkers();

    // 高亮选中的标记
    const markerId = `${pointId}_${this.currentYear}`;
    const markerData = this.markers.get(markerId);

    if (markerData) {
      const marker = markerData.marker;

      // 增加大小和亮度
      marker.scale.set(1.5, 1.5, 1.5);

      // 改变颜色为金色
      marker.children.forEach(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0xffd700);
          child.material.emissiveIntensity = 0.8;
        }
      });

      console.log(`📍 Highlighted marker: ${markerData.point.name}`);
    }
  }

  /**
   * 重置所有标记
   */
  resetAllMarkers() {
    for (const [markerId, markerData] of this.markers) {
      const marker = markerData.marker;
      marker.scale.set(1, 1, 1);

      // 恢复原始颜色
      const originalColor = markerData.year === 1761 ? 0x330000 : 0x003333;
      marker.children.forEach(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(originalColor);
          if (child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = this.markerConfig.emissiveIntensity;
          }
        }
      });
    }
  }

  /**
   * 所有标记脉冲动画
   */
  pulseAllMarkers() {
    const currentMarkers = Array.from(this.markers.values())
      .filter(markerData => markerData.year === this.currentYear);

    currentMarkers.forEach((markerData, index) => {
      setTimeout(() => {
        this.pulseMarker(markerData.marker);
      }, index * 100); // 错开动画时间
    });
  }

  /**
   * 单个标记脉冲动画
   */
  pulseMarker(marker) {
    const originalScale = marker.scale.clone();

    // 放大动画
    const scaleUp = () => {
      marker.scale.multiplyScalar(1.5);
      setTimeout(() => {
        marker.scale.copy(originalScale);
      }, 200);
    };

    scaleUp();
  }

  /**
   * 显示/隐藏所有标记
   */
  setVisible(visible) {
    this.isVisible = visible;
    this.updateMarkersVisibility();
  }

  /**
   * 获取指定观测点的标记
   */
  getMarker(pointId, year) {
    const markerId = `${pointId}_${year || this.currentYear}`;
    return this.markers.get(markerId);
  }

  /**
   * 获取当前年份的所有标记
   */
  getCurrentYearMarkers() {
    return Array.from(this.markers.values())
      .filter(markerData => markerData.year === this.currentYear);
  }

  /**
   * 添加悬停效果
   */
  handleMarkerHover(markerId, isHovered) {
    const markerData = this.markers.get(markerId);
    if (markerData) {
      const labelSprite = markerData.marker.children.find(child => child.type === 'Sprite');
      if (labelSprite) {
        labelSprite.visible = isHovered;
      }
    }
  }

  /**
   * 销毁标记系统
   */
  dispose() {
    console.log('🗑️ Disposing Earth Observation Markers...');

    // 清理所有标记
    for (const [markerId, markerData] of this.markers) {
      const marker = markerData.marker;

      // 清理几何体和材质
      marker.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      // 从场景中移除
      this.markerGroup.remove(marker);
    }

    // 清理标记组
    if (this.earthBody && this.earthBody.mesh) {
      this.earthBody.mesh.remove(this.markerGroup);
    }

    this.markers.clear();
    console.log('✅ Earth Observation Markers disposed');
  }
}

export default EarthObservationMarkers;
