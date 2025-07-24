/**
 * 用户数据记录与分析系统
 * 记录用户的观测数据、测量结果和学习进度
 * 支持数据导出和分析报告生成
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { astronomyCalculator } from '../utils/AstronomyCalculator.js';
import { historicalObservationSystem } from './HistoricalObservationSystem.js';

export class UserDataRecorder {
  constructor() {
    this.observationRecords = [];
    this.measurementData = [];
    this.learningProgress = new Map();
    this.userPreferences = {
      autoSave: true,
      exportFormat: 'json',
      precision: 6,
      includeMetadata: true
    };
    
    this.dataSchema = {
      observation: {
        required: ['timestamp', 'observer', 'telescope', 'measurements'],
        optional: ['weather', 'notes', 'accuracy', 'images']
      },
      measurement: {
        required: ['type', 'value', 'unit', 'timestamp'],
        optional: ['error', 'confidence', 'conditions']
      }
    };
    
    this.initialize();
  }

  initialize() {
    this.loadUserPreferences();
    this.setupEventListeners();
    this.createBackupSystem();
    
    console.log('📊 User Data Recorder initialized');
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听观测事件
    eventSystem.subscribe('observationRecorded', (data) => {
      this.recordObservation(data);
    });

    // 监听测量事件
    eventSystem.subscribe('measurementTaken', (data) => {
      this.recordMeasurement(data);
    });

    // 监听学习进度
    eventSystem.subscribe('learningProgress', (data) => {
      this.updateLearningProgress(data);
    });

    // 监听时间变化以记录连续观测
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      if (this.userPreferences.autoSave) {
        this.autoRecordObservation(data);
      }
    });
  }

  /**
   * 记录观测数据
   */
  recordObservation(observation) {
    const record = {
      id: this.generateId(),
      timestamp: new Date(),
      julianDate: astronomyCalculator.dateToJulian(observation.timestamp || new Date()),
      observer: observation.observer || 'User',
      location: observation.location || { lat: 0, lon: 0, elevation: 0 },
      telescope: observation.telescope || 'default',
      target: observation.target || 'Venus',
      measurements: observation.measurements || [],
      weather: observation.weather || 'clear',
      notes: observation.notes || '',
      accuracy: observation.accuracy || 0,
      images: observation.images || [],
      metadata: {
        version: '1.0',
        appVersion: '1.0.0',
        userAgent: navigator.userAgent
      }
    };
    
    this.observationRecords.push(record);
    
    // 触发事件
    eventSystem.emit('observationStored', { record });
    
    // 自动备份
    if (this.userPreferences.autoSave) {
      this.createBackup();
    }
    
    return record.id;
  }

  /**
   * 记录测量数据
   */
  recordMeasurement(measurement) {
    const record = {
      id: this.generateId(),
      type: measurement.type,
      value: measurement.value,
      unit: measurement.unit,
      timestamp: measurement.timestamp || new Date(),
      julianDate: astronomyCalculator.dateToJulian(measurement.timestamp || new Date()),
      error: measurement.error || 0,
      confidence: measurement.confidence || 1.0,
      conditions: measurement.conditions || {},
      source: measurement.source || 'manual',
      observationId: measurement.observationId || null
    };
    
    this.measurementData.push(record);
    
    // 计算派生数据
    this.calculateDerivedData(record);
    
    eventSystem.emit('measurementStored', { record });
    
    return record.id;
  }

  /**
   * 自动记录观测
   */
  autoRecordObservation(timeData) {
    const transitStatus = this.getTransitStatus(timeData.time);
    
    if (transitStatus.isTransiting) {
      const autoRecord = {
        timestamp: timeData.time,
        target: 'Venus Transit',
        measurements: [
          {
            type: 'transit_progress',
            value: transitStatus.progress,
            unit: 'percent'
          },
          {
            type: 'phase',
            value: transitStatus.phase,
            unit: 'string'
          }
        ],
        source: 'auto'
      };
      
      this.recordObservation(autoRecord);
    }
  }

  /**
   * 计算派生数据
   */
  calculateDerivedData(measurement) {
    if (measurement.type === 'parallax_angle') {
      const auDistance = this.calculateAUDistance(measurement.value);
      
      this.recordMeasurement({
        type: 'au_distance',
        value: auDistance,
        unit: 'km',
        timestamp: measurement.timestamp,
        source: 'derived',
        observationId: measurement.observationId
      });
    }
  }

  /**
   * 更新学习进度
   */
  updateLearningProgress(progress) {
    const key = progress.lesson || 'general';
    const current = this.learningProgress.get(key) || {
      completed: 0,
      total: 0,
      lastAccess: new Date(),
      score: 0
    };
    
    current.completed = Math.max(current.completed, progress.completed || 0);
    current.total = Math.max(current.total, progress.total || 0);
    current.lastAccess = new Date();
    current.score = Math.max(current.score, progress.score || 0);
    
    this.learningProgress.set(key, current);
    
    eventSystem.emit('progressUpdated', {
      lesson: key,
      progress: current
    });
  }

  /**
   * 计算天文单位距离
   */
  calculateAUDistance(parallaxAngle) {
    const earthRadius = 6371; // km
    const baseline = 2 * earthRadius; // 简化基线
    const parallaxRad = parallaxAngle * (Math.PI / 180) / 3600; // 角秒转弧度
    
    return baseline / Math.tan(parallaxRad);
  }

  /**
   * 获取观测记录
   */
  getObservations(filters = {}) {
    let records = [...this.observationRecords];
    
    // 应用过滤器
    if (filters.startDate) {
      records = records.filter(r => r.timestamp >= filters.startDate);
    }
    
    if (filters.endDate) {
      records = records.filter(r => r.timestamp <= filters.endDate);
    }
    
    if (filters.target) {
      records = records.filter(r => r.target === filters.target);
    }
    
    if (filters.observer) {
      records = records.filter(r => r.observer === filters.observer);
    }
    
    // 排序
    records.sort((a, b) => a.timestamp - b.timestamp);
    
    return records;
  }

  /**
   * 获取测量数据
   */
  getMeasurements(filters = {}) {
    let measurements = [...this.measurementData];
    
    if (filters.type) {
      measurements = measurements.filter(m => m.type === filters.type);
    }
    
    if (filters.source) {
      measurements = measurements.filter(m => m.source === filters.source);
    }
    
    if (filters.observationId) {
      measurements = measurements.filter(m => m.observationId === filters.observationId);
    }
    
    measurements.sort((a, b) => a.timestamp - b.timestamp);
    
    return measurements;
  }

  /**
   * 生成分析报告
   */
  generateAnalysisReport(options = {}) {
    const observations = this.getObservations(options);
    const measurements = this.getMeasurements(options);
    
    const report = {
      summary: {
        totalObservations: observations.length,
        totalMeasurements: measurements.length,
        dateRange: this.getDateRange(observations),
        accuracy: this.calculateOverallAccuracy(measurements)
      },
      observations: observations,
      measurements: measurements,
      statistics: this.calculateStatistics(measurements),
      learningProgress: Object.fromEntries(this.learningProgress),
      recommendations: this.generateRecommendations(observations, measurements)
    };
    
    return report;
  }

  /**
   * 计算统计数据
   */
  calculateStatistics(measurements) {
    const byType = {};
    const bySource = {};
    
    measurements.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      bySource[m.source] = (bySource[m.source] || 0) + 1;
    });
    
    const parallaxMeasurements = measurements.filter(m => m.type === 'parallax_angle');
    const auDistances = measurements.filter(m => m.type === 'au_distance');
    
    return {
      byType,
      bySource,
      parallaxAccuracy: this.calculateParallaxAccuracy(parallaxMeasurements),
      auAccuracy: this.calculateAUAccuracy(auDistances),
      temporalDistribution: this.getTemporalDistribution(measurements)
    };
  }

  /**
   * 计算视差精度
   */
  calculateParallaxAccuracy(parallaxMeasurements) {
    if (parallaxMeasurements.length === 0) return null;
    
    const values = parallaxMeasurements.map(m => m.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      stdDev,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * 计算AU距离精度
   */
  calculateAUAccuracy(auMeasurements) {
    if (auMeasurements.length === 0) return null;
    
    const actualAU = 149597870.7; // km
    const values = auMeasurements.map(m => m.value);
    const errors = values.map(v => Math.abs(v - actualAU) / actualAU * 100);
    
    return {
      meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
      maxError: Math.max(...errors),
      minError: Math.min(...errors),
      count: errors.length
    };
  }

  /**
   * 获取时间分布
   */
  getTemporalDistribution(measurements) {
    const distribution = {
      daily: {},
      weekly: {},
      monthly: {}
    };
    
    measurements.forEach(m => {
      const date = new Date(m.timestamp);
      const day = date.toISOString().split('T')[0];
      const week = this.getWeekNumber(date);
      const month = date.toISOString().slice(0, 7);
      
      distribution.daily[day] = (distribution.daily[day] || 0) + 1;
      distribution.weekly[week] = (distribution.weekly[week] || 0) + 1;
      distribution.monthly[month] = (distribution.monthly[month] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * 生成建议
   */
  generateRecommendations(observations, measurements) {
    const recommendations = [];
    
    // 基于观测数量的建议
    if (observations.length < 5) {
      recommendations.push('建议增加观测次数以提高精度');
    }
    
    // 基于测量类型的建议
    const parallaxCount = measurements.filter(m => m.type === 'parallax_angle').length;
    if (parallaxCount < 3) {
      recommendations.push('建议增加视差角度测量');
    }
    
    // 基于精度的建议
    const auAccuracy = this.calculateAUAccuracy(
      measurements.filter(m => m.type === 'au_distance')
    );
    if (auAccuracy && auAccuracy.meanError > 10) {
      recommendations.push('建议改进测量精度');
    }
    
    return recommendations;
  }

  /**
   * 导出数据
   */
  exportData(format = 'json') {
    const data = {
      observations: this.observationRecords,
      measurements: this.measurementData,
      learningProgress: Object.fromEntries(this.learningProgress),
      exportInfo: {
        format,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * 转换为CSV格式
   */
  convertToCSV(data) {
    const observations = data.observations;
    const measurements = data.measurements;
    
    let csv = 'Type,Timestamp,Observer,Target,Value,Unit,Notes\n';
    
    observations.forEach(obs => {
      csv += `Observation,${obs.timestamp.toISOString()},${obs.observer},${obs.target},,,${obs.notes}\n`;
    });
    
    measurements.forEach(meas => {
      csv += `Measurement,${meas.timestamp.toISOString()},,${meas.type},${meas.value},${meas.unit},${meas.error || ''}\n`;
    });
    
    return csv;
  }

  /**
   * 转换为XML格式
   */
  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?\u003e\n';
    xml += '<observation-data\u003e\n';
    
    data.observations.forEach(obs => {
      xml += '  <observation\u003e\n';
      Object.keys(obs).forEach(key => {
        xml += `    <${key}\u003e${obs[key]}</${key}\u003e\n`;
      });
      xml += '  </observation\u003e\n';
    });
    
    xml += '</observation-data\u003e';
    return xml;
  }

  /**
   * 生成ID
   */
  generateId() {
    return `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取日期范围
   */
  getDateRange(records) {
    if (records.length === 0) return null;
    
    const timestamps = records.map(r => r.timestamp.getTime());
    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps))
    };
  }

  /**
   * 获取学习进度
   */
  getLearningProgress(lesson = null) {
    if (lesson) {
      return this.learningProgress.get(lesson);
    }
    return Object.fromEntries(this.learningProgress);
  }

  /**
   * 清除所有数据
   */
  clearAllData() {
    this.observationRecords = [];
    this.measurementData = [];
    this.learningProgress.clear();
    
    eventSystem.emit('dataCleared');
  }

  /**
   * 获取用户偏好设置
   */
  getUserPreferences() {
    return { ...this.userPreferences };
  }

  /**
   * 设置用户偏好
   */
  setUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    this.saveUserPreferences();
  }

  /**
   * 保存用户偏好
   */
  saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
  }

  /**
   * 加载用户偏好
   */
  loadUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
    }
  }

  /**
   * 创建备份
   */
  createBackup() {
    const backup = {
      observations: this.observationRecords,
      measurements: this.measurementData,
      learningProgress: Object.fromEntries(this.learningProgress),
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('dataBackup', JSON.stringify(backup));
  }

  /**
   * 恢复备份
   */
  restoreBackup() {
    const backup = localStorage.getItem('dataBackup');
    if (backup) {
      const data = JSON.parse(backup);
      this.observationRecords = data.observations || [];
      this.measurementData = data.measurements || [];
      this.learningProgress = new Map(Object.entries(data.learningProgress || {}));
      
      eventSystem.emit('dataRestored', data);
    }
  }

  /**
   * 获取周数
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * 获取当前观测状态
   */
  getCurrentStatus() {
    return {
      totalObservations: this.observationRecords.length,
      totalMeasurements: this.measurementData.length,
      lastObservation: this.observationRecords[this.observationRecords.length - 1],
      lastMeasurement: this.measurementData[this.measurementData.length - 1],
      learningProgress: this.getLearningProgress()
    };
  }

  /**
   * 计算总体精度
   */
  calculateOverallAccuracy(measurements) {
    const auMeasurements = measurements.filter(m => m.type === 'au_distance');
    if (auMeasurements.length === 0) return null;
    
    const actualAU = 149597870.7;
    const errors = auMeasurements.map(m => Math.abs(m.value - actualAU) / actualAU * 100);
    
    return {
      meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
      medianError: errors.sort((a, b) => a - b)[Math.floor(errors.length / 2)],
      samples: errors.length
    };
  }

  /**
   * 获取历史观测数据
   */
  getHistoricalComparison(year) {
    const historicalData = historicalObservationSystem.getHistoricalObservationPoints(year);
    const userData = this.getObservations({
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31)
    });
    
    return {
      historical: historicalData,
      user: userData,
      comparison: this.compareHistoricalVsUser(historicalData, userData)
    };
  }

  /**
   * 比较历史与用户数据
   */
  compareHistoricalVsUser(historical, user) {
    return {
      historicalCount: historical.length,
      userCount: user.length,
      averageAccuracy: this.calculateOverallAccuracy(user),
      dataQuality: user.length > 0 ? 'good' : 'insufficient'
    };
  }
}

// 创建全局实例
export const userDataRecorder = new UserDataRecorder();
export default UserDataRecorder;