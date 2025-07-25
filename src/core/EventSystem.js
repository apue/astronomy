/**
 * 事件系统 - 全局事件管理器
 * 用于模块间的解耦通信
 */

export const EventTypes = {
  // 时间相关事件
  TIME_CHANGED: 'timeChanged',
  PLAY_STATE_CHANGED: 'playStateChanged',
  SPEED_CHANGED: 'speedChanged',

  // 天体相关事件
  CELESTIAL_BODY_CLICKED: 'celestialBodyClicked',
  CELESTIAL_BODY_HOVERED: 'celestialBodyHovered',
  ORBIT_UPDATED: 'orbitUpdated',

  // 观测相关事件
  OBSERVATION_POINT_SELECTED: 'observationPointSelected',
  OBSERVATION_POINT_ADDED: 'observationPointAdded',
  TELESCOPE_VIEW_CHANGED: 'telescopeViewChanged',

  // 数据相关事件
  DATA_RECORDED: 'dataRecorded',
  DATA_ANALYSIS_COMPLETE: 'dataAnalysisComplete',
  CALCULATION_COMPLETE: 'calculationComplete',

  // UI相关事件
  VIEW_MODE_CHANGED: 'viewModeChanged',
  UI_PANEL_TOGGLED: 'uiPanelToggled',
  LOADING_PROGRESS: 'loadingProgress',

  // 凌日相关事件
  TRANSIT_STATUS_CHANGED: 'transitStatusChanged',
  TRANSIT_CONTACT_DETECTED: 'transitContactDetected',
  PARALLAX_CALCULATION_COMPLETE: 'parallaxCalculationComplete',
  OBSERVATION_DATA_UPDATED: 'observationDataUpdated',

  // 系统事件
  SCENE_INITIALIZED: 'sceneInitialized',
  ERROR_OCCURRED: 'errorOccurred',
  PERFORMANCE_WARNING: 'performanceWarning'
};

export class EventSystem {
  constructor() {
    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = 100;
  }

  /**
   * 订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @param {Object} context - 回调上下文（可选）
   * @returns {Function} 取消订阅函数
   */
  subscribe(eventType, callback, context = null) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listener = { callback, context };
    this.listeners.get(eventType).add(listener);

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(eventType, callback, context);
    };
  }

  /**
   * 取消订阅事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @param {Object} context - 回调上下文（可选）
   */
  unsubscribe(eventType, callback, context = null) {
    if (!this.listeners.has(eventType)) return;

    const listeners = this.listeners.get(eventType);
    for (const listener of listeners) {
      if (listener.callback === callback && listener.context === context) {
        listeners.delete(listener);
        break;
      }
    }

    // 清理空的事件类型
    if (listeners.size === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * 发布事件
   * @param {string} eventType - 事件类型
   * @param {*} data - 事件数据
   * @param {Object} source - 事件来源（可选）
   */
  emit(eventType, data = null, source = null) {
    if (!this.listeners.has(eventType)) return;

    const event = {
      type: eventType,
      data,
      source,
      timestamp: Date.now()
    };

    // 记录事件历史
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // 异步执行回调，避免阻塞
    setTimeout(() => {
      const listeners = this.listeners.get(eventType);
      if (!listeners) return;

      for (const listener of listeners) {
        try {
          if (listener.context) {
            listener.callback.call(listener.context, data, event);
          } else {
            listener.callback(data, event);
          }
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
          this.emit(EventTypes.ERROR_OCCURRED, {
            error,
            eventType,
            source: listener.context
          });
        }
      }
    }, 0);
  }

  /**
   * 订阅一次性事件
   * @param {string} eventType - 事件类型
   * @param {Function} callback - 回调函数
   * @param {Object} context - 回调上下文（可选）
   */
  once(eventType, callback, context = null) {
    const unsubscribe = this.subscribe(eventType, (data, event) => {
      unsubscribe();
      if (context) {
        callback.call(context, data, event);
      } else {
        callback(data, event);
      }
    });

    return unsubscribe;
  }

  /**
   * 获取事件历史
   * @param {string} eventType - 事件类型（可选）
   * @returns {Array} 事件历史
   */
  getHistory(eventType = null) {
    if (!eventType) return [...this.history];
    return this.history.filter(event => event.type === eventType);
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this.listeners.clear();
    this.history.length = 0;
  }

  /**
   * 获取当前订阅的事件类型
   * @returns {Array} 事件类型列表
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 检查是否有监听器订阅了指定事件类型
   * @param {string} eventType - 事件类型
   * @returns {boolean}
   */
  hasListeners(eventType) {
    return this.listeners.has(eventType) && this.listeners.get(eventType).size > 0;
  }
}

// 创建全局事件系统实例
export const eventSystem = new EventSystem();

// 为了向后兼容，也导出默认实例
export default EventSystem;
