/**
 * 天文常量和物理常量定义
 * 基于国际天文学联合会(IAU)标准值
 */

// 天文单位（AU） - 地球到太阳的平均距离
export const AU = 149597870.7; // 千米

// 光速
export const SPEED_OF_LIGHT = 299792.458; // 千米/秒

// 天体基本数据
export const CELESTIAL_BODIES = {
  SUN: {
    name: 'Sun',
    radius: 696340, // 千米
    mass: 1.989e30, // 千克
    luminosity: 3.828e26, // 瓦特
    temperature: 5778, // 开尔文
    rotationPeriod: 25.05, // 天（赤道）
    color: 0xFFD700
  },
  
  EARTH: {
    name: 'Earth',
    radius: 6371, // 千米
    mass: 5.972e24, // 千克
    rotationPeriod: 0.99726968, // 天（恒星日）
    orbitalPeriod: 365.256363004, // 天
    color: 0x6B93D6,
    
    // 轨道参数（J2000.0历元）
    orbitElements: {
      semiMajorAxis: 1.00000011, // AU
      eccentricity: 0.01671022,
      inclination: 0.00005, // 度
      longitudeOfAscendingNode: -11.26064, // 度
      argumentOfPeriapsis: 102.94719, // 度
      meanAnomaly0: 100.46435, // 度（J2000.0）
      meanMotion: 0.98560912 // 度/天
    }
  },
  
  VENUS: {
    name: 'Venus',
    radius: 6051.8, // 千米
    mass: 4.8675e24, // 千克
    rotationPeriod: -243.025, // 天（逆向自转）
    orbitalPeriod: 224.701, // 天
    color: 0xFFC649,
    
    // 轨道参数（J2000.0历元）
    orbitElements: {
      semiMajorAxis: 0.72332102, // AU
      eccentricity: 0.00682069,
      inclination: 3.39471, // 度
      longitudeOfAscendingNode: 76.68069, // 度
      argumentOfPeriapsis: 131.53298, // 度
      meanAnomaly0: 181.97973, // 度（J2000.0）
      meanMotion: 1.60213634 // 度/天
    }
  }
};

// 1761年和1769年金星凌日事件
export const VENUS_TRANSIT_EVENTS = {
  1761: {
    date: new Date('1761-06-06T00:00:00Z'),
    contacts: {
      firstContact: new Date('1761-06-06T02:19:00Z'),
      secondContact: new Date('1761-06-06T02:39:00Z'),
      thirdContact: new Date('1761-06-06T08:37:00Z'),
      fourthContact: new Date('1761-06-06T08:57:00Z')
    },
    duration: 6.6333, // 小时
    type: 'external'
  },
  
  1769: {
    date: new Date('1769-06-03T00:00:00Z'),
    contacts: {
      firstContact: new Date('1769-06-03T02:19:00Z'),
      secondContact: new Date('1769-06-03T02:39:00Z'),
      thirdContact: new Date('1769-06-03T08:37:00Z'),
      fourthContact: new Date('1769-06-03T08:57:00Z')
    },
    duration: 6.6333, // 小时
    type: 'external'
  }
};

