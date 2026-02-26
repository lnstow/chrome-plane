# Project: FlowRead - Chrome Extension Technical Specification
bun+vite+react+unocss

## 1. 项目概述 (Overview)
**FlowRead** 是一款基于“滑动窗口”概念的标签页管理扩展。旨在缓解“标签囤积癖”与浏览器性能之间的矛盾。
核心理念是**解耦**：将内容的“阅读状态”（Tab）与“管理状态”（Card）分离。
*   **体验目标**：用户无需管理关闭标签页，只需不断打开新内容。
*   **核心机制**：扩展接管特定域名的所有 Tab，维护一个无限长度的内容列表（Dashboard），但在浏览器中只保留最近使用的 50 个 Tab（Active），超出的 Tab 会被静默回收（Archived），点击卡片时瞬间恢复。

## 2. 技术栈 (Tech Stack)
*   **Platform**: Chrome Extension (Manifest V3)
*   **Language**: JavaScript (ES6+) or TypeScript
*   **Storage**: `chrome.storage.local`
*   **Communication**: Chrome Runtime Messaging (Long-lived connections or One-time requests)

## 3. 核心数据结构 (Data Structures)

### 3.1. Card Object (卡片对象)
存储在 `storage.local` 中，按域名分组。
```typescript
interface Card {
  key: string;        // 唯一ID，生成算法：MD5(Canonical_URL) 或 MD5(URL_Path)
  url: string;        // 当前内容的链接
  domain: string;     // e.g., "36kr.com"
  title: string;
  type: 'item' | 'list' | 'default'; // 卡片类型
  meta: {
    cover?: string;         // 封面图 (详情页用)
    previewImgs?: string[]; // 预览图数组 (列表页用)
  };
  status: 'active' | 'archived'; // active=tab存在, archived=tab被回收/离线
  tabId: number | null; // 如果 status=='active'，存储对应 tabId
  lastActiveTime: number; // 用于 LRU 排序的时间戳
  createdAt: number;
}
```

### 3.2. Domain State (域名状态管理)
```typescript
interface DomainState {
  [domain: string]: {
    cards: { [key: string]: Card }; // 所有卡片 Map
    activeKeys: string[]; // 仅存储当前 status='active' 的 keys，按 LRU 顺序排列 (尾部为最新)
    tabIdToKeyMap: { [tabId: number]: string }; // 反向索引，用于快速查找 Tab 当前绑定的 Key
  }
}
```

### 3.3. Trash Object (回收站)
```typescript
interface TrashItem {
  card: Card;
  deletedAt: number; // 删除时间，用于判断是否超过 7 天
}
```

---

## 4. 关键业务逻辑 (Core Business Logic)

### 4.1. 全托管模式 (Full Managed Scope)
*   **触发条件**：只要 Tab 的 URL 匹配配置的域名列表（无论用户手动输入、从外部点击、还是站内跳转），都必须被扩展捕获。
*   **实现**：Content Script 注入所有目标域名，页面加载 (`onload`) 及 URL 变化 (`popstate`, `hashchange`) 时均触发上报。

### 4.2. 智能探针与心跳 (The Agent Model)
Content Script 作为 Agent，逻辑如下：
1.  **解析 DOM**：根据配置提取信息（见第 6 节）。
2.  **生成 Key**：计算当前 URL 的唯一指纹。
3.  **上报心跳**：发送 `PAGE_HEARTBEAT` 消息给 Background，包含 `{ key, url, title, type, meta, tabId }`。

### 4.3. Background 核心处理流
收到 `PAGE_HEARTBEAT` 后的处理流程：

1.  **上下文检查 (Context Switch)**：
    *   检查该 `tabId` 之前是否绑定了 `oldKey`（查 `tabIdToKeyMap`）。
    *   **如果存在 `oldKey` 且 `oldKey != newKey`**（即用户在 Tab 内点击了链接跳转）：
        *   **解绑**：将 `oldKey` 对应的 Card 状态更新为 `archived`，`tabId = null`。
        *   **保留**：`oldKey` 的卡片**仍然保留**在 Dashboard 列表中（用于历史回溯），**不**移动到回收站。
        *   从 `activeKeys` 数组中移除 `oldKey`。

2.  **新卡片处理 (New/Update Card)**：
    *   如果 `newKey` 已存在：更新 Card 内容，将其移动到列表顶部。
    *   如果 `newKey` 不存在：创建新 Card。
    *   **Tab 去重**：检查 `newKey` 是否已经绑定了 *另一个* `existingTabId`。
        *   如果是，说明重复打开了。策略：**“新皇登基”**——保留当前的 `currentTabId`，关闭旧的 `existingTabId`。

