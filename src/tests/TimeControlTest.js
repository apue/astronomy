/**
 * 时间控制系统测试
 * 验证完整的时间控制功能
 */

import { timeController } from '../core/TimeController.js';
import { advancedTimeController } from '../systems/AdvancedTimeController.js';
import { timeControlPanel } from '../ui/TimeControlPanel.js';
import { transitCalculator } from '../systems/TransitCalculator.js';

export class TimeControlTest {
  constructor() {
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Time Control System Tests...\n');
    
    await this.testTimeController();
    await this.testAdvancedTimeController();
    await this.testTimeControlPanel();
    await this.testIntegration();
    
    this.printResults();
  }

  async testTimeController() {
    console.log('1. Testing TimeController...');
    
    // 测试基础功能
    const initialTime = new Date('1761-06-06T05:00:00Z');
    timeController.setTime(initialTime);
    
    const currentTime = timeController.getTime();
    this.assertEqual(
      currentTime.getTime(),
      initialTime.getTime(),
      'TimeController.setTime()'
    );
    
    // 测试速度控制
    timeController.setSpeed(100);
    this.assertEqual(timeController.speed, 100, 'TimeController.setSpeed()');
    
    // 测试播放状态
    timeController.setPlayState(false);
    this.assertEqual(timeController.isPlaying, false, 'TimeController.setPlayState()');
    
    console.log('   ✅ TimeController tests passed\n');
  }

  async testAdvancedTimeController() {
    console.log('2. Testing AdvancedTimeController...');
    
    // 测试初始化
    await advancedTimeController.initialize();
    
    // 测试时间模式
    advancedTimeController.setTimeMode('accelerated');
    this.assertEqual(
      advancedTimeController.currentMode,
      'accelerated',
      'AdvancedTimeController.setTimeMode()'
    );
    
    // 测试接触事件查找
    const testTime = new Date('1761-06-06T02:00:00Z');
    const nextContact = advancedTimeController.stepToNextContact(testTime, 1);
    this.assertTrue(
      nextContact > testTime,
      'AdvancedTimeController.stepToNextContact()'
    );
    
    console.log('   ✅ AdvancedTimeController tests passed\n');
  }

  async testTimeControlPanel() {
    console.log('3. Testing TimeControlPanel...');
    
    // 测试面板创建
    timeControlPanel.createPanel();
    this.assertTrue(
      timeControlPanel.panel !== null,
      'TimeControlPanel.createPanel()'
    );
    
    // 测试显示/隐藏
    timeControlPanel.show();
    this.assertTrue(timeControlPanel.isVisible, 'TimeControlPanel.show()');
    
    timeControlPanel.hide();
    this.assertFalse(timeControlPanel.isVisible, 'TimeControlPanel.hide()');
    
    console.log('   ✅ TimeControlPanel tests passed\n');
  }

  async testIntegration() {
    console.log('4. Testing System Integration...');
    
    // 测试凌日数据加载
    await transitCalculator.initializeTransitData();
    const observations1761 = transitCalculator.getHistoricalObservations(1761);
    
    this.assertTrue(
      observations1761 && observations1761.length > 0,
      'TransitCalculator historical data'
    );
    
    // 测试时间跳转
    const firstContact = new Date('1761-06-06T02:19:00Z');
    timeController.jumpToTime(firstContact);
    
    const currentTime = timeController.getTime();
    this.assertEqual(
      currentTime.getTime(),
      firstContact.getTime(),
      'Time jump integration'
    );
    
    console.log('   ✅ Integration tests passed\n');
  }

  // 断言工具
  assertEqual(actual, expected, testName) {
    const passed = actual === expected;
    this.results.push({
      test: testName,
      passed: passed,
      message: passed ? 'PASS' : `FAIL: expected ${expected}, got ${actual}`
    });
  }

  assertTrue(condition, testName) {
    this.results.push({
      test: testName,
      passed: condition,
      message: condition ? 'PASS' : 'FAIL: condition was false'
    });
  }

  assertFalse(condition, testName) {
    this.results.push({
      test: testName,
      passed: !condition,
      message: !condition ? 'PASS' : 'FAIL: condition was true'
    });
  }

  printResults() {
    console.log('📊 Test Results Summary:');
    console.log('========================\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    console.log(`\n🎯 Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All time control tests passed successfully!');
    } else {
      console.log('⚠️  Some tests failed. Check the output above.');
    }
  }
}

// 导出测试器
export const timeControlTest = new TimeControlTest();

// 全局访问
window.TimeControlTest = TimeControlTest;
window.timeControlTest = timeControlTest;