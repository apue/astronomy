/**
 * 工具提示系统
 * 提供智能的悬停提示和信息显示
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';

export class TooltipSystem {
  constructor() {
    this.tooltip = null;
    this.isVisible = false;
    this.currentTarget = null;
    this.hideTimeout = null;
    this.mouse = { x: 0, y: 0 };

    this.initialize();
  }

  initialize() {
    console.log('💬 Initializing Tooltip System...');

    this.createTooltip();
    this.setupEventListeners();
    this.setupMouseTracking();

    console.log('✅ Tooltip System initialized');
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'system-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 12px;
      padding: 15px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      color: white;
      pointer-events: none;
      z-index: 10001;
      opacity: 0;
      transform: scale(0.8) translateY(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      max-width: 300px;
      line-height: 1.4;
    `;

    document.body.appendChild(this.tooltip);
  }

  setupEventListeners() {
    // 监听天体悬停事件
    eventSystem.subscribe(EventTypes.CELESTIAL_BODY_HOVERED, (data) => {
      if (data.isHovered) {
        this.showCelestialTooltip(data.body);
      } else {
        this.hide();
      }
    });

    // 监听观测点选择事件
    eventSystem.subscribe(EventTypes.OBSERVATION_POINT_SELECTED, (data) => {
      this.showNotificationTooltip(`已选择观测点: ${data.point.name}`, 'success');
    });

    // 监听错误事件
    eventSystem.subscribe(EventTypes.ERROR_OCCURRED, (data) => {
      this.showNotificationTooltip(data.error.message || '发生错误', 'error');
    });
  }

  setupMouseTracking() {
    document.addEventListener('mousemove', (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;

      if (this.isVisible) {
        this.updatePosition();
      }
    });
  }

  /**
   * 显示天体工具提示
   */
  showCelestialTooltip(celestialBody) {
    let content = '';

    switch (celestialBody.name.toLowerCase()) {
    case 'earth':
      content = this.getEarthTooltipContent();
      break;
    case 'sun':
      content = this.getSunTooltipContent();
      break;
    case 'venus':
      content = this.getVenusTooltipContent();
      break;
    default:
      content = this.getGenericTooltipContent(celestialBody);
    }

    this.show(content);
  }

  /**
   * 获取地球工具提示内容
   */
  getEarthTooltipContent() {
    return `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #ffd700; margin-bottom: 8px;">
          🌍 地球
        </div>
        <div style="color: #cccccc; margin-bottom: 10px;">
          点击查看历史观测点
        </div>
        <div style="font-size: 12px; color: #999;">
          包含1761年和1769年<br>
          金星凌日观测网络
        </div>
      </div>
    `;
  }

  /**
   * 获取太阳工具提示内容
   */
  getSunTooltipContent() {
    return `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #ffd700; margin-bottom: 8px;">
          ☀️ 太阳
        </div>
        <div style="color: #cccccc; margin-bottom: 8px;">
          金星凌日的观测目标
        </div>
        <div style="font-size: 12px; color: #999;">
          直径: 1,392,700 km<br>
          距离地球: 149.6 百万 km
        </div>
      </div>
    `;
  }

  /**
   * 获取金星工具提示内容
   */
  getVenusTooltipContent() {
    return `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #ffd700; margin-bottom: 8px;">
          ♀️ 金星
        </div>
        <div style="color: #cccccc; margin-bottom: 8px;">
          凌日现象的主角
        </div>
        <div style="font-size: 12px; color: #999;">
          直径: 12,104 km<br>
          轨道周期: 225 天<br>
          下次凌日: 2117年
        </div>
      </div>
    `;
  }

  /**
   * 获取通用工具提示内容
   */
  getGenericTooltipContent(celestialBody) {
    const info = celestialBody.getInfo ? celestialBody.getInfo() : {};

    return `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #ffd700; margin-bottom: 8px;">
          ${info.name || celestialBody.name}
        </div>
        <div style="color: #cccccc; margin-bottom: 8px;">
          ${info.type || '天体'}
        </div>
        ${info.radius ? `<div style="font-size: 12px; color: #999;">半径: ${(info.radius / 1000).toFixed(0)} km</div>` : ''}
      </div>
    `;
  }

  /**
   * 显示通知类型的工具提示
   */
  showNotificationTooltip(message, type = 'info', duration = 3000) {
    const colors = {
      info: '#4ecdc4',
      success: '#95e1d3',
      warning: '#fce38a',
      error: '#ff6b6b'
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const content = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">${icons[type]}</span>
        <span style="color: ${colors[type]};">${message}</span>
      </div>
    `;

    this.show(content);

    // 自动隐藏
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * 显示工具提示
   */
  show(content) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.tooltip.innerHTML = content;
    this.isVisible = true;
    this.updatePosition();

    // 显示动画
    requestAnimationFrame(() => {
      this.tooltip.style.opacity = '1';
      this.tooltip.style.transform = 'scale(1) translateY(0)';
    });
  }

  /**
   * 隐藏工具提示
   */
  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'scale(0.8) translateY(10px)';

    this.hideTimeout = setTimeout(() => {
      this.tooltip.innerHTML = '';
    }, 300);
  }

  /**
   * 更新工具提示位置
   */
  updatePosition() {
    if (!this.isVisible) return;

    const offset = 15;
    let x = this.mouse.x + offset;
    let y = this.mouse.y + offset;

    // 防止工具提示超出窗口边界
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x + tooltipRect.width > windowWidth) {
      x = this.mouse.x - tooltipRect.width - offset;
    }

    if (y + tooltipRect.height > windowHeight) {
      y = this.mouse.y - tooltipRect.height - offset;
    }

    // 确保不会超出左上角
    x = Math.max(10, x);
    y = Math.max(10, y);

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  /**
   * 显示键盘快捷键提示
   */
  showKeyboardShortcuts() {
    const shortcuts = `
      <div style="text-align: left;">
        <div style="font-size: 16px; color: #ffd700; margin-bottom: 10px; text-align: center;">
          ⌨️ 键盘快捷键
        </div>
        <div style="font-size: 12px; line-height: 1.6;">
          <div><span style="color: #ffd700;">空格键</span> - 暂停/继续时间</div>
          <div><span style="color: #ffd700;">R</span> - 重置相机视角</div>
          <div><span style="color: #ffd700;">1/2/3</span> - 聚焦太阳/地球/金星</div>
          <div><span style="color: #ffd700;">O</span> - 显示观测点信息</div>
          <div><span style="color: #ffd700;">V</span> - 望远镜视图</div>
          <div><span style="color: #ffd700;">ESC</span> - 关闭弹窗</div>
        </div>
      </div>
    `;

    this.show(shortcuts);
  }

  /**
   * 显示加载提示
   */
  showLoadingTooltip(message) {
    const content = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid #ffd700;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span>${message}</span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    this.show(content);
  }

  /**
   * 销毁工具提示系统
   */
  dispose() {
    console.log('🗑️ Disposing Tooltip System...');

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }

    this.tooltip = null;
    this.isVisible = false;

    console.log('✅ Tooltip System disposed');
  }
}

// 创建全局实例
export const tooltipSystem = new TooltipSystem();
export default TooltipSystem;