3.  **绑定与状态更新**：
    *   更新 Card: `status = 'active'`, `tabId = currentTabId`, `lastActiveTime = now`.
    *   更新 `tabIdToKeyMap`: `currentTabId` -> `newKey`.
    *   更新 `activeKeys`: 将 `newKey` 移至数组尾部。

4.  **容量控制 (Quota & LRU)**：
    *   检查 `activeKeys.length > 50`。
    *   **如果超限**：
        *   取数组头部元素（最旧） `victimKey`。
        *   获取 `victimTabId`。
        *   **执行回收**：`chrome.tabs.remove(victimTabId)`。
        *   **标记归档**：更新 `victimKey` 的 Card 为 `archived`，`tabId = null`。
        *   **注意**：此次关闭是扩展发起的，需设置 flag 避免误触发“手动关闭”逻辑。

### 4.4. 手动关闭与回收站 (Manual Close)
监听 `chrome.tabs.onRemoved`：
1.  检查是否为扩展自动回收（检查内存中的 `isRecycling` 标记）。
2.  **如果是用户手动关闭**：
    *   通过 `tabId` 找到对应的 `currentKey`。
    *   将该 Card 移入 `Trash`（回收站），记录 `deletedAt`。
    *   从 Dashboard 列表中移除。
3.  **自动清理**：每次启动或每天检查一次 Trash，删除 `deletedAt > 7 days` 的项目。

---

## 5. UI 交互设计 (Dashboard)

*   **列表渲染**：按 `lastActiveTime` 倒序排列。
*   **状态指示**：
    *   🟢 **Active**: 右上角绿点。点击 -> `chrome.tabs.update(tabId, {active:true})`。
    *   ⚪ **Archived**: 右上角灰点。点击 -> `chrome.tabs.create({url})` (新 Tab 打开后会自动触发心跳重新绑定)。
*   **卡片样式**：
    *   **Type: Item**: 左图右文（Cover + Title）。
    *   **Type: List**: 抽屉样式，显示标题 + 底部横排 3 张小图。
    *   **Type: Default**: 纯文本卡片。

---

## 6. DOM 解析策略 (可配置化设计)

为了应对不同网站结构，采用 **Strategy Pattern (策略模式)**。请按以下结构编写解析模块。

### 6.1. SiteConfig 接口
```typescript
interface SiteConfig {
  domain: string; // e.g. "news.ycombinator.com"
  
  // 识别当前页面类型的规则
  typeDetector: (document: Document, url: URL) => 'item' | 'list' | 'default';
  
  // 提取器定义
  selectors: {
    item: {
      title: string; // CSS Selector
      cover: string; // CSS Selector (取 src 或 data-src)
      content?: string;
    };
    list: {
      items: string; // 列表项容器 Selector
      thumb: string; // 列表项内的缩略图 Selector
    };
  };
}
```

### 6.2. 默认兜底策略 (Fallback Adapter)
如果域名未命中特定配置，使用通用解析：
*   **Type**: 默认为 `item`。
*   **Title**: `document.title` or `og:title`.
*   **Cover**: `og:image`.

### 6.3. 示例配置 (Example Implementation)
*请在代码中实现一个名为 `SiteAdapters` 的注册表。*

```javascript
// Example for a Generic News Site
const SiteAdapters = {
  "example.com": {
    typeDetector: (doc) => doc.querySelector('.article-body') ? 'item' : 'list',
    selectors: {
      item: {
        title: 'h1.headline',
        cover: 'meta[property="og:image"]'
      },
      list: {
        items: '.news-feed .feed-item',
        thumb: 'img.preview'
      }
    }
  }
}
```

---

## 7. 开发路线图 (Implementation Steps)

1.  **Setup**: 初始化 Manifest V3 项目，配置 TypeScript。
2.  **Core Module**: 实现 `CardManager` 类（处理 Storage, LRU, Map 维护）。
3.  **Content Script**: 实现 `PageAgent`，包含 DOM 解析器和消息发送器。
4.  **Background**: 实现消息监听总线 (`PAGE_HEARTBEAT`) 和 Tab 事件监听 (`onRemoved`)。
5.  **Logic Integration**: 对接 LRU 算法与 Tab 移除/创建逻辑。
6.  **UI**: 使用 React/Vue 或 Vanilla JS 构建 Dashboard 管理页。
7.  **Testing**: 模拟 50+ Tab 场景，测试内存回收与状态恢复是否准确。