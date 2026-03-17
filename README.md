# 打赌助手

一个基于 `uni-app + Vue 3 + Vite` 的轻量打赌记录工具，支持 H5 和微信小程序构建。

## 功能

* 维护多个赌局
* 编辑赌局标题
* 录入正方 / 反方下注
* 自动计算奖池、赔率、小计
* 结算、归档、状态切换
* 本地持久化保存
* 导出当前页面海报

## 技术栈

* `uni-app`
* `Vue 3`
* `Vite`
* Node.js 原生测试

## 目录结构

    .
    ├─ src/
    │  ├─ pages/
    │  │  └─ index/
    │  │     └─ index.vue
    │  ├─ utils/
    │  │  └─ bet.mjs
    │  ├─ App.vue
    │  ├─ main.js
    │  ├─ manifest.json
    │  └─ pages.json
    ├─ scripts/
    │  └─ postbuild-mp-weixin.mjs
    ├─ tests/
    │  └─ bet.test.mjs
    ├─ uni-app-version/
    └─ package.json

## 安装

    npm install

## 开发

    # H5
    npm run dev:h5
    
    # 微信小程序
    npm run dev:mp-weixin

## 构建

    # H5 构建
    npm run build:h5
    
    # 微信小程序构建
    npm run build:mp-weixin

默认构建命令：

    npm run build

## 微信小程序导入

这个仓库根目录是源码工程，不是原生小程序运行目录。

构建后请在微信开发者工具中导入：

    dist/build/mp-weixin

不要直接导入仓库根目录，否则会提示找不到 `app.json`。

## 测试

    npm test

## 说明

* 小程序 `AppID` 配置在 [`src/manifest.json`](./src/manifest.json)
* 页面入口配置在 [`src/pages.json`](./src/pages.json)
* 核心计算逻辑在 [`src/utils/bet.mjs`](./src/utils/bet.mjs)

## 仓库

GitHub:

    https://github.com/specifi-slash-adoptedfather/gambling-simulator
