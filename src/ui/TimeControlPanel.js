/**
 * 时间控制面板组件
 * 提供完整的用户界面用于控制时间、观测和演示
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { timeController } from '../core/TimeController.js';
import { advancedTimeController } from '../systems/AdvancedTimeController.js';
import { transitCalculator } from '../systems/TransitCalculator.js';

export class TimeControlPanel {
  constructor(container = null) {
    this.container = container || document.body;
    this.isVisible = false;
    this.isDragging = false;
    this.panel = null;
    this.controls = {};
    
    this.initialize();
  }

  initialize() {
    this.createPanel();
    this.setupEventListeners();
    this.bindToEvents();
  }

  /**
   * 创建控制面板
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'time-control-panel';
    this.panel.innerHTML = `
      <div class="time-panel-header">
        <h3>⏰ 时间控制面板</h3>
        <button class="close-btn" title="关闭">×</button>
      </div>
      
      <div class="time-panel-content">
        <!-- 时间显示 -->
        <div class="time-display">
          <div class="current-time">
            <label>当前时间：</label>
            <span id="current-time-display">--</span>
          </div>
          <div class="julian-date">
            <label>儒略日：</label>
            <span id="julian-date-display">--</span>
          </div>
        </div>

        <!-- 播放控制 -->
        <div class="playback-controls">
          <div class="control-row">
            <button id="btn-play-pause" class="control-btn" title="播放/暂停">▶️</button>
            <button id="btn-step-back" class="control-btn" title="后退1天">◀️</button>
            <button id="btn-step-forward" class="control-btn" title="前进1天">▶️</button>
            <button id="btn-reset" class="control-btn" title="重置到凌日开始">🔄</button>
          </div>
          
          <div class="speed-control">
            <label>速度：</label>
            <input type="range" id="speed-slider" min="0.01" max="1000" value="100" step="0.01">
            <span id="speed-display">100x</span>
          </div>
        </div>

        <!-- 时间模式 -->
        <div class="time-modes">
          <label>时间模式：</label>
          <select id="time-mode-select">
            <option value="accelerated">加速模式</option>
            <option value="step_by_step">步进模式</option>
            <option value="contact_mode">接触模式</option>
            <option value="observation_mode">观测模式</option>
          </select>
        </div>

        <!-- 凌日事件 -->
        <div class="transit-events">
          <h4>🌟 凌日事件</h4>
          <div class="transit-buttons">
            <button class="transit-btn" data-year="1761" data-contact="first">1761年第一次接触</button>
            <button class="transit-btn" data-year="1761" data-contact="second">第二次接触</button>
            <button class="transit-btn" data-year="1761" data-contact="third">第三次接触</button>
            <button class="transit-btn" data-year="1761" data-contact="fourth">第四次接触</button>
          </div>
          <div class="transit-buttons">
            <button class="transit-btn" data-year="1769" data-contact="first">1769年第一次接触</button>
            <button class="transit-btn" data-year="1769" data-contact="second">第二次接触</button>
            <button class="transit-btn" data-year="1769" data-contact="third">第三次接触</button>
            <button class="transit-btn" data-year="1769" data-contact="fourth">第四次接触</button>
          </div>
        </div>

        <!-- 精确控制 -->
        <div class="precise-controls">
          <h4>🔍 精确控制</h4>
          <div class="precise-row">
            <button id="btn-step-contact" class="precise-btn">步进到接触点</button>
            <button id="btn-step-keypoint" class="precise-btn">步进到关键点</button>
            <button id="btn-step-measurement" class="precise-btn">步进到测量点</button>
          </div>
        </div>

        <!-- 演示模式 -->
        <div class="demo-section">
          <h4>🎓 教学演示</h4>
          <select id="demo-sequence-select">
            <option value="">选择演示序列</option>
            <option value="完整1761凌日">完整1761凌日演示</option>
            <option value="视差测量演示">视差测量演示</option>
          </select>
          <div class="demo-controls">
            <button id="btn-start-demo" class="demo-btn">开始演示</button>
            <button id="btn-stop-demo" class="demo-btn" disabled>停止演示</button>
          </div>
        </div>

        <!-- 书签管理 -->
        <div class="bookmark-section">
          <h4>🔖 书签管理</h4>
          <div class="bookmark-add">
            <input type="text" id="bookmark-label" placeholder="书签名称">
            <button id="btn-add-bookmark">添加书签</button>
          </div>
          <div class="bookmark-list" id="bookmark-list">
            <div class="bookmark-item">暂无书签</div>
          </div>
        </div>

        <!-- 观测记录 -->
        <div class="observation-section">
          <h4>📊 观测记录</h4>
          <div class="observation-controls">
            <button id="btn-record-observation">记录观测</button>
            <button id="btn-export-data">导出数据</button>
          </div>
          <div class="observation-log" id="observation-log">
            <div class="log-item">暂无观测记录</div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <label>时间进度：</label>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <span id="progress-text">0%</span>
          </div>
        </div>

        <!-- 凌日状态 -->
        <div class="transit-status">
          <h4>🌟 凌日状态</h4>
          <div id="transit-info">
            <div>当前状态：无凌日</div>
            <div>下一次凌日：--</div>
          </div>
        </div>
      </div>

      <!-- 拖动手柄 -->
      <div class="drag-handle"></div>
    `;
    
    this.setupStyles();
    this.setupControls();
    this.bindEvents();
  }

  /**
   * 设置样式
   */
  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #time-control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 80vh;
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid #ffd700;
        border-radius: 10px;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        overflow-y: auto;
        transition: all 0.3s ease;
      }

      #time-control-panel.hidden {
        transform: translateX(100%);
        opacity: 0;
      }

      .time-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        cursor: move;
      }

      .time-panel-header h3 {
        margin: 0;
        color: #ffd700;
        font-size: 14px;
      }

      .close-btn {
        background: none;
        border: none;
        color: #ffd700;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .time-panel-content {
        padding: 15px;
      }

      .time-display {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
      }

      .time-display div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .time-display label {
        color: #ffd700;
        font-weight: bold;
      }

      .control-row, .precise-row {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
      }

      .control-btn, .precise-btn, .demo-btn, .transit-btn {
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid #ffd700;
        color: #ffd700;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }

      .control-btn:hover, .precise-btn:hover, .demo-btn:hover, .transit-btn:hover {
        background: rgba(255, 215, 0, 0.3);
        transform: translateY(-1px);
      }

      .control-btn:disabled, .demo-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .speed-control {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .speed-control label {
        color: #ffd700;
        white-space: nowrap;
      }

      #speed-slider {
        flex: 1;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        outline: none;
        -webkit-appearance: none;
      }

      #speed-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        background: #ffd700;
        border-radius: 50%;
        cursor: pointer;
      }

      .transit-events, .precise-controls, .demo-section, .bookmark-section, .observation-section {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 5px;
      }

      .transit-events h4, .precise-controls h4, .demo-section h4, .bookmark-section h4, .observation-section h4 {
        margin: 0 0 10px 0;
        color: #ffd700;
        font-size: 12px;
      }

      .transit-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin-bottom: 5px;
      }

      .bookmark-add {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
      }

      .bookmark-add input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        color: white;
        padding: 5px;
        border-radius: 3px;
        font-size: 11px;
      }

      .bookmark-add input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }

      .bookmark-list, .observation-log {
        max-height: 100px;
        overflow-y: auto;
        font-size: 10px;
      }

      .bookmark-item, .log-item {
        padding: 3px;
        margin-bottom: 2px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
        cursor: pointer;
      }

      .bookmark-item:hover, .log-item:hover {
        background: rgba(255, 215, 0, 0.1);
      }

      .progress-section {
        margin-bottom: 15px;
      }

      .progress-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .progress-bar {
        flex: 1;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #ffd700;
        transition: width 0.3s ease;
        width: 0%;
      }

      .drag-handle {
        position: absolute;
        top: 0;
        left: -5px;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
        background: transparent;
      }

      select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        color: white;
        padding: 5px;
        border-radius: 3px;
        font-size: 11px;
        width: 100%;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 设置控制引用
   */
  setupControls() {
    this.controls = {
      playPause: this.panel.querySelector('#btn-play-pause'),
      stepBack: this.panel.querySelector('#btn-step-back'),
      stepForward: this.panel.querySelector('#btn-step-forward'),
      reset: this.panel.querySelector('#btn-reset'),
      speedSlider: this.panel.querySelector('#speed-slider'),
      speedDisplay: this.panel.querySelector('#speed-display'),
      timeModeSelect: this.panel.querySelector('#time-mode-select'),
      stepContact: this.panel.querySelector('#btn-step-contact'),
      stepKeypoint: this.panel.querySelector('#btn-step-keypoint'),
      stepMeasurement: this.panel.querySelector('#btn-step-measurement'),
      demoSequenceSelect: this.panel.querySelector('#demo-sequence-select'),
      startDemo: this.panel.querySelector('#btn-start-demo'),
      stopDemo: this.panel.querySelector('#btn-stop-demo'),
      addBookmark: this.panel.querySelector('#btn-add-bookmark'),
      bookmarkLabel: this.panel.querySelector('#bookmark-label'),
      bookmarkList: this.panel.querySelector('#bookmark-list'),
      recordObservation: this.panel.querySelector('#btn-record-observation'),
      exportData: this.panel.querySelector('#btn-export-data'),
      currentTime: this.panel.querySelector('#current-time-display'),
      julianDate: this.panel.querySelector('#julian-date-display'),
      progressFill: this.panel.querySelector('#progress-fill'),
      progressText: this.panel.querySelector('#progress-text'),
      transitInfo: this.panel.querySelector('#transit-info'),
      logContainer: this.panel.querySelector('#observation-log')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 播放控制
    this.controls.playPause.addEventListener('click', () => {
      if (window.timeController) {
        window.timeController.togglePlayState();
      }
    });
    
    this.controls.stepBack.addEventListener('click', () => {
      advancedTimeController.stepTime(-1);
    });
    
    this.controls.stepForward.addEventListener('click', () => {
      advancedTimeController.stepTime(1);
    });
    
    this.controls.reset.addEventListener('click', () => {
      if (window.timeController) {
        window.timeController.jumpToTime(new Date('1761-06-06T02:19:00Z'));
      }
    });
    
    // 速度控制
    this.controls.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (window.timeController) {
        window.timeController.setSpeed(speed);
      }
      this.controls.speedDisplay.textContent = `${speed}x`;
    });
    
    // 时间模式
    this.controls.timeModeSelect.addEventListener('change', (e) => {
      advancedTimeController.setTimeMode(e.target.value);
    });
    
    // 精确控制
    this.controls.stepContact.addEventListener('click', () => {
      advancedTimeController.stepTime(1, 'contact');
    });
    
    this.controls.stepKeypoint.addEventListener('click', () => {
      advancedTimeController.stepTime(1, 'keypoint');
    });
    
    this.controls.stepMeasurement.addEventListener('click', () => {
      advancedTimeController.stepTime(1, 'measurement');
    });
    
    // 演示控制
    this.controls.startDemo.addEventListener('click', () => {
      const sequence = this.controls.demoSequenceSelect.value;
      if (sequence) {
        advancedTimeController.startDemoSequence(sequence);
      }
    });
    
    this.controls.stopDemo.addEventListener('click', () => {
      advancedTimeController.stopDemoSequence();
    });
    
    // 书签管理
    this.controls.addBookmark.addEventListener('click', () => {
      const label = this.controls.bookmarkLabel.value.trim() || '书签';
      if (window.timeController) {
        advancedTimeController.addBookmark(window.timeController.getTime(), label);
      }
      this.updateBookmarks();
    });
    
    // 观测记录
    this.controls.recordObservation.addEventListener('click', () => {
      this.recordObservation();
    });
    
    this.controls.exportData.addEventListener('click', () => {
      this.exportData();
    });
    
    // 凌日事件按钮
    this.panel.querySelectorAll('.transit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const year = parseInt(e.target.dataset.year);
        const contact = e.target.dataset.contact;
        const contactTime = transitCalculator.getHistoricalObservations(year)[0]?.contactTimes?.contactTimes[contact];
        if (contactTime) {
          timeController.jumpToTime(contactTime);
        }
      });
    });
    
    // 面板控制
    this.panel.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });
    
    // 拖动功能
    this.makeDraggable();
  }

  /**
   * 绑定系统事件
   */
  bindToEvents() {
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.updateTimeDisplay(data);
      this.updateTransitStatus(data.time);
    });
    
    eventSystem.subscribe('timeModeChanged', (data) => {
      this.updateModeDisplay(data.mode);
    });
    
    eventSystem.subscribe('bookmarkAdded', () => {
      this.updateBookmarks();
    });
    
    eventSystem.subscribe('observationAdded', () => {
      this.updateLog();
    });
    
    eventSystem.subscribe('demoStep', (data) => {
      this.updateDemoControls(data);
    });
  }

  /**
   * 更新时间显示
   */
  updateTimeDisplay(data) {
    if (this.controls.currentTime) {
      this.controls.currentTime.textContent = data.formattedTime || data.time.toISOString().slice(0, 19);
    }
    
    if (this.controls.julianDate) {
      this.controls.julianDate.textContent = data.julianDate?.toFixed(6) || '--';
    }
    
    if (this.controls.progressFill && this.controls.progressText) {
      const progress = data.progress || 0;
      this.controls.progressFill.style.width = `${progress}%`;
      this.controls.progressText.textContent = `${progress.toFixed(1)}%`;
    }
  }

  /**
   * 更新凌日状态
   */
  updateTransitStatus(currentTime) {
    const status = transitCalculator.getTransitStatus(currentTime);
    
    if (this.controls.transitInfo) {
      if (status.isTransiting) {
        const distance = transitCalculator.calculateHistoricalAUDistance(status.year);
        this.controls.transitInfo.innerHTML = `
          <div>当前状态：${status.year}年凌日进行中</div>
          <div>阶段：${status.phase}</div>
          <div>进度：${status.progress.toFixed(1)}%</div>
          <div>计算AU：${distance?.calculatedDistance?.toFixed(0) || '--'} km</div>
        `;
      } else {
        const nextTransit = transitCalculator.getNextTransit(currentTime);
        this.controls.transitInfo.innerHTML = `
          <div>当前状态：无凌日</div>
          <div>下一次凌日：${nextTransit?.date.toUTCString().slice(0, 16) || '--'}</div>
        `;
      }
    }
  }

  /**
   * 更新书签列表
   */
  updateBookmarks() {
    const bookmarks = advancedTimeController.getBookmarks();
    
    if (this.controls.bookmarkList) {
      if (bookmarks.length === 0) {
        this.controls.bookmarkList.innerHTML = '<div class="bookmark-item">暂无书签</div>';
      } else {
        this.controls.bookmarkList.innerHTML = bookmarks.map(bookmark => `
          <div class="bookmark-item" data-id="${bookmark.id}">
            <span>${bookmark.label}</span>
            <small>${bookmark.time.toISOString().slice(0, 16)}</small>
          </div>
        `).join('');
        
        // 绑定书签点击事件
        this.controls.bookmarkList.querySelectorAll('.bookmark-item').forEach(item => {
          item.addEventListener('click', (e) => {
            const bookmarkId = parseInt(e.currentTarget.dataset.id);
            advancedTimeController.jumpToBookmark(bookmarkId);
          });
        });
      }
    }
  }

  /**
   * 更新观测日志
   */
  updateLog() {
    const logs = advancedTimeController.getObservationLog();
    
    if (this.controls.logContainer) {
      if (logs.length === 0) {
        this.controls.logContainer.innerHTML = '<div class="log-item">暂无观测记录</div>';
      } else {
        this.controls.logContainer.innerHTML = logs.slice(-5).map(log => `
          <div class="log-item">
            <small>${log.time.toISOString().slice(0, 16)}</small>
            <div>${log.observation.type || '观测'}</div>
          </div>
        `).join('');
      }
    }
  }

  /**
   * 记录观测
   */
  recordObservation() {
    if (!window.timeController) return;
    
    const currentTime = window.timeController.getTime();
    const status = transitCalculator.getTransitStatus(currentTime);
    
    const observation = {
      type: 'manual_observation',
      timestamp: currentTime,
      transitStatus: status,
      notes: `手动记录于 ${currentTime.toISOString()}`
    };
    
    advancedTimeController.addObservation(currentTime, observation);
  }

  /**
   * 导出数据
   */
  exportData() {
    const data = advancedTimeController.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `astronomy_observations_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * 使面板可拖动
   */
  makeDraggable() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
      if (e.target.closest('.time-panel-header') || e.target.classList.contains('drag-handle')) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
      }
    };

    const dragEnd = () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        this.panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    };

    this.panel.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  }

  /**
   * 显示面板
   */
  show() {
    this.isVisible = true;
    this.panel.classList.remove('hidden');
    this.updateBookmarks();
    this.updateLog();
    this.container.appendChild(this.panel);
  }

  /**
   * 隐藏面板
   */
  hide() {
    this.isVisible = false;
    this.panel.classList.add('hidden');
    setTimeout(() => {
      if (this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
      }
    }, 300);
  }

  /**
   * 切换显示状态
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 销毁面板
   */
  destroy() {
    this.hide();
    if (this.panel) {
      this.panel.remove();
    }
  }
}

// 创建全局实例
export const timeControlPanel = new TimeControlPanel();

export default TimeControlPanel;