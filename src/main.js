/**
 * 金星凌日测距教学网站 - 主入口文件（更新版）
 *
 * 这是一个交互式3D教学应用，展示18世纪天文学家如何通过
 * 金星凌日现象测量地球与太阳之间的距离
 */

import './styles/main.css';
import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { timeController } from './core/TimeController.js';
import { eventSystem, EventTypes } from './core/EventSystem.js';
import { Sun, Earth, Venus } from './objects/index.js';
import { TextureGenerator } from './utils/TextureGenerator.js';
import { transitCalculator } from './systems/TransitCalculator.js';
// import { astronomyCalculator } from './utils/AstronomyCalculator.js';
import { advancedTimeController } from './systems/AdvancedTimeController.js';
import { timeControlPanel } from './ui/TimeControlPanel.js';
import { historicalObservationSystem } from './systems/HistoricalObservationSystem.js';
// import { EarthObservationMarkers } from './systems/EarthObservationMarkers.js'; // 已禁用
import { TelescopeSimulation } from './systems/TelescopeSimulation.js';
import { userDataRecorder } from './systems/UserDataRecorder.js';
import { parallaxEngine } from './systems/ParallaxCalculationEngine.js';
import { educationalGuidanceSystem } from './systems/EducationalGuidanceSystem.js';
import { modernInterface } from './ui/ModernInterface.js';
import { uiIntegration } from './ui/UIIntegration.js';
import './ui/ObservationPointSelector.js'; // Auto-initializes globally
import { tooltipSystem } from './ui/TooltipSystem.js';
import { performanceOptimizer } from './systems/PerformanceOptimizer.js';

class AstronomyApp {
  constructor() {
    console.log('🏗️ AstronomyApp constructor called');
    this.sceneManager = null;
    this.canvas = null;
    this.isInitialized = false;
    this.celestialBodies = new Map();
    this.textureGenerator = new TextureGenerator();
    this.telescopeSimulation = null;
    this.earthMarkers = null;
    this.debugMode = false;

    // 检查URL参数来设置debug模式
    const urlParams = new URLSearchParams(window.location.search);
    this.debugMode = urlParams.has('debug') || urlParams.get('debug') === 'true';

    if (this.debugMode) {
      console.log('🔧 DEBUG MODE ENABLED');
      console.log('🔧 Sun will be rendered as red sphere instead of textured surface');
    }

    // 性能优化器初始化
    this.initializePerformanceOptimization();

    // 异步初始化将在外部调用
    console.log('🏗️ AstronomyApp constructor completed');
  }

  async init() {
    try {

      // 检查WebGL支持
      if (!this.checkWebGLSupport()) {
        return;
      }

      // 使用现有的加载界面（从HTML）
      console.log('📺 Using existing loading screen from HTML');

      // 创建画布
      this.createCanvas();

      // 初始化场景管理器
      this.updateLoadingProgress(20, '正在初始化3D场景...');
      this.sceneManager = new SceneManager(this.canvas);
      await this.sceneManager.initialize();

      // 设置事件监听
      this.setupEventListeners();

      // 创建占位符纹理
      this.updateLoadingProgress(40, '准备纹理资源...');
      await this.prepareTextures();

      // 创建天体系统
      this.updateLoadingProgress(60, '创建天体模型...');
      await this.createCelestialSystem();

      // 设置时间控制
      this.updateLoadingProgress(80, '配置时间系统...');
      await this.setupTimeControl();

      // 初始化交互系统
      this.updateLoadingProgress(85, '初始化观测系统...');
      await this.setupInteractiveSystems();

      // 启动渲染循环
      this.updateLoadingProgress(100, '启动应用...');
      this.sceneManager.startRenderLoop();

      this.isInitialized = true;

      console.log('🔄 Hiding loading screen...');
      this.hideLoadingScreen();

      console.log('✅ Astronomy Application initialized successfully');
      this.showWelcomeMessage();

    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleInitError(error);
    }
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        this.showWebGLError();
        return false;
      }

