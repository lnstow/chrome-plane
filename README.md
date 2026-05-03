# Project: Plane - Chrome Extension Technical Specification
bun+vite+react+unocss

## 1. 项目概述 (Overview)
**Plane** 是一个 all-in-one 展示第三方网站内容/iframe的浏览器扩展。

## 2. 技术栈 (Tech Stack)
*   **Platform**: Chrome Extension (Manifest V3)
*   **Language**: TypeScript
*   **Storage**: `indexdb`
*   **扩展主页与iframe通信**: `window.postMessage`

## 3. 核心数据结构 (Data Structures)
参考 model.ts

---

## 4. 关键业务逻辑 (Core Business Logic)
1. 用户打开扩展主页，左右半屏展示两个列表
2. 扩展中实现一个微型后端Api.js，左列表调用 api.getList('https://japaneseasmr.com') 获取数据
3. api 的实现逻辑是 用iframe打开目标网页，然后contentjs会注入目标网页，解析网页数据并通过 window.postMessage 与 api通信
4. api 返回解析结果给ui展示，展示为 Card 列表，每行大约3个Card
5. 用户点击Card，将Card添加到右列表

contentjs逻辑如下：
1.  **解析 DOM**：根据dom提取信息，实现时无需关心具体解析逻辑，使用todo标记。
2.  **获取 Key**：获取当前页面的唯一key。
3.  **上报数据**：发送消息和数据给扩展主页。

---

## 5. UI 交互设计 (Dashboard)

*   **列表渲染**：按 `updateDate` 倒序排列。
*   **卡片样式**：
    *   **Type: Item**: 上图下文（Cover + Title）。
    *   **Type: List**: 抽屉样式，显示堆叠 3 张小图 + 标题。
    *   **Type: Default**: 纯文本卡片。
*   **交互功能**：
    *   点击右侧“已保存”列表中的卡片，在页面左下角打开悬浮 Iframe 窗口预览详情网页。
    *   悬浮窗支持自由拖动、缩放大小，点击标题栏链接，复制 URL。
    *   **多窗口预览 (LRU Cache Pool)**：支持同时打开最多 10 个 Iframe 悬浮窗口。当打开第 11 个窗口时，自动回收最久未使用的窗口。
    *   **窗口置顶与性能优化**：点击下层窗口时，会自动将其置于最顶层；通过维护固定的数组渲染位置并单纯变更 `z-index`，保证了切换窗口时 Iframe 内容不会重新加载（避免白屏）。

---
