/**
 * 金星凌日测距教学网站 - 主入口文件
 * 
 * 这是一个交互式3D教学应用，展示18世纪天文学家如何通过
 * 金星凌日现象测量地球与太阳之间的距离
 */

import './styles/main.css';

// 全局错误处理
class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
  }

  handleError(event) {
    console.error('Application Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
    this.showUserFriendlyError('应用遇到了问题，请刷新页面重试。');
  }

  handleRejection(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    this.showUserFriendlyError('数据加载失败，请检查网络连接。');
    event.preventDefault();
  }

  showUserFriendlyError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
      </div>
      <button onclick="location.reload()" 
              style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer;">
        刷新页面
      </button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // 5秒后自动消失
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }
}

// WebGL支持检查
class WebGLChecker {
  static checkSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        throw new Error('WebGL not supported');
      }
      
      // 检查必要的扩展
      const requiredExtensions = ['OES_texture_float'];
      const missingExtensions = requiredExtensions.filter(ext => !gl.getExtension(ext));
      
      if (missingExtensions.length > 0) {
        console.warn('Missing WebGL extensions:', missingExtensions);
      }
      
      return true;
    } catch (error) {
      console.error('WebGL check failed:', error);
      this.showWebGLError();
      return false;
    }
  }
  
  static showWebGLError() {
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        padding: 50px;
        font-family: Inter, Arial, sans-serif;
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
}

// 加载管理器
class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBar = document.getElementById('loading-bar');
    this.loadingText = document.getElementById('loading-text');
    this.progress = 0;
    this.steps = [
      '正在初始化...',
      '加载3D引擎...',
      '准备天体模型...',
      '加载纹理资源...',
      '计算轨道数据...',
      '启动应用...',
    ];
    this.currentStep = 0;
  }
  
  updateProgress(progress, step) {
    this.progress = Math.max(this.progress, progress);
    this.loadingBar.style.width = `${this.progress}%`;
    
    if (step !== undefined) {
      this.currentStep = step;
      this.loadingText.textContent = this.steps[step] || '准备完成...';
    }
  }
  
  hide() {
    setTimeout(() => {
      this.loadingScreen.classList.add('loading-hidden');
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 500);
    }, 200);
  }
}

// 应用主类
class VenusTransitApp {
  constructor() {
    this.loadingManager = new LoadingManager();
    this.initialized = false;
  }
  
  async initialize() {
    try {
      // 检查WebGL支持
      if (!WebGLChecker.checkSupport()) {
        return;
      }
      
      this.loadingManager.updateProgress(10, 0);
      
      // 动态导入核心模块
      this.loadingManager.updateProgress(20, 1);
      const { default: SceneManager } = await import('./core/SceneManager.js');
      
      this.loadingManager.updateProgress(40, 2);
      
      // 初始化场景管理器
      const canvas = document.getElementById('canvas');
      this.sceneManager = new SceneManager(canvas);
      await this.sceneManager.initialize();
      
      this.loadingManager.updateProgress(60, 3);
      
      // 加载其他系统
      await this.loadSystems();
      
      this.loadingManager.updateProgress(80, 4);
      
      // 启动应用
      this.start();
      
      this.loadingManager.updateProgress(100, 5);
      this.initialized = true;
      
      // 隐藏加载屏幕
      setTimeout(() => {
        this.loadingManager.hide();
      }, 500);
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showInitializationError(error);
    }
  }
  
  async loadSystems() {
    // 这里后续会加载其他系统模块
    // 例如: TimeController, ObservationSystem, UI等
    return new Promise(resolve => {
      setTimeout(resolve, 500); // 模拟加载时间
    });
  }
  
  start() {
    if (!this.sceneManager) {
      throw new Error('Scene manager not initialized');
    }
    
    // 启动渲染循环
    this.sceneManager.startRenderLoop();
    
    console.log('Venus Transit App started successfully!');
  }
  
  showInitializationError(error) {
    const errorMessage = error.message || '未知错误';
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        padding: 50px;
        font-family: Inter, Arial, sans-serif;
        background: #0a0a0a;
        color: #ffffff;
      ">
        <h2 style="color: #ff4444; margin-bottom: 20px;">应用启动失败</h2>
        <p style="margin-bottom: 30px; max-width: 500px; line-height: 1.6;">
          遇到了一个错误：${errorMessage}
        </p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: #ffd700;
          color: #000;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        ">重新加载</button>
      </div>
    `;
  }
}

// 应用启动
async function main() {
  // 初始化错误处理
  new ErrorHandler();
  
  // 创建并启动应用
  const app = new VenusTransitApp();
  await app.initialize();
  
  // 将应用实例暴露到全局（用于调试）
  if (process.env.NODE_ENV === 'development') {
    window.app = app;
  }
}

// 页面加载完成后启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}