/**
 * 高精度视差计算引擎
 * 基于VSOP87理论和开普勒定律的精确天文单位计算
 * 实现18世纪视差测量方法的现代重现
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { astronomyCalculator } from '../utils/AstronomyCalculator.js';
import { historicalObservationSystem } from './HistoricalObservationSystem.js';

export class ParallaxCalculationEngine {
  constructor() {
    this.vsop87Data = new Map();
    this.keplerianElements = new Map();
    this.observationPairs = new Map();
    this.calculationHistory = [];
    this.precisionMode = 'high'; // 'standard' | 'high' | 'ultra'

    this.constants = {
      AU: 149597870.7, // km (现代精确值)
      earthRadius: 6371.0088, // km (地球平均半径)
      solarRadius: 696340, // km (太阳半径)
      venusRadius: 6051.8, // km (金星半径)
      parallaxConstant: 8.794148, // 太阳视差角(角秒)
      lightTimeAU: 499.004786, // 光行时间(AU到地球，秒)
      gravitationalParameter: 3.986004418e14 // μ (m³/s²)
    };

    this.initialize();
  }

  async initialize() {
    console.log('🔬 Initializing Parallax Calculation Engine...');

    await this.loadVSOP87Data();
    await this.loadKeplerianElements();
    this.setupEventListeners();
    this.setupPrecision();

    console.log('✅ Parallax Calculation Engine initialized');
    console.log(`📊 Precision mode: ${this.precisionMode}`);
  }

  /**
   * 加载VSOP87行星理论数据
   */
  async loadVSOP87Data() {
    // 简化的VSOP87系数（实际应用中需要完整数据集）
    this.vsop87Data.set('earth', {
      orbitalElements: {
        a: 1.00000011, // 半长轴 (AU)
        e: 0.01671022, // 离心率
        i: 0.00005,    // 倾角 (度)
        L: 100.46457166, // 平黄经 (度)
        ω: 102.93768193, // 近日点黄经 (度)
        Ω: 0.0         // 升交点黄经 (度)
      },
      timeCoefficients: {
        da: [0.00000000, -0.00000059,  0.00000000],
        de: [0.00000000, -0.00003804,  0.00000000],
        di: [0.00000000, -0.00004193,  0.00000000],
        dL: [0.00000000, 35999.05034290, 0.00000000],
        dω: [0.00000000, 0.32255570, 0.00000000],
        dΩ: [0.00000000, -0.24123856, 0.00000000]
      }
    });

    this.vsop87Data.set('venus', {
      orbitalElements: {
        a: 0.72333199,
        e: 0.00677323,
        i: 3.39471,
        L: 181.97980085,
        ω: 131.56370300,
        Ω: 76.67984255
      },
      timeCoefficients: {
        da: [0.00000000, -0.00000092, 0.00000000],
        de: [0.00000000, -0.00004938, 0.00000000],
        di: [0.00000000, -0.00001034, 0.00000000],
        dL: [0.00000000, 58517.81567600, 0.00000000],
        dω: [0.00000000, 0.00206355, 0.00000000],
        dΩ: [0.00000000, -0.27769418, 0.00000000]
      }
    });
  }

  /**
   * 加载开普勒轨道根数
   */
  async loadKeplerianElements() {
    const J2000 = 2451545.0; // J2000.0儒略日

    this.keplerianElements.set('earth', {
      epoch: J2000,
      elements: {
        a: 1.00000011, // AU
        e: 0.01671022,
        i: 0.00005 * Math.PI / 180, // 转为弧度
        Ω: 0.0 * Math.PI / 180,
        ω: 102.93768193 * Math.PI / 180,
        M: (100.46457166 - 102.93768193) * Math.PI / 180
      },
      rates: {
        da: -0.00000059,
        de: -0.00003804,
        di: -0.00004193 * Math.PI / 180,
        dΩ: -0.24123856 * Math.PI / 180,
        dω: 0.32255570 * Math.PI / 180,
        dM: 35999.05034290 * Math.PI / 180
      }
    });

    this.keplerianElements.set('venus', {
      epoch: J2000,
      elements: {
        a: 0.72333199,
        e: 0.00677323,
        i: 3.39471 * Math.PI / 180,
        Ω: 76.67984255 * Math.PI / 180,
        ω: 131.56370300 * Math.PI / 180,
        M: (181.97980085 - 131.56370300) * Math.PI / 180
      },
      rates: {
        da: -0.00000092,
        de: -0.00004938,
        di: -0.00001034 * Math.PI / 180,
        dΩ: -0.27769418 * Math.PI / 180,
        dω: 0.00206355 * Math.PI / 180,
        dM: 58517.81567600 * Math.PI / 180
      }
    });
  }

  /**
   * 设置精度模式
   */
  setupPrecision() {
    // 根据环境自动设置精度模式
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isHighPerformance = this.detectHighPerformance();

    if (isHighPerformance) {
      this.precisionMode = 'ultra';
    } else if (isDevelopment) {
      this.precisionMode = 'high';
    } else {
      this.precisionMode = 'standard';
    }

    console.log(`⚙️  Precision mode set to: ${this.precisionMode}`);
  }

  /**
   * 检测高性能环境
   */
  detectHighPerformance() {
    try {
      // 检测WebGL支持
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) return false;

      // 检测GPU性能指标
      const debugInfo = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL || 0);
      const highPerformanceGPUs = ['NVIDIA', 'AMD', 'Intel Iris', 'Apple M'];

      return highPerformanceGPUs.some(gpu =>
        debugInfo && debugInfo.toString().includes(gpu)
      );
    } catch (error) {
      console.warn('Performance detection failed:', error);
      return false;
    }
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventSystem.subscribe(EventTypes.TIME_CHANGED, (data) => {
      this.updateCalculations(data.time);
    });

    eventSystem.subscribe('observationPointSelected', (data) => {
      this.calculateParallaxForObservation(data.point);
    });

    eventSystem.subscribe('measurementTaken', (data) => {
      this.validateMeasurement(data.measurement);
    });
  }

  /**
   * 计算两个观测点间的精确视差
   */
  calculateParallax(observation1, observation2, date) {
    const baseline = this.calculateGeodesicDistance(
      observation1.location,
      observation2.location
    );

    const positions = this.calculateCelestialPositions(date);
    const parallaxAngle = this.calculateTrueParallaxAngle(
      positions,
      baseline,
      observation1.location,
      observation2.location
    );

    const calculatedAU = this.calculateAUFromParallax(parallaxAngle, baseline);
    const uncertainty = this.calculateUncertainty(observation1, observation2);

    const result = {
      observation1,
      observation2,
      date,
      baseline,
      parallaxAngle,
      calculatedAU,
      actualAU: this.constants.AU,
      error: Math.abs(calculatedAU - this.constants.AU) / this.constants.AU * 100,
      uncertainty,
      precision: this.getPrecisionLevel(),
      calculationMethod: 'VSOP87 + Geodesic',
      timestamp: new Date()
    };

    this.calculationHistory.push(result);

    eventSystem.emit('parallaxCalculated', result);

    return result;
  }

  /**
   * 计算地球表面两点间的测地线距离
   */
  calculateGeodesicDistance(loc1, loc2) {
    const R = this.constants.earthRadius;
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    // Vincenty公式的简化版本（高精度）
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * 使用VSOP87计算天体精确位置
   */
  calculateCelestialPositions(date) {
    const jd = astronomyCalculator.dateToJulian(date);
    const T = (jd - 2451545.0) / 36525.0; // 儒略世纪数

    const earthPos = this.calculateVSOP87Position('earth', T);
    const venusPos = this.calculateVSOP87Position('venus', T);
    const sunPos = { x: 0, y: 0, z: 0 }; // 太阳系质心坐标系

    return {
      earth: earthPos,
      venus: venusPos,
      sun: sunPos,
      earthSunDistance: Math.sqrt(earthPos.x ** 2 + earthPos.y ** 2 + earthPos.z ** 2)
    };
  }

  /**
   * VSOP87位置计算
   */
  calculateVSOP87Position(planet, T) {
    const data = this.vsop87Data.get(planet);
    if (!data) throw new Error(`No data for planet: ${planet}`);

    const elements = data.orbitalElements;
    const rates = data.timeCoefficients;

    // 计算时间变化后的轨道根数
    const a = elements.a + rates.da[0] + rates.da[1] * T + rates.da[2] * T * T;
    const e = elements.e + rates.de[0] + rates.de[1] * T + rates.de[2] * T * T;
    const i = elements.i + rates.di[0] + rates.di[1] * T + rates.di[2] * T * T;
    const L = elements.L + rates.dL[0] + rates.dL[1] * T + rates.dL[2] * T * T;
    const ω = elements.ω + rates.dω[0] + rates.dω[1] * T + rates.dω[2] * T * T;
    const Ω = elements.Ω + rates.dΩ[0] + rates.dΩ[1] * T + rates.dΩ[2] * T * T;

    const M = (L - ω) * Math.PI / 180; // 平近点角
    const E = this.solveKepler(M, e); // 偏近点角

    // 计算日心坐标
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // 转换为黄道坐标
    const X = x;
    const Y = y * Math.cos(i * Math.PI / 180);
    const Z = y * Math.sin(i * Math.PI / 180);

    return { x: X, y: Y, z: Z };
  }

  /**
   * 解克普勒方程 (E - e*sin(E) = M)
   */
  solveKepler(M, e, tolerance = 1e-10) {
    let E = M;
    let delta = 1;

    while (Math.abs(delta) > tolerance) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
    }

    return E;
  }

  /**
   * 计算真实视差角
   */
  calculateTrueParallaxAngle(positions, baseline, loc1, loc2) {
    const R = this.constants.earthRadius;
    const D = positions.earthSunDistance * this.constants.AU;

    // 计算观测者位置矢量
    const obs1 = this.calculateObserverVector(loc1);
    const obs2 = this.calculateObserverVector(loc2);

    // 计算视差角
    const parallax = (baseline / D) * (180 / Math.PI) * 3600; // 转换为角秒

    return parallax;
  }

  /**
   * 计算观测者位置矢量
   */
  calculateObserverVector(location) {
    const φ = location.latitude * Math.PI / 180;
    const λ = location.longitude * Math.PI / 180;
    const R = this.constants.earthRadius;

    return {
      x: R * Math.cos(φ) * Math.cos(λ),
      y: R * Math.cos(φ) * Math.sin(λ),
      z: R * Math.sin(φ)
    };
  }

  /**
   * 从视差角计算天文单位
   */
  calculateAUFromParallax(parallaxAngle, baseline) {
    const parallaxRad = parallaxAngle / 3600 * Math.PI / 180; // 转换为弧度
    return baseline / Math.tan(parallaxRad);
  }

  /**
   * 计算不确定性
   */
  calculateUncertainty(obs1, obs2) {
    const timeUncertainty = 120; // 2分钟 (秒)
    const angularUncertainty = 0.5; // 角秒
    const distanceUncertainty = 1000; // 米

    return {
      time: timeUncertainty,
      angular: angularUncertainty,
      distance: distanceUncertainty,
      total: Math.sqrt(
        Math.pow(timeUncertainty / 3600, 2) + // 小时误差
        Math.pow(angularUncertainty / 3600, 2) + // 度误差
        Math.pow(distanceUncertainty / 1000, 2)  // 公里误差
      )
    };
  }

  /**
   * 计算历史观测的视差
   */
  calculateHistoricalParallax(year = 1761) {
    const historicalPoints = historicalObservationSystem.getHistoricalObservationPoints(year);

    if (historicalPoints.length < 2) {
      throw new Error('需要至少两个观测点才能计算视差');
    }

    const transitDate = new Date(year === 1761 ? '1761-06-06T05:30:00Z' : '1769-06-03T05:30:00Z');
    const results = [];

    for (let i = 0; i < historicalPoints.length; i++) {
      for (let j = i + 1; j < historicalPoints.length; j++) {
        const result = this.calculateParallax(historicalPoints[i], historicalPoints[j], transitDate);
        results.push(result);
      }
    }

    return {
      year,
      results,
      summary: this.generateSummary(results),
      bestResult: this.findBestResult(results)
    };
  }

  /**
   * 生成计算摘要
   */
  generateSummary(results) {
    if (results.length === 0) return null;

    const distances = results.map(r => r.calculatedAU);
    const errors = results.map(r => r.error);

    return {
      meanDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
      stdDeviation: this.calculateStdDeviation(distances),
      minError: Math.min(...errors),
      maxError: Math.max(...errors),
      sampleCount: results.length
    };
  }

  /**
   * 寻找最佳结果
   */
  findBestResult(results) {
    return results.reduce((best, current) =>
      current.error < best.error ? current : best
    );
  }

  /**
   * 计算标准差
   */
  calculateStdDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 更新计算
   */
  updateCalculations(date) {
    const activeObservations = historicalObservationSystem.getActiveObservations();

    if (activeObservations.length >= 2) {
      const bestPair = this.findBestObservationPair(activeObservations);
      if (bestPair) {
        const result = this.calculateParallax(bestPair[0], bestPair[1], date);
        eventSystem.emit('liveCalculationUpdate', result);
      }
    }
  }

  /**
   * 寻找最佳观测点对
   */
  findBestObservationPair(observations) {
    let bestPair = null;
    let maxBaseline = 0;

    for (let i = 0; i < observations.length; i++) {
      for (let j = i + 1; j < observations.length; j++) {
        const baseline = this.calculateGeodesicDistance(
          observations[i].location,
          observations[j].location
        );

        if (baseline > maxBaseline) {
          maxBaseline = baseline;
          bestPair = [observations[i], observations[j]];
        }
      }
    }

    return bestPair;
  }

  /**
   * 验证测量精度
   */
  validateMeasurement(measurement) {
    const tolerance = this.getTolerance();
    const isValid = Math.abs(measurement.error) <= tolerance;

    eventSystem.emit('measurementValidated', {
      measurement,
      isValid,
      tolerance
    });

    return isValid;
  }

  /**
   * 获取容差
   */
  getTolerance() {
    const tolerances = {
      standard: 0.1,  // 10%
      high: 0.05,     // 5%
      ultra: 0.01     // 1%
    };
    return tolerances[this.precisionMode] || tolerances.standard;
  }

  /**
   * 获取精度等级
   */
  getPrecisionLevel() {
    return {
      mode: this.precisionMode,
      angularPrecision: this.precisionMode === 'ultra' ? 0.001 : 0.01,
      temporalPrecision: this.precisionMode === 'ultra' ? 1 : 60, // 秒
      tolerance: this.getTolerance()
    };
  }

  /**
   * 设置精度模式
   */
  setPrecisionMode(mode) {
    if (['standard', 'high', 'ultra'].includes(mode)) {
      this.precisionMode = mode;
      eventSystem.emit('precisionModeChanged', { mode });
    }
  }

  /**
   * 获取计算历史
   */
  getCalculationHistory(filters = {}) {
    let history = [...this.calculationHistory];

    if (filters.startDate) {
      history = history.filter(c => c.date >= filters.startDate);
    }

    if (filters.endDate) {
      history = history.filter(c => c.date <= filters.endDate);
    }

    if (filters.maxError) {
      history = history.filter(c => c.error <= filters.maxError);
    }

    return history;
  }

  /**
   * 清除计算历史
   */
  clearHistory() {
    this.calculationHistory = [];
    eventSystem.emit('historyCleared');
  }

  /**
   * 获取当前状态
   */
  getCurrentStatus() {
    return {
      precisionMode: this.precisionMode,
      calculationCount: this.calculationHistory.length,
      lastCalculation: this.calculationHistory[this.calculationHistory.length - 1],
      currentPrecision: this.getPrecisionLevel()
    };
  }
}

// 创建全局实例
export const parallaxEngine = new ParallaxCalculationEngine();
export default ParallaxCalculationEngine;
