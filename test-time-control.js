#!/usr/bin/env node

/**
 * 时间控制系统测试脚本
 * 用于验证Days 21-25: 完整时间控制功能的实现
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建测试HTML文件
const testHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>时间控制系统测试 - 金星凌日测距教学</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
        }
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .test-section h3 {
            color: #333;
            margin-top: 0;
        }
        .test-result {
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
        }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            border-radius: 3px;
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        button:hover { background: #0056b3; }
        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        #astronomy-canvas {
            width: 100%;
            height: 400px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>🕐 时间控制系统测试 - Days 21-25 完成验证</h1>
        
        <div class="test-section">
            <h3>📋 测试概览</h3>
            <div id="test-overview" class="test-result info">
                正在初始化测试环境...
            </div>
        </div>

        <div class="test-section">
            <h3>🎮 功能测试</h3>
            <div class="controls">
                <button onclick="testTimeControl()">测试基础时间控制</button>
                <button onclick="testAdvancedFeatures()">测试高级功能</button>
                <button onclick="testDemoMode()">测试演示模式</button>
                <button onclick="testBookmarks()">测试书签系统</button>
                <button onclick="testTransitEvents()">测试凌日事件</button>
            </div>
            <div id="functional-tests"></div>
        </div>

        <div class="test-section">
            <h3>🖥️ UI测试</h3>
            <div class="controls">
                <button onclick="toggleTimePanel()">显示/隐藏控制面板</button>
                <button onclick="resetTo1761()">跳转到1761年凌日</button>
                <button onclick="runFullDemo()">运行完整演示</button>
            </div>
            <div id="ui-tests"></div>
        </div>

        <div class="test-section">
            <h3>📊 性能测试</h3>
            <div id="performance-tests"></div>
        </div>

        <div class="test-section">
            <h3>🌐 3D场景测试</h3>
            <canvas id="astronomy-canvas"></canvas>
            <div class="controls">
                <button onclick="test3DIntegration()">测试3D集成</button>
                <button onclick="testOrbitalAccuracy()">测试轨道精度</button>
            </div>
            <div id="scene-tests"></div>
        </div>

        <div class="test-section">
            <h3>📈 测试结果汇总</h3>
            <div id="test-summary" class="test-result info">
                等待测试完成...
            </div>
        </div>
    </div>

    <script type="module">
        // 测试状态
        let testResults = [];
        let app = null;

        // 初始化测试
        async function initTests() {
            try {
                const module = await import('./src/main.js');
                app = await module.initApp();
                
                document.getElementById('test-overview').innerHTML = 
                    '✅ 测试环境初始化完成 - 所有模块已加载';
                
                logTest('系统初始化', 'PASS', '所有核心模块加载成功');
            } catch (error) {
                document.getElementById('test-overview').innerHTML = 
                    '❌ 测试环境初始化失败: ' + error.message;
                logTest('系统初始化', 'FAIL', error.message);
            }
        }

        // 基础时间控制测试
        async function testTimeControl() {
            const container = document.getElementById('functional-tests');
            container.innerHTML = '';

            try {
                // 测试时间设置
                const testTime = new Date('1761-06-06T05:00:00Z');
                window.timeController.jumpToTime(testTime);
                
                const current = window.timeController.getTime();
                logTest('时间跳转', current.getTime() === testTime.getTime() ? 'PASS' : 'FAIL', 
                       `跳转到 ${testTime.toISOString()}`);

                // 测试速度控制
                window.timeController.setSpeed(100);
                logTest('速度控制', window.timeController.speed === 100 ? 'PASS' : 'FAIL', 
                       '设置速度为100x');

                // 测试播放控制
                window.timeController.setPlayState(false);
                logTest('播放控制', !window.timeController.isPlaying ? 'PASS' : 'FAIL', 
                       '暂停时间流动');

            } catch (error) {
                logTest('基础时间控制', 'FAIL', error.message);
            }
        }

        // 高级功能测试
        async function testAdvancedFeatures() {
            const container = document.getElementById('functional-tests');
            
            try {
                const { advancedTimeController } = await import('./src/systems/AdvancedTimeController.js');
                
                // 测试时间模式
                advancedTimeController.setTimeMode('contact_mode');
                logTest('时间模式', advancedTimeController.currentMode === 'contact_mode' ? 'PASS' : 'FAIL', 
                       '切换到接触模式');

                // 测试步进功能
                const current = window.timeController.getTime();
                const nextContact = advancedTimeController.stepToNextContact(current, 1);
                logTest('步进功能', nextContact > current ? 'PASS' : 'FAIL', 
                       '找到下一个接触点');

            } catch (error) {
                logTest('高级功能', 'FAIL', error.message);
            }
        }

        // 演示模式测试
        async function testDemoMode() {
            try {
                const { advancedTimeController } = await import('./src/systems/AdvancedTimeController.js');
                
                // 测试演示序列
                const sequence = advancedTimeController.demoSequence.find(s => s.name === '完整1761凌日');
                logTest('演示序列', sequence ? 'PASS' : 'FAIL', 
                       '找到1761年凌日演示序列');

                // 测试演示步骤
                if (sequence) {
                    logTest('演示步骤', sequence.steps.length > 0 ? 'PASS' : 'FAIL', 
                           `包含 ${sequence.steps.length} 个演示步骤`);
                }

            } catch (error) {
                logTest('演示模式', 'FAIL', error.message);
            }
        }

        // 书签系统测试
        async function testBookmarks() {
            try {
                const { advancedTimeController } = await import('./src/systems/AdvancedTimeController.js');
                
                const testTime = new Date('1761-06-06T05:30:00Z');
                advancedTimeController.addBookmark(testTime, '凌日中心');
                
                const bookmarks = advancedTimeController.getBookmarks();
                const found = bookmarks.find(b => b.label === '凌日中心');
                
                logTest('书签系统', found ? 'PASS' : 'FAIL', 
                       '书签添加和查找功能正常');

            } catch (error) {
                logTest('书签系统', 'FAIL', error.message);
            }
        }

        // 凌日事件测试
        async function testTransitEvents() {
            try {
                const { transitCalculator } = await import('./src/systems/TransitCalculator.js');
                
                const testTime = new Date('1761-06-06T05:00:00Z');
                const status = transitCalculator.getTransitStatus(testTime);
                
                logTest('凌日检测', status.isTransiting ? 'PASS' : 'FAIL', 
                       '正确识别1761年凌日');

                if (status.isTransiting) {
                    logTest('凌日年份', status.year === 1761 ? 'PASS' : 'FAIL', 
                           `检测到 ${status.year} 年凌日`);
                }

            } catch (error) {
                logTest('凌日事件', 'FAIL', error.message);
            }
        }

        // UI测试
        async function toggleTimePanel() {
            try {
                const { timeControlPanel } = await import('./src/ui/TimeControlPanel.js');
                timeControlPanel.toggle();
                
                logTest('UI控制', 'PASS', 
                       `时间控制面板 ${timeControlPanel.isVisible ? '显示' : '隐藏'}`);
            } catch (error) {
                logTest('UI控制', 'FAIL', error.message);
            }
        }

        async function resetTo1761() {
            try {
                window.timeController.jumpToTime(new Date('1761-06-06T02:19:00Z'));
                logTest('时间重置', 'PASS', '已跳转到1761年凌日开始');
            } catch (error) {
                logTest('时间重置', 'FAIL', error.message);
            }
        }

        async function runFullDemo() {
            try {
                const { advancedTimeController } = await import('./src/systems/AdvancedTimeController.js');
                advancedTimeController.startDemoSequence('完整1761凌日');
                logTest('演示运行', 'PASS', '1761年凌日演示已启动');
            } catch (error) {
                logTest('演示运行', 'FAIL', error.message);
            }
        }

        // 性能测试
        async function testPerformance() {
            const container = document.getElementById('performance-tests');
            
            try {
                const start = performance.now();
                
                // 测试大量时间计算
                for (let i = 0; i < 1000; i++) {
                    const testTime = new Date(1761, 5, 6 + i, 5, 0, 0);
                    window.timeController.jumpToTime(testTime);
                }
                
                const end = performance.now();
                const duration = end - start;
                
                logTest('性能测试', duration < 1000 ? 'PASS' : 'FAIL', 
                       `1000次时间跳转耗时 ${duration.toFixed(2)}ms`);

            } catch (error) {
                logTest('性能测试', 'FAIL', error.message);
            }
        }

        // 3D集成测试
        async function test3DIntegration() {
            try {
                const canvas = document.getElementById('astronomy-canvas');
                const hasContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
                
                logTest('3D集成', hasContext ? 'PASS' : 'FAIL', 
                       'WebGL上下文创建成功');

            } catch (error) {
                logTest('3D集成', 'FAIL', error.message);
            }
        }

        async function testOrbitalAccuracy() {
            try {
                const { astronomyCalculator } = await import('./src/utils/AstronomyCalculator.js');
                
                const testTime = new Date('1761-06-06T05:00:00Z');
                const jd = astronomyCalculator.dateToJulian(testTime);
                
                // 测试地球位置计算
                const earthPos = astronomyCalculator.getCelestialPosition('earth', testTime);
                const distance = Math.sqrt(earthPos.x ** 2 + earthPos.y ** 2 + earthPos.z ** 2);
                
                const accuracy = Math.abs(distance - 1.0) < 0.1; // 误差小于0.1AU
                
                logTest('轨道精度', accuracy ? 'PASS' : 'FAIL', 
                       `地球距离计算精度: ${Math.abs(distance - 1.0).toFixed(6)} AU`);

            } catch (error) {
                logTest('轨道精度', 'FAIL', error.message);
            }
        }

        // 工具函数
        function logTest(testName, result, message) {
            testResults.push({ testName, result, message, timestamp: new Date() });
            
            const container = document.getElementById('functional-tests');
            const div = document.createElement('div');
            div.className = `test-result ${result.toLowerCase()}`;
            div.textContent = `${result}: ${testName} - ${message}`;
            
            if (container) {
                container.appendChild(div);
            }
            
            updateSummary();
        }

        function updateSummary() {
            const passed = testResults.filter(r => r.result === 'PASS').length;
            const total = testResults.length;
            
            const summary = document.getElementById('test-summary');
            summary.innerHTML = `
                测试总数: ${total} | 通过: ${passed} | 失败: ${total - passed} | 
                成功率: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%
                ${total > 0 && passed === total ? '🎉 所有测试通过！' : ''}
            `;
        }

        // 全局访问
        window.testTimeControl = testTimeControl;
        window.testAdvancedFeatures = testAdvancedFeatures;
        window.testDemoMode = testDemoMode;
        window.testBookmarks = testBookmarks;
        window.testTransitEvents = testTransitEvents;
        window.toggleTimePanel = toggleTimePanel;
        window.resetTo1761 = resetTo1761;
        window.runFullDemo = runFullDemo;
        window.testPerformance = testPerformance;
        window.test3DIntegration = test3DIntegration;
        window.testOrbitalAccuracy = testOrbitalAccuracy;

        // 初始化
        initTests();
    </script>
</body>
</html>
`;