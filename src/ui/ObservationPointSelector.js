/**
 * 观测点选择器 - 显示历史金星凌日观测点
 * 用于展示1761年和1769年的全球观测网络
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { historicalObservationSystem } from '../systems/HistoricalObservationSystem.js';

export class ObservationPointSelector {
  constructor() {
    this.isVisible = false;
    this.selectedYear = 1761;
    this.selectedPoint = null;
    this.modal = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听地球点击事件
    eventSystem.subscribe('earthClicked', () => {
      this.show();
    });

    // 监听年份切换
    eventSystem.subscribe('observationYearChanged', (data) => {
      this.selectedYear = data.year;
      if (this.isVisible) {
        this.updateObservationPointsList();
      }
    });

    // 监听ESC键关闭
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * 显示观测点选择器
   */
  show() {
    if (this.isVisible) return;

    this.createModal();
    this.isVisible = true;

    // 添加淡入动画
    setTimeout(() => {
      if (this.modal) {
        this.modal.style.opacity = '1';
        const modalContent = this.modal.querySelector('.obs-modal-content');
        if (modalContent) {
          modalContent.style.transform = 'scale(1) translateY(0)';
        }
      }
    }, 10);

    console.log('🔭 Observation Point Selector shown');
  }

  /**
   * 隐藏观测点选择器
   */
  hide() {
    if (!this.isVisible || !this.modal) return;

    this.modal.style.opacity = '0';

    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.isVisible = false;
    }, 300);

    console.log('🔭 Observation Point Selector hidden');
  }

  /**
   * 创建模态框
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'observation-point-selector';
    this.modal.innerHTML = this.getModalHTML();

    // 设置样式
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(5px);
    `;

    document.body.appendChild(this.modal);
    this.setupModalEventListeners();
  }

  /**
   * 获取模态框HTML
   */
  getModalHTML() {
    const observationPoints1761 = historicalObservationSystem.getHistoricalObservationPoints(1761);
    const observationPoints1769 = historicalObservationSystem.getHistoricalObservationPoints(1769);

    return `
      <div class="obs-modal-content" style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 20px;
        padding: 30px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.2);
        position: relative;
        transform: scale(0.9) translateY(20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <!-- 关闭按钮 -->
        <button class="obs-close-btn" style="
          position: absolute;
          top: 15px;
          right: 20px;
          background: none;
          border: none;
          color: #ffd700;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
        ">&times;</button>

        <!-- 标题 -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #ffd700; margin: 0 0 10px 0; font-size: 28px;">
            🌍 历史观测点选择
          </h2>
          <p style="color: #cccccc; margin: 0; font-size: 16px;">
            选择金星凌日观测点，体验18世纪天文学家的观测视角
          </p>
        </div>

        <!-- 年份选择器 -->
        <div class="year-selector" style="
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          gap: 10px;
        ">
          <button class="year-btn ${this.selectedYear === 1761 ? 'active' : ''}" data-year="1761" style="
            padding: 12px 24px;
            border: 2px solid #ffd700;
            background: ${this.selectedYear === 1761 ? '#ffd700' : 'transparent'};
            color: ${this.selectedYear === 1761 ? '#000' : '#ffd700'};
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
          ">1761年金星凌日</button>
          <button class="year-btn ${this.selectedYear === 1769 ? 'active' : ''}" data-year="1769" style="
            padding: 12px 24px;
            border: 2px solid #ffd700;
            background: ${this.selectedYear === 1769 ? '#ffd700' : 'transparent'};
            color: ${this.selectedYear === 1769 ? '#000' : '#ffd700'};
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
          ">1769年金星凌日</button>
        </div>

        <!-- 观测点列表 -->
        <div class="observation-points-list">
          ${this.getObservationPointsHTML()}
        </div>

        <!-- 底部信息 -->
        <div style="
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 215, 0, 0.2);
          color: #999;
          font-size: 14px;
        ">
          <p>💡 点击任意观测点进入望远镜视角，按ESC键关闭窗口</p>
        </div>
      </div>
    `;
  }

  /**
   * 获取观测点HTML
   */
  getObservationPointsHTML() {
    const points = historicalObservationSystem.getHistoricalObservationPoints(this.selectedYear);

    if (!points || points.length === 0) {
      return '<p style="text-align: center; color: #666;">暂无观测点数据</p>';
    }

    return `
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      ">
        ${points.map(point => this.getObservationPointHTML(point)).join('')}
      </div>
    `;
  }

  /**
   * 获取单个观测点HTML
   */
  getObservationPointHTML(point) {
    const contactTimes = point.contactTimes;
    const duration = contactTimes ? this.calculateTransitDuration(contactTimes.first, contactTimes.fourth) : 'N/A';

    return `
      <div class="observation-point-card" data-point-id="${point.id}" style="
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 15px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(255, 215, 0, 0.2)'" 
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
        
        <!-- 观测点标题 -->
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="
            width: 12px;
            height: 12px;
            background: #ffd700;
            border-radius: 50%;
            margin-right: 10px;
          "></div>
          <h3 style="margin: 0; color: #ffd700; font-size: 18px;">${point.name}</h3>
        </div>

        <!-- 观测者信息 -->
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #ffffff; font-weight: bold;">
            👨‍🔬 观测者: ${point.observer}
          </p>
          <p style="margin: 0; color: #cccccc; font-size: 14px;">
            🔭 望远镜: ${point.telescope}
          </p>
        </div>

        <!-- 地理位置 -->
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #ffffff;">
            📍 位置: ${point.location.latitude.toFixed(2)}°, ${point.location.longitude.toFixed(2)}°
          </p>
          <p style="margin: 0; color: #cccccc; font-size: 14px;">
            🏔️ 海拔: ${point.location.elevation}米
          </p>
        </div>

        <!-- 观测时间 -->
        ${contactTimes ? `
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #ffffff;">⏰ 观测时间:</p>
          <div style="color: #cccccc; font-size: 13px; line-height: 1.4;">
            第一接触: ${this.formatTime(contactTimes.first)}<br>
            第二接触: ${this.formatTime(contactTimes.second)}<br>
            第三接触: ${this.formatTime(contactTimes.third)}<br>
            第四接触: ${this.formatTime(contactTimes.fourth)}
          </div>
        </div>
        ` : ''}

        <!-- 观测精度和备注 -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="
            background: rgba(255, 215, 0, 0.2);
            color: #ffd700;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
          ">📊 精度: ${point.accuracy || 'N/A'}</span>
          <span style="
            background: rgba(0, 255, 100, 0.2);
            color: #00ff64;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
          ">⏱️ ${duration}</span>
        </div>

        <!-- 备注 -->
        ${point.notes ? `
        <div style="
          margin-top: 15px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border-left: 3px solid #ffd700;
        ">
          <p style="margin: 0; color: #cccccc; font-size: 13px; font-style: italic;">
            💭 ${point.notes}
          </p>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 设置模态框事件监听器
   */
  setupModalEventListeners() {
    if (!this.modal) return;

    // 关闭按钮
    const closeBtn = this.modal.querySelector('.obs-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // 点击背景关闭
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    // 年份切换按钮
    const yearBtns = this.modal.querySelectorAll('.year-btn');
    yearBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const year = parseInt(event.target.dataset.year);
        this.switchYear(year);
      });
    });

    // 观测点卡片点击
    const pointCards = this.modal.querySelectorAll('.observation-point-card');
    pointCards.forEach(card => {
      card.addEventListener('click', (event) => {
        const pointId = event.currentTarget.dataset.pointId;
        this.selectObservationPoint(pointId);
      });
    });
  }

  /**
   * 切换年份
   */
  switchYear(year) {
    if (this.selectedYear === year) return;

    this.selectedYear = year;
    historicalObservationSystem.setCurrentYear(year);

    // 更新观测点列表
    this.updateObservationPointsList();

    // 更新年份按钮样式
    this.updateYearButtons();

    eventSystem.emit('observationYearChanged', { year });
  }

  /**
   * 更新观测点列表
   */
  updateObservationPointsList() {
    if (!this.modal) return;

    const listContainer = this.modal.querySelector('.observation-points-list');
    if (listContainer) {
      listContainer.innerHTML = this.getObservationPointsHTML();

      // 重新绑定事件监听器
      const pointCards = listContainer.querySelectorAll('.observation-point-card');
      pointCards.forEach(card => {
        card.addEventListener('click', (event) => {
          const pointId = event.currentTarget.dataset.pointId;
          this.selectObservationPoint(pointId);
        });
      });
    }
  }

  /**
   * 更新年份按钮样式
   */
  updateYearButtons() {
    if (!this.modal) return;

    const yearBtns = this.modal.querySelectorAll('.year-btn');
    yearBtns.forEach(btn => {
      const year = parseInt(btn.dataset.year);
      const isActive = year === this.selectedYear;

      btn.style.background = isActive ? '#ffd700' : 'transparent';
      btn.style.color = isActive ? '#000' : '#ffd700';
    });
  }

  /**
   * 选择观测点
   */
  selectObservationPoint(pointId) {
    const point = historicalObservationSystem.getObservationPointDetails(pointId);

    if (point) {
      this.selectedPoint = point;

      console.log(`🔭 Selected observation point: ${point.name} (${point.observer})`);

      // 发射观测点选择事件
      eventSystem.emit(EventTypes.OBSERVATION_POINT_SELECTED, {
        point,
        year: this.selectedYear
      });

      // 关闭选择器
      this.hide();
    }
  }

  /**
   * 计算凌日持续时间
   */
  calculateTransitDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';

    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  /**
   * 格式化时间显示
   */
  formatTime(date) {
    if (!date) return 'N/A';
    return `${date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    })} UTC`;
  }

  /**
   * 获取当前选中的观测点
   */
  getSelectedPoint() {
    return this.selectedPoint;
  }

  /**
   * 获取当前选中的年份
   */
  getSelectedYear() {
    return this.selectedYear;
  }

  /**
   * 检查是否可见
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * 销毁选择器
   */
  dispose() {
    this.hide();
    // 清理事件监听器会在类销毁时自动完成
  }
}

// 创建全局实例
export const observationPointSelector = new ObservationPointSelector();
export default ObservationPointSelector;
