/**
 * 高级时间控制系统
 * 专为金星凌日观测设计的完整时间控制功能
 * 支持精确的时间步进、观测事件和教学演示
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { astronomyCalculator } from '../utils/AstronomyCalculator.js';
import { transitCalculator } from './TransitCalculator.js';
import { orbitalMechanics } from '../utils/OrbitalMechanics.js';
import { VENUS_TRANSIT_EVENTS, MATH_CONSTANTS } from '../utils/Constants.js';

export class AdvancedTimeController {
  constructor() {
    // 扩展的时间范围
    this.extendedRange = {
      start: new Date('1750-01-01T00:00:00Z'),
      end: new Date('1780-12-31T23:59:59Z')
    };
    
    // 观测关键时间点
    this.observationEvents = new Map();
    this.contactTimes = new Map();
    this.timeMarkers = [];
    
    // 时间模式
    this.timeModes = {
      REAL_TIME: 'real_time',
      ACCELERATED: 'accelerated',
      STEP_BY_STEP: 'step_by_step',
      CONTACT_MODE: 'contact_mode',
      OBSERVATION_MODE: 'observation_mode'
    };
    
    this.currentMode = this.timeModes.ACCELERATED;
    this.stepSize = 1; // 1 day steps in step mode
    this.contactStep = 1; // Contact event stepping
    
    // 时间标记系统
    this.bookmarks = [];
    this.annotations = new Map();
    
    // 观测事件追踪
    this.observationLog = [];
    this.measurementPoints = [];
    
    // 教学演示模式
    this.demonstrationMode = false;
    this.demoSequence = [];
    this.currentDemoStep = 0;
    
    this.initialize();
  }

  async initialize() {
    console.log('🕐 Initializing Advanced Time Controller...');
    
    await this.loadObservationEvents();
    this.setupTimeMarkers();
    this.setupEventHandling();
    this.createDemoSequences();
    
    console.log('✅ Advanced Time Controller initialized');
  }

  /**
   * 加载观测事件数据
   */
  async loadObservationEvents() {
    // 1761年金星凌日事件
    const transit1761 = VENUS_TRANSIT_EVENTS[1761];
    this.contactTimes.set(1761, {
      first: transit1761.contacts.firstContact,
      second: transit1761.contacts.secondContact,
      third: transit1761.contacts.thirdContact,
      fourth: transit1761.contacts.fourthContact,
      duration: transit1761.duration
    });
    
    // 1769年金星凌日事件
    const transit1769 = VENUS_TRANSIT_EVENTS[1769];
    this.contactTimes.set(1769, {
      first: transit1769.contacts.firstContact,
      second: transit1769.contacts.secondContact,
      third: transit1769.contacts.thirdContact,
      fourth: transit1769.contacts.fourthContact,
      duration: transit1769.duration
    });
    
    // 预计算关键时间点
    this.generateKeyTimepoints();
  }

  /**
   * 设置时间标记系统
   */
  setupTimeMarkers() {
    this.timeMarkers = [
      // 1761年标记点
      { date: new Date('1761-05-01T00:00:00Z'), type: 'preparation', label: '观测准备开始' },
      { date: new Date('1761-06-05T12:00:00Z'), type: 'final', label: '最终校准' },
      { date: new Date('1761-06-06T02:19:00Z'), type: 'contact', label: '第一次接触' },
      { date: new Date('1761-06-06T02:39:00Z'), type: 'contact', label: '第二次接触' },
      { date: new Date('1761-06-06T05:30:00Z'), type: 'midpoint', label: '凌日中心' },
      { date: new Date('1761-06-06T08:37:00Z'), type: 'contact', label: '第三次接触' },
      { date: new Date('1761-06-06T08:57:00Z'), type: 'contact', label: '第四次接触' },
      
      // 1769年标记点
      { date: new Date('1769-05-01T00:00:00Z'), type: 'preparation', label: '观测准备开始' },
      { date: new Date('1769-06-02T12:00:00Z'), type: 'final', label: '最终校准' },
      { date: new Date('1769-06-03T02:19:00Z'), type: 'contact', label: '第一次接触' },
      { date: new Date('1769-06-03T02:39:00Z'), type: 'contact', label: '第二次接触' },
      { date: new Date('1769-06-03T05:30:00Z'), type: 'midpoint', label: '凌日中心' },
      { date: new Date('1769-06-03T08:37:00Z'), type: 'contact', label: '第三次接触' },
      { date: new Date('1769-06-03T08:57:00Z'), type: 'contact', label: '第四次接触' }
    ];
  }

  /**
   * 设置事件处理
   */
  setupEventHandling() {
    // 监听时间变化
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.checkForTimeEvents(data.time);
      this.updateObservations(data.time);
    });
    
    // 监听凌日状态变化
    eventSystem.subscribe(EventTypes.TRANSIT_STATUS_CHANGED, (data) => {
      this.handleTransitEvent(data);
    });
  }

  /**
   * 创建教学演示序列
   */
  createDemoSequences() {
    this.demoSequence = [
      {
        name: '完整1761凌日',
        steps: [
          { time: new Date('1761-06-05T12:00:00Z'), duration: 5000, label: '观测准备' },
          { time: new Date('1761-06-06T02:00:00Z'), duration: 3000, label: '等待开始' },
          { time: new Date('1761-06-06T02:19:00Z'), duration: 2000, label: '第一次接触' },
          { time: new Date('1761-06-06T02:39:00Z'), duration: 2000, label: '第二次接触' },
          { time: new Date('1761-06-06T05:30:00Z'), duration: 3000, label: '凌日中心' },
          { time: new Date('1761-06-06T08:37:00Z'), duration: 2000, label: '第三次接触' },
          { time: new Date('1761-06-06T08:57:00Z'), duration: 2000, label: '第四次接触' }
        ]
      },
      {
        name: '视差测量演示',
        steps: [
          { time: new Date('1761-06-06T05:30:00Z'), duration: 3000, label: '中心时刻' },
          { time: new Date('1761-06-06T05:30:00Z'), duration: 5000, label: '测量视差' },
          { time: new Date('1761-06-06T05:30:00Z'), duration: 3000, label: '计算距离' }
        ]
      }
    ];
  }

  /**
   * 生成关键时间点
   */
  generateKeyTimepoints() {
    const keypoints = [];
    
    // 为每个凌日事件生成详细时间点
    [1761, 1769].forEach(year => {
      const transit = this.contactTimes.get(year);
      if (!transit) return;
      
      // 每个接触点前后各添加几个时间点
      const contacts = [
        transit.first,
        transit.second,
        transit.third,
        transit.fourth
      ];
      
      contacts.forEach((contact, index) => {
        const contactTime = new Date(contact);
        
        // 前后30分钟
        [-30, -15, -5, -1, 0, 1, 5, 15, 30].forEach(minutes => {
          const time = new Date(contactTime.getTime() + minutes * 60000);
          keypoints.push({
            date: time,
            type: 'precise',
            label: `${year}年${['一', '二', '三', '四'][index]}次接触 ${minutes >= 0 ? '+' : ''}${minutes}分钟`,
            year: year,
            contact: index + 1,
            offset: minutes
          });
        });
      });
    });
    
    this.keypoints = keypoints;
  }

  /**
   * 设置时间模式
   * @param {string} mode - 时间模式
   */
  setTimeMode(mode) {
    if (!Object.values(this.timeModes).includes(mode)) {
      console.warn(`Invalid time mode: ${mode}`);
      return;
    }
    
    this.currentMode = mode;
    
    switch (mode) {
      case this.timeModes.STEP_BY_STEP:
        this.stepSize = 1; // 1天步长
        break;
      case this.timeModes.CONTACT_MODE:
        this.contactStep = 1;
        break;
      case this.timeModes.OBSERVATION_MODE:
        this.stepSize = 0.5; // 12小时步长
        break;
    }
    
    eventSystem.emit('timeModeChanged', { mode });
  }

  /**
   * 精确时间步进
   * @param {number} direction - 方向（1=前进，-1=后退）
   * @param {string} stepType - 步进类型
   */
  stepTime(direction, stepType = 'normal') {
    // 直接使用全局 timeController
    const currentTime = window.timeController?.getTime() || new Date();
    let newTime;
    
    switch (stepType) {
      case 'contact':
        newTime = this.stepToNextContact(currentTime, direction);
        break;
      case 'keypoint':
        newTime = this.stepToNextKeypoint(currentTime, direction);
        break;
      case 'measurement':
        newTime = this.stepToNextMeasurement(currentTime, direction);
        break;
      default:
        newTime = new Date(currentTime.getTime() + direction * this.stepSize * 24 * 60 * 60 * 1000);
    }
    
    if (window.timeController) {
      window.timeController.jumpToTime(newTime);
    }
  }

  /**
   * 步进到下一个接触事件
   */
  stepToNextContact(currentTime, direction) {
    const allContacts = [];
    
    // 收集所有接触点
    this.contactTimes.forEach((transit, year) => {
      ['first', 'second', 'third', 'fourth'].forEach(contact => {
        allContacts.push({
          time: new Date(transit[contact]),
          year: year,
          type: contact
        });
      });
    });
    
    // 按时间排序
    allContacts.sort((a, b) => a.time - b.time);
    
    // 找到下一个接触点
    const currentIndex = allContacts.findIndex(c => 
      direction > 0 ? c.time > currentTime : c.time < currentTime
    );
    
    if (currentIndex === -1) {
      return direction > 0 ? allContacts[0].time : allContacts[allContacts.length - 1].time;
    }
    
    const targetIndex = direction > 0 ? currentIndex : currentIndex - 1;
    return allContacts[Math.max(0, Math.min(targetIndex, allContacts.length - 1))].time;
  }

  /**
   * 步进到下一个关键点
   */
  stepToNextKeypoint(currentTime, direction) {
    const keypoints = this.timeMarkers.filter(m => m.type === 'contact' || m.type === 'midpoint');
    
    const currentIndex = keypoints.findIndex(k => 
      direction > 0 ? k.date > currentTime : k.date < currentTime
    );
    
    if (currentIndex === -1) {
      return direction > 0 ? keypoints[0].date : keypoints[keypoints.length - 1].date;
    }
    
    const targetIndex = direction > 0 ? currentIndex : currentIndex - 1;
    return keypoints[Math.max(0, Math.min(targetIndex, keypoints.length - 1))].date;
  }

  /**
   * 步进到下一个测量点
   */
  stepToNextMeasurement(currentTime, direction) {
    const measurementInterval = 30; // 30分钟间隔
    const baseTime = Math.floor(currentTime.getTime() / (measurementInterval * 60000)) * (measurementInterval * 60000);
    const newTime = new Date(baseTime + direction * measurementInterval * 60000);
    
    return newTime;
  }

  /**
   * 添加时间书签
   * @param {Date} time - 时间点
   * @param {string} label - 标签
   * @param {Object} metadata - 元数据
   */
  addBookmark(time, label, metadata = {}) {
    const bookmark = {
      id: Date.now(),
      time: new Date(time),
      label: label,
      metadata: metadata,
      created: new Date()
    };
    
    this.bookmarks.push(bookmark);
    this.bookmarks.sort((a, b) => a.time - b.time);
    
    eventSystem.emit('bookmarkAdded', { bookmark });
  }

  /**
   * 跳转到书签
   * @param {string} bookmarkId - 书签ID
   */
  jumpToBookmark(bookmarkId) {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (bookmark && window.timeController) {
      window.timeController.jumpToTime(bookmark.time);
    }
  }

  /**
   * 开始演示序列
   * @param {string} sequenceName - 序列名称
   */
  async startDemoSequence(sequenceName) {
    const sequence = this.demoSequence.find(s => s.name === sequenceName);
    if (!sequence) {
      console.warn(`Demo sequence '${sequenceName}' not found`);
      return;
    }
    
    this.demonstrationMode = true;
    this.currentDemoStep = 0;
    
    for (const step of sequence.steps) {
      if (!this.demonstrationMode) break;
      
      if (window.timeController) {
        window.timeController.jumpToTime(step.time);
      }
      
      eventSystem.emit('demoStep', {
        step: step,
        index: this.currentDemoStep,
        total: sequence.steps.length
      });
      
      await this.sleep(step.duration);
      this.currentDemoStep++;
    }
    
    this.demonstrationMode = false;
  }

  /**
   * 停止演示
   */
  stopDemoSequence() {
    this.demonstrationMode = false;
    eventSystem.emit('demoStopped');
  }

  /**
   * 添加观测记录
   * @param {Date} time - 观测时间
   * @param {Object} observation - 观测数据
   */
  addObservation(time, observation) {
    const record = {
      id: Date.now(),
      time: new Date(time),
      julianDate: astronomyCalculator.dateToJulian(time),
      observation: observation,
      calculated: this.calculateObservation(time, observation)
    };
    
    this.observationLog.push(record);
    eventSystem.emit('observationAdded', { record });
  }

  /**
   * 计算观测数据
   */
  calculateObservation(time, observation) {
    const earthPos = astronomyCalculator.getCelestialPosition('earth', time);
    const venusPos = astronomyCalculator.getCelestialPosition('venus', time);
    
    return {
      angularSeparation: earthPos.angleTo(venusPos),
      relativePosition: {
        earth: earthPos,
        venus: venusPos
      }
    };
  }

  /**
   * 检查时间事件
   * @param {Date} currentTime - 当前时间
   */
  checkForTimeEvents(currentTime) {
    // 检查是否接近接触点
    const tolerance = 60000; // 1分钟容差
    
    this.contactTimes.forEach((transit, year) => {
      ['first', 'second', 'third', 'fourth'].forEach(contact => {
        const contactTime = new Date(transit[contact]);
        const diff = Math.abs(currentTime.getTime() - contactTime.getTime());
        
        if (diff < tolerance) {
          eventSystem.emit('contactApproaching', {
            year: year,
            contact: contact,
            time: contactTime,
            distance: diff
          });
        }
      });
    });
    
    // 检查是否到达标记点
    this.timeMarkers.forEach(marker => {
      const diff = Math.abs(currentTime.getTime() - marker.date.getTime());
      if (diff < tolerance) {
        eventSystem.emit('timeMarkerReached', { marker });
      }
    });
  }

  /**
   * 更新观测记录
   * @param {Date} currentTime - 当前时间
   */
  updateObservations(currentTime) {
    const status = transitCalculator.getTransitStatus(currentTime);
    
    if (status.isTransiting) {
      // 自动记录关键观测点
      if (status.progress > 0 && status.progress < 100) {
        const observation = {
          type: 'transit_observation',
          year: status.year,
          phase: status.phase,
          progress: status.progress,
          timestamp: currentTime
        };
        
        this.measurementPoints.push(observation);
      }
    }
  }

  /**
   * 获取观测日志
   * @returns {Array} 观测日志
   */
  getObservationLog() {
    return [...this.observationLog].sort((a, b) => a.time - b.time);
  }

  /**
   * 获取书签列表
   * @returns {Array} 书签列表
   */
  getBookmarks() {
    return [...this.bookmarks];
  }

  /**
   * 导出观测数据
   * @returns {Object} 观测数据
   */
  exportData() {
    return {
      bookmarks: this.bookmarks,
      observations: this.observationLog,
      measurements: this.measurementPoints,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清除所有数据
   */
  clearAll() {
    this.bookmarks = [];
    this.observationLog = [];
    this.measurementPoints = [];
    this.annotations.clear();
  }
}

// 创建全局高级时间控制器实例
export const advancedTimeController = new AdvancedTimeController();

export default AdvancedTimeController;