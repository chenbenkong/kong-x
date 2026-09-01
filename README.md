# kong-x（天宫立体课堂）

> 中国空间站 Tiangong 交互式 3D 教案 —— 科幻风 HUD、在轨动效、NASA 真实贴图、UnrealBloom 泛光。

## 项目简介

**kong-x** 是一套面向课堂的「中国空间站」交互式 3D 教案。它把天宫空间站（天和核心舱 + 问天 / 梦天实验舱的 T 字构型）搬进浏览器，配合科幻风格的 HUD 与实时遥测，让学生像看指挥大厅大屏一样认识这座"太空家园"。

项目**纯原生 HTML / CSS / JavaScript**，通过 importmap 直接加载本地 `js/vendor/three.module.js`，**无需构建步骤、无第三方 CDN 依赖**，双击 `index.html` 即可运行。

## 功能特性

- 🛰️ **T 字构型空间站**：天和核心舱、问天实验舱、梦天实验舱，含可展开太阳翼。
- 🎬 **在轨动效**：可暂停 / 调速的真实轨道运行模拟（默认 ×30 时间流速），遥测面板实时显示轨道高度（≈400 km）、飞行速度（≈7.68 km/s）、绕地圈数、累计航程、轨道倾角等。
- 🔭 **多视角预设**：全局总览 / 天和核心舱 / 问天实验舱 / 梦天实验舱 / T 字构型俯瞰 / 地平线视角，一键切换。
- 🧩 **模型拆解与剖切**：爆炸 / 组装滑杆拆解舱段，太阳翼展开状态切换，舱体剖切透明度调节，露出门内部构造。
- 🏷️ **舱段标注与资料卡**：显示舱段标注、部件名称；点击任意舱段弹出资料卡（作用说明、技术参数、冷知识），并可一键「镜头对准此舱段」。
- 📚 **学习区抽屉**：教学目标 / 认识三舱 / 任务时间线 / 数据速查 / 课堂测验 五个标签页，直接用于授课。
- 🌍 **NASA 真实贴图**：地球采用 NASA 提供的昼 / 夜 / 云层 / 地形 / 水域五套真实贴图（位于 `js/assets/`）。
- ✨ **UnrealBloom 泛光**：使用 Three.js 后期处理 + UnrealBloom 实现科幻发光质感。
- 🔊 **环境音效**：可选开关的太空环境音。
- 🖱️ **交互**：拖拽旋转、滚轮缩放；移动端适配。

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 3D 引擎 | Three.js（本地 `js/vendor/three.module.js`，r1xx） | WebGL 渲染、轨道控制、后期处理 |
| 后期 | EffectComposer + UnrealBloom | 泛光质感 |
| 语言 | 原生 JavaScript（ES Module + importmap） | 无打包、无框架 |
| 样式 | 原生 CSS（`css/style.css`） | 科幻 HUD 风格 |
| 资源 | NASA 地球贴图（`js/assets/`） | 昼 / 夜 / 云 / 地形 / 水域 |

## 目录结构

```
kong-x/
├── index.html              # 应用骨架：HUD 标题 / 遥测 / 视角切换 / 控制台 / 学习抽屉
├── css/
│   └── style.css           # 全部样式（科幻风 HUD）
└── js/
    ├── main.js             # 入口：场景初始化、主循环、后期处理
    ├── station.js          # 空间站建模（舱段 / 太阳翼 / 拆解 / 剖切）
    ├── environment.js      # 地球、星空、光照、贴图
    ├── controls.js         # 视角预设与相机控制
    ├── ui.js               # HUD、资料卡、学习区交互
    ├── data.js             # 舱段 / 教学文案数据
    ├── assets/             # NASA 地球贴图（day/night/clouds/topology/water）
    └── vendor/             # three.module.js + addons
```

## 本地运行

纯静态页面，**无需安装依赖、无需构建**：

1. 直接用浏览器打开 `index.html` 即可。
2. 若浏览器对本地 `importmap` / ES Module 有跨域限制，可起一个本地静态服务器：
   ```bash
   # 任选其一
   python -m http.server 8080
   # 或
   npx serve .
   ```
   然后访问 `http://localhost:8080/`。

## 在线演示

🌐 https://chenbenkong.github.io/kong-x/

## 说明 / 备注

- 项目为**科普教学用途**，空间站形态与参数为示意 / 近似值，旨在帮助理解，非工程级精确数据。
- 所有依赖（Three.js）已随仓库提供，离线可用。
