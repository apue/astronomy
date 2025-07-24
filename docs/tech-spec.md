# 金星凌日测距教学网站 - 技术规范

## 1. 技术栈选择

### 1.1 核心技术
- **Three.js**: ^0.160.0 - 3D图形渲染引擎
- **Vite**: ^5.0.0 - 现代前端构建工具
- **JavaScript**: ES2022+ - 现代JavaScript语法
- **WebGL**: 2.0 - 硬件加速3D渲染

### 1.2 辅助库
- **@tweenjs/tween.js**: ^21.0.0 - 动画补间库
- **dat.gui**: ^0.7.9 - 开发调试界面（可选）
- **stats.js**: ^0.17.0 - 性能监控工具

### 1.3 开发工具
- **ESLint**: ^8.56.0 - 代码质量检查
- **Prettier**: ^3.1.1 - 代码格式化
- **TypeScript**: ^5.3.0 - 类型检查（可选）

## 2. 项目结构

### 2.1 目录结构
```
astronomy/
├── public/                 # 静态资源
│   ├── textures/          # 天体纹理图片
│   │   ├── earth/         
│   │   │   ├── earth_day.jpg
│   │   │   ├── earth_night.jpg
│   │   │   └── earth_clouds.jpg
│   │   ├── sun/           
│   │   │   └── sun_surface.jpg
│   │   └── venus/         
│   │       └── venus_surface.jpg
│   ├── data/              # 数据文件
│   │   ├── observation-points-1761.json
│   │   ├── observation-points-1769.json
│   │   └── orbital-elements.json
│   └── favicon.ico
├── src/                   # 源代码
│   ├── core/              # 核心系统
│   │   ├── SceneManager.js
│   │   ├── TimeController.js
│   │   ├── CameraController.js
│   │   └── EventSystem.js
│   ├── objects/           # 3D对象
│   │   ├── CelestialBody.js
│   │   ├── Earth.js
│   │   ├── Sun.js
│   │   ├── Venus.js
│   │   └── ObservationPoint.js
│   ├── systems/           # 功能系统
│   │   ├── ObservationSystem.js
│   │   ├── ParallaxCalculator.js
│   │   ├── DataRecorder.js
│   │   └── TelescopeView.js
│   ├── ui/                # 用户界面
│   │   ├── ControlPanel.js
│   │   ├── Timeline.js
│   │   ├── InfoDisplay.js
│   │   └── Modal.js
│   ├── utils/             # 工具函数
│   │   ├── MathUtils.js
│   │   ├── AstronomyUtils.js
│   │   ├── LoaderUtils.js
│   │   └── Constants.js
│   ├── styles/            # 样式文件
│   │   ├── main.css
│   │   ├── components.css
│   │   └── responsive.css
│   └── main.js            # 入口文件
├── docs/                  # 文档
├── tests/                 # 测试文件
├── package.json
├── vite.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## 3. 天文计算核心算法

### 3.1 轨道位置计算
```javascript
// AstronomyUtils.js
export class AstronomyUtils {
  static calculateOrbitalPosition(time, orbitElements) {
    const { semiMajorAxis, eccentricity, inclination, 
            longitudeOfAscendingNode, argumentOfPeriapsis, 
            meanAnomaly0, meanMotion, epoch } = orbitElements;
    
    // 计算时间差（天）
    const deltaTime = (time - epoch) / (1000 * 60 * 60 * 24);
    
    // 计算平近点角
    const M = (meanAnomaly0 + meanMotion * deltaTime) % (2 * Math.PI);
    
    // 求解开普勒方程（牛顿迭代法）
    let E = M;
    for (let i = 0; i < 10; i++) {
      const dE = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-10) break;
    }
    
    // 计算真近点角
    const v = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );
    
    // 计算轨道半径
    const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));
    
    // 轨道平面坐标
    const x_orb = r * Math.cos(v);
    const y_orb = r * Math.sin(v);
    
    // 转换到黄道坐标系
    const cos_w = Math.cos(argumentOfPeriapsis);
    const sin_w = Math.sin(argumentOfPeriapsis);
    const cos_O = Math.cos(longitudeOfAscendingNode);
    const sin_O = Math.sin(longitudeOfAscendingNode);
    const cos_i = Math.cos(inclination);
    const sin_i = Math.sin(inclination);
    
    const x = x_orb * (cos_w * cos_O - sin_w * sin_O * cos_i) - y_orb * (sin_w * cos_O + cos_w * sin_O * cos_i);
    const y = x_orb * (cos_w * sin_O + sin_w * cos_O * cos_i) - y_orb * (sin_w * sin_O - cos_w * cos_O * cos_i);
    const z = x_orb * (sin_w * sin_i) + y_orb * (cos_w * sin_i);
    
    return new THREE.Vector3(x, y, z);
  }
}
```

### 3.2 视差计算系统
```javascript
// ParallaxCalculator.js
export class ParallaxCalculator {
  static calculateAngularSeparation(observer1, observer2, target) {
    const vec1 = target.clone().sub(observer1).normalize();
    const vec2 = target.clone().sub(observer2).normalize();
    return Math.acos(Math.max(-1, Math.min(1, vec1.dot(vec2))));
  }
  
