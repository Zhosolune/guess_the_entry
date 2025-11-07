# 技术方案设计 — UI 极简风格与统一间距改造

## 概述
- 目标：统一三大区域（文本、已猜对字符、坟场）间距与对齐；移除紫色主题与多余装饰；采用中性色扁平化设计；以 CSS 变量管理主题；确保响应式与跨浏览器一致。
- 技术栈：React + TypeScript + Tailwind CSS + 原生 CSS 变量；构建工具 Vite。

## 主题与变量方案
在 `src/index.css` 的 `@layer base` 中注入 CSS 变量，并在暗色模式下覆盖：

```css
:root {
  /* 基础中性色 */
  --color-bg-app: #ffffff;
  --color-bg-card: #ffffff;
  --color-border: #e0e0e0;
  --color-text-primary: #1f2937; /* gray-800 */
  --color-text-secondary: #6b7280; /* gray-500 */

  /* 按钮与控件 */
  --btn-bg: #f3f4f6; /* gray-100 */
  --btn-text: #111827; /* gray-900 */
  --btn-border: #e5e7eb; /* gray-200 */
  --btn-hover-bg: #e5e7eb; /* gray-200 */
  --btn-disabled-bg: #f9fafb; /* gray-50 */

  /* 间距变量（统一三大区域） */
  --section-padding: 1rem; /* mobile 默认 */
}

@media (min-width: 1024px) {
  :root { --section-padding: 1.25rem; }
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-app: #0f1115;
    --color-bg-card: #111318;
    --color-border: #2a2d33;
    --color-text-primary: #e5e7eb;
    --color-text-secondary: #9ca3af;

    --btn-bg: #1f232a;
    --btn-text: #e5e7eb;
    --btn-border: #2a2d33;
    --btn-hover-bg: #262a31;
    --btn-disabled-bg: #171a1f;
  }
}
```

## 自定义组件类与应用点位
在 `src/index.css` 的 `@layer components` 中新增以下类用于统一样式：

```css
/* 卡片扁平化（统一边框与内边距，移除阴影） */
.card-flat {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: var(--section-padding);
  transition: all 0.3s ease;
}

/* 扁平化按钮（中性配色，轻微状态反馈） */
.btn-flat {
  background: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--btn-border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}
.btn-flat:hover { background: var(--btn-hover-bg); }
.btn-flat:disabled { background: var(--btn-disabled-bg); opacity: 0.7; cursor: not-allowed; }

/* 统一区块（用于三大区域外层容器） */
.section { padding: var(--section-padding); }

/* 简化标题样式（保留功能性标识） */
.section-title { font-weight: 600; font-size: 1rem; color: var(--color-text-primary); }
.section-subtitle { font-weight: 400; font-size: 0.875rem; color: var(--color-text-secondary); }
```

应用点位：
- 页面背景：`App.tsx` 顶层容器由渐变改为 `style={{ background: 'var(--color-bg-app)' }}` 或 `className="bg-[var(--color-bg-app)]"`。
- 卡片：`GameBoard`、`CorrectPanel`、`Graveyard` 外层容器使用 `card-flat section` 替代当前 `game-card` 与冗余阴影类。
- 按钮：统一替换为 `btn-flat`，保留 `focus:ring` 可选（或简化为边框色加深）。
- 标题：使用 `section-title` 与 `section-subtitle`，移除强渐变与额外装饰。

## 现有类的调整策略
- 移除或改造：
  - `game-card`: 由 `@apply bg-white rounded-xl shadow-lg ...` 改为引用 `.card-flat`。
  - 渐变背景（如 `bg-gradient-to-br from-blue-50 to-indigo-100`）：替换为 `bg-[var(--color-bg-app)]`。
  - 复杂阴影与扫光：如 `.success-banner` 的强阴影与渐变，可降级为边框强调；保留功能性提示颜色但去除过度装饰。
- 保留：
  - 区块图标与坟场/正确字符的功能色（红/绿）保留；若与中性主题冲突，优先降低饱和度而非移除。

## 间距与对齐统一方案
- 三大区域统一使用 `.section` 或 `.card-flat`（已包含统一 padding）。
- 列栅布局保持：左侧主内容（文本区域）与右侧侧栏（已猜对字符、坟场）继续使用 `lg:grid lg:grid-cols-3` 或现有栅格，仅在容器内保持相同的内边距。
- 移除多余的 `mt-*` 与 `space-y-*`，改为以容器间统一 `gap` 管理（例如 `gap-6`）。

## 响应式与暗色模式
- 间距变量在 `≥1024px` 提升到 `1.25rem`，移动端保持紧凑但不拥挤。
- 暗色模式通过变量覆盖保证对比度；边框与背景不产生“漂浮”感（扁平化）。

## 过渡动画策略
- 统一采用 `transition: all 0.3s ease`；卡片与按钮应用，避免为普通文本元素设置全局过渡导致性能抖动。
- 保留字符揭示动画（与功能相关），不改动其动效逻辑。

## 变更影响与风险
- 影响范围：主要为样式与类名；不改动数据结构与业务逻辑。
- 风险：
  - Tailwind 与自定义类混用需注意优先级；建议在组件层减少 Tailwind 冗余类，明确采用 `.card-flat/.btn-flat`。
  - 少量视觉差异在暗色下需微调边框与背景色差。

## 测试策略
- 场景：
  - 浏览器：Chrome/Firefox/Safari（桌面）；移动端响应式模拟。
  - 主题：浅色/暗色模式切换。
  - 尺寸：常见视口（375×667、768×1024、1440×900）。
- 验收：
  - 三大区域内边距一致，左右对齐；不同断点下视觉稳定。
  - 无卡片阴影；边框为 `1px var(--color-border)`；按钮扁平化且反馈清晰。
  - 保留的功能性图标与标题样式简洁且可辨识。

## 实施清单（概览）
1. 在 `index.css` 注入 `:root` 与暗色模式变量；新增 `.card-flat/.btn-flat/.section/.section-title`。
2. `App.tsx` 顶层背景改为中性色变量；移除渐变。
3. `GameBoard/CorrectPanel/Graveyard` 外层容器替换为 `card-flat section`；统一间距与对齐。
4. 将页面内按钮统一替换为 `btn-flat`；保留轻微 hover/focus。
5. 清理冗余 `shadow-*`、强渐变、扫光等装饰类，保留功能性提示。
6. 预览与多场景验证，调整暗色模式边框与背景对比度。

## 里程碑与回滚
- 里程碑：变量注入 → 卡片/按钮替换 → 页面背景与布局统一 → 预览与验收。
- 回滚策略：所有改动限定在样式与类名，出现问题可快速恢复原类或变量；不影响核心逻辑。
