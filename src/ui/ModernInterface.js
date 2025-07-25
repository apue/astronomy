/**
 * 现代界面系统
 * 响应式设计、无障碍支持、视觉主题优化
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';

export class ModernInterface {
  constructor() {
    this.theme = 'dark';
    this.colorScheme = {
      dark: {
        primary: '#ffd700',
        secondary: '#ff6b35',
        background: '#0a0a0a',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        accent: '#00bcd4',
        error: '#ff4444',
        success: '#4caf50',
        warning: '#ff9800'
      },
      light: {
        primary: '#1976d2',
        secondary: '#ff6b35',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#212121',
        textSecondary: '#666666',
        accent: '#00bcd4',
        error: '#f44336',
        success: '#4caf50',
        warning: '#ff9800'
      }
    };

    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };

    this.isInitialized = false;
    this.currentView = 'main';
    this.accessibility = {
      fontSize: 16,
      highContrast: false,
      reducedMotion: false,
      screenReader: false
    };

    this.initialize();
  }

  initialize() {
    console.log('🎨 Initializing Modern Interface...');

    this.createRootStyles();
    this.setupResponsiveDesign();
    this.setupBasicAccessibility();
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('✅ Modern Interface initialized');
  }

  /**
   * 创建根样式系统
   */
  createRootStyles() {
    const root = document.documentElement;
    const colors = this.colorScheme[this.theme];

    // CSS变量定义
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // 响应式变量
    root.style.setProperty('--mobile-breakpoint', `${this.breakpoints.mobile}px`);
    root.style.setProperty('--tablet-breakpoint', `${this.breakpoints.tablet}px`);
    root.style.setProperty('--desktop-breakpoint', `${this.breakpoints.desktop}px`);

    // 动画变量
    root.style.setProperty('--transition-fast', '0.15s ease');
    root.style.setProperty('--transition-normal', '0.3s ease');
    root.style.setProperty('--transition-slow', '0.5s ease');
  }

  /**
   * 设置响应式设计
   */
  setupResponsiveDesign() {
    this.createViewportMeta();
    this.createMediaQueries();
    this.setupTouchGestures();
  }

  /**
   * 设置触摸手势支持
   */
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTouchEnd = 0;

    // 防止双击缩放
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // 处理触摸开始
    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = new Date().getTime();
      }
    }, { passive: true });

    // 处理触摸移动
    document.addEventListener('touchmove', (event) => {
      // 在移动设备上防止页面滚动
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);

        // 如果移动距离超过阈值，认为是手势操作而非点击
        if (deltaX > 10 || deltaY > 10) {
          event.preventDefault();
        }
      }
    }, { passive: false });

    // 处理触摸结束
    document.addEventListener('touchend', (event) => {
      if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const deltaTime = new Date().getTime() - touchStartTime;

        // 识别滑动手势
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
          // 水平滑动
          if (deltaX > 0) {
            // 向右滑动
            this.handleSwipeRight();
          } else {
            // 向左滑动
            this.handleSwipeLeft();
          }
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50 && deltaTime < 300) {
          // 垂直滑动
          if (deltaY > 0) {
            // 向下滑动
            this.handleSwipeDown();
          } else {
            // 向上滑动
            this.handleSwipeUp();
          }
        }
      }
    }, { passive: true });

    // 处理双指缩放手势
    let initialDistance = 0;

    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          this.handlePinchZoom(scale);
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      initialDistance = 0;
    }, { passive: true });
  }

  /**
   * 处理向右滑动
   */
  handleSwipeRight() {
    eventSystem.emit('swipeRight');
    // 在移动设备上显示侧边栏或返回上一视图
    this.showNotification('向右滑动 - 显示菜单', 'info', 1500);
  }

  /**
   * 处理向左滑动
   */
  handleSwipeLeft() {
    eventSystem.emit('swipeLeft');
    // 在移动设备上隐藏侧边栏或进入下一视图
    this.showNotification('向左滑动 - 隐藏菜单', 'info', 1500);
  }

  /**
   * 处理向上滑动
   */
  handleSwipeUp() {
    eventSystem.emit('swipeUp');
    // 在移动设备上显示控制面板
    this.showNotification('向上滑动 - 显示控制面板', 'info', 1500);
  }

  /**
   * 处理向下滑动
   */
  handleSwipeDown() {
    eventSystem.emit('swipeDown');
    // 在移动设备上隐藏控制面板
    this.showNotification('向下滑动 - 隐藏控制面板', 'info', 1500);
  }

  /**
   * 处理双指缩放
   */
  handlePinchZoom(scale) {
    eventSystem.emit('pinchZoom', { scale });
  }

  createViewportMeta() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    document.head.appendChild(meta);
  }

  createMediaQueries() {
    const style = document.createElement('style');
    style.textContent = `
      /* 移动设备优化 */
      @media (max-width: ${this.breakpoints.mobile}px) {
        .ui-panel {
          width: 100% !important;
          max-width: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
        }
        
        .ui-button {
          min-height: 44px;
          min-width: 44px;
        }
        
        .ui-text {
          font-size: 14px;
          line-height: 1.5;
        }
      }

      /* 平板设备优化 */
      @media (min-width: ${this.breakpoints.mobile + 1}px) and (max-width: ${this.breakpoints.tablet}px) {
        .ui-panel {
          width: 80% !important;
          max-width: 600px !important;
        }
      }

      /* 桌面设备优化 */
      @media (min-width: ${this.breakpoints.desktop}px) {
        .ui-panel {
          width: 400px !important;
        }
      }

      /* 高对比度模式 */
      @media (prefers-contrast: high) {
        :root {
          --color-background: #000000;
          --color-surface: #ffffff;
          --color-text: #ffffff;
          --color-text-secondary: #ffffff;
        }
      }

      /* 减少动画模式 */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 设置基础无障碍支持
   */
  setupBasicAccessibility() {
    this.createAccessibilityStyles();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    // 移除无障碍面板 - 功能重复且遮挡视图
  }

  createAccessibilityStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* 焦点指示器 */
      .focus-visible:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      /* 高对比度模式 */
      .high-contrast {
        filter: contrast(1.5) !important;
      }

      /* 大字体模式 */
      .large-font {
        font-size: 1.2em !important;
      }

      /* 屏幕阅读器专用 */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* 跳过链接 */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--color-primary);
        color: var(--color-background);
        padding: 8px;
        text-decoration: none;
        border-radius: 0 0 8px 0;
        z-index: 1000;
      }

      .skip-link:focus {
        top: 0;
      }
    `;
    document.head.appendChild(style);
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKeys(event);
        break;
      }
    });
  }

  setupScreenReaderSupport() {
    // ARIA live regions
    this.createLiveRegions();

    // 语义化标记
    this.addSemanticMarkup();
  }

  createLiveRegions() {
    const announcements = document.createElement('div');
    announcements.setAttribute('aria-live', 'polite');
    announcements.setAttribute('aria-atomic', 'true');
    announcements.className = 'sr-only';
    announcements.id = 'announcements';
    document.body.appendChild(announcements);
  }

  addSemanticMarkup() {
    // 添加地标和角色
    document.body.setAttribute('role', 'application');
    document.body.setAttribute('aria-label', '金星凌日测距教学系统');
  }


  /**
   * 设置主题
   */
  setTheme(theme) {
    this.theme = theme;
    this.createRootStyles();

    if (theme === 'high-contrast') {
      document.body.classList.add('high-contrast');
      this.setHighContrast(true);
    } else {
      document.body.classList.remove('high-contrast');
    }

    eventSystem.emit('themeChanged', { theme });
  }

  /**
   * 设置字体大小
   */
  setFontSize(size) {
    this.accessibility.fontSize = size;
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
    document.body.style.fontSize = `${size}px`;
  }

  /**
   * 设置减少动画
   */
  setReducedMotion(enabled) {
    this.accessibility.reducedMotion = enabled;
    document.documentElement.style.setProperty('--animations-enabled', enabled ? '0' : '1');
  }

  /**
   * 设置高对比度
   */
  setHighContrast(enabled) {
    this.accessibility.highContrast = enabled;
    document.body.classList.toggle('high-contrast', enabled);
  }

  /**
   * 创建简化的导航栏
   */
  createModernNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'modern-nav';
    nav.innerHTML = `
      <div class="nav-brand">
        <h1>金星凌日测距教学</h1>
        <span class="nav-subtitle">18世纪天文观测重现</span>
      </div>
      
      <div class="nav-controls">
        <button class="nav-btn" data-action="help" aria-label="显示帮助信息" title="查看操作指南和快捷键说明">
          帮助
        </button>
        <button class="nav-btn" data-action="reset-view" aria-label="重置视角" title="将相机重置到默认位置">
          重置视角
        </button>
      </div>
    `;

    this.styleNavigation(nav);
    document.body.appendChild(nav);
    this.setupNavigationControls(nav);
  }

  styleNavigation(nav) {
    nav.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--color-primary);
      padding: 8px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      transition: var(--transition-normal);
      min-height: 50px;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .nav-brand h1 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.3em;
        font-weight: 300;
      }
      
      .nav-subtitle {
        color: var(--color-text-secondary);
        font-size: 0.8em;
        display: none;
      }
      
      .nav-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .nav-btn {
        background: transparent;
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
        padding: 6px 12px;
        border-radius: 15px;
        cursor: pointer;
        transition: var(--transition-fast);
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85em;
        min-height: 36px;
        white-space: nowrap;
      }
      
      .nav-btn:hover,
      .nav-btn:active {
        background: var(--color-primary);
        color: var(--color-background);
      }
      
      /* 移动端优化 */
      @media (max-width: 768px) {
        .modern-nav {
          padding: 6px 10px !important;
          min-height: 45px !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 8px;
        }
        
        .nav-brand {
          text-align: center;
        }
        
        .nav-brand h1 {
          font-size: 1.1em !important;
        }
        
        .nav-subtitle {
          display: block !important;
          font-size: 0.75em !important;
        }
        
        .nav-controls {
          justify-content: center !important;
          gap: 6px !important;
        }
        
        .nav-btn {
          padding: 5px 10px !important;
          font-size: 0.8em !important;
          min-height: 32px !important;
          flex: 1;
          max-width: 80px;
          justify-content: center;
        }
      }
      
      @media (max-width: 480px) {
        .nav-btn {
          font-size: 0.75em !important;
          padding: 4px 8px !important;
          min-height: 30px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupNavigationControls(nav) {
    nav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.closest('.nav-btn').dataset.action;
        this.handleNavigationAction(action);
      });
    });
  }

  handleNavigationAction(action) {
    switch (action) {
    case 'help':
      this.showHelpModal();
      break;
    case 'reset-view':
      // 发送重置视角事件
      eventSystem.emit('resetCameraView');
      this.showNotification('视角已重置', 'info', 2000);
      break;
    }
  }

  /**
   * 创建简化的控制面板
   */
  createModernControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'modern-control-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h2>基础控制</h2>
        <button class="panel-toggle" aria-label="折叠面板" title="点击折叠或展开控制面板">−</button>
      </div>
      
      <div class="panel-content">
        <div class="control-section">
          <h3>时间控制</h3>
          <div class="time-controls">
            <button class="control-btn" data-action="play-pause" title="播放/暂停时间">
              播放/暂停
            </button>
            <button class="control-btn" data-action="speed-up" title="加快时间速度">
              加速
            </button>
            <button class="control-btn" data-action="speed-down" title="减慢时间速度">
              减速
            </button>
            <button class="control-btn" data-action="reset" title="重置时间到凌日开始">
              重置时间
            </button>
          </div>
          <div class="speed-display">
            <span>当前速度: </span>
            <span id="speed-value">100x</span>
          </div>
        </div>
        
        <div class="control-section">
          <h3>观测选择</h3>
          <div class="observation-controls">
            <label for="observation-year">选择观测年份:</label>
            <select id="observation-year" title="选择要观测的金星凌日年份">
              <option value="1761">1761年金星凌日</option>
              <option value="1769">1769年金星凌日</option>
            </select>
          </div>
        </div>
        
        <div class="control-section">
          <h3>快速聚焦</h3>
          <div class="focus-controls">
            <button class="control-btn" data-action="focus-sun" title="聚焦到太阳">
              聚焦太阳
            </button>
            <button class="control-btn" data-action="focus-earth" title="聚焦到地球">
              聚焦地球
            </button>
            <button class="control-btn" data-action="focus-venus" title="聚焦到金星">
              聚焦金星
            </button>
          </div>
        </div>
      </div>
    `;

    this.styleControlPanel(panel);
    document.body.appendChild(panel);
    this.setupControlPanel(panel);
  }

  styleControlPanel(panel) {
    panel.style.cssText = `
      position: fixed;
      top: 70px;
      right: 15px;
      width: 280px;
      background: rgba(26, 26, 26, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      color: var(--color-text);
      z-index: 99;
      transition: var(--transition-normal);
    `;

    const style = document.createElement('style');
    style.textContent = `
      .modern-control-panel {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        border-bottom: 1px solid var(--color-surface);
      }
      
      .panel-header h2 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.1em;
        font-weight: 400;
      }
      
      .panel-toggle {
        background: none;
        border: none;
        color: var(--color-text);
        cursor: pointer;
        font-size: 1.3em;
        padding: 4px;
        min-height: 32px;
        min-width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .panel-content {
        padding: 15px;
      }
      
      .control-section {
        margin-bottom: 20px;
      }
      
      .control-section h3 {
        margin: 0 0 10px 0;
        color: var(--color-secondary);
        font-size: 0.95em;
        font-weight: 500;
      }
      
      .time-controls, .observation-controls, .focus-controls {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      
      .observation-controls label {
        display: block;
        margin-bottom: 6px;
        color: var(--color-secondary);
        font-size: 0.85em;
      }
      
      .focus-controls {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 5px;
      }
      
      .control-btn {
        background: var(--color-surface);
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: var(--transition-fast);
        font-size: 0.8em;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      
      .control-btn:hover,
      .control-btn:active {
        background: var(--color-primary);
        color: var(--color-background);
      }
      
      select {
        width: 100%;
        padding: 6px;
        background: var(--color-surface);
        border: 1px solid var(--color-text-secondary);
        border-radius: 4px;
        color: var(--color-text);
        margin-bottom: 6px;
        font-size: 0.85em;
      }
      
      .speed-display {
        margin-top: 6px;
        color: var(--color-text-secondary);
        font-size: 0.8em;
      }
      
      /* 移动端优化 */
      @media (max-width: 768px) {
        .modern-control-panel {
          position: fixed !important;
          bottom: 15px !important;
          left: 10px !important;
          right: 10px !important;
          top: auto !important;
          width: auto !important;
          max-height: 40vh !important;
          overflow-y: auto !important;
        }
        
        .panel-content {
          padding: 12px !important;
        }
        
        .control-section {
          margin-bottom: 15px !important;
        }
        
        .control-section h3 {
          font-size: 0.9em !important;
          margin-bottom: 8px !important;
        }
        
        .time-controls {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 5px !important;
        }
        
        .focus-controls {
          grid-template-columns: 1fr 1fr 1fr !important;
          gap: 4px !important;
        }
        
        .control-btn {
          font-size: 0.75em !important;
          padding: 8px 6px !important;
          min-height: 40px !important;
        }
        
        .panel-header {
          padding: 10px 12px !important;
        }
        
        .panel-header h2 {
          font-size: 1em !important;
        }
      }
      
      @media (max-width: 480px) {
        .modern-control-panel {
          bottom: 10px !important;
          left: 5px !important;
          right: 5px !important;
          max-height: 35vh !important;
        }
        
        .time-controls {
          grid-template-columns: 1fr 1fr !important;
        }
        
        .focus-controls {
          grid-template-columns: 1fr !important;
          gap: 6px !important;
        }
        
        .control-btn {
          font-size: 0.7em !important;
          min-height: 42px !important;
          padding: 10px 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupControlPanel(panel) {
    // 设置折叠功能
    const toggleBtn = panel.querySelector('.panel-toggle');
    const content = panel.querySelector('.panel-content');

    toggleBtn.addEventListener('click', () => {
      const isExpanded = content.style.display !== 'none';
      content.style.display = isExpanded ? 'none' : 'block';
      toggleBtn.textContent = isExpanded ? '+' : '−';
    });

    // 设置控制按钮
    panel.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleControlAction(action);
      });
    });

    // 设置年份选择框
    const yearSelect = panel.querySelector('#observation-year');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        eventSystem.emit('observationYearChanged', { year: parseInt(e.target.value) });
        this.showNotification(`已切换到${e.target.value}年金星凌日`, 'info', 2000);
      });
    }
  }

  handleControlAction(action) {
    switch (action) {
    case 'play-pause':
      eventSystem.emit('timeControlAction', { action: 'toggle' });
      this.showNotification('时间播放状态已切换', 'info', 1500);
      break;
    case 'speed-up':
      eventSystem.emit('timeControlAction', { action: 'speedUp' });
      this.showNotification('时间速度已加快', 'info', 1500);
      break;
    case 'speed-down':
      eventSystem.emit('timeControlAction', { action: 'speedDown' });
      this.showNotification('时间速度已减慢', 'info', 1500);
      break;
    case 'reset':
      eventSystem.emit('timeControlAction', { action: 'reset' });
      this.showNotification('时间已重置到凌日开始', 'info', 2000);
      break;
    case 'focus-sun':
      eventSystem.emit('focusCelestialBody', { target: 'sun' });
      this.showNotification('已聚焦到太阳', 'info', 1500);
      break;
    case 'focus-earth':
      eventSystem.emit('focusCelestialBody', { target: 'earth' });
      this.showNotification('已聚焦到地球', 'info', 1500);
      break;
    case 'focus-venus':
      eventSystem.emit('focusCelestialBody', { target: 'venus' });
      this.showNotification('已聚焦到金星', 'info', 1500);
      break;
    }
  }

  /**
   * 创建简化的帮助模态框
   */
  createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" aria-hidden="true"></div>
      <div class="modal-content" role="dialog" aria-labelledby="help-title">
        <div class="modal-header">
          <h2 id="help-title">操作指南</h2>
          <button class="modal-close" aria-label="关闭帮助">×</button>
        </div>
        <div class="modal-body">
          <section class="help-section">
            <h3>🖱️ 鼠标控制</h3>
            <ul>
              <li><strong>拖拽：</strong>旋转视角，观察不同角度的天体</li>
              <li><strong>滚轮：</strong>缩放视图，靠近或远离天体</li>
              <li><strong>点击天体：</strong>查看天体详细信息</li>
            </ul>
          </section>
          
          <section class="help-section">
            <h3>⌨️ 键盘快捷键</h3>
            <ul>
              <li><strong>空格键：</strong>快速暂停/播放时间</li>
              <li><strong>数字键 1：</strong>聚焦到太阳</li>
              <li><strong>数字键 2：</strong>聚焦到地球</li>
              <li><strong>数字键 3：</strong>聚焦到金星</li>
              <li><strong>R键：</strong>重置相机到默认视角</li>
              <li><strong>C键：</strong>显示/隐藏时间控制面板</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>🎛️ 界面控制</h3>
            <ul>
              <li><strong>右侧控制面板：</strong>控制时间播放和速度</li>
              <li><strong>快速跳转按钮：</strong>直接跳到金星凌日的关键时刻</li>
              <li><strong>顶部导航栏：</strong>访问帮助、设置和重置功能</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>🌟 关于金星凌日</h3>
            <p>金星凌日是指金星在地球和太阳之间经过，在太阳表面留下黑色小圆点的天文现象。18世纪的天文学家通过观测不同地点的凌日时间差异，成功计算出了地球到太阳的距离。</p>
          </section>
        </div>
      </div>
    `;

    this.styleModal(modal);
    document.body.appendChild(modal);
    this.setupModalControls(modal);
  }

  styleModal(modal) {
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1001;
      display: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
      }
      
      .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-surface);
        border: 1px solid var(--color-primary);
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        color: var(--color-text);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid var(--color-surface);
      }
      
      .modal-header h2 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.2em;
      }
      
      .modal-close {
        background: none;
        border: none;
        color: var(--color-text);
        font-size: 1.5em;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .modal-close:hover,
      .modal-close:active {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .modal-body {
        padding: 15px 20px 20px;
      }
      
      .help-section {
        margin-bottom: 20px;
      }
      
      .help-section h3 {
        color: var(--color-secondary);
        margin: 0 0 10px 0;
        font-size: 1.05em;
      }
      
      .help-section ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .help-section li {
        margin-bottom: 6px;
        line-height: 1.4;
        font-size: 0.9em;
      }
      
      .help-section p {
        line-height: 1.5;
        font-size: 0.9em;
        margin-bottom: 10px;
      }
      
      /* 移动端优化 */
      @media (max-width: 768px) {
        .modal-content {
          width: 95% !important;
          max-width: none !important;
          max-height: 85vh !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
        }
        
        .modal-header {
          padding: 12px 15px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .modal-header h2 {
          font-size: 1.1em !important;
        }
        
        .modal-close {
          width: 36px !important;
          height: 36px !important;
          font-size: 1.3em !important;
        }
        
        .modal-body {
          padding: 12px 15px 15px !important;
        }
        
        .help-section {
          margin-bottom: 15px !important;
        }
        
        .help-section h3 {
          font-size: 1em !important;
          margin-bottom: 8px !important;
        }
        
        .help-section ul {
          padding-left: 15px !important;
        }
        
        .help-section li {
          font-size: 0.85em !important;
          line-height: 1.3 !important;
          margin-bottom: 5px !important;
        }
        
        .help-section p {
          font-size: 0.85em !important;
          line-height: 1.4 !important;
        }
      }
      
      @media (max-width: 480px) {
        .modal-content {
          width: 98% !important;
          max-height: 90vh !important;
        }
        
        .modal-header {
          padding: 10px 12px !important;
        }
        
        .modal-header h2 {
          font-size: 1em !important;
        }
        
        .modal-body {
          padding: 10px 12px 12px !important;
        }
        
        .help-section li,
        .help-section p {
          font-size: 0.8em !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupModalControls(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    const closeModal = () => {
      modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });
  }

  /**
   * 显示帮助
   */
  showHelpModal() {
    let modal = document.getElementById('help-modal');
    if (!modal) {
      this.createHelpModal();
      modal = document.getElementById('help-modal');
    }

    if (modal) {
      modal.style.display = 'block';
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  }


  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventSystem.subscribe('themeChanged', (data) => {
      this.updateTheme(data.theme);
    });

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // 系统主题偏好
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.userSetTheme) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  handleResize() {
    const isMobile = window.innerWidth <= this.breakpoints.mobile;
    const isTablet = window.innerWidth <= this.breakpoints.tablet;

    eventSystem.emit('viewportChanged', {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  updateTheme(theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  }

  /**
   * 创建加载指示器
   */
  createModernLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'modern-loader';
    loader.innerHTML = `
      <div class="loader-container">
        <div class="loader-orbit">
          <div class="loader-planet venus"></div>
          <div class="loader-planet earth"></div>
        </div>
        <div class="loader-sun"></div>
        <div class="loader-text">正在加载天体...</div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .modern-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .loader-container {
        text-align: center;
      }
      
      .loader-orbit {
        position: relative;
        width: 200px;
        height: 200px;
        margin: 0 auto 20px;
      }
      
      .loader-sun {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, #ffd700, #ff6b35);
        border-radius: 50%;
        box-shadow: 0 0 20px #ffd700;
      }
      
      .loader-planet {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: orbit 3s linear infinite;
      }
      
      .loader-planet.venus {
        background: #e6b89c;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(0deg) translateX(60px);
        animation-delay: -1s;
      }
      
      .loader-planet.earth {
        background: #4fc3f7;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(0deg) translateX(90px);
      }
      
      @keyframes orbit {
        from { transform: translate(-50%, -50%) rotate(0deg) translateX(var(--orbit-radius)); }
        to { transform: translate(-50%, -50%) rotate(360deg) translateX(var(--orbit-radius)); }
      }
      
      .loader-text {
        color: var(--color-primary);
        font-size: 1.2em;
        font-weight: 300;
      }
    `;
    document.head.appendChild(style);

    return loader;
  }

  /**
   * 获取当前设置
   */
  getCurrentSettings() {
    return {
      theme: this.theme,
      fontSize: this.accessibility.fontSize,
      reducedMotion: this.accessibility.reducedMotion,
      highContrast: this.accessibility.highContrast
    };
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');

    this.styleNotification(notification);
    document.body.appendChild(notification);

    // 动画进入
    setTimeout(() => notification.classList.add('show'), 100);

    // 自动移除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  styleNotification(notification) {
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1002;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .notification-info { background: var(--color-accent); }
      .notification-success { background: var(--color-success); }
      .notification-warning { background: var(--color-warning); }
      .notification-error { background: var(--color-error); }
      .notification.show { transform: translateX(0); }
    `;
    document.head.appendChild(style);
  }
}

// 创建全局实例
export const modernInterface = new ModernInterface();
export default ModernInterface;