  static calculateParallax(observationData) {
    const results = [];
    
    for (let i = 0; i < observationData.length; i++) {
      for (let j = i + 1; j < observationData.length; j++) {
        const obs1 = observationData[i];
        const obs2 = observationData[j];
        
        // 计算基线长度
        const baseline = obs1.position.distanceTo(obs2.position);
        
        // 计算视差角
        const parallaxAngle = this.calculateAngularSeparation(
          obs1.position, obs2.position, obs1.venusPosition
        );
        
        // 计算距离（三角测量）
        const distance = baseline / (2 * Math.sin(parallaxAngle / 2));
        
        results.push({
          observer1: obs1.name,
          observer2: obs2.name,
          baseline: baseline,
          parallaxAngle: parallaxAngle,
          distance: distance
        });
      }
    }
    
    return results;
  }
  
  static calculateSunDistance(venusParallaxData, venusOrbitRatio = 0.723) {
    // 金星轨道半径与地球轨道半径的比值
    const avgVenusDistance = venusParallaxData.reduce((sum, data) => sum + data.distance, 0) / venusParallaxData.length;
    return avgVenusDistance / venusOrbitRatio;
  }
}
```

## 4. 核心模块API

### 4.1 TimeController
```javascript
export class TimeController {
  constructor(startDate, endDate) {
    this.startTime = new Date(startDate);
    this.endTime = new Date(endDate);
    this.currentTime = new Date(startDate);
    this.isPlaying = false;
    this.speed = 1; // 天/秒
    this.callbacks = new Set();
  }
  
  // 订阅时间变化
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  // 设置时间
  setTime(date) {
    this.currentTime = new Date(date);
    this.notifyCallbacks();
  }
  
  // 播放/暂停
  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) this.animate();
  }
  
  // 动画循环
  animate() {
    if (!this.isPlaying) return;
    
    const deltaTime = this.speed * 86400000; // 转换为毫秒
    this.currentTime.setTime(this.currentTime.getTime() + deltaTime * 16.67); // 60fps
    
    if (this.currentTime > this.endTime) {
      this.currentTime = new Date(this.endTime);
      this.isPlaying = false;
    }
    
    this.notifyCallbacks();
    
    if (this.isPlaying) {
      requestAnimationFrame(() => this.animate());
    }
  }
  
  notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.currentTime));
  }
}
```

### 4.2 TelescopeView
```javascript
export class TelescopeView {
  constructor(canvas, observer) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.observer = observer;
    this.sunAngularSize = 0.53; // 度
    this.venusAngularSize = 0.001; // 度
  }
  
  render(sunPosition, venusPosition) {
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制望远镜圆形视野
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.clip();
    
    // 计算太阳和金星在视野中的位置
    const sunViewPos = this.calculateViewPosition(sunPosition);
    const venusViewPos = this.calculateViewPosition(venusPosition);
    
    // 绘制太阳
    const sunPixelRadius = (this.sunAngularSize * Math.PI / 180) * radius / 0.1; // 假设视野为0.1弧度
    ctx.fillStyle = '#FDB813';
    ctx.beginPath();
    ctx.arc(
      centerX + sunViewPos.x * radius,
      centerY + sunViewPos.y * radius,
      sunPixelRadius,
      0, 2 * Math.PI
    );
    ctx.fill();
    
    // 绘制金星
    const venusPixelRadius = Math.max(3, (this.venusAngularSize * Math.PI / 180) * radius / 0.1);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
      centerX + venusViewPos.x * radius,
      centerY + venusViewPos.y * radius,
      venusPixelRadius,
      0, 2 * Math.PI
    );
    ctx.fill();
    
    // 绘制视野边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
  calculateViewPosition(worldPosition) {
    // 将3D世界坐标转换为2D视野坐标
    const observerToTarget = worldPosition.clone().sub(this.observer.position);
    const distance = observerToTarget.length();
    const normalized = observerToTarget.normalize();
    
    // 简化投影（实际需要考虑观测者的朝向）
    return {
      x: normalized.x,
      y: -normalized.y // Y轴翻转
    };
  }
}
```

## 5. 数据格式规范

### 5.1 观测点数据格式
```json
{
  "1761": [
    {
      "name": "Stockholm",
      "observer": "Per Wilhelm Wargentin",
      "latitude": 59.3293,
      "longitude": 18.0686,
      "altitude": 45,
      "contactTimes": {
        "firstContact": "1761-06-06T02:19:00Z",
        "secondContact": "1761-06-06T02:39:00Z",
        "thirdContact": "1761-06-06T08:37:00Z",
        "fourthContact": "1761-06-06T08:57:00Z"
      },
      "weatherConditions": "clear",
      "instruments": ["telescope", "quadrant"]
    }
  ]
}
```

### 5.2 轨道元素数据格式
```json
{
  "earth": {
    "semiMajorAxis": 1.0,
    "eccentricity": 0.0167,
    "inclination": 0.0,
    "longitudeOfAscendingNode": 0.0,
    "argumentOfPeriapsis": 1.796,
    "meanAnomaly0": 6.240,
    "meanMotion": 0.0172,
    "epoch": "1761-01-01T00:00:00Z"
  },
  "venus": {
    "semiMajorAxis": 0.723,
    "eccentricity": 0.0068,
    "inclination": 0.0592,
    "longitudeOfAscendingNode": 1.338,
    "argumentOfPeriapsis": 0.955,
    "meanAnomaly0": 0.875,
    "meanMotion": 0.0278,
    "epoch": "1761-01-01T00:00:00Z"
  }
}
```

## 6. 性能优化策略

### 6.1 渲染优化
```javascript
// 纹理缓存管理
class TextureManager {
  constructor() {
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
  }
  
