/**
 * 开普勒轨道力学计算模块
 * 基于开普勒定律实现精确的轨道预测和位置计算
 * 用于金星凌日现象的轨道模拟
 */

import * as THREE from 'three';
import { MATH_CONSTANTS, PHYSICAL_CONSTANTS } from './Constants.js';

export class OrbitalMechanics {
  constructor() {
    this.G = PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT;
    this.cache = new Map();
  }

  /**
   * 解决开普勒方程
   * @param {number} M - 平近点角（弧度）
   * @param {number} e - 轨道偏心率
   * @returns {number} 偏近点角（弧度）
   */
  solveKeplerEquation(M, e) {
    let E = M;
    let delta = 1;
    const maxIterations = 100;
    let iterations = 0;

    while (Math.abs(delta) > 1e-12 && iterations < maxIterations) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
      iterations++;
    }

    return E;
  }

  /**
   * 计算真近点角
   * @param {number} E - 偏近点角（弧度）
   * @param {number} e - 轨道偏心率
   * @returns {number} 真近点角（弧度）
   */
  calculateTrueAnomaly(E, e) {
    const cos_v = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const sin_v = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    return Math.atan2(sin_v, cos_v);
  }

  /**
   * 计算轨道位置
   * @param {Object} elements - 轨道要素
   * @param {number} jd - 儒略日
   * @returns {Object} 包含位置和速度的对象
   */
  calculateOrbitalPosition(elements, jd) {
    const {
      semiMajorAxis,
      eccentricity,
      inclination,
      longitudeOfAscendingNode,
      argumentOfPeriapsis,
      meanAnomaly0,
      meanMotion,
      epoch
    } = elements;

    // 计算经过的时间（天）
    const deltaT = jd - epoch;

    // 计算平近点角
    const M = (meanAnomaly0 + meanMotion * deltaT) % (2 * Math.PI);

    // 解决开普勒方程
    const E = this.solveKeplerEquation(M, eccentricity);

    // 计算真近点角
    const v = this.calculateTrueAnomaly(E, eccentricity);

    // 计算距离
    const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));

    // 计算轨道平面坐标
    const x_orb = r * Math.cos(v);
    const y_orb = r * Math.sin(v);
    const z_orb = 0;

    // 转换为日心赤道坐标
    const position = this.orbitalToEquatorial(
      x_orb, y_orb, z_orb,
      inclination,
      longitudeOfAscendingNode,
      argumentOfPeriapsis
    );

    // 计算速度
    const velocity = this.calculateOrbitalVelocity(
      elements, E, v, r
    );

    return {
      position,
      velocity,
      trueAnomaly: v,
      eccentricAnomaly: E,
      distance: r
    };
  }

  /**
   * 将轨道坐标转换为赤道坐标
   * @param {number} x - 轨道平面x坐标
   * @param {number} y - 轨道平面y坐标
   * @param {number} z - 轨道平面z坐标
   * @param {number} i - 轨道倾角（弧度）
   * @param {number} Ω - 升交点黄经（弧度）
   * @param {number} ω - 近地点幅角（弧度）
   * @returns {THREE.Vector3} 赤道坐标
   */
  orbitalToEquatorial(x, y, z, i, Ω, ω) {
    // 旋转矩阵：轨道平面 -> 赤道平面
    const cos_Ω = Math.cos(Ω);
    const sin_Ω = Math.sin(Ω);
    const cos_i = Math.cos(i);
    const sin_i = Math.sin(i);
    const cos_ω = Math.cos(ω);
    const sin_ω = Math.sin(ω);

    // 组合旋转矩阵
    const x_eq = x * (cos_Ω * cos_ω - sin_Ω * sin_ω * cos_i) -
                 y * (cos_Ω * sin_ω + sin_Ω * cos_ω * cos_i);
    const y_eq = x * (sin_Ω * cos_ω + cos_Ω * sin_ω * cos_i) +
                 y * (-sin_Ω * sin_ω + cos_Ω * cos_ω * cos_i);
    const z_eq = x * (sin_ω * sin_i) + y * (cos_ω * sin_i);

    return new THREE.Vector3(x_eq, y_eq, z_eq);
  }

  /**
   * 计算轨道速度
   * @param {Object} elements - 轨道要素
   * @param {number} E - 偏近点角
   * @param {number} v - 真近点角
   * @param {number} r - 距离
   * @returns {THREE.Vector3} 速度向量
   */
  calculateOrbitalVelocity(elements, E, v, r) {
    const {
      semiMajorAxis,
      eccentricity,
      inclination,
      longitudeOfAscendingNode,
      argumentOfPeriapsis
    } = elements;

    // 计算标准引力参数
    const mu = this.G * 1.989e30; // 太阳质量

    // 计算速度大小 (unused for now)
    // const v_mag = Math.sqrt(mu * (2 / r - 1 / semiMajorAxis));

    // 计算速度方向分量
    const cos_E = Math.cos(E);
    const sin_E = Math.sin(E);

    // 轨道平面速度分量
    const vx_orb = -Math.sqrt(mu / (semiMajorAxis * (1 - eccentricity * eccentricity))) * sin_E;
    const vy_orb = Math.sqrt(mu / (semiMajorAxis * (1 - eccentricity * eccentricity))) * (cos_E - eccentricity);
    const vz_orb = 0;

    // 转换为赤道坐标系
    const velocity = this.orbitalToEquatorial(
      vx_orb, vy_orb, vz_orb,
      inclination,
      longitudeOfAscendingNode,
      argumentOfPeriapsis
    );

    return velocity;
  }

  /**
   * 计算凌日条件
   * @param {Object} earthElements - 地球轨道要素
   * @param {Object} venusElements - 金星轨道要素
   * @param {number} jd - 儒略日
   * @returns {Object} 凌日信息
   */
  calculateTransitCondition(earthElements, venusElements, jd) {
    const earth = this.calculateOrbitalPosition(earthElements, jd);
    const venus = this.calculateOrbitalPosition(venusElements, jd);

    // 计算金星相对于地球的视位置
    const relativePos = venus.position.clone().sub(earth.position);

    // 计算与太阳的角距离
    const sunDirection = earth.position.clone().normalize();
    const angularDistance = Math.acos(relativePos.dot(sunDirection) / relativePos.length());

    // 计算太阳角半径
    const solarRadius = 0.004652; // 太阳角半径（弧度）

    // 判断是否在凌日
    const isTransiting = angularDistance < solarRadius;

    // 计算凌日深度
    const transitDepth = isTransiting ? 1 - (angularDistance / solarRadius) : 0;

    return {
      isTransiting,
      angularDistance,
      transitDepth,
      contactTime: isTransiting ? jd : null,
      earthPosition: earth.position,
      venusPosition: venus.position
    };
  }

  /**
   * 预测凌日时间
   * @param {Object} earthElements - 地球轨道要素
   * @param {Object} venusElements - 金星轨道要素
   * @param {number} startJD - 开始儒略日
   * @param {number} endJD - 结束儒略日
   * @returns {Array} 凌日时间列表
   */
  predictTransitTimes(earthElements, venusElements, startJD, endJD) {
    const transitTimes = [];
    const dayStep = 0.5; // 半天步长

    let jd = startJD;
    let wasTransiting = false;

    while (jd < endJD) {
      const condition = this.calculateTransitCondition(earthElements, venusElements, jd);

      if (condition.isTransiting && !wasTransiting) {
        // 找到凌日开始
        const startTime = this.refineTransitTime(earthElements, venusElements, jd, 1);
        const endTime = this.findTransitEnd(earthElements, venusElements, jd);

        transitTimes.push({
          start: startTime,
          end: endTime,
          type: 'transit',
          planet: 'venus'
        });
      }

      wasTransiting = condition.isTransiting;
      jd += dayStep;
    }

    return transitTimes;
  }

  /**
   * 精确计算凌日时间
   * @param {Object} earthElements - 地球轨道要素
   * @param {Object} venusElements - 金星轨道要素
   * @param {number} jd - 初始儒略日
   * @param {number} direction - 搜索方向（1向前，-1向后）
   * @returns {number} 精确凌日时间
   */
  refineTransitTime(earthElements, venusElements, jd, direction) {
    const step = direction * 0.001; // 约1.44分钟
    let refinedJD = jd;

    for (let i = 0; i < 10; i++) {
      const condition = this.calculateTransitCondition(earthElements, venusElements, refinedJD);

      if (!condition.isTransiting) {
        break;
      }

      refinedJD += step;
    }

    return refinedJD - step;
  }

  /**
   * 查找凌日结束时间
   * @param {Object} earthElements - 地球轨道要素
   * @param {Object} venusElements - 金星轨道要素
   * @param {number} jd - 开始儒略日
   * @returns {number} 凌日结束时间
   */
  findTransitEnd(earthElements, venusElements, jd) {
    return this.refineTransitTime(earthElements, venusElements, jd, 1);
  }

  /**
   * 计算轨道周期
   * @param {number} semiMajorAxis - 半长轴（AU）
   * @param {number} centralMass - 中心天体质量（太阳质量）
   * @returns {number} 轨道周期（天）
   */
  calculateOrbitalPeriod(semiMajorAxis, centralMass = 1) {
    const AU = 1.496e11; // 天文单位（米）
    const G = this.G;
    const Msun = 1.989e30; // 太阳质量（千克）

    // 开普勒第三定律：T² = 4π²a³ / GM
    const a = semiMajorAxis * AU;
    const period = 2 * Math.PI * Math.sqrt(a * a * a / (G * centralMass * Msun));

    return period / (24 * 3600); // 转换为天
  }

  /**
   * 计算会合周期
   * @param {number} period1 - 内行星周期（天）
   * @param {number} period2 - 外行星周期（天）
   * @returns {number} 会合周期（天）
   */
  calculateSynodicPeriod(period1, period2) {
    return Math.abs(1 / (1 / period1 - 1 / period2));
  }

  /**
   * 计算轨道要素随时间的变化
   * @param {Object} elements - 初始轨道要素
   * @param {number} jd - 儒略日
   * @param {Object} rates - 轨道要素变化率
   * @returns {Object} 更新后的轨道要素
   */
  updateOrbitalElements(elements, jd, rates = {}) {
    const deltaT = jd - elements.epoch;

    const updatedElements = { ...elements };

    // 应用长期变化率
    if (rates.semiMajorAxis) {
      updatedElements.semiMajorAxis += rates.semiMajorAxis * deltaT / 36525;
    }

    if (rates.eccentricity) {
      updatedElements.eccentricity += rates.eccentricity * deltaT / 36525;
    }

    if (rates.inclination) {
      updatedElements.inclination += rates.inclination * deltaT / 36525 * MATH_CONSTANTS.DEG_TO_RAD;
    }

    if (rates.longitudeOfAscendingNode) {
      updatedElements.longitudeOfAscendingNode += rates.longitudeOfAscendingNode * deltaT / 36525 * MATH_CONSTANTS.DEG_TO_RAD;
    }

    if (rates.argumentOfPeriapsis) {
      updatedElements.argumentOfPeriapsis += rates.argumentOfPeriapsis * deltaT / 36525 * MATH_CONSTANTS.DEG_TO_RAD;
    }

    if (rates.meanAnomaly0) {
      updatedElements.meanAnomaly0 += rates.meanAnomaly0 * deltaT / 36525 * MATH_CONSTANTS.DEG_TO_RAD;
    }

    return updatedElements;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 创建全局轨道力学计算器实例
export const orbitalMechanics = new OrbitalMechanics();

export default OrbitalMechanics;
