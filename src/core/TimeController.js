/**
 * 时间控制器 - 管理天体运动和观测时间
 * 支持1761年和1769年金星凌日事件的精确时间控制
 */

import { eventSystem, EventTypes } from './EventSystem.js';

export class TimeController {
  constructor() {
    // 关键时间点（金星凌日日期）
    this.keyDates = {
      venusTransit1761: new Date('1761-06-06T00:00:00Z'),
      venusTransit1769: new Date('1769-06-03T00:00:00Z'),
      
      // 观测时间范围（前后各延长2个月）
      startRange1761: new Date('1761-04-01T00:00:00Z'),
      endRange1761: new Date('1761-08-31T23:59:59Z'),
      
      startRange1769: new Date('1769-04-01T00:00:00Z'),
      endRange1769: new Date('1769-08-31T23:59:59Z')
    };

    // 默认时间范围
    this.startTime = this.keyDates.startRange1761;
    this.endTime = this.keyDates.endRange1761;
    this.currentTime = new Date(this.startTime);
    
    // 播放控制
    this.isPlaying = false;
    this.speed = 1; // 1天/秒
    this.maxSpeed = 1000; // 最大1000天/秒
    this.minSpeed = 0.01; // 最小0.01天/秒
    
    // 动画控制
    this.animationId = null;
    this.lastUpdateTime = 0;
    this.frameInterval = 16.67; // 60fps
    
    // 预设时间点
    this.presets = [
      { name: '1761凌日开始', date: new Date('1761-06-06T02:00:00Z'), type: 'transit' },
      { name: '1761凌日峰值', date: new Date('1761-06-06T05:30:00Z'), type: 'transit' },
      { name: '1761凌日结束', date: new Date('1761-06-06T09:00:00Z'), type: 'transit' },
      { name: '1769凌日开始', date: new Date('1769-06-03T02:00:00Z'), type: 'transit' },
      { name: '1769凌日峰值', date: new Date('1769-06-03T05:30:00Z'), type: 'transit' },
      { name: '1769凌日结束', date: new Date('1769-06-03T09:00:00Z'), type: 'transit' }
    ];

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听外部时间控制请求
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      if (data.time) {
        this.setTime(data.time);
      }
    });

    eventSystem.subscribe(EventTypes.PLAY_STATE_CHANGED, (data) => {
      if (data.isPlaying !== undefined) {
        this.setPlayState(data.isPlaying);
      }
    });

    eventSystem.subscribe(EventTypes.SPEED_CHANGED, (data) => {
      if (data.speed !== undefined) {
        this.setSpeed(data.speed);
      }
    });
  }

  /**
   * 设置当前时间
   * @param {Date} time - 目标时间
   */
  setTime(time) {
    const newTime = new Date(Math.max(this.startTime, Math.min(time, this.endTime)));
    
    if (newTime.getTime() !== this.currentTime.getTime()) {
      this.currentTime = newTime;
      this.notifyTimeChanged();
    }
  }

  /**
   * 设置时间范围
   * @param {Date} start - 开始时间
   * @param {Date} end - 结束时间
   */
  setTimeRange(start, end) {
    this.startTime = new Date(start);
    this.endTime = new Date(end);
    
    // 确保当前时间在范围内
    if (this.currentTime < this.startTime) {
      this.currentTime = new Date(this.startTime);
    } else if (this.currentTime > this.endTime) {
      this.currentTime = new Date(this.endTime);
    }
    
    this.notifyTimeChanged();
  }

  /**
   * 设置播放状态
   * @param {boolean} isPlaying - 是否播放
   */
  setPlayState(isPlaying) {
    if (this.isPlaying === isPlaying) return;
    
    this.isPlaying = isPlaying;
    
    if (this.isPlaying) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
    
    this.notifyPlayStateChanged();
  }

  /**
   * 切换播放状态
   */
  togglePlayState() {
    this.setPlayState(!this.isPlaying);
  }

  /**
   * 设置播放速度
   * @param {number} speed - 速度（天/秒）
   */
  setSpeed(speed) {
    this.speed = Math.max(this.minSpeed, Math.min(speed, this.maxSpeed));
    this.notifySpeedChanged();
  }

  /**
   * 增加播放速度
   */
  increaseSpeed() {
    const speeds = [0.01, 0.1, 1, 10, 100, 1000];
    const currentIndex = speeds.findIndex(s => s >= this.speed);
    
    if (currentIndex < speeds.length - 1) {
      this.setSpeed(speeds[currentIndex + 1]);
    }
  }

  /**
   * 减少播放速度
   */
  decreaseSpeed() {
    const speeds = [0.01, 0.1, 1, 10, 100, 1000];
    const currentIndex = speeds.findIndex(s => s > this.speed);
    
    if (currentIndex > 0) {
      this.setSpeed(speeds[Math.max(0, currentIndex - 1)]);
    }
  }

  /**
   * 跳转到指定时间
   * @param {Date} time - 目标时间
   */
  jumpToTime(time) {
    this.setTime(time);
    this.notifyJumpToTime(time);
  }

  /**
   * 跳转到预设时间点
   * @param {string} presetName - 预设名称
   */
  jumpToPreset(presetName) {
    const preset = this.presets.find(p => p.name === presetName);
    if (preset) {
      this.jumpToTime(preset.date);
    }
  }

  /**
   * 开始动画循环
   */
  startAnimation() {
    if (this.animationId) return;
    
    this.lastUpdateTime = performance.now();
    this.animate();
  }

  /**
   * 停止动画循环
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 动画循环
   */
  animate() {
    if (!this.isPlaying) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 转换为秒
    
    this.lastUpdateTime = currentTime;

    // 计算时间增量（毫秒）
    const timeDelta = deltaTime * this.speed * 24 * 60 * 60 * 1000;
    const newTime = new Date(this.currentTime.getTime() + timeDelta);

    // 检查是否到达边界
    if (newTime >= this.endTime) {
      this.currentTime = new Date(this.endTime);
      this.setPlayState(false);
    } else if (newTime <= this.startTime) {
      this.currentTime = new Date(this.startTime);
      this.setPlayState(false);
    } else {
      this.currentTime = newTime;
    }

    this.notifyTimeChanged();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * 获取当前时间格式化字符串
   * @returns {string} 格式化的时间字符串
   */
  getFormattedTime() {
    return this.currentTime.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 获取当前时间在时间范围内的百分比
   * @returns {number} 百分比（0-100）
   */
  getProgress() {
    const total = this.endTime.getTime() - this.startTime.getTime();
    const current = this.currentTime.getTime() - this.startTime.getTime();
    return Math.max(0, Math.min(100, (current / total) * 100));
  }

  /**
   * 获取当前儒略日
   * @returns {number} 儒略日
   */
  getJulianDate() {
    return this.dateToJulian(this.currentTime);
  }

  /**
   * 日期转儒略日
   * @param {Date} date - 日期
   * @returns {number} 儒略日
   */
  dateToJulian(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

    return jd;
  }

  /**
   * 获取当前时间的天体位置计算参数
   * @returns {Object} 包含各种时间参数的对象
   */
  getTimeParameters() {
    const jd = this.getJulianDate();
    const t = (jd - 2451545.0) / 36525.0; // 儒略世纪数

    return {
      julianDate: jd,
      julianCenturies: t,
      utcDate: this.currentTime,
      year: this.currentTime.getUTCFullYear(),
      month: this.currentTime.getUTCMonth() + 1,
      day: this.currentTime.getUTCDate(),
      hour: this.currentTime.getUTCHours(),
      minute: this.currentTime.getUTCMinutes(),
      second: this.currentTime.getUTCSeconds()
    };
  }

  /**
   * 通知时间变化
   */
  notifyTimeChanged() {
    eventSystem.emit(EventTypes.TIME_CHANGED, {
      time: this.currentTime,
      julianDate: this.getJulianDate(),
      formattedTime: this.getFormattedTime(),
      progress: this.getProgress()
    });
  }

  /**
   * 通知播放状态变化
   */
  notifyPlayStateChanged() {
    eventSystem.emit(EventTypes.PLAY_STATE_CHANGED, {
      isPlaying: this.isPlaying
    });
  }

  /**
   * 通知速度变化
   */
  notifySpeedChanged() {
    eventSystem.emit(EventTypes.SPEED_CHANGED, {
      speed: this.speed
    });
  }

  /**
   * 通知时间跳转
   */
  notifyJumpToTime(time) {
    eventSystem.emit(EventTypes.TIME_CHANGED, {
      time,
      isJump: true,
      julianDate: this.dateToJulian(time),
      formattedTime: time.toISOString().slice(0, 19).replace('T', ' ')
    });
  }

  /**
   * 获取预设时间点
   * @returns {Array} 预设时间点列表
   */
  getPresets() {
    return [...this.presets];
  }

  /**
   * 销毁时间控制器
   */
  destroy() {
    this.stopAnimation();
    this.clear();
  }

  /**
   * 清除状态
   */
  clear() {
    this.isPlaying = false;
    this.speed = 1;
    this.animationId = null;
  }
}

// 创建全局时间控制器实例
export const timeController = new TimeController();