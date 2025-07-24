# 金星凌日测距教学网站 - 部署文档

## 1. 本地开发环境搭建

### 1.1 环境要求
- **Node.js**: ≥18.0.0
- **npm**: ≥8.0.0 或 **yarn**: ≥1.22.0
- **现代浏览器**: Chrome 90+, Firefox 90+, Safari 14+

### 1.2 项目初始化
```bash
# 克隆项目
git clone <repository-url>
cd astronomy

# 安装依赖
npm install
# 或
yarn install

# 启动开发服务器
npm run dev
# 或
yarn dev
```

### 1.3 开发服务器配置
开发服务器默认运行在 `http://localhost:3000`，配置详见 `vite.config.js`：

```javascript
export default defineConfig({
  server: {
    port: 3000,
    host: true, // 允许外部访问
    open: true, // 自动打开浏览器
    cors: true
  }
});
```

## 2. 构建配置

### 2.1 生产构建
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 2.2 构建优化配置
```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three'],
          utils: ['@tweenjs/tween.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

## 3. Cloudflare Pages部署

### 3.1 连接GitHub仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Pages" 选项卡
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 授权并选择GitHub仓库

### 3.2 构建配置
```yaml
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js version: 18
```

### 3.3 环境变量配置
```bash
NODE_VERSION=18
NPM_VERSION=8
VITE_APP_TITLE=Venus Transit Astronomy
```

### 3.4 自动部署配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: astronomy
          directory: dist
```

## 4. 性能优化

### 4.1 资源优化
```javascript
// 纹理预加载
const preloadTextures = [
  '/textures/earth/earth_day.jpg',
  '/textures/sun/sun_surface.jpg',
  '/textures/venus/venus_surface.jpg'
];

preloadTextures.forEach(url => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
});
```

### 4.2 代码分割
```javascript
// 动态导入
const loadModule = async (moduleName) => {
  switch (moduleName) {
    case 'telescope':
      return await import('./systems/TelescopeView.js');
    case 'recorder':
      return await import('./systems/DataRecorder.js');
    default:
      throw new Error(`Unknown module: ${moduleName}`);
  }
};
```

## 5. 监控与错误处理

### 5.1 全局错误处理
```javascript
class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
  }
  
  setupGlobalHandlers() {
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
  }
  
  handleError(event) {
    console.error('Application Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    this.showUserFriendlyError();
  }
  
  handleRejection(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault();
  }
  
  showUserFriendlyError() {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #ff4444; color: white; padding: 15px; border-radius: 5px; z-index: 10000;">
        应用遇到问题，请刷新页面重试
        <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px;">刷新</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}

new ErrorHandler();
```

### 5.2 WebGL兼容性检查
```javascript
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    // 检查必要的扩展
    const requiredExtensions = ['OES_texture_float', 'WEBGL_depth_texture'];
    const missingExtensions = requiredExtensions.filter(ext => !gl.getExtension(ext));
    
    if (missingExtensions.length > 0) {
      console.warn('Missing WebGL extensions:', missingExtensions);
    }
    
    return true;
  } catch (error) {
    console.error('WebGL check failed:', error);
    showWebGLError();
    return false;
  }
}

function showWebGLError() {
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
      <h2>浏览器不支持WebGL</h2>
      <p>这个应用需要WebGL支持才能运行。请：</p>
      <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
        <li>更新到最新版本的浏览器</li>
        <li>启用硬件加速</li>
        <li>更新显卡驱动程序</li>
      </ul>
    </div>
  `;
}
```

## 6. 备用部署方案

### 6.1 GitHub Pages部署
```yaml
# .github/workflows/gh-pages.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install and build
        run: |
          npm ci
          npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 6.2 Netlify部署
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 6.3 Vercel部署
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": null
}
```

## 7. 域名和SSL配置

### 7.1 自定义域名设置
```bash
# 在Cloudflare Pages中添加自定义域名
# 1. 进入项目设置
# 2. Custom domains
# 3. 添加域名: astronomy.yourdomain.com
# 4. 配置DNS记录
```

### 7.2 SSL/TLS配置
```yaml
# 在Cloudflare中配置
SSL/TLS encryption mode: Full (strict)
Always Use HTTPS: On
HTTP Strict Transport Security (HSTS): Enabled
Minimum TLS Version: 1.2
```

## 8. 缓存策略

### 8.1 静态资源缓存
```javascript
// vite.config.js 中配置文件名hash
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    }
  }
});
```

### 8.2 Cloudflare缓存规则
```yaml
# Page Rules设置
Pattern: astronomy.yourdomain.com/assets/*
Settings:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 year
  - Edge Cache TTL: 1 month

Pattern: astronomy.yourdomain.com/*.js
Settings:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
  - Edge Cache TTL: 1 week
```

## 9. 维护和更新

### 9.1 依赖更新策略
```bash
# 检查过时依赖
npm outdated

# 更新所有依赖到最新版本
npm update

# 安全审计
npm audit
npm audit fix
```

### 9.2 监控检查清单
- [ ] 页面加载时间 < 5秒
- [ ] 3D渲染帧率 > 30fps
- [ ] 错误率 < 1%
- [ ] 移动端兼容性
- [ ] 跨浏览器测试
- [ ] 纹理资源正常加载
- [ ] 数据计算准确性

### 9.3 备份策略
```bash
# 定期备份重要文件
backup_files=(
  "public/data/"
  "public/textures/"
  "src/"
  "docs/"
)

# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf "astronomy-backup-$DATE.tar.gz" "${backup_files[@]}"
```

## 10. 故障排查

### 10.1 常见问题
**问题**: 纹理加载失败
```javascript
// 解决方案: 添加纹理加载重试机制
async function loadTextureWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await loadTexture(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**问题**: 3D渲染性能差
```javascript
// 解决方案: 动态调整渲染质量
class QualityManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.targetFPS = 30;
    this.currentFPS = 60;
  }
  
  adjustQuality() {
    if (this.currentFPS < this.targetFPS) {
      // 降低渲染质量
      this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.5));
    } else if (this.currentFPS > this.targetFPS + 10) {
      // 提高渲染质量
      this.renderer.setPixelRatio(Math.min(2, this.renderer.getPixelRatio() + 0.5));
    }
  }
}
```

### 10.2 日志收集
```javascript
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }
  
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.logs.push(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console[level](message, data);
  }
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

const logger = new Logger();
```