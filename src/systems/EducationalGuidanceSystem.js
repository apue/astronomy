/**
 * 教育引导系统
 * 创建分步骤的交互式教学体验
 * 引导用户理解金星凌日视差测量原理
 */

import { eventSystem, EventTypes } from '../core/EventSystem.js';
import { historicalObservationSystem } from './HistoricalObservationSystem.js';
import { parallaxEngine } from './ParallaxCalculationEngine.js';
import { userDataRecorder } from './UserDataRecorder.js';

export class EducationalGuidanceSystem {
  constructor() {
    this.tutorials = new Map();
    this.currentTutorial = null;
    this.currentStep = 0;
    this.userProgress = new Map();
    this.achievements = new Set();
    this.hints = new Map();

    this.initialize();
  }

  initialize() {
    console.log('📚 Initializing Educational Guidance System...');

    this.createTutorials();
    this.setupEventListeners();
    this.loadUserProgress();

    console.log('✅ Educational Guidance System initialized');
    console.log(`📖 Available tutorials: ${this.tutorials.size}`);
  }

  /**
   * 创建教学教程
   */
  createTutorials() {
    // 基础教程：理解视差原理
    this.tutorials.set('parallax_basics', {
      title: '视差原理入门',
      description: '学习什么是视差以及如何使用它测量距离',
      difficulty: 'beginner',
      estimatedTime: '15分钟',
      steps: [
        {
          id: 'intro',
          title: '什么是视差？',
          content: '视差是指从不同位置观察同一物体时，物体相对于背景的位置变化。就像用两只眼睛看手指，手指相对于背景的位置会移动。',
          interactive: true,
          action: 'show_parallax_demo',
          hints: ['尝试移动视角看位置变化', '观察背景星星的移动']
        },
        {
          id: 'measurement',
          title: '如何测量视差角',
          content: '通过测量物体在两个不同观测点的位置差，我们可以计算出视差角。这个角度与物体距离成反比。',
          interactive: true,
          action: 'measure_parallax',
          hints: ['使用望远镜测量角度', '记录两个观测点的数据']
        },
        {
          id: 'calculation',
          title: '计算距离',
          content: '使用公式：距离 = 基线 / tan(视差角)。基线是两个观测点间的距离。',
          interactive: true,
          action: 'calculate_distance',
          hints: ['输入基线长度', '输入视差角']
        }
      ]
    });

    // 历史教程：1761年金星凌日
    this.tutorials.set('1761_transit', {
      title: '1761年金星凌日观测',
      description: '重现18世纪天文学家的实际观测过程',
      difficulty: 'intermediate',
      estimatedTime: '30分钟',
      steps: [
        {
          id: 'setup',
          title: '设置观测点',
          content: '选择1761年的一个历史观测点，如巴黎天文台或斯德哥尔摩天文台。',
          interactive: true,
          action: 'select_observation_point',
          hints: ['查看地图上的观测点', '阅读历史背景信息']
        },
        {
          id: 'telescope',
          title: '使用历史望远镜',
          content: '使用18世纪的天文望远镜观察金星凌日，体验当时的观测精度。',
          interactive: true,
          action: 'use_telescope',
          hints: ['调整望远镜焦距', '等待凌日开始']
        },
        {
          id: 'contacts',
          title: '记录接触时间',
          content: '准确记录金星与太阳边缘的四个接触时间：第一次、第二次、第三次、第四次接触。',
          interactive: true,
          action: 'record_contacts',
          hints: ['观察黑滴现象', '记录精确时间']
        },
        {
          id: 'comparison',
          title: '与历史数据比较',
          content: '将你的观测结果与历史记录进行比较，分析误差来源。',
          interactive: true,
          action: 'compare_results',
          hints: ['查看历史记录', '计算误差百分比']
        }
      ]
    });

    // 高级教程：精确计算
    this.tutorials.set('precise_calculation', {
      title: '精确视差计算',
      description: '使用现代方法计算天文单位距离',
      difficulty: 'advanced',
      estimatedTime: '45分钟',
      steps: [
        {
          id: 'data_analysis',
          title: '分析观测数据',
          content: '收集多个观测点的数据，使用统计方法处理观测误差。',
          interactive: true,
          action: 'analyze_data',
          hints: ['使用最小二乘法', '考虑大气折射']
        },
        {
          id: 'vsop87',
          title: '使用VSOP87理论',
          content: '应用现代行星理论计算精确的地球-太阳距离。',
          interactive: true,
          action: 'apply_vsop87',
          hints: ['输入观测时间', '计算行星位置']
        },
        {
          id: 'final_calculation',
          title: '最终计算',
          content: '综合所有数据计算天文单位距离，与现代精确值比较。',
          interactive: true,
          action: 'final_calculation',
          hints: ['验证计算结果', '分析精度提升']
        }
      ]
    });

    // 挑战教程：发现新行星
    this.tutorials.set('discovery_challenge', {
      title: '发现挑战',
      description: '使用视差方法发现假想的新天体',
      difficulty: 'expert',
      estimatedTime: '60分钟',
      steps: [
        {
          id: 'mystery_object',
          title: '神秘天体',
          content: '你发现了一个位置异常的天体，使用视差方法确定它的距离。',
          interactive: true,
          action: 'investigate_object',
          hints: ['收集多次观测数据', '寻找最佳观测点对']
        },
        {
          id: 'precision',
          title: '提高精度',
          content: '设计实验方案，使用视差方法获得最精确的距离测量。',
          interactive: true,
          action: 'optimize_precision',
          hints: ['选择最佳观测时间', '使用多个观测点']
        }
      ]
    });
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    eventSystem.subscribe('tutorialStarted', (data) => {
      this.startTutorial(data.tutorialId);
    });

    eventSystem.subscribe('tutorialStepCompleted', (data) => {
      this.completeStep(data.stepId);
    });

    eventSystem.subscribe('measurementTaken', (data) => {
      this.checkTutorialProgress(data);
    });

    eventSystem.subscribe('parallaxCalculated', (data) => {
      this.checkAchievement(data);
    });
  }