      return true;
    } catch (error) {
      console.error('WebGL check failed:', error);
      this.showWebGLError();
      return false;
    }
  }

  createLoadingScreen() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-screen';
    loadingDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Arial', sans-serif;
      ">
        <div style="text-align: center; color: white;">
          <h2 style="color: #ffd700; margin-bottom: 20px;">金星凌日测距教学</h2>
          <div style="margin-bottom: 30px;">
            <div id="loading-progress" style="
              width: 300px;
              height: 4px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 2px;
              overflow: hidden;
            ">
              <div id="loading-bar" style="
                width: 0%;
                height: 100%;
                background: #ffd700;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          <p id="loading-text" style="margin-bottom: 10px;">正在初始化...</p>
          <p style="font-size: 14px; color: #cccccc;">加载3D天体模型和纹理资源</p>
        </div>
      </div>
    `;

    document.body.appendChild(loadingDiv);
  }

  updateLoadingProgress(percent, text) {
    // 使用HTML中的元素
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    console.log(`📊 Progress: ${percent}% - ${text}`);

    if (loadingBar) {
      loadingBar.style.width = `${percent}%`;
    } else {
      console.warn('Loading bar element not found');
    }

    if (loadingText && text) {
      loadingText.textContent = text;
    } else if (text) {
      console.warn('Loading text element not found');
    }
  }

  hideLoadingScreen() {
    console.log('🎭 hideLoadingScreen called');
    const loadingScreen = document.getElementById('loading-screen');
    console.log('🎭 Loading screen element:', loadingScreen);

    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        console.log('🎭 Removing loading screen element');
        loadingScreen.remove();
      }, 500);
    } else {
      console.warn('🎭 Loading screen element not found!');
    }
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'astronomy-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 1;
    `;

    document.body.appendChild(this.canvas);
  }

  setupEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.sceneManager?.handleResize();
    });

    // 键盘事件
    document.addEventListener('keydown', (event) => {
      this.handleKeyPress(event);
    });

    // 监听应用事件
    eventSystem.subscribe(EventTypes.ERROR_OCCURRED, (data) => {
      this.handleError(data);
    });

    eventSystem.subscribe(EventTypes.CELESTIAL_BODY_CLICKED, (data) => {
      this.handleBodyClick(data);
    });

    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.handleTimeChange(data);
    });

    // 监听观测点选择事件
    eventSystem.subscribe(EventTypes.OBSERVATION_POINT_SELECTED, (data) => {
      this.handleObservationPointSelected(data);
    });

    // 监听地球点击事件
    eventSystem.subscribe('earthClicked', (data) => {
      this.handleEarthClick(data);
    });
  }

  async prepareTextures() {
    // 预生成占位符纹理
    const placeholderTextures = TextureGenerator.createAllPlaceholderTextures();

    // 将纹理缓存到全局以便使用
    window.placeholderTextures = placeholderTextures;
  }

  async createCelestialSystem() {
    try {
      // 创建太阳
      const sun = new Sun({ debugMode: this.debugMode });
      await sun.initialize();
      await sun.initializeSun();
      this.celestialBodies.set('sun', sun);
      this.sceneManager.addCelestialBody(sun);

      // 创建地球
      const earth = new Earth();
      await earth.initialize();
      await earth.initializeEarth();
      this.celestialBodies.set('earth', earth);
      this.sceneManager.addCelestialBody(earth);

      // 创建金星
      const venus = new Venus();
      await venus.initialize();
      await venus.initializeVenus();
      this.celestialBodies.set('venus', venus);
      this.sceneManager.addCelestialBody(venus);

    } catch (error) {
      console.error('❌ CRITICAL: Celestial system creation failed:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async setupTimeControl() {
    // 设置初始时间为1761年金星凌日
    const transitDate = new Date('1761-06-06T05:00:00Z');
    timeController.setTime(transitDate);
    timeController.setSpeed(100); // 100倍速度，便于观察

    // 初始化凌日计算器
    await transitCalculator.initializeTransitData();

    // 初始化高级时间控制器
    await advancedTimeController.initialize();

    // 初始化时间控制面板
    timeControlPanel.show();

  }

  async setupInteractiveSystems() {

    // 初始化历史观测系统
    await historicalObservationSystem.initialize();

    // 初始化地球观测点标记系统 - 暂时禁用，避免地球渲染混乱
    // this.earthMarkers = new EarthObservationMarkers(this.sceneManager);
    // await this.earthMarkers.initialize();

    // 初始化望远镜模拟
    this.telescopeSimulation = new TelescopeSimulation(this.sceneManager);

    // 初始化用户数据记录器
    await userDataRecorder.initialize();

    // 初始化视差计算引擎
    await parallaxEngine.initialize();

    // 初始化教育引导系统
    await educationalGuidanceSystem.initialize();

    // 初始化现代界面系统
    modernInterface.createModernNavigation();
    modernInterface.createModernControlPanel();
    modernInterface.createHelpModal();

    // 初始化UI集成系统
    await uiIntegration.initialize();

    // 设置键盘快捷键
    this.setupInteractiveKeyboardShortcuts();

  }

  setupInteractiveKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
      case 'o':
        // 显示历史观测点信息
        this.showHistoricalObservations();
        break;
      case 'v':
        // 切换望远镜视图
        this.toggleTelescopeView();
        break;
      case 'g':
        // 显示教育引导系统
        this.showEducationalGuidance();
        break;
      case 'p':
        // 显示视差计算结果
        this.showParallaxCalculations();
        break;
      case 'k':
        // 显示计算面板
        if (uiIntegration) {
          uiIntegration.toggleCalculationPanel();
        }
        break;
      case 't':
        // 显示教程选择器
        if (uiIntegration) {
          uiIntegration.showTutorialSelector();
        }
        break;
      case 'h':
        // 显示帮助 - 使用tooltip系统显示键盘快捷键
        tooltipSystem.showKeyboardShortcuts();
        break;
      case 'q':
        // 显示性能报告
        this.showPerformanceReport();
        break;
      case 'm':
        // 手动内存清理
        this.performMemoryCleanup();
        break;
      case 'd':
        // 切换debug模式 (Ctrl+D 或 Cmd+D)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleDebugMode();
        }
        break;
      }
    });
  }

  async toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`🔧 Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);

    // 显示调试状态提示
    this.showNotification(`Debug mode ${this.debugMode ? 'ON' : 'OFF'} - Sun is now ${this.debugMode ? 'red sphere' : 'textured'}`);

    // 重新创建太阳以应用debug模式
    const sun = this.celestialBodies.get('sun');
    if (sun) {
      // 移除旧的太阳
      this.sceneManager.scene.remove(sun.mesh);

      // 创建新的太阳实例
      const newSun = new Sun({ debugMode: this.debugMode });
      await newSun.initialize();
      await newSun.initializeSun();

      // 替换旧的太阳
      this.celestialBodies.set('sun', newSun);
      this.sceneManager.addCelestialBody(newSun);

      console.log('🌞 Sun reinitialized in debug mode');
    }
  }

  showNotification(message) {
    // 创建简单的通知提示
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showHistoricalObservations() {
    const activeObservations = historicalObservationSystem.getActiveObservations();
    const currentYear = historicalObservationSystem.currentYear;

    console.log(`
    🏛️ 历史观测点 (${currentYear}年金星凌日)
    
    活跃观测点 (${activeObservations.length}):
    ${activeObservations.map(point =>
    `  • ${point.name} (${point.observer})
        位置: ${point.location.latitude}°, ${point.location.longitude}°
        望远镜: ${point.telescope}
        精度: ${point.accuracy}`
  ).join('\n\n')}
    
    视差计算:
    ${historicalObservationSystem.getParallaxCalculations(currentYear).map(calc =>
    `  ${calc.pair}: ${calc.parallaxAngle.toFixed(2)}" → ${calc.calculatedAU.toFixed(0)} km`
  ).join('\n')}
    `);
  }

  toggleTelescopeView() {
    if (this.telescopeSimulation) {
      const currentData = this.telescopeSimulation.getObservationData();
      console.log(`
      🔭 当前望远镜观测数据:
      望远镜: ${currentData.telescope?.name || '未选择'}
      位置: ${currentData.position ?
    `${currentData.position.lat}°, ${currentData.position.lon}°` : '未设置'}
      大气条件: ${currentData.atmosphericConditions}
      测量标记: ${currentData.measurementMarks.length}个
      `);
    }
  }

  handleKeyPress(event) {
    switch (event.key.toLowerCase()) {
    case 'r':
      this.sceneManager.resetCamera();
      break;
    case 'f':
      this.toggleFullscreen();
      break;
    case 't':
      this.showTransitInfo();
      break;
    case ' ':
      timeController.togglePause();
      break;
    case 'arrowright':
      timeController.setSpeed(timeController.speed * 2);
      break;
    case 'arrowleft':
      timeController.setSpeed(timeController.speed / 2);
      break;
    case '1':
      this.focusOnBody('sun');
      break;
    case '2':
      this.focusOnBody('earth');
      break;
    case '3':
      this.focusOnBody('venus');
      break;
    case 'c':
      timeControlPanel.toggle();
      break;
    }
  }

  handleBodyClick(data) {
    console.log('🪐 Body clicked:', data.body.name);
    this.showBodyInfo(data.body);
  }

  handleEarthClick(data) {
    console.log('🌍 Earth clicked, showing observation point selector');
    // ObservationPointSelector已经在事件中自动显示了
    // 这里可以添加额外的逻辑，比如相机动画等
  }

  handleObservationPointSelected(data) {
    const { point, year } = data;
    console.log(`🔭 Observation point selected: ${point.name} (${year})`);

    // 设置时间到观测年份
    const transitDate = new Date(year === 1761 ? '1761-06-06T05:00:00Z' : '1769-06-03T05:00:00Z');
    timeController.setTime(transitDate);

    // 聚焦到地球并开始望远镜模拟
    this.focusOnObservationPoint(point);

    // 启动望远镜视图
    if (this.telescopeSimulation) {
      this.telescopeSimulation.setObservationPoint(point);
      // 可以在这里启动望远镜视图，或者让用户手动切换
    }

    // 显示观测点信息
    this.showObservationPointInfo(point, year);
  }

  handleTimeChange(data) {
    // 更新天体位置
    this.celestialBodies.forEach(body => {
      if (body.updatePosition) {
        body.updatePosition(timeController.getJulianDate());
      }
    });
  }

  handleError(data) {
    console.error('❌ Application error:', data.error);
    this.showErrorMessage(data.error.message || 'An error occurred');
  }

  handleInitError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff4444;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        z-index: 10000;
        max-width: 400px;
        text-align: center;
      ">
        <h3>初始化错误</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" style="
          margin-top: 10px;
          padding: 8px 16px;
          background: white;
          color: #ff4444;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">重新加载</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  showWebGLError() {
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        padding: 50px;
        font-family: Arial, sans-serif;
        background: #0a0a0a;
        color: #ffffff;
      ">
        <h2 style="color: #ffd700; margin-bottom: 20px;">浏览器不支持WebGL</h2>
        <p style="margin-bottom: 30px; max-width: 500px; line-height: 1.6;">
          这个应用需要WebGL支持才能运行3D图形。请尝试以下解决方案：
        </p>
        <ul style="text-align: left; max-width: 400px; margin: 0 auto 30px; line-height: 2;">
          <li>更新到最新版本的浏览器</li>
          <li>启用硬件加速</li>
          <li>更新显卡驱动程序</li>
          <li>尝试使用Chrome或Firefox浏览器</li>
        </ul>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: #ffd700;
          color: #000;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        ">重新检测</button>
      </div>
    `;
  }

  showEducationalGuidance() {
    const tutorials = educationalGuidanceSystem.getAvailableTutorials();
    console.log(`
    📚 教育引导系统
    
    可用教程：
    ${tutorials.map(t =>
    `  • ${t.title} (${t.difficulty})
        ${t.description}
        预计时间: ${t.estimatedTime}
        步骤数: ${t.steps}`
  ).join('\n\n')}
    
    使用说明：
    - 输入 'educationalGuidanceSystem.startTutorial("教程ID")' 开始教程
    - 使用 'G' 键快速访问教程菜单
    - 按 'P' 键查看当前视差计算结果
    `);
  }

  showParallaxCalculations() {
    const historical1761 = parallaxEngine.calculateHistoricalParallax(1761);
    const historical1769 = parallaxEngine.calculateHistoricalParallax(1769);

    console.log(`
    🔬 视差计算结果
    
    1761年金星凌日计算：
    观测点数: ${historical1761.results.length} 组
    平均距离: ${historical1761.summary.meanDistance.toFixed(0)} km
    标准差: ${historical1761.summary.stdDeviation.toFixed(0)} km
    最佳精度: ${historical1761.bestResult.error.toFixed(2)}%
    
    1769年金星凌日计算：
    观测点数: ${historical1769.results.length} 组
    平均距离: ${historical1769.summary.meanDistance.toFixed(0)} km
    标准差: ${historical1769.summary.stdDeviation.toFixed(0)} km
    最佳精度: ${historical1769.bestResult.error.toFixed(2)}%
    
    实际天文单位: ${parallaxEngine.constants.AU.toFixed(0)} km
    `);
  }

  showWelcomeMessage() {
    console.log(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║                   金星凌日测距教学系统                        ║
    ║                                                              ║
    ║  交互式3D模拟18世纪金星凌日现象                               ║
    ║  体验天文学家如何测量日地距离                               ║
    ║                                                              ║
    ║  🎮 基础控制：                                                ║
    ║  - 鼠标拖拽：旋转视角                                        ║
    ║  - 滚轮：缩放视图                                            ║
    ║  - 空格键：暂停/继续时间                                     ║
    ║  - 左右箭头：调整时间速度                                    ║
    ║  - 数字键1-3：聚焦太阳/地球/金星                             ║
    ║  - R键：重置相机视角                                         ║
    ║                                                              ║
    ║  🔭 观测系统：                                               ║
    ║  - O键：显示历史观测点信息                                  ║
    ║  - V键：显示望远镜信息                                      ║
    ║  - T键：显示凌日信息                                         ║
    ║  - C键：显示/隐藏时间控制面板                               ║
    ║                                                              ║
    ║  📚 教育学习：                                               ║
    ║  - G键：显示教育引导系统                                    ║
    ║  - P键：显示视差计算结果                                    ║
    ║  - T键：显示教程选择器                                       ║
    ║  - K键：显示实时计算面板                                    ║
    ║                                                              ║
    ║  ⚡ 性能优化：                                                ║
    ║  - Q键：显示性能报告                                        ║
    ║  - M键：手动内存清理                                        ║
    ║                                                              ║
    ║  🎨 界面控制：                                               ║
    ║  - H键：显示帮助中心                                        ║
    ╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  showBodyInfo(body) {
    const info = body.getInfo();
    console.log(`
    📊 天体信息：
    名称：${info.name}
    类型：${info.type}
    半径：${(info.radius / 1000).toFixed(0)} km
    距离：${(info.distance / 1000).toFixed(0)} km
    自转周期：${info.rotationPeriod?.toFixed(2) || 'N/A'} 天
    公转周期：${info.orbitalPeriod?.toFixed(2) || 'N/A'} 天
    `);
  }

  showTransitInfo() {
    const currentTime = timeController.getTime();
    const transitStatus = transitCalculator.getTransitStatus(currentTime);

    if (transitStatus.isTransiting) {
      const distance = transitCalculator.calculateHistoricalAUDistance(transitStatus.year);

      console.log(`
      🌟 金星凌日信息：
      当前时间：${currentTime.toUTCString()}
      凌日年份：${transitStatus.year}
      凌日阶段：${transitStatus.phase}
      进度：${transitStatus.progress.toFixed(1)}%
      
      计算的天文单位距离：${distance?.calculatedDistance?.toFixed(0) || 'N/A'} km
      实际天文单位距离：${149597870.7.toFixed(0)} km
      计算精度：${distance?.accuracy?.toFixed(2) || 'N/A'}%
      
      当前时间速度：${timeController.speed}x
      `);
    } else {
      const nextTransit = transitCalculator.getNextTransit(currentTime);

      console.log(`
      🌟 金星凌日信息：
      当前时间：${currentTime.toUTCString()}
      当前状态：无凌日
      
      下一次凌日：${nextTransit?.date.toUTCString() || 'N/A'}
      
      当前时间速度：${timeController.speed}x
      `);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  focusOnBody(bodyName) {
    const body = this.celestialBodies.get(bodyName);
    if (body && body.position) {
      this.sceneManager.setCameraPosition(
        body.position.x + 5,
        body.position.y + 2,
        body.position.z + 5
      );
    }
  }

  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      z-index: 1000;
      max-width: 300px;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * 聚焦到观测点
   */
  focusOnObservationPoint(point) {
    const earth = this.celestialBodies.get('earth');
    if (earth && earth.position && this.sceneManager) {
      // 计算基于地球位置的相机位置
      const earthPos = earth.position;
      const distance = 8; // 距离地球的距离

      // 根据观测点的纬度调整相机角度
      const lat = (point.location.latitude * Math.PI) / 180;
      const lon = (point.location.longitude * Math.PI) / 180;

      // 计算相机位置（稍微偏离观测点，便于观察）
      const cameraX = earthPos.x + distance * Math.cos(lat) * Math.cos(lon);
      const cameraY = earthPos.y + distance * Math.sin(lat);
      const cameraZ = earthPos.z + distance * Math.cos(lat) * Math.sin(lon);

      const targetPosition = new THREE.Vector3(cameraX, cameraY, cameraZ);
      const targetLookAt = earthPos.clone();

      // 使用平滑动画移动相机
      this.sceneManager.animateCameraTo(targetPosition, targetLookAt, 1500);

      console.log(`📍 Camera focused on observation point: ${point.name}`);
    }
  }

  /**
   * 显示观测点信息
   */
  showObservationPointInfo(point, year) {
    console.log(`
    🔭 观测点详细信息
    
    观测点: ${point.name}
    观测者: ${point.observer}
    年份: ${year}年金星凌日
    位置: ${point.location.latitude.toFixed(4)}°, ${point.location.longitude.toFixed(4)}°
    海拔: ${point.location.elevation}米
    望远镜: ${point.telescope}
    精度: ${point.accuracy}
    
    观测时间:
    ${point.contactTimes ? `
    第一接触: ${point.contactTimes.first.toUTCString()}
    第二接触: ${point.contactTimes.second.toUTCString()}
    第三接触: ${point.contactTimes.third.toUTCString()}
    第四接触: ${point.contactTimes.fourth.toUTCString()}
    ` : '时间数据不可用'}
    
    备注: ${point.notes || '无'}
    
    💡 使用 'V' 键可以切换到望远镜视图
    `);

    // 创建简单的信息提示
    this.showNotification(`已选择观测点: ${point.name} (${point.observer})`);
  }

  // 公共API
  getCelestialBody(name) {
    return this.celestialBodies.get(name);
  }

  getAllBodies() {
    return Array.from(this.celestialBodies.values());
  }

  initializePerformanceOptimization() {
    console.log('⚡ Initializing performance optimization...');

    // 设置性能优化事件监听
    eventSystem.subscribe('qualityChanged', (data) => {
      console.log(`🎯 Quality changed to: ${data.quality}`);
      this.applyQualitySettings(data.settings);
    });

    eventSystem.subscribe('memoryPressure', (data) => {
      console.log('⚠️ Memory pressure detected, applying optimizations...');
      this.handleMemoryPressure();
    });
  }

  applyQualitySettings(settings) {
    if (this.sceneManager && this.sceneManager.scene) {
      performanceOptimizer.optimizeScene(this.sceneManager.scene);
    }
  }

  handleMemoryPressure() {
    // 降低纹理质量
    if (this.sceneManager) {
      this.sceneManager.updateTextureQuality('low');
    }

    // 清理非关键资源
    performanceOptimizer.performMemoryCleanup();
  }

  showPerformanceReport() {
    const report = performanceOptimizer.getPerformanceReport();
    console.log(`
    📊 性能报告
    
    当前状态:
    - FPS: ${report.currentFPS}
    - 内存使用: ${report.memoryUsage.toFixed(2)} MB
    - 纹理内存: ${report.textureMemory.toFixed(2)} MB
    - 几何体内存: ${report.geometryMemory.toFixed(2)} MB
    - 绘制调用: ${report.drawCalls}
    - 缓存大小: ${report.cacheSize}
    - 质量设置: ${report.quality}
    
    加载时间: ${report.loadingTime.toFixed(2)} ms
    
    优化建议:
    ${report.recommendations.map(rec => `  • ${rec}`).join('\n')}
    
    设备信息:
    - 设备内存: ${navigator.deviceMemory || '未知'} GB
    - 硬件并发: ${navigator.hardwareConcurrency || '未知'} 核
    - 是否移动设备: ${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '是' : '否'}
    `);
  }

  performMemoryCleanup() {
    console.log('🧹 Performing manual memory cleanup...');
    performanceOptimizer.performMemoryCleanup();

    // 强制垃圾回收（如果浏览器支持）
    if (window.gc) {
      window.gc();
    }

    console.log('✅ Memory cleanup completed');
  }

  dispose() {
    console.log('🗑️ 正在清理应用资源...');

    // 清理性能优化器
    if (performanceOptimizer) {
      performanceOptimizer.dispose();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    // 清理地球标记系统 - 已禁用
    // if (this.earthMarkers) {
    //   this.earthMarkers.dispose();
    // }

    this.celestialBodies.forEach(body => {
      body.dispose();
    });

    this.celestialBodies.clear();

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    console.log('✅ 应用已清理');
  }
}

// 全局应用实例
let app = null;

// 初始化应用
async function initApp() {
  console.log('🎬 Starting initApp...');

  if (app) {
    console.log('🧹 Disposing existing app...');
    app.dispose();
  }

  console.log('🏗️ Creating new AstronomyApp instance...');
  app = new AstronomyApp();

  console.log('🚀 Calling app.init()...');
  await app.init(); // 关键：调用初始化方法

  console.log('✅ initApp completed');
  return app;
}

// 当DOM加载完成后启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 导出API
export { AstronomyApp, initApp };
export default AstronomyApp;

// 全局访问（用于调试）
window.AstronomyApp = AstronomyApp;
window.initApp = initApp;
