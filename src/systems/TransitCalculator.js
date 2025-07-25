/**
 * 金星凌日计算器
 * 专门用于计算和分析金星凌日现象
 * 提供精确的接触时间、视差计算和距离测量
 */

import * as THREE from 'three';
import { astronomyCalculator } from '../utils/AstronomyCalculator.js';
import { orbitalMechanics } from '../utils/OrbitalMechanics.js';
import { VENUS_TRANSIT_EVENTS, HISTORICAL_OBSERVATIONS, AU } from '../utils/Constants.js';
import { eventSystem, EventTypes } from '../core/EventSystem.js';

export class TransitCalculator {
  constructor() {
    this.transitData = new Map();
    this.observationPoints = new Map();
    this.currentTransit = null;
    this.calibrationData = new Map();

    this.initializeTransitData();
    this.setupEventHandling();
  }

  /**
   * 初始化凌日数据
   */
  async initializeTransitData() {
    console.log('🌟 Initializing Venus Transit Calculator...');

    // 计算1761年和1769年的凌日事件
    for (const year of [1761, 1769]) {
      const transit = astronomyCalculator.calculateTransitEvents(year);
      this.transitData.set(year, transit);

      // 计算历史观测点数据
      const observations = HISTORICAL_OBSERVATIONS[year];
      const calculatedObservations = await this.calculateObservationData(year, observations);
      this.observationPoints.set(year, calculatedObservations);
    }

    console.log('✅ Transit data initialized');
  }