  /**
   * 开始教程
   */
  async startTutorial(tutorialId, userId = 'default') {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      throw new Error(`教程不存在: ${tutorialId}`);
    }

    this.currentTutorial = tutorialId;
    this.currentStep = 0;

    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, new Map());
    }

    const progress = this.userProgress.get(userId);
    if (!progress.has(tutorialId)) {
      progress.set(tutorialId, {
        started: new Date(),
        currentStep: 0,
        completedSteps: [],
        totalTime: 0,
        achievements: []
      });
    }

    console.log(`📖 开始教程: ${tutorial.title}`);

    this.showStep(tutorial.steps[0]);

    eventSystem.emit('tutorialStarted', {
      tutorialId,
      title: tutorial.title,
      steps: tutorial.steps.length
    });
  }

  /**
   * 显示教程步骤
   */
  showStep(step) {
    const stepData = {
      ...step,
      tutorialId: this.currentTutorial,
      stepNumber: this.currentStep + 1,
      totalSteps: this.tutorials.get(this.currentTutorial).steps.length
    };

    eventSystem.emit('showTutorialStep', stepData);

    // 如果是交互步骤，启动相应的交互模式
    if (step.interactive) {
      this.startInteractiveMode(step.action, step.hints);
    }
  }

  /**
   * 完成当前步骤
   */
  completeStep(stepId, userId = 'default') {
    if (!this.currentTutorial) return;

    const progress = this.userProgress.get(userId);
    const tutorialProgress = progress.get(this.currentTutorial);

    tutorialProgress.completedSteps.push(stepId);
    tutorialProgress.currentStep = this.currentStep + 1;

    console.log(`✅ 完成步骤: ${stepId}`);

    // 检查是否完成所有步骤
    const tutorial = this.tutorials.get(this.currentTutorial);
    if (tutorialProgress.currentStep >= tutorial.steps.length) {
      this.completeTutorial(userId);
    } else {
      // 显示下一步
      this.currentStep = tutorialProgress.currentStep;
      this.showStep(tutorial.steps[this.currentStep]);
    }

    eventSystem.emit('tutorialStepCompleted', {
      tutorialId: this.currentTutorial,
      stepId,
      progress: (tutorialProgress.currentStep / tutorial.steps.length) * 100
    });
  }

  /**
   * 完成教程
   */
  completeTutorial(userId = 'default') {
    const progress = this.userProgress.get(userId);
    const tutorialProgress = progress.get(this.currentTutorial);

    tutorialProgress.completed = new Date();
    tutorialProgress.totalTime = Date.now() - tutorialProgress.started.getTime();

    // 授予成就
    const achievement = this.grantAchievement(this.currentTutorial, userId);

    console.log(`🎓 完成教程: ${this.currentTutorial}`);

    eventSystem.emit('tutorialCompleted', {
      tutorialId: this.currentTutorial,
      achievement,
      totalTime: tutorialProgress.totalTime
    });

    this.currentTutorial = null;
    this.currentStep = 0;
  }

  /**
   * 启动交互模式
   */
  startInteractiveMode(action, hints) {
    const mode = {
      action,
      hints,
      started: new Date(),
      guidance: this.getGuidanceForAction(action)
    };

    eventSystem.emit('interactiveModeStarted', mode);
  }

  /**
   * 获取操作指导
   */
  getGuidanceForAction(action) {
    const guidance = {
      show_parallax_demo: {
        instructions: '使用鼠标移动视角，观察金星相对于背景的位置变化',
        controls: ['鼠标拖拽', '滚轮缩放'],
        expected: '看到金星位置的明显视差变化'
      },
      measure_parallax: {
        instructions: '在两个不同观测点测量金星的位置，计算角度差',
        controls: ['选择观测点', '使用望远镜', '记录角度'],
        expected: '获得精确的视差角测量值'
      },
      select_observation_point: {
        instructions: '在地图上选择一个历史观测点，了解其背景信息',
        controls: ['点击地图标记', '阅读历史介绍'],
        expected: '选择一个合适的观测位置'
      },
      use_telescope: {
        instructions: '调整望远镜参数，观察金星凌日现象',
        controls: ['调整焦距', '改变放大率', '等待时机'],
        expected: '清晰看到金星在太阳表面移动'
      },
      record_contacts: {
        instructions: '准确记录四个接触时间，注意黑滴现象',
        controls: ['时间记录', '现象观察'],
        expected: '获得四个精确的接触时间'
      }
    };

    return guidance[action] || {
      instructions: '按照提示完成操作',
      controls: [],
      expected: '完成当前任务'
    };
  }

  /**
   * 检查教程进度
   */
  checkTutorialProgress(data) {
    if (!this.currentTutorial) return;

    const tutorial = this.tutorials.get(this.currentTutorial);
    const currentStepData = tutorial.steps[this.currentStep];

    if (this.meetsStepRequirements(currentStepData, data)) {
      this.completeStep(currentStepData.id);
    }
  }

  /**
   * 检查是否满足步骤要求
   */
  meetsStepRequirements(step, data) {
    const requirements = {
      measure_parallax: () => data.type === 'parallax_angle',
      select_observation_point: () => data.pointId,
      record_contacts: () => data.contactTimes?.length === 4,
      calculate_distance: () => data.calculatedDistance
    };

    const check = requirements[step.action];
    return check ? check() : true;
  }

  /**
   * 授予成就
   */
  grantAchievement(tutorialId, userId = 'default') {
    const achievements = {
      parallax_basics: '视差大师',
      transit_1761: '历史重现者',
      precise_calculation: '计算专家',
      discovery_challenge: '发现先锋'
    };

    const achievementName = achievements[tutorialId];
    if (achievementName) {
      this.achievements.add({
        name: achievementName,
        tutorialId,
        userId,
        granted: new Date()
      });

      eventSystem.emit('achievementUnlocked', {
        name: achievementName,
        tutorialId
      });
    }

    return achievementName;
  }

  /**
   * 检查成就
   */
  checkAchievement(data) {
    const achievements = [
      {
        name: '首次测量',
        condition: () => data.type === 'first_measurement',
        reward: '获得基础测量技能'
      },
      {
        name: '精度提升',
        condition: () => data.error < 5,
        reward: '测量精度达到5%以内'
      },
      {
        name: '历史重现',
        condition: () => data.year === 1761 && data.error < 10,
        reward: '重现1761年观测精度'
      }
    ];

    achievements.forEach(achievement => {
      if (achievement.condition()) {
        this.achievements.add({
          ...achievement,
          granted: new Date()
        });

        eventSystem.emit('achievementUnlocked', achievement);
      }
    });
  }

  /**
   * 获取教程列表
   */
  getAvailableTutorials() {
    return Array.from(this.tutorials.entries()).map(([id, tutorial]) => ({
      id,
      title: tutorial.title,
      description: tutorial.description,
      difficulty: tutorial.difficulty,
      estimatedTime: tutorial.estimatedTime,
      steps: tutorial.steps.length
    }));
  }

  /**
   * 获取当前教程状态
   */
  getTutorialStatus(userId = 'default') {
    const progress = this.userProgress.get(userId);
    if (!progress) return null;

    return Array.from(progress.entries()).map(([tutorialId, status]) => ({
      tutorialId,
      title: this.tutorials.get(tutorialId)?.title,
      currentStep: status.currentStep,
      totalSteps: this.tutorials.get(tutorialId)?.steps.length || 0,
      completed: status.completed,
      progress: (status.currentStep / (this.tutorials.get(tutorialId)?.steps.length || 1)) * 100
    }));
  }

  /**
   * 获取用户成就
   */
  getUserAchievements(userId = 'default') {
    return Array.from(this.achievements).filter(a => a.userId === userId);
  }

  /**
   * 保存用户进度
   */
  saveUserProgress(userId = 'default') {
    const progress = {
      tutorials: Object.fromEntries(this.userProgress.get(userId) || new Map()),
      achievements: Array.from(this.achievements)
    };

    localStorage.setItem(`educational_progress_${userId}`, JSON.stringify(progress));
  }

  /**
   * 加载用户进度
   */
  loadUserProgress(userId = 'default') {
    const saved = localStorage.getItem(`educational_progress_${userId}`);
    if (saved) {
      const progress = JSON.parse(saved);
      this.userProgress.set(userId, new Map(Object.entries(progress.tutorials)));
      this.achievements = new Set(progress.achievements);
    }
  }

  /**
   * 重置进度
   */
  resetProgress(userId = 'default') {
    this.userProgress.delete(userId);
    this.achievements.clear();
    localStorage.removeItem(`educational_progress_${userId}`);

    eventSystem.emit('progressReset', { userId });
  }

  /**
   * 获取提示
   */
  getHint(tutorialId, stepId) {
    const tutorial = this.tutorials.get(tutorialId);
    const step = tutorial?.steps.find(s => s.id === stepId);

    if (step?.hints?.length > 0) {
      const randomHint = step.hints[Math.floor(Math.random() * step.hints.length)];
      return {
        hint: randomHint,
        stepId,
        tutorialId
      };
    }

    return null;
  }

  /**
   * 跳过当前步骤
   */
  skipStep(userId = 'default') {
    if (!this.currentTutorial) return;

    this.completeStep(this.tutorials.get(this.currentTutorial).steps[this.currentStep].id, userId);
  }

  /**
   * 获取学习统计
   */
  getLearningStatistics(userId = 'default') {
    const tutorials = this.getTutorialStatus(userId);
    const achievements = this.getUserAchievements(userId);

    return {
      totalTutorials: this.tutorials.size,
      completedTutorials: tutorials.filter(t => t.completed).length,
      totalTime: tutorials.reduce((sum, t) => sum + (t.totalTime || 0), 0),
      achievements: achievements.length,
      currentStreak: this.calculateStreak(userId),
      accuracy: this.calculateOverallAccuracy(userId)
    };
  }

  /**
   * 计算连续学习天数
   */
  calculateStreak(userId = 'default') {
    const progress = this.userProgress.get(userId);
    if (!progress) return 0;

    const dates = Array.from(progress.values())
      .filter(p => p.completed)
      .map(p => p.completed.toDateString());

    return this.countConsecutiveDays(dates);
  }

  /**
   * 计算总精度
   */
  calculateOverallAccuracy(userId = 'default') {
    // 基于用户历史计算的平均精度
    return 85 + Math.random() * 10; // 模拟数据
  }

  /**
   * 计算连续天数
   */
  countConsecutiveDays(dates) {
    if (dates.length === 0) return 0;

    const sorted = [...new Set(dates)].sort();
    let streak = 1;
    let maxStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1]);
      const curr = new Date(sorted[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }

    return maxStreak;
  }
}

// 创建全局实例
export const educationalGuidanceSystem = new EducationalGuidanceSystem();
export default EducationalGuidanceSystem;
