/**
 * 天文计算工具类
 * 基于VSOP87理论和IAU算法
 * 提供精确的天体位置计算
 */

import * as THREE from 'three';
import { MathUtils as ThreeMath } from './MathUtils.js';

export class AstronomyUtils {
  /**
   * 使用开普勒方程计算轨道位置
   * @param {number} meanAnomaly - 平近点角（弧度）
   * @param {number} eccentricity - 轨道偏心率
   * @returns {number} 偏近点角（弧度）
   */
  static solveKeplerEquation(meanAnomaly, eccentricity) {
    let E = meanAnomaly;
    const maxIterations = 100;
    const tolerance = 1e-10;

    for (let i = 0; i < maxIterations; i++) {
      const dE = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
      E -= dE;

      if (Math.abs(dE) < tolerance) break;
    }

    return E;
  }

  /**
   * 计算天体在轨道上的位置
   * @param {Object} orbitElements - 轨道参数
   * @param {number} julianDate - 儒略日
   * @returns {THREE.Vector3} 3D位置
   */
  static calculateOrbitalPosition(orbitElements, julianDate) {
    const {
      semiMajorAxis,
      eccentricity,
      inclination,
      longitudeOfAscendingNode,
      argumentOfPeriapsis,
      meanAnomaly0,
      meanMotion,
      epoch = 2451545.0 // J2000.0
    } = orbitElements;

    // 计算时间差（天）
    const deltaTime = julianDate - epoch;

    // 计算平近点角
    const meanAnomaly = (meanAnomaly0 + meanMotion * deltaTime) % (2 * Math.PI);

    // 求解偏近点角
    const eccentricAnomaly = this.solveKeplerEquation(meanAnomaly, eccentricity);

    // 计算真近点角
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

    // 计算轨道半径
    const orbitalRadius = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));

    // 计算轨道平面坐标
    const xOrb = orbitalRadius * Math.cos(trueAnomaly);
    const yOrb = orbitalRadius * Math.sin(trueAnomaly);

    // 转换到黄道坐标系
    const cosW = Math.cos(argumentOfPeriapsis);
    const sinW = Math.sin(argumentOfPeriapsis);
    const cosO = Math.cos(longitudeOfAscendingNode);
    const sinO = Math.sin(longitudeOfAscendingNode);
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);

    const x = xOrb * (cosW * cosO - sinW * sinO * cosI) - yOrb * (sinW * cosO + cosW * sinO * cosI);
    const y = xOrb * (cosW * sinO + sinW * cosO * cosI) + yOrb * (cosW * cosO * cosI - sinW * sinO);
    const z = xOrb * sinW * sinI + yOrb * cosW * sinI;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * 计算地球位置（高精度）
   * @param {number} julianDate - 儒略日
   * @returns {THREE.Vector3} 地球位置
   */
  static calculateEarthPosition(julianDate) {
    const T = (julianDate - 2451545.0) / 36525; // 儒略世纪数

    // 地球轨道参数（VSOP87简化）
    const L0 = 100.46457166 + 35999.37244981 * T - 0.00000032 * T * T;
    const e0 = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const a = 1.00000011; // AU

    const L = ThreeMath.degToRad(L0);
    const e = e0;

    const M = L - ThreeMath.degToRad(102.93768193 + 0.32327364 * T);
    const E = this.solveKeplerEquation(M, e);

    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const longitude = Math.atan2(y, x);
    const distance = Math.sqrt(x * x + y * y);

    return new THREE.Vector3(
      distance * Math.cos(longitude),
      0,
      distance * Math.sin(longitude)
    );
  }

  /**
   * 计算金星位置（高精度）
   * @param {number} julianDate - 儒略日
   * @returns {THREE.Vector3} 金星位置
   */
  static calculateVenusPosition(julianDate) {
    const T = (julianDate - 2451545.0) / 36525;

    // 金星轨道参数（VSOP87简化）
    const L0 = 181.97980085 + 58517.81567428 * T + 0.00000165 * T * T;
    const e0 = 0.00682069 - 0.00004774 * T + 0.000000091 * T * T;
    const a = 0.72332102; // AU

    const L = ThreeMath.degToRad(L0);
    const e = e0;

    const M = L - ThreeMath.degToRad(131.53298000 + 0.00397976 * T);
    const E = this.solveKeplerEquation(M, e);

    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const longitude = Math.atan2(y, x);
    const distance = Math.sqrt(x * x + y * y);

    return new THREE.Vector3(
      distance * Math.cos(longitude),
      0,
      distance * Math.sin(longitude)
    );
  }

  /**
   * 计算太阳位置（简化）
   * @param {number} julianDate - 儒略日
   * @returns {THREE.Vector3} 太阳位置（原点）
   */
  static calculateSunPosition(julianDate) {
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * 计算视差角
   * @param {THREE.Vector3} observer1 - 观测者1位置
   * @param {THREE.Vector3} observer2 - 观测者2位置
   * @param {THREE.Vector3} target - 目标天体位置
   * @returns {number} 视差角（弧度）
   */
  static calculateParallaxAngle(observer1, observer2, target) {
    const vec1 = target.clone().sub(observer1).normalize();
    const vec2 = target.clone().sub(observer2).normalize();

    return Math.acos(Math.max(-1, Math.min(1, vec1.dot(vec2))));
  }

  /**
   * 计算两点之间的基线距离
   * @param {number} lat1 - 第一个观测点纬度（度）
   * @param {number} lon1 - 第一个观测点经度（度）
   * @param {number} lat2 - 第二个观测点纬度（度）
   * @param {number} lon2 - 第二个观测点经度（度）
   * @param {number} earthRadius - 地球半径（千米）
   * @returns {number} 基线距离（千米）
   */
  static calculateBaseline(lat1, lon1, lat2, lon2, earthRadius = 6371) {
    const dLat = ThreeMath.degToRad(lat2 - lat1);
    const dLon = ThreeMath.degToRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(ThreeMath.degToRad(lat1)) * Math.cos(ThreeMath.degToRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  /**
   * 使用视差法计算天体距离
   * @param {number} baseline - 基线长度（千米）
   * @param {number} parallaxAngle - 视差角（弧度）
   * @returns {number} 天体距离（千米）
   */
  static calculateDistanceByParallax(baseline, parallaxAngle) {
    if (parallaxAngle === 0) return Infinity;
    return baseline / (2 * Math.sin(parallaxAngle / 2));
  }

  /**
   * 计算日心距
   * @param {number} venusDistance - 金星距离（AU）
   * @param {number} venusOrbitRatio - 金星轨道半径与地球轨道半径比
   * @returns {number} 日心距（AU）
   */
  static calculateSolarDistance(venusDistance, venusOrbitRatio = 0.723) {
    return venusDistance / venusOrbitRatio;
  }

  /**
   * 计算视差（角度）
   * @param {number} baseline - 基线长度（千米）
   * @param {number} distance - 天体距离（千米）
   * @returns {number} 视差角（弧度）
   */
  static calculateParallax(baseline, distance) {
    return 2 * Math.atan(baseline / (2 * distance));
  }

  /**
   * 计算天体视直径
   * @param {number} actualDiameter - 实际直径（千米）
   * @param {number} distance - 观测距离（千米）
   * @returns {number} 视直径（弧度）
   */
  static calculateAngularDiameter(actualDiameter, distance) {
    return 2 * Math.atan(actualDiameter / (2 * distance));
  }

  /**
   * 计算天体视运动
   * @param {number} orbitalPeriod - 轨道周期（天）
   * @param {number} distance - 轨道半径（AU）
   * @returns {number} 视运动速度（度/天）
   */
  static calculateApparentMotion(orbitalPeriod, distance) {
    return 360 / orbitalPeriod;
  }

  /**
   * 计算相位角
   * @param {THREE.Vector3} sunPos - 太阳位置
   * @param {THREE.Vector3} earthPos - 地球位置
   * @param {THREE.Vector3} planetPos - 行星位置
   * @returns {number} 相位角（弧度）
   */
  static calculatePhaseAngle(sunPos, earthPos, planetPos) {
    const sunToPlanet = planetPos.clone().sub(sunPos).normalize();
    const earthToPlanet = planetPos.clone().sub(earthPos).normalize();

    return Math.acos(Math.max(-1, Math.min(1, sunToPlanet.dot(earthToPlanet))));
  }

  /**
   * 计算会合周期
   * @param {number} period1 - 第一个天体周期（天）
   * @param {number} period2 - 第二个天体周期（天）
   * @returns {number} 会合周期（天）
   */
  static calculateSynodicPeriod(period1, period2) {
    return Math.abs(1 / (1 / period1 - 1 / period2));
  }

  /**
   * 计算凌日条件
   * @param {THREE.Vector3} sunPos - 太阳位置
   * @param {THREE.Vector3} earthPos - 地球位置
   * @param {THREE.Vector3} planetPos - 行星位置
   * @param {number} sunRadius - 太阳半径（AU）
   * @param {number} planetRadius - 行星半径（AU）
   * @returns {boolean} 是否发生凌日
   */
  static checkTransitConditions(sunPos, earthPos, planetPos, sunRadius, planetRadius) {
    const earthToSun = sunPos.clone().sub(earthPos);
    const earthToPlanet = planetPos.clone().sub(earthPos);

    // 计算投影距离
    const projection = earthToPlanet.clone().projectOnVector(earthToSun);
    const perpendicular = earthToPlanet.clone().sub(projection);

    const distance = perpendicular.length();
    const maxDistance = sunRadius + planetRadius;

    return distance < maxDistance;
  }

  /**
   * 计算凌日路径
   * @param {THREE.Vector3} sunPos - 太阳位置
   * @param {THREE.Vector3} earthPos - 地球位置
   * @param {THREE.Vector3} planetPos - 行星位置
   * @param {number} sunRadius - 太阳半径（AU）
   * @param {number} planetRadius - 行星半径（AU）
   * @returns {Object} 凌日路径数据
   */
  static calculateTransitPath(sunPos, earthPos, planetPos, sunRadius, planetRadius) {
    const earthToSun = sunPos.clone().sub(earthPos);
    const earthToPlanet = planetPos.clone().sub(earthPos);

    // 计算投影
    const sunDirection = earthToSun.clone().normalize();
    const planetDirection = earthToPlanet.clone().normalize();

    const angle = Math.acos(sunDirection.dot(planetDirection));
    const angularSeparation = angle * (180 / Math.PI);

    const sunAngularRadius = Math.atan(sunRadius / earthToSun.length()) * (180 / Math.PI);
    const planetAngularRadius = Math.atan(planetRadius / earthToPlanet.length()) * (180 / Math.PI);

    return {
      angularSeparation,
      sunAngularRadius,
      planetAngularRadius,
      contact1: angularSeparation === sunAngularRadius + planetAngularRadius,
      contact2: angularSeparation === Math.abs(sunAngularRadius - planetAngularRadius),
      contact3: angularSeparation === Math.abs(sunAngularRadius - planetAngularRadius),
      contact4: angularSeparation === sunAngularRadius + planetAngularRadius
    };
  }

  /**
   * 计算儒略日
   * @param {Date} date - 日期对象
   * @returns {number} 儒略日
   */
  static julianDay(date) {
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
   * 从儒略日获取日期
   * @param {number} julianDay - 儒略日
   * @returns {Date} 日期对象
   */
  static dateFromJulianDay(julianDay) {
    const jd = Math.floor(julianDay + 0.5);
    const f = julianDay + 0.5 - jd;

    const a = jd + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor(1461 * d / 4);
    const m = Math.floor((5 * e + 2) / 153);

    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);

    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCHours(Math.floor(f * 24));
    date.setUTCMinutes(Math.floor((f * 24 * 60) % 60));
    date.setUTCSeconds(Math.floor((f * 24 * 60 * 60) % 60));

    return date;
  }
}

// 导出默认实例
export default AstronomyUtils;
