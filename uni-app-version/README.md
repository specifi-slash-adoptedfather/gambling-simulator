# 打赌模拟器 - uni-app 版本

这是一个基于 uni-app 开发的打赌记录和赔率计算工具，支持编译到微信小程序、H5、App 等多个平台。

## 功能特性

- ✅ 可编辑的标题
- ✅ 自动计算总奖池
- ✅ 正方/反方两列显示
- ✅ 实时计算赔率
- ✅ 添加/删除参与者
- ✅ 标记是否已缴费
- ✅ 显示预期收益
- ✅ 数据持久化存储
- ✅ 保存为图片（待完善）

## 技术栈

- Vue 3 + TypeScript
- uni-app 框架
- Vite 构建工具

## 开发步骤

### 1. 安装依赖

```bash
cd uni-app-version
npm install
```

### 2. 运行到微信小程序

```bash
npm run dev:mp-weixin
```

然后使用微信开发者工具打开 `dist/dev/mp-weixin` 目录。

### 3. 运行到 H5

```bash
npm run dev:h5
```

### 4. 构建生产版本

```bash
# 构建微信小程序
npm run build:mp-weixin

# 构建 H5
npm run build:h5
```

## 微信小程序配置

1. 在微信公众平台注册小程序账号
2. 获取 AppID
3. 在 `src/manifest.json` 中配置 `mp-weixin.appid`
4. 使用微信开发者工具导入项目

## 主要改动说明

从 Web 版本迁移到 uni-app 的主要改动：

1. **标签替换**
   - `div` → `view`
   - `button` → `button` 或 `view`（带 @tap）
   - `input` → `input`（属性略有不同）

2. **事件处理**
   - `@click` → `@tap`
   - `@blur` → `@blur`
   - `@keyup.enter` → `@confirm`

3. **样式单位**
   - `px` → `rpx`（响应式像素单位）
   - 1rpx = 0.5px（在 iPhone6 上）

4. **API 替换**
   - `localStorage` → `uni.getStorageSync/setStorageSync`
   - `alert/confirm` → `uni.showModal`
   - `console.log` → `console.log`（保持不变）

5. **组件差异**
   - 使用 `checkbox` 组件替代原生 input[type="checkbox"]
   - 移除了不支持的 CSS 属性（如某些渐变效果）

## 目录结构

```
uni-app-version/
├── src/
│   ├── pages/
│   │   └── index/
│   │       └── index.vue      # 主页面
│   ├── static/                # 静态资源
│   ├── App.vue                # 应用入口
│   ├── main.ts                # 入口文件
│   ├── manifest.json          # 应用配置
│   └── pages.json             # 页面配置
├── package.json
└── vite.config.ts
```

## 注意事项

1. 小程序有包大小限制（主包 2MB，分包 20MB）
2. 某些 Web API 在小程序中不可用
3. 样式需要使用 rpx 单位以适配不同屏幕
4. 图片保存功能需要使用 canvas 实现

## 后续优化

- [ ] 完善保存为图片功能（使用 canvas）
- [ ] 添加分享功能
- [ ] 支持多个赌局管理
- [ ] 添加历史记录
- [ ] 支持导出数据

## License

MIT