  /**
   * 设置事件处理
   */
  setupEventHandling() {
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.checkTransitStatus(data.time);
    });
  }

  /**
   * 计算观测点数据
   * @param {number} year - 年份
   * @param {Array} observations - 观测点数据
   * @returns {Array} 计算后的观测数据
   */
  async calculateObservationData(year, observations) {
    const transit = this.transitData.get(year);
    if (!transit) return [];

    const calculatedObservations = [];

    for (const obs of observations) {
      const observerPos = this.getObserverPosition(obs.latitude, obs.longitude, obs.altitude);
      const contactTimes = astronomyCalculator.calculateContactTimes(year, obs);

      // 计算每个接触点的视差角
      const parallaxData = await this.calculateParallaxData(
        observerPos,
        transit,
        contactTimes
      );

      calculatedObservations.push({
        ...obs,
        observerPosition: observerPos,
        contactTimes,
        parallaxData,
        calculatedDistance: this.calculateDistanceFromParallax(parallaxData)
      });
    }

    return calculatedObservations;
  }

  /**
   * 获取观测者位置（地心坐标）
   * @param {number} lat - 纬度（度）
   * @param {number} lon - 经度（度）
   * @param {number} alt - 海拔（米）
   * @returns {THREE.Vector3} 地心坐标
   */
  getObserverPosition(lat, lon, alt = 0) {
    const R = 6371000 + alt; // 地球半径 + 海拔
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    const x = R * Math.cos(latRad) * Math.cos(lonRad);
    const y = R * Math.cos(latRad) * Math.sin(lonRad);
    const z = R * Math.sin(latRad);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * 计算视差数据
   * @param {THREE.Vector3} observerPos - 观测者位置
   * @param {Object} transit - 凌日事件
   * @param {Object} contactTimes - 接触时间
   * @returns {Object} 视差数据
   */
  async calculateParallaxData(observerPos, transit, contactTimes) {
    const parallaxData = {};

    for (const [contact, time] of Object.entries(contactTimes.contactTimes)) {
      if (time instanceof Date) {
        const jd = astronomyCalculator.dateToJulian(time);

        // 计算太阳和金星位置
        const sunPos = new THREE.Vector3(0, 0, 0); // 日心坐标系
        const earthPos = astronomyCalculator.getCelestialPosition('earth', time);
        const venusPos = astronomyCalculator.getCelestialPosition('venus', time);

        // 转换为地心坐标系
        const earthCenter = earthPos.clone().multiplyScalar(149597870.7); // AU to km
        const observerRelative = observerPos.clone();
        const venusRelative = venusPos.clone().multiplyScalar(149597870.7).sub(earthCenter);

        // 计算视差角
        const parallaxAngle = astronomyCalculator.calculateParallaxAngle(
          observerRelative,
          sunPos,
          venusRelative
        );

        parallaxData[contact] = {
          time,
          julianDate: jd,
          parallaxAngle,
          angularDistance: earthPos.distanceTo(venusPos),
          position: {
            observer: observerPos.clone(),
            earth: earthPos,
            venus: venusPos
          }
        };
      }
    }

    return parallaxData;
  }

  /**
   * 从视差计算距离
   * @param {Object} parallaxData - 视差数据
   * @returns {number} 计算的天文单位距离
   */
  calculateDistanceFromParallax(parallaxData) {
    const contacts = Object.values(parallaxData);
    if (contacts.length < 2) return 0;

    // 使用多个接触点的平均视差
    const parallaxAngles = contacts.map(c => c.parallaxAngle).filter(p => !isNaN(p));
    const avgParallax = parallaxAngles.reduce((sum, p) => sum + p, 0) / parallaxAngles.length;

    if (avgParallax <= 0) return 0;

    // 使用18世纪观测者的基线距离（简化计算）
    const baseline = 10000; // 假设观测基线（千米）

    return baseline / Math.tan(avgParallax);
  }

  /**
   * 获取当前凌日状态
   * @param {Date} currentTime - 当前时间
   * @returns {Object} 凌日状态
   */
  getTransitStatus(currentTime) {
    const year = currentTime.getFullYear();

    for (const transitYear of [1761, 1769]) {
      const transit = this.transitData.get(transitYear);
      if (!transit) continue;

      const startTime = astronomyCalculator.julianToDate(transit.contacts.first);
      const endTime = astronomyCalculator.julianToDate(transit.contacts.fourth);

      if (currentTime >= startTime && currentTime <= endTime) {
        return {
          isTransiting: true,
          year: transitYear,
          startTime,
          endTime,
          progress: this.calculateTransitProgress(currentTime, startTime, endTime),
          phase: this.getTransitPhase(currentTime, transit)
        };
      }
    }

    return {
      isTransiting: false,
      nextTransit: this.getNextTransit(currentTime)
    };
  }

  /**
   * 计算凌日进度
   * @param {Date} currentTime - 当前时间
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @returns {number} 进度百分比
   */
  calculateTransitProgress(currentTime, startTime, endTime) {
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = currentTime.getTime() - startTime.getTime();

    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  }

  /**
   * 获取凌日阶段
   * @param {Date} currentTime - 当前时间
   * @param {Object} transit - 凌日事件
   * @returns {string} 凌日阶段
   */
  getTransitPhase(currentTime, transit) {
    const contacts = [
      { name: 'first', time: astronomyCalculator.julianToDate(transit.contacts.first) },
      { name: 'second', time: astronomyCalculator.julianToDate(transit.contacts.second) },
      { name: 'third', time: astronomyCalculator.julianToDate(transit.contacts.third) },
      { name: 'fourth', time: astronomyCalculator.julianToDate(transit.contacts.fourth) }
    ];

    for (let i = 0; i < contacts.length - 1; i++) {
      if (currentTime >= contacts[i].time && currentTime < contacts[i + 1].time) {
        return contacts[i].name;
      }
    }

    if (currentTime < contacts[0].time) return 'pre-transit';
    return 'post-transit';
  }

  /**
   * 获取下一次凌日
   * @param {Date} currentTime - 当前时间
   * @returns {Object} 下一次凌日信息
   */
  getNextTransit(currentTime) {
    const nextTransits = [
      { year: 1761, date: new Date('1761-06-06T02:19:00Z') },
      { year: 1769, date: new Date('1769-06-03T02:19:00Z') }
    ];

    for (const transit of nextTransits) {
      if (transit.date > currentTime) {
        return transit;
      }
    }

    return null;
  }

  /**
   * 获取历史观测数据
   * @param {number} year - 年份
   * @returns {Array} 观测数据
   */
  getHistoricalObservations(year) {
    return this.observationPoints.get(year) || [];
  }

  /**
   * 计算18世纪的天文单位距离
   * @param {number} year - 年份（1761或1769）
   * @returns {Object} 计算结果
   */
  calculateHistoricalAUDistance(year) {
    const observations = this.getHistoricalObservations(year);
    if (observations.length < 2) return null;

    // 使用历史观测数据计算距离
    const distances = [];

    for (let i = 0; i < observations.length; i++) {
      for (let j = i + 1; j < observations.length; j++) {
        const obs1 = observations[i];
        const obs2 = observations[j];

        // 计算基线距离
        const baseline = astronomyCalculator.calculateBaselineDistance(obs1, obs2);

        // 计算视差差异
        const parallaxDiff = this.calculateParallaxDifference(obs1, obs2);

        if (parallaxDiff > 0) {
          const distance = baseline / (2 * Math.tan(parallaxDiff / 2));
          distances.push({
            observers: [obs1.name, obs2.name],
            baseline,
            parallax: parallaxDiff,
            distance,
            accuracy: Math.abs(distance - AU) / AU * 100
          });
        }
      }
    }

    // 计算平均距离
    const validDistances = distances.filter(d => d.distance > 0 && d.distance < 2 * AU);
    const avgDistance = validDistances.reduce((sum, d) => sum + d.distance, 0) / validDistances.length;

    return {
      year,
      calculatedDistance: avgDistance,
      actualDistance: AU,
      accuracy: Math.abs(avgDistance - AU) / AU * 100,
      observations: distances,
      summary: {
        totalPairs: distances.length,
        validPairs: validDistances.length,
        bestAccuracy: Math.min(...validDistances.map(d => d.accuracy))
      }
    };
  }

  /**
   * 计算视差差异
   * @param {Object} obs1 - 观测点1
   * @param {Object} obs2 - 观测点2
   * @returns {number} 视差角差异
   */
  calculateParallaxDifference(obs1, obs2) {
    const parallax1 = obs1.parallaxData;
    const parallax2 = obs2.parallaxData;

    if (!parallax1 || !parallax2) return 0;

    // 使用第二个接触点的视差角
    const p1 = parallax1.second?.parallaxAngle || 0;
    const p2 = parallax2.second?.parallaxAngle || 0;

    return Math.abs(p1 - p2);
  }

  /**
   * 检查凌日状态变化
   * @param {Date} time - 当前时间
   */
  checkTransitStatus(time) {
    const status = this.getTransitStatus(time);

    if (status.isTransiting !== this.currentTransit?.isTransiting) {
      this.currentTransit = status;

      eventSystem.emit(EventTypes.TRANSIT_STATUS_CHANGED, {
        status,
        timestamp: time
      });
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const stats = {
      totalObservations: 0,
      validCalculations: 0,
      averageAccuracy: 0,
      bestAccuracy: 100
    };

    for (const year of [1761, 1769]) {
      const observations = this.getHistoricalObservations(year);
      const distanceCalc = this.calculateHistoricalAUDistance(year);

      if (distanceCalc) {
        stats.totalObservations += observations.length;
        stats.validCalculations += distanceCalc.summary.validPairs;
        stats.averageAccuracy = (stats.averageAccuracy + distanceCalc.accuracy) / 2;
        stats.bestAccuracy = Math.min(stats.bestAccuracy, distanceCalc.summary.bestAccuracy);
      }
    }

    return stats;
  }

  /**
   * 清除缓存数据
   */
  clearCache() {
    this.transitData.clear();
    this.observationPoints.clear();
    this.calibrationData.clear();
  }
}

// 创建全局凌日计算器实例
export const transitCalculator = new TransitCalculator();

export default TransitCalculator;