  async loadTexture(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    
    const texture = await new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
    
    // 性能优化设置
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    this.cache.set(url, texture);
    return texture;
  }
}

// LOD（细节层次）管理
class LODManager {
  static getGeometrySegments(distance) {
    if (distance < 10) return { widthSegments: 64, heightSegments: 32 };
    if (distance < 50) return { widthSegments: 32, heightSegments: 16 };
    return { widthSegments: 16, heightSegments: 8 };
  }
}
```

### 6.2 内存管理
```javascript
class ResourceManager {
  constructor() {
    this.disposables = new Set();
  }
  
  track(resource) {
    this.disposables.add(resource);
    return resource;
  }
  
  dispose() {
    for (const resource of this.disposables) {
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.disposables.clear();
  }
}
```

## 7. 配置文件

### 7.1 vite.config.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['three', '@tweenjs/tween.js']
  }
});
```

### 7.2 package.json
```json
{
  "name": "venus-transit-astronomy",
  "version": "1.0.0",
  "description": "Interactive 3D visualization of Venus transit parallax measurements",
  "main": "src/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js",
    "format": "prettier --write src/**/*.js"
  },
  "dependencies": {
    "three": "^0.160.0",
    "@tweenjs/tween.js": "^21.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "stats.js": "^0.17.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 8. API接口规范

### 8.1 事件系统
```javascript
// 自定义事件类型
export const EventTypes = {
  TIME_CHANGED: 'timeChanged',
  CELESTIAL_BODY_CLICKED: 'celestialBodyClicked',
  OBSERVATION_POINT_SELECTED: 'observationPointSelected',
  DATA_RECORDED: 'dataRecorded',
  VIEW_MODE_CHANGED: 'viewModeChanged'
};

// 事件数据格式
export const EventData = {
  timeChanged: { time: Date },
  celestialBodyClicked: { body: CelestialBody, position: Vector3 },
  observationPointSelected: { point: ObservationPoint },
  dataRecorded: { type: String, value: Number, timestamp: Date },
  viewModeChanged: { mode: String, previousMode: String }
};
```

### 8.2 组件接口
```javascript
// 所有UI组件必须实现的基础接口
export class UIComponent {
  constructor(element) {
    this.element = element;
    this.isVisible = true;
    this.eventListeners = new Map();
  }
  
  show() { this.isVisible = true; this.render(); }
  hide() { this.isVisible = false; }
  destroy() { this.removeAllListeners(); }
  
  addEventListener(type, callback) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type).add(callback);
  }
  
  removeEventListener(type, callback) {
    const listeners = this.eventListeners.get(type);
    if (listeners) listeners.delete(callback);
  }
  
  emit(type, data) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  // 子类必须实现
  render() { throw new Error('render method must be implemented'); }
  update(data) { throw new Error('update method must be implemented'); }
}