// 历史观测点数据
export const HISTORICAL_OBSERVATIONS = {
  1761: [
    {
      name: 'Stockholm',
      observer: 'Pehr Wilhelm Wargentin',
      country: 'Sweden',
      latitude: 59.3293,
      longitude: 18.0686,
      altitude: 45,
      timezone: 1,
      contactTimes: {
        firstContact: '1761-06-06T02:19:00Z',
        secondContact: '1761-06-06T02:39:00Z',
        thirdContact: '1761-06-06T08:37:00Z',
        fourthContact: '1761-06-06T08:57:00Z'
      },
      instruments: ['telescope', 'quadrant'],
      weather: 'clear',
      accuracy: 'high'
    },
    {
      name: 'Paris',
      observer: 'Joseph-Nicolas Delisle',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522,
      altitude: 35,
      timezone: 0,
      contactTimes: {
        firstContact: '1761-06-06T02:19:00Z',
        secondContact: '1761-06-06T02:39:00Z',
        thirdContact: '1761-06-06T08:37:00Z',
        fourthContact: '1761-06-06T08:57:00Z'
      },
      instruments: ['telescope', 'micrometer'],
      weather: 'partly cloudy',
      accuracy: 'medium'
    },
    {
      name: 'Cape Town',
      observer: 'Nicolas-Louis de Lacaille',
      country: 'South Africa',
      latitude: -33.9249,
      longitude: 18.4241,
      altitude: 42,
      timezone: 2,
      contactTimes: {
        firstContact: '1761-06-06T02:19:00Z',
        secondContact: '1761-06-06T02:39:00Z',
        thirdContact: '1761-06-06T08:37:00Z',
        fourthContact: '1761-06-06T08:57:00Z'
      },
      instruments: ['telescope', 'clock'],
      weather: 'clear',
      accuracy: 'high'
    }
  ],
  
  1769: [
    {
      name: 'Hudson Bay',
      observer: 'William Wales',
      country: 'Canada',
      latitude: 60.0,
      longitude: -94.0,
      altitude: 100,
      timezone: -6,
      contactTimes: {
        firstContact: '1769-06-03T02:19:00Z',
        secondContact: '1769-06-03T02:39:00Z',
        thirdContact: '1769-06-03T08:37:00Z',
        fourthContact: '1769-06-03T08:57:00Z'
      },
      instruments: ['telescope', 'quadrant'],
      weather: 'clear',
      accuracy: 'high'
    },
    {
      name: 'Tahiti',
      observer: 'James Cook',
      country: 'United Kingdom',
      latitude: -17.6509,
      longitude: -149.4260,
      altitude: 10,
      timezone: -10,
      contactTimes: {
        firstContact: '1769-06-03T02:19:00Z',
        secondContact: '1769-06-03T02:39:00Z',
        thirdContact: '1769-06-03T08:37:00Z',
        fourthContact: '1769-06-03T08:57:00Z'
      },
      instruments: ['telescope', 'clock'],
      weather: 'clear',
      accuracy: 'very high'
    }
  ]
};

// 物理常量
export const PHYSICAL_CONSTANTS = {
  GRAVITATIONAL_CONSTANT: 6.67430e-11, // m³/kg/s²
  ASTRONOMICAL_UNIT: 149597870700, // 米
  PARSEC: 3.085677581491367e16, // 米
  LIGHT_YEAR: 9.4607304725808e15, // 米
  SOLAR_RADIUS: 696340000, // 米
  EARTH_RADIUS: 6371000, // 米
  VENUS_RADIUS: 6051800 // 米
};

// 数学常量
export const MATH_CONSTANTS = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  SECONDS_PER_DAY: 86400,
  DAYS_PER_YEAR: 365.25,
  JULIAN_CENTURY: 36525
};

// 缩放因子（用于3D可视化）
export const SCALE_FACTORS = {
  DISTANCE_SCALE: 1000, // 1 AU = 1000 单位
  SIZE_SCALE: 100,      // 天体半径放大100倍
  TIME_SCALE: 86400     // 1天 = 86400秒
};

// 纹理路径
export const TEXTURE_PATHS = {
  SUN: {
    surface: '/textures/sun/sun_surface.jpg',
    corona: '/textures/sun/sun_corona.jpg',
    normal: '/textures/sun/sun_normal.jpg'
  },
  EARTH: {
    day: '/textures/earth/earth_day.jpg',
    night: '/textures/earth/earth_night.jpg',
    clouds: '/textures/earth/earth_clouds.jpg',
    bump: '/textures/earth/earth_bump.jpg',
    normal: '/textures/earth/earth_normal.jpg',
    specular: '/textures/earth/earth_specular.jpg'
  },
  VENUS: {
    surface: '/textures/venus/venus_surface.jpg',
    clouds: '/textures/venus/venus_clouds.jpg',
    normal: '/textures/venus/venus_normal.jpg',
    atmosphere: '/textures/venus/venus_atmosphere.jpg'
  },
  STARS: {
    milkyWay: '/textures/stars/milky_way.jpg',
    starField: '/textures/stars/star_field.jpg',
    starAlpha: '/textures/stars/star_alpha.png'
  }
};

// 颜色方案
export const COLOR_SCHEMES = {
  primary: {
    background: 0x000011,
    stars: 0xffffff,
    sun: 0xFFD700,
    earth: 0x6B93D6,
    venus: 0xFFC649
  },
  ui: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#ffd700',
    text: '#ffffff',
    textSecondary: '#cccccc'
  }
};

// 性能配置
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  LOD_DISTANCES: [10, 50, 200], // 距离阈值
  TEXTURE_QUALITY: {
    high: { anisotropy: 16, size: 2048 },
    medium: { anisotropy: 8, size: 1024 },
    low: { anisotropy: 4, size: 512 }
  }
};