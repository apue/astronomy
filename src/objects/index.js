/**
 * 天体对象模块导出
 * 提供所有天体类的统一导出接口
 */

export { CelestialBody } from './CelestialBody.js';
export { Sun } from './Sun.js';
export { Earth } from './Earth.js';
export { Venus } from './Venus.js';

// 天体工厂函数
export class CelestialBodyFactory {
  static create(type, options = {}) {
    switch (type.toLowerCase()) {
      case 'sun':
        return new Sun(options);
      case 'earth':
        return new Earth(options);
      case 'venus':
        return new Venus(options);
      default:
        throw new Error(`Unknown celestial body type: ${type}`);
    }
  }

  static createSolarSystem() {
    return {
      sun: new Sun(),
      earth: new Earth(),
      venus: new Venus()
    };
  }
}