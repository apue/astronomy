/**
 * UI集成系统
 * 连接现代界面与现有系统，提供统一的用户体验
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { modernInterface } from './ModernInterface.js';
import { timeController } from '../core/TimeController.js';
import { historicalObservationSystem } from '../systems/HistoricalObservationSystem.js';
import { parallaxEngine } from '../systems/ParallaxCalculationEngine.js';
import { educationalGuidanceSystem } from '../systems/EducationalGuidanceSystem.js';
import { userDataRecorder } from '../systems/UserDataRecorder.js';

export class UIIntegration {
  constructor() {
    this.isInitialized = false;
    this.currentSpeed = 100;
    this.currentYear = 1761;
    this.currentTelescope = '18th_century_refractor';

    this.initialize();
  }

  initialize() {
    console.log('🔗 Initializing UI Integration...');
    this.setupEventListeners();
    this.setupUIControls();
    this.syncUIState();

    this.isInitialized = true;
    console.log('✅ UI Integration initialized');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 时间控制事件
    eventSystem.subscribe('timeControlAction', (data) => {
      this.handleTimeControlAction(data.action);
    });

    // 观测年份变更
    eventSystem.subscribe('observationYearChanged', (data) => {
      this.handleObservationYearChange(data.year);
    });

    // 望远镜类型变更
    eventSystem.subscribe('telescopeTypeChanged', (data) => {
      this.handleTelescopeTypeChange(data.type);
    });

    // 视差计算结果
    eventSystem.subscribe('parallaxCalculated', (data) => {
      this.updateCalculationDisplay(data);
    });

    // 教育进度
    eventSystem.subscribe('tutorialStarted', (data) => {
      this.showTutorialNotification(data.tutorialId, data.title);
    });

    eventSystem.subscribe('tutorialCompleted', (data) => {
      this.showAchievementNotification(data.achievement);
    });

    // 系统状态
    eventSystem.subscribe('systemStateChanged', (data) => {
      this.updateStatusDisplay(data);
    });
  }

  /**
   * 设置UI控制
   */
  setupUIControls() {
    // 时间控制
    this.setupTimeControl();
    this.setupObservationControl();
    this.setupCalculationDisplay();
    this.setupTutorialIntegration();
  }

  /**
   * 时间控制
   */
  setupTimeControl() {
    const speedDisplay = document.getElementById('speed-value');
    if (speedDisplay) {
      speedDisplay.textContent = `${this.currentSpeed}x`;
    }

    // 监听实际时间变化
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.updateTimeDisplay(data.time);
    });
  }

  handleTimeControlAction(action) {
    switch (action) {
    case 'toggle':
      timeController.togglePause();
      modernInterface.showNotification(
        timeController.isPaused ? '时间已暂停' : '时间继续运行',
        'info'
      );
      break;
    case 'speedUp':
      this.currentSpeed = Math.min(this.currentSpeed * 2, 10000);
      timeController.setSpeed(this.currentSpeed);
      this.updateSpeedDisplay();
      break;
    case 'speedDown':
      this.currentSpeed = Math.max(this.currentSpeed / 2, 1);
      timeController.setSpeed(this.currentSpeed);
      this.updateSpeedDisplay();
      break;
    case 'reset':
      this.currentSpeed = 100;
      timeController.setSpeed(this.currentSpeed);
      const transitDate = new Date('1761-06-06T05:00:00Z');
      timeController.setTime(transitDate);
      modernInterface.showNotification('已重置到1761年金星凌日', 'success');
      break;
    }
  }

  /**
   * 观测控制
   */
  setupObservationControl() {
    // 监听历史观测点变化
    eventSystem.subscribe('historicalPointsUpdated', (data) => {
      this.updateHistoricalPointsDisplay(data.points);
    });
  }

  handleObservationYearChange(year) {
    this.currentYear = year;
    historicalObservationSystem.setActiveYear(year);

    modernInterface.showNotification(
      `已切换到${year}年金星凌日观测`,
      'success'
    );

    this.updateYearDisplay();
  }

  handleTelescopeTypeChange(type) {
    this.currentTelescope = type;

    const telescopeNames = {
      '18th_century_refractor': '18世纪折射望远镜',
      'quadrant_telescope': '象限仪望远镜',
      'achromatic_refractor': '消色差折射望远镜'
    };

    modernInterface.showNotification(
      `已选择: ${telescopeNames[type] || type}`,
      'info'
    );
  }

  /**
   * 计算结果显示
   */
  setupCalculationDisplay() {
    this.createCalculationPanel();
  }

  createCalculationPanel() {
    const panel = document.createElement('div');
    panel.id = 'calculation-panel';
    panel.className = 'calculation-display-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>实时计算结果</h3>
        <button class="panel-close" aria-label="关闭">×</button>
      </div>
      <div class="panel-content">
        <div class="calculation-item">
          <label>当前天文单位距离:</label>
          <span id="current-au">-</span> km
        </div>
        <div class="calculation-item">
          <label>计算精度:</label>
          <span id="calculation-accuracy">-</span> %
        </div>
        <div class="calculation-item">
          <label>观测点数:</label>
          <span id="observation-count">-</span>
        </div>
        <div class="calculation-item">
          <label>基线长度:</label>
          <span id="baseline-length">-</span> km
        </div>
      </div>
    `;

    this.styleCalculationPanel(panel);
    document.body.appendChild(panel);

    // 设置关闭按钮
    panel.querySelector('.panel-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  styleCalculationPanel(panel) {
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      width: 300px;
      background: rgba(26, 26, 26, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      color: var(--color-text);
      z-index: 99;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .calculation-display-panel .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--color-surface);
      }

      .calculation-display-panel h3 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.1em;
        font-weight: 500;
      }

      .calculation-display-panel .panel-close {
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

      .calculation-display-panel .panel-content {
        padding: 20px;
      }

      .calculation-item {
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .calculation-item label {
        color: var(--color-text-secondary);
        font-size: 0.9em;
      }

      .calculation-item span {
        color: var(--color-primary);
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  updateCalculationDisplay(data) {
    const panel = document.getElementById('calculation-panel');
    if (panel && panel.style.display !== 'none') {
      document.getElementById('current-au').textContent =
        data.calculatedAU ? data.calculatedAU.toLocaleString() : '-';
      document.getElementById('calculation-accuracy').textContent =
        data.error ? data.error.toFixed(2) : '-';
      document.getElementById('observation-count').textContent =
        data.observationCount || '-';
      document.getElementById('baseline-length').textContent =
        data.baseline ? data.baseline.toLocaleString() : '-';
    }
  }

  /**
   * 教程集成
   */
  setupTutorialIntegration() {
    // 创建教程选择器
    this.createTutorialSelector();
  }

  createTutorialSelector() {
    const selector = document.createElement('div');
    selector.id = 'tutorial-selector';
    selector.className = 'tutorial-selector';
    selector.innerHTML = `
      <div class="selector-header">
        <h3>选择教程</h3>
        <button class="selector-close" aria-label="关闭">×</button>
      </div>
      <div class="selector-content">
        <div class="tutorial-list" id="tutorial-list">
          <!-- 教程列表将动态生成 -->
        </div>
      </div>
    `;

    this.styleTutorialSelector(selector);
    document.body.appendChild(selector);

    // 设置关闭按钮
    selector.querySelector('.selector-close').addEventListener('click', () => {
      selector.style.display = 'none';
    });

    this.populateTutorialList();
  }

  styleTutorialSelector(selector) {
    selector.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 90vw;
      max-height: 70vh;
      background: rgba(26, 26, 26, 0.98);
      backdrop-filter: blur(15px);
      border: 1px solid var(--color-primary);
      border-radius: 16px;
      color: var(--color-text);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      overflow: hidden;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .tutorial-selector .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--color-surface);
      }

      .tutorial-selector h3 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.3em;
        font-weight: 500;
      }

      .tutorial-selector .selector-close {
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

      .tutorial-selector .selector-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .tutorial-item {
        padding: 15px;
        margin-bottom: 10px;
        background: var(--color-surface);
        border-radius: 8px;
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .tutorial-item:hover {
        background: var(--color-primary);
        color: var(--color-background);
      }

      .tutorial-item h4 {
        margin: 0 0 5px 0;
        font-size: 1.1em;
      }

      .tutorial-item p {
        margin: 0;
        font-size: 0.9em;
        opacity: 0.8;
      }

      .tutorial-item .difficulty {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-left: 5px;
      }

      .tutorial-item .difficulty.beginner {
        background: var(--color-success);
        color: white;
      }

      .tutorial-item .difficulty.intermediate {
        background: var(--color-warning);
        color: black;
      }

      .tutorial-item .difficulty.advanced,
      .tutorial-item .difficulty.expert {
        background: var(--color-error);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  populateTutorialList() {
    const tutorials = educationalGuidanceSystem.getAvailableTutorials();
    const listContainer = document.getElementById('tutorial-list');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    tutorials.forEach(tutorial => {
      const item = document.createElement('div');
      item.className = 'tutorial-item';
      item.innerHTML = `
        <h4>${tutorial.title}</h4>
        <p>${tutorial.description}</p>
        <span class="difficulty ${tutorial.difficulty}">${tutorial.difficulty}</span>
        <small>预计时间: ${tutorial.estimatedTime}</small>
      `;

      item.addEventListener('click', () => {
        educationalGuidanceSystem.startTutorial(tutorial.id);
        document.getElementById('tutorial-selector').style.display = 'none';
      });

      listContainer.appendChild(item);
    });
  }

  /**
   * 显示通知
   */
  showTutorialNotification(tutorialId, title) {
    modernInterface.showNotification(`开始教程: ${title}`, 'info', 3000);
  }

  showAchievementNotification(achievement) {
    modernInterface.showNotification(`🎉 获得成就: ${achievement}`, 'success', 5000);
  }

  /**
   * 更新显示
   */
  updateTimeDisplay(time) {
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
      timeDisplay.textContent = time.toUTCString();
    }
  }

  updateSpeedDisplay() {
    const speedDisplay = document.getElementById('speed-value');
    if (speedDisplay) {
      speedDisplay.textContent = `${this.currentSpeed}x`;
    }
  }

  updateYearDisplay() {
    const yearSelect = document.getElementById('observation-year');
    if (yearSelect) {
      yearSelect.value = this.currentYear.toString();
    }
  }

  updateHistoricalPointsDisplay(points) {
    // 更新历史观测点显示
    console.log(`Updated historical points: ${points.length} active`);
  }

  updateStatusDisplay(data) {
    // 更新系统状态显示
    console.log('System status updated:', data);
  }

  /**
   * 同步UI状态
   */
  syncUIState() {
    // 确保所有UI组件显示正确状态
    this.updateSpeedDisplay();
    this.updateYearDisplay();
  }

  /**
   * 显示/隐藏计算面板
   */
  toggleCalculationPanel() {
    const panel = document.getElementById('calculation-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * 显示教程选择器
   */
  showTutorialSelector() {
    const selector = document.getElementById('tutorial-selector');
    if (selector) {
      selector.style.display = 'block';
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return {
      currentSpeed: this.currentSpeed,
      currentYear: this.currentYear,
      currentTelescope: this.currentTelescope,
      tutorials: educationalGuidanceSystem.getAvailableTutorials(),
      achievements: educationalGuidanceSystem.getUserAchievements()
    };
  }
}

// 创建全局实例
export const uiIntegration = new UIIntegration();
export default UIIntegration;
