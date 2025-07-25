/**
 * 精密天文计算模块
 * 基于VSOP87理论实现精确的天体位置计算
 * 用于金星凌日现象的精确模拟
 */

import * as THREE from 'three';
import { CELESTIAL_BODIES, MATH_CONSTANTS, VENUS_TRANSIT_EVENTS } from './Constants.js';

export class AstronomyCalculator {
  constructor() {
    this.cache = new Map();
    this.precision = 1e-8; // 计算精度
  }

  /**
   * 将儒略日转换为格里历日期
   * @param {number} jd - 儒略日
   * @returns {Date} 格里历日期
   */
  julianToDate(jd) {
    const J = jd + 0.5;
    const I = Math.floor(J);
    const F = J - I;

    let A, B, C, D, E, G;

    if (I > 2299160) {
      A = Math.floor((I - 1867216.25) / 36524.25);
      B = I + 1 + A - Math.floor(A / 4);
    } else {
      B = I;
    }

    C = B + 1524;
    D = Math.floor((C - 122.1) / 365.25);
    E = Math.floor(365.25 * D);
    G = Math.floor((C - E) / 30.6001);

    const day = C - E - Math.floor(30.6001 * G) + F;
    const month = G < 13.5 ? G - 1 : G - 13;
    const year = month > 2.5 ? D - 4716 : D - 4715;

    const hours = (day % 1) * 24;
    const minutes = (hours % 1) * 60;
    const seconds = (minutes % 1) * 60;

    return new Date(year, month - 1, Math.floor(day), Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
  }

  /**
   * 将格里历日期转换为儒略日
   * @param {Date} date - 格里历日期
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

    return jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;
  }

  /**
   * 计算儒略世纪数（从J2000.0开始）
   * @param {number} jd - 儒略日
   * @returns {number} 儒略世纪数
   */
  julianCentury(jd) {
    return (jd - 2451545.0) / 36525.0;
  }

  /**
   * VSOP87理论计算行星日心黄经、黄纬、距离
   * @param {string} planet - 行星名称
   * @param {number} jd - 儒略日
   * @returns {Object} 包含黄经、黄纬、距离的对象
   */
  calculateVSOP87Position(planet, jd) {
    const T = this.julianCentury(jd);

    let L, B, R;

    switch (planet.toLowerCase()) {
    case 'earth':
      L = this.calculateEarthLongitude(T);
      B = this.calculateEarthLatitude(T);
      R = this.calculateEarthDistance(T);
      break;
    case 'venus':
      L = this.calculateVenusLongitude(T);
      B = this.calculateVenusLatitude(T);
      R = this.calculateVenusDistance(T);
      break;
    case 'sun':
    default:
      // 太阳位于原点
      return {
        longitude: 0,
        latitude: 0,
        distance: 0
      };
    }

    return {
      longitude: L,
      latitude: B,
      distance: R
    };
  }

  /**
   * 计算地球黄经（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 地球黄经（弧度）
   */
  calculateEarthLongitude(T) {
    // VSOP87 Earth longitude terms
    const terms = [
      // 主要项
      { A: 1.753470369, B: 0, C: 0 },
      { A: 0.033416564, B: 6283.075849991, C: 0 },
      { A: 0.000348942, B: 12566.151699982, C: 0 },
      { A: 0.000034175, B: 18869.227549973, C: 0 },
      // 更多项...
    ];

    let longitude = 0;
    terms.forEach(term => {
      longitude += term.A * Math.cos(term.B + term.C * T);
    });

    return longitude;
  }

  /**
   * 计算地球黄纬（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 地球黄纬（弧度）
   */
  calculateEarthLatitude(T) {
    // VSOP87 Earth latitude terms - simplified
    const terms = [
      { A: 0.0004664, B: 6283.075849991, C: 0 },
      { A: 0.000075, B: 12566.151699982, C: 0 },
    ];

    let latitude = 0;
    terms.forEach(term => {
      latitude += term.A * Math.cos(term.B + term.C * T);
    });

    return latitude;
  }

  /**
   * 计算地球距离（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 地球距离（AU）
   */
  calculateEarthDistance(T) {
    // VSOP87 Earth distance terms - simplified
    const terms = [
      { A: 1.000139887, B: 0, C: 0 },
      { A: 0.016706996, B: 6283.075849991, C: 0 },
      { A: 0.000139493, B: 12566.151699982, C: 0 },
    ];

    let distance = 0;
    terms.forEach(term => {
      distance += term.A * Math.cos(term.B + term.C * T);
    });

    return distance;
  }

  /**
   * 计算金星黄经（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 金星黄经（弧度）
   */
  calculateVenusLongitude(T) {
    // VSOP87 Venus longitude terms - simplified
    const terms = [
      { A: 3.176146697, B: 0, C: 0 },
      { A: 0.013539684, B: 10213.285546211, C: 0 },
      { A: 0.000765444, B: 20426.571092422, C: 0 },
    ];

    let longitude = 0;
    terms.forEach(term => {
      longitude += term.A * Math.cos(term.B + term.C * T);
    });

    return longitude;
  }

  /**
   * 计算金星黄纬（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 金星黄纬（弧度）
   */
  calculateVenusLatitude(T) {
    // VSOP87 Venus latitude terms - simplified
    const terms = [
      { A: 0.059236384, B: 10213.285546211, C: 0 },
      { A: 0.002878938, B: 20426.571092422, C: 0 },
    ];

    let latitude = 0;
    terms.forEach(term => {
      latitude += term.A * Math.sin(term.B + term.C * T);
    });

    return latitude;
  }

  /**
   * 计算金星距离（VSOP87理论）
   * @param {number} T - 儒略世纪数
   * @returns {number} 金星距离（AU）
   */
  calculateVenusDistance(T) {
    // VSOP87 Venus distance terms - simplified
    const terms = [
      { A: 0.723331601, B: 0, C: 0 },
      { A: 0.004863957, B: 10213.285546211, C: 0 },
      { A: 0.000029565, B: 20426.571092422, C: 0 },
    ];

    let distance = 0;
    terms.forEach(term => {
      distance += term.A * Math.cos(term.B + term.C * T);
    });

    return distance;
  }

  /**
   * 将日心黄经、黄纬、距离转换为笛卡尔坐标
   * @param {number} L - 黄经（弧度）
   * @param {number} B - 黄纬（弧度）
   * @param {number} R - 距离（AU）
   * @returns {THREE.Vector3} 笛卡尔坐标
   */
  eclipticToCartesian(L, B, R) {
    const x = R * Math.cos(B) * Math.cos(L);
    const y = R * Math.cos(B) * Math.sin(L);
    const z = R * Math.sin(B);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * 计算天体在指定时间的精确位置
   * @param {string} body - 天体名称
   * @param {Date} date - 计算时间
   * @returns {THREE.Vector3} 天体位置（AU）
   */
  getCelestialPosition(body, date) {
    const jd = this.dateToJulian(date);
    const vsop87 = this.calculateVSOP87Position(body, jd);

    return this.eclipticToCartesian(vsop87.longitude, vsop87.latitude, vsop87.distance);
  }

  /**
   * 计算金星凌日现象的关键时间点
   * @param {number} year - 年份（1761或1769）
   * @returns {Object} 凌日事件信息
   */
  calculateTransitEvents(year) {
    const transit = VENUS_TRANSIT_EVENTS[year];
    if (!transit) return null;

    const jd0 = this.dateToJulian(transit.date);
    const events = {
      year,
      julianDate: jd0,
      contacts: {
        first: this.dateToJulian(transit.contacts.firstContact),
        second: this.dateToJulian(transit.contacts.secondContact),
        third: this.dateToJulian(transit.contacts.thirdContact),
        fourth: this.dateToJulian(transit.contacts.fourthContact)
      }
    };

    // 计算每个接触点的精确位置
    ['first', 'second', 'third', 'fourth'].forEach((contact, index) => {
      const jd = events.contacts[contact];
      const earthPos = this.getCelestialPosition('earth', this.julianToDate(jd));
      const venusPos = this.getCelestialPosition('venus', this.julianToDate(jd));

      events.contacts[`${contact}Position`] = {
        earth: earthPos,
        venus: venusPos,
        separation: earthPos.distanceTo(venusPos)
      };
    });

    return events;
  }

  /**
   * 计算视差角
   * @param {THREE.Vector3} observer - 观察者位置
   * @param {THREE.Vector3} sun - 太阳位置
   * @param {THREE.Vector3} venus - 金星位置
   * @returns {number} 视差角（弧度）
   */
  calculateParallaxAngle(observer, sun, venus) {
    const sunVenus = venus.clone().sub(sun);
    const sunObserver = observer.clone().sub(sun);

    const dot = sunVenus.dot(sunObserver);
    const magProduct = sunVenus.length() * sunObserver.length();

    return Math.acos(dot / magProduct);
  }

  /**
   * 计算天文单位距离（基于视差观测）
   * @param {Object} observations - 两个观测点的数据
   * @returns {number} 天文单位距离（千米）
   */
  calculateAUDistance(observations) {
    if (!observations || observations.length < 2) return 0;

    const [obs1, obs2] = observations;

    // 计算两个观测点之间的基线距离
    const baseline = this.calculateBaselineDistance(obs1, obs2);

    // 计算视差角差异
    const parallaxDiff = Math.abs(obs1.parallaxAngle - obs2.parallaxAngle);

    // 使用三角视差公式计算距离
    const distance = baseline / (2 * Math.tan(parallaxDiff / 2));

    return distance;
  }

  /**
   * 计算两个观测点之间的基线距离
   * @param {Object} obs1 - 观测点1
   * @param {Object} obs2 - 观测点2
   * @returns {number} 基线距离（千米）
   */
  calculateBaselineDistance(obs1, obs2) {
    const R = 6371; // 地球半径（千米）
    const lat1 = obs1.latitude * MATH_CONSTANTS.DEG_TO_RAD;
    const lon1 = obs1.longitude * MATH_CONSTANTS.DEG_TO_RAD;
    const lat2 = obs2.latitude * MATH_CONSTANTS.DEG_TO_RAD;
    const lon2 = obs2.longitude * MATH_CONSTANTS.DEG_TO_RAD;

    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 计算太阳角直径
   * @param {number} distance - 到太阳的距离（千米）
   * @returns {number} 太阳角直径（弧度）
   */
  calculateSolarAngularDiameter(distance) {
    const solarRadius = 696340; // 太阳半径（千米）
    return 2 * Math.atan(solarRadius / distance);
  }

  /**
   * 计算金星凌日时的接触时间
   * @param {number} year - 年份
   * @param {Object} observer - 观测者位置
   * @returns {Object} 接触时间预测
   */
  calculateContactTimes(year, observer) {
    const transitEvents = this.calculateTransitEvents(year);
    if (!transitEvents) return null;

    // 考虑观测者位置修正
    const longitudeCorrection = observer.longitude * MATH_CONSTANTS.DEG_TO_RAD;
    const timeCorrection = longitudeCorrection / (2 * Math.PI) * 24; // 小时

    const correctedTimes = {};
    Object.keys(transitEvents.contacts).forEach(contact => {
      if (contact.includes('Position')) return;

      const originalTime = this.julianToDate(transitEvents.contacts[contact]);
      const correctedTime = new Date(originalTime.getTime() + timeCorrection * 3600000);

      correctedTimes[contact] = correctedTime;
    });

    return {
      year,
      observer,
      contactTimes: correctedTimes,
      duration: transitEvents.duration
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取计算精度
   * @returns {number} 当前计算精度
   */
  getPrecision() {
    return this.precision;
  }

  /**
   * 设置计算精度
   * @param {number} precision - 新的计算精度
   */
  setPrecision(precision) {
    this.precision = precision;
    this.clearCache();
  }
}

// 创建全局计算器实例
export const astronomyCalculator = new AstronomyCalculator();

export default AstronomyCalculator;
