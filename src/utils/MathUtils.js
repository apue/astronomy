/**
 * 数学工具类 - 提供天文计算和数学函数
 * 基于国际天文学联合会(IAU)标准算法
 */

import * as THREE from 'three';

export class MathUtils {
  /**
   * 角度转弧度
   * @param {number} degrees - 角度值
   * @returns {number} 弧度值
   */
  static degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * 弧度转角度
   * @param {number} radians - 弧度值
   * @returns {number} 角度值
   */
  static radToDeg(radians) {
    return radians * 180 / Math.PI;
  }

  /**
   * 规范化角度到0-360度范围
   * @param {number} angle - 角度值
   * @returns {number} 规范化后的角度
   */
  static normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  /**
   * 规范化弧度到0-2π范围
   * @param {number} radians - 弧度值
   * @returns {number} 规范化后的弧度
   */
  static normalizeRadians(radians) {
    return ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  /**
   * 计算两点之间的角度（弧度）
   * @param {THREE.Vector3} v1 - 第一个向量
   * @param {THREE.Vector3} v2 - 第二个向量
   * @returns {number} 角度（弧度）
   */
  static angleBetween(v1, v2) {
    return v1.angleTo(v2);
  }

  /**
   * 计算两点之间的角度（度）
   * @param {THREE.Vector3} v1 - 第一个向量
   * @param {THREE.Vector3} v2 - 第二个向量
   * @returns {number} 角度（度）
   */
  static angleBetweenDegrees(v1, v2) {
    return this.radToDeg(v1.angleTo(v2));
  }

  /**
   * 计算球面距离（大圆距离）
   * @param {number} lat1 - 第一个点纬度（度）
   * @param {number} lon1 - 第一个点经度（度）
   * @param {number} lat2 - 第二个点纬度（度）
   * @param {number} lon2 - 第二个点经度（度）
   * @returns {number} 球面距离（度）
   */
  static sphericalDistance(lat1, lon1, lat2, lon2) {
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.radToDeg(c);
  }

  /**
   * 将经纬度转换为3D坐标
   * @param {number} latitude - 纬度（度）
   * @param {number} longitude - 经度（度）
   * @param {number} radius - 球体半径
   * @returns {THREE.Vector3} 3D坐标
   */
  static latLonToVector3(latitude, longitude, radius = 1) {
    const phi = this.degToRad(90 - latitude);
    const theta = this.degToRad(longitude);

    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * 将3D坐标转换为经纬度
   * @param {THREE.Vector3} vector - 3D坐标
   * @returns {Object} 经纬度对象
   */
  static vector3ToLatLon(vector) {
    const normalized = vector.clone().normalize();

    const latitude = 90 - this.radToDeg(Math.acos(normalized.y));
    let longitude = this.radToDeg(Math.atan2(normalized.z, normalized.x));

    longitude = this.normalizeAngle(longitude);

    return { latitude, longitude };
  }

  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} t - 插值因子（0-1）
   * @returns {number} 插值结果
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * 向量线性插值
   * @param {THREE.Vector3} start - 起始向量
   * @param {THREE.Vector3} end - 结束向量
   * @param {number} t - 插值因子（0-1）
   * @returns {THREE.Vector3} 插值结果
   */
  static lerpVector3(start, end, t) {
    return start.clone().lerp(end, t);
  }

  /**
   * 四元数球面插值
   * @param {THREE.Quaternion} start - 起始四元数
   * @param {THREE.Quaternion} end - 结束四元数
   * @param {number} t - 插值因子（0-1）
   * @returns {THREE.Quaternion} 插值结果
   */
  static slerpQuaternion(start, end, t) {
    return start.clone().slerp(end, t);
  }

  /**
   * 限制值在指定范围内
   * @param {number} value - 输入值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 将值映射到新范围
   * @param {number} value - 输入值
   * @param {number} inMin - 输入范围最小值
   * @param {number} inMax - 输入范围最大值
   * @param {number} outMin - 输出范围最小值
   * @param {number} outMax - 输出范围最大值
   * @returns {number} 映射后的值
   */
  static mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  /**
   * 生成随机数
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数
   */
  static randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成随机向量
   * @param {number} length - 向量长度
   * @returns {THREE.Vector3} 随机向量
   */
  static randomVector3(length = 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    return new THREE.Vector3(
      length * Math.sin(phi) * Math.cos(theta),
      length * Math.sin(phi) * Math.sin(theta),
      length * Math.cos(phi)
    );
  }

  /**
   * 计算圆周上的点
   * @param {number} radius - 圆半径
   * @param {number} angle - 角度（弧度）
   * @param {THREE.Vector3} center - 圆心
   * @param {THREE.Vector3} normal - 法向量
   * @returns {THREE.Vector3} 圆周上的点
   */
  static pointOnCircle(radius, angle, center = new THREE.Vector3(), normal = new THREE.Vector3(0, 1, 0)) {
    const tangent = new THREE.Vector3(1, 0, 0);
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    tangent.crossVectors(binormal, normal).normalize();

    const point = new THREE.Vector3()
      .addScaledVector(tangent, radius * Math.cos(angle))
      .addScaledVector(binormal, radius * Math.sin(angle))
      .add(center);

    return point;
  }

  /**
   * 计算贝塞尔曲线点
   * @param {Array} points - 控制点数组
   * @param {number} t - 参数（0-1）
   * @returns {THREE.Vector3} 曲线上的点
   */
  static bezierCurve(points, t) {
    if (points.length === 0) return new THREE.Vector3();
    if (points.length === 1) return points[0].clone();

    const n = points.length - 1;
    const result = new THREE.Vector3();

    for (let i = 0; i <= n; i++) {
      const coefficient = this.binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
      result.add(points[i].clone().multiplyScalar(coefficient));
    }

    return result;
  }

  /**
   * 计算二项式系数
   * @param {number} n - 总数
   * @param {number} k - 选择数
   * @returns {number} 二项式系数
   */
  static binomialCoefficient(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;

    let result = 1;
    for (let i = 1; i <= k; i++) {
      result = result * (n - i + 1) / i;
    }
    return result;
  }

  /**
   * 计算两点之间的大圆距离
   * @param {THREE.Vector3} start - 起点
   * @param {THREE.Vector3} end - 终点
   * @returns {number} 大圆距离
   */
  static greatCircleDistance(start, end) {
    const startNorm = start.clone().normalize();
    const endNorm = end.clone().normalize();
    return Math.acos(Math.max(-1, Math.min(1, startNorm.dot(endNorm))));
  }

  /**
   * 计算两点之间的方位角
   * @param {THREE.Vector3} from - 起点
   * @param {THREE.Vector3} to - 终点
   * @param {THREE.Vector3} up - 上方向
   * @returns {number} 方位角（弧度）
   */
  static azimuth(from, to, up = new THREE.Vector3(0, 1, 0)) {
    const direction = to.clone().sub(from).normalize();
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();

    return Math.atan2(right.dot(direction), forward.dot(direction));
  }

  /**
   * 计算两点之间的仰角
   * @param {THREE.Vector3} from - 起点
   * @param {THREE.Vector3} to - 终点
   * @param {THREE.Vector3} up - 上方向
   * @returns {number} 仰角（弧度）
   */
  static elevation(from, to, up = new THREE.Vector3(0, 1, 0)) {
    const direction = to.clone().sub(from).normalize();
    return Math.asin(direction.dot(up));
  }

  /**
   * 平滑步进函数
   * @param {number} edge0 - 起始边缘
   * @param {number} edge1 - 结束边缘
   * @param {number} x - 输入值
   * @returns {number} 平滑后的值
   */
  static smoothstep(edge0, edge1, x) {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /**
   * 更平滑的步进函数
   * @param {number} edge0 - 起始边缘
   * @param {number} edge1 - 结束边缘
   * @param {number} x - 输入值
   * @returns {number} 平滑后的值
   */
  static smootherstep(edge0, edge1, x) {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * 数值积分（辛普森法则）
   * @param {Function} f - 被积函数
   * @param {number} a - 积分下限
   * @param {number} b - 积分上限
   * @param {number} n - 区间数（必须为偶数）
   * @returns {number} 积分结果
   */
  static integrate(f, a, b, n = 1000) {
    if (n % 2 !== 0) n++;

    const h = (b - a) / n;
    let sum = f(a) + f(b);

    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += f(x) * (i % 2 === 0 ? 2 : 4);
    }

    return sum * h / 3;
  }

  /**
   * 求解非线性方程（牛顿迭代法）
   * @param {Function} f - 函数
   * @param {Function} df - 导数函数
   * @param {number} x0 - 初始猜测
   * @param {number} tolerance - 容差
   * @param {number} maxIterations - 最大迭代次数
   * @returns {number} 方程的解
   */
  static newtonMethod(f, df, x0, tolerance = 1e-10, maxIterations = 100) {
    let x = x0;

    for (let i = 0; i < maxIterations; i++) {
      const fx = f(x);
      const dfx = df(x);

      if (Math.abs(dfx) < tolerance) break;

      const newX = x - fx / dfx;

      if (Math.abs(newX - x) < tolerance) return newX;

      x = newX;
    }

    return x;
  }

  /**
   * 生成随机数种子
   * @param {string} seed - 种子字符串
   * @returns {Function} 随机数生成函数
   */
  static seededRandom(seed) {
    let state = 0;

    // 简单的哈希函数
    for (let i = 0; i < seed.length; i++) {
      state = ((state << 5) + state + seed.charCodeAt(i)) & 0x7fffffff;
    }

    return () => {
      state = (state * 9301 + 49297) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }
}

// 导出默认实例
export default MathUtils;
