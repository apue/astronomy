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
    this.setupAccessibility();
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
    this.setupMobileGestures();
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
   * 设置无障碍支持
   */
  setupAccessibility() {
    this.createAccessibilityStyles();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.createAccessibilityPanel();
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

  createAccessibilityPanel() {
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.innerHTML = `
      <h2 id="accessibility-title">无障碍设置</h2>
      
      <div class="accessibility-section">
        <label for="theme-toggle">主题:</label>
        <select id="theme-toggle" aria-label="选择界面主题">
          <option value="dark">深色主题</option>
          <option value="light">浅色主题</option>
          <option value="high-contrast">高对比度</option>
        </select>
      </div>
      
      <div class="accessibility-section">
        <label for="font-size">字体大小:</label>
        <input type="range" id="font-size" min="12" max="24" value="16" aria-label="调整字体大小">
        <span id="font-size-value">16px</span>
      </div>
      
      <div class="accessibility-section">
        <label>
          <input type="checkbox" id="reduced-motion" aria-label="减少动画效果">
          减少动画效果
        </label>
      </div>
      
      <div class="accessibility-section">
        <label>
          <input type="checkbox" id="high-contrast" aria-label="启用高对比度模式">
          高对比度模式
        </label>
      </div>
    `;
    
    this.styleAccessibilityPanel(panel);
    document.body.appendChild(panel);
    this.setupAccessibilityControls(panel);
  }

  styleAccessibilityPanel(panel) {
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: var(--color-surface);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-panel h2 {
        color: var(--color-primary);
        margin: 0 0 20px 0;
        font-size: 1.2em;
      }
      
      .accessibility-section {
        margin-bottom: 15px;
      }
      
      .accessibility-section label {
        display: block;
        margin-bottom: 5px;
        color: var(--color-text);
        font-weight: 500;
      }
      
      .accessibility-section input,
      .accessibility-section select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--color-text-secondary);
        border-radius: 4px;
        background: var(--color-background);
        color: var(--color-text);
      }
    `;
    document.head.appendChild(style);
  }

  setupAccessibilityControls(panel) {
    const themeToggle = panel.querySelector('#theme-toggle');
    const fontSize = panel.querySelector('#font-size');
    const fontSizeValue = panel.querySelector('#font-size-value');
    const reducedMotion = panel.querySelector('#reduced-motion');
    const highContrast = panel.querySelector('#high-contrast');

    themeToggle.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });

    fontSize.addEventListener('input', (e) => {
      this.setFontSize(parseInt(e.target.value));
      fontSizeValue.textContent = `${e.target.value}px`;
    });

    reducedMotion.addEventListener('change', (e) => {
      this.setReducedMotion(e.target.checked);
    });

    highContrast.addEventListener('change', (e) => {
      this.setHighContrast(e.target.checked);
    });
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
   * 创建现代导航栏
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
        <button class="nav-btn" data-action="help" aria-label="帮助">
          <span class="icon">❓</span>
          帮助
        </button>
        <button class="nav-btn" data-action="settings" aria-label="设置">
          <span class="icon">⚙️</span>
          设置
        </button>
        <button class="nav-btn" data-action="accessibility" aria-label="无障碍设置">
          <span class="icon">♿</span>
          无障碍
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
      background: rgba(10, 10, 10, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--color-primary);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      transition: var(--transition-normal);
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .nav-brand h1 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.5em;
        font-weight: 300;
      }
      
      .nav-subtitle {
        color: var(--color-text-secondary);
        font-size: 0.9em;
      }
      
      .nav-controls {
        display: flex;
        gap: 10px;
      }
      
      .nav-btn {
        background: transparent;
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        transition: var(--transition-fast);
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .nav-btn:hover {
        background: var(--color-primary);
        color: var(--color-background);
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
      case 'settings':
        this.showSettingsModal();
        break;
      case 'accessibility':
        this.toggleAccessibilityPanel();
        break;
    }
  }

  /**
   * 创建现代控制面板
   */
  createModernControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'modern-control-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h2>控制面板</h2>
        <button class="panel-toggle" aria-label="折叠面板">⋯</button>
      </div>
      
      <div class="panel-content">
        <div class="control-section">
          <h3>时间控制</h3>
          <div class="time-controls">
            <button class="control-btn" data-action="play-pause">⏯️</button>
            <button class="control-btn" data-action="speed-up">⏩</button>
            <button class="control-btn" data-action="speed-down">⏪</button>
            <button class="control-btn" data-action="reset">🔄</button>
          </div>
          <div class="speed-display">
            <span>速度: </span>
            <span id="speed-value">100x</span>
          </div>
        </div>
        
        <div class="control-section">
          <h3>观测设置</h3>
          <div class="observation-controls">
            <select id="observation-year" aria-label="选择观测年份">
              <option value="1761">1761年金星凌日</option>
              <option value="1769">1769年金星凌日</option>
            </select>
            <select id="telescope-type" aria-label="选择望远镜类型">
              <option value="18th_century_refractor">18世纪折射望远镜</option>
              <option value="quadrant_telescope">象限仪望远镜</option>
              <option value="achromatic_refractor">消色差折射望远镜</option>
            </select>
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
      top: 80px;
      right: 20px;
      width: 320px;
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
        padding: 16px 20px;
        border-bottom: 1px solid var(--color-surface);
      }
      
      .panel-header h2 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.2em;
        font-weight: 400;
      }
      
      .panel-toggle {
        background: none;
        border: none;
        color: var(--color-text);
        cursor: pointer;
        font-size: 1.5em;
      }
      
      .panel-content {
        padding: 20px;
      }
      
      .control-section {
        margin-bottom: 24px;
      }
      
      .control-section h3 {
        margin: 0 0 12px 0;
        color: var(--color-secondary);
        font-size: 1em;
        font-weight: 500;
      }
      
      .time-controls, .observation-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .control-btn {
        background: var(--color-surface);
        border: 1px solid var(--color-primary);
        color: var(--color-primary);
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: var(--transition-fast);
        font-size: 1.2em;
      }
      
      .control-btn:hover {
        background: var(--color-primary);
        color: var(--color-background);
      }
      
      select {
        width: 100%;
        padding: 8px;
        background: var(--color-surface);
        border: 1px solid var(--color-text-secondary);
        border-radius: 4px;
        color: var(--color-text);
        margin-bottom: 8px;
      }
      
      .speed-display {
        margin-top: 8px;
        color: var(--color-text-secondary);
        font-size: 0.9em;
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
      toggleBtn.textContent = isExpanded ? '⋮' : '⋯';
    });
    
    // 设置控制按钮
    panel.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleControlAction(action);
      });
    });
    
    // 设置选择框
    const yearSelect = panel.querySelector('#observation-year');
    const telescopeSelect = panel.querySelector('#telescope-type');
    
    yearSelect.addEventListener('change', (e) => {
      eventSystem.emit('observationYearChanged', { year: parseInt(e.target.value) });
    });
    
    telescopeSelect.addEventListener('change', (e) => {
      eventSystem.emit('telescopeTypeChanged', { type: e.target.value });
    });
  }

  handleControlAction(action) {
    switch (action) {
      case 'play-pause':
        eventSystem.emit('timeControlAction', { action: 'toggle' });
        break;
      case 'speed-up':
        eventSystem.emit('timeControlAction', { action: 'speedUp' });
        break;
      case 'speed-down':
        eventSystem.emit('timeControlAction', { action: 'speedDown' });
        break;
      case 'reset':
        eventSystem.emit('timeControlAction', { action: 'reset' });
        break;
    }
  }

  /**
   * 创建帮助模态框
   */
  createHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" aria-hidden="true"></div>
      <div class="modal-content" role="dialog" aria-labelledby="help-title">
        <div class="modal-header">
          <h2 id="help-title">帮助中心</h2>
          <button class="modal-close" aria-label="关闭帮助">×</button>
        </div>
        <div class="modal-body">
          <section class="help-section">
            <h3>基本操作</h3>
            <ul>
              <li><strong>鼠标拖拽：</strong>旋转视角</li>
              <li><strong>滚轮：</strong>缩放视图</li>
              <li><strong>空格键：</strong>暂停/继续时间</li>
              <li><strong>方向键：</strong>调整时间速度</li>
            </ul>
          </section>
          
          <section class="help-section">
            <h3>快捷键</h3>
            <ul>
              <li><strong>1/2/3：</strong>聚焦太阳/地球/金星</li>
              <li><strong>R：</strong>重置相机视角</li>
              <li><strong>T：</strong>显示凌日信息</li>
              <li><strong>C：</strong>显示/隐藏时间控制</li>
              <li><strong>O：</strong>显示历史观测点</li>
              <li><strong>G：</strong>显示教育引导</li>
              <li><strong>P：</strong>显示视差计算</li>
            </ul>
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
        padding: 20px;
        border-bottom: 1px solid var(--color-surface);
      }
      
      .modal-header h2 {
        margin: 0;
        color: var(--color-primary);
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
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .help-section {
        margin-bottom: 24px;
      }
      
      .help-section h3 {
        color: var(--color-secondary);
        margin: 0 0 12px 0;
      }
      
      .help-section ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .help-section li {
        margin-bottom: 8px;
        line-height: 1.5;
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
    const modal = document.getElementById('help-modal') || this.createHelpModal();
    modal.style.display = 'block';
    modal.querySelector('.modal-close').focus();
  }

  showSettingsModal() {
    this.toggleAccessibilityPanel();
  }

  toggleAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
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