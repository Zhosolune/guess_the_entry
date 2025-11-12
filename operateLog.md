时间：2025-11-06 14:21
操作类型：[修改]
影响文件：
- src/constants/game.constants.ts

时间：2025-11-07 10:40
操作类型：[重构]
影响文件：
- `src/components/Graveyard/Graveyard.tsx`
- `src/styles/animations.css`
变更摘要：坟场由纵向分组改为行内“分组标签+字块”流式布局，自动换行；滚动条更新为灰色圆角滑块，隐藏滚动槽。
原因：提升密度与阅读连续性，优化暗色主题与现代滚动条视觉一致性。
测试状态：[已测试]

变更摘要：统一 GameCategory 类型为中文枚举，调整 CATEGORIES 为中文键，消除类型不一致导致的潜在诊断问题。
原因：常量使用英文键与类型文件使用中文枚举不一致，可能引发 IDE/TS 误诊与后续数据不一致。
测试状态：[已测试]

时间：2025-11-07 11:45
操作类型：[修改]
影响文件：
- src/index.css
- src/App.tsx
- src/components/GameBoard/GameBoard.tsx
- src/components/CorrectPanel/CorrectPanel.tsx
- src/components/Graveyard/Graveyard.tsx
- src/components/GameStart/GameStart.tsx

变更摘要：引入中性色主题CSS变量；统一三大区域容器为 `card-flat section`，移除阴影改为1px浅色边框；按钮统一为 `btn-flat` 扁平化样式；顶层与开始页背景替换为中性变量；进度条采用变量强调色；保留图标与功能性标识并简化样式。
原因：落实UI极简改造需求，统一间距与对齐，提升浅/暗色模式下的一致性与可读性。
测试状态：[待测试]

时间：2025-11-07 12:10
操作类型：[修改]
影响文件：
- src/index.css
- src/components/GameStart/GameStart.tsx
- src/components/GameBoard/GameBoard.tsx

变更摘要：统一系统主题色为 #4772c3；领域选择按钮移除边框与放大效果，新增左上角 4px 绿色圆点标记（#4CAF50），悬浮背景轻灰（rgba(0,0,0,0.05)）；开始游戏与猜测按钮改为主题色实体按钮（hover/active 分别加深 10%/20%）；输入框焦点样式调整为 1px 主题色边框与轻微阴影；清理全局与词条/文本区域浅灰背景，确保文本在白色背景下清晰可读。
原因：根据用户视觉规范优化整体风格，提升交互一致性与可读性，改善原有过于阴沉的视觉效果。
测试状态：[已测试]

时间：2025-11-07 12:20
操作类型：[修改]
影响文件：
- src/index.css

变更摘要：统一 `.badge-primary` 与 `.form-textarea` 的主题色表现；移除浅色与暗色模式下的 indigo 焦点残留，改为使用 `--color-primary` 与一致的阴影效果。
原因：按“审查并更新所有使用主题色的元素”要求，进一步提升主题一致性和交互统一性。
测试状态：[已测试]

时间：2025-11-07 11:00
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/components/GameBoard/GameBoard.tsx

变更摘要：将遮罩样式改为纯灰半透明填充并移除中心“■”方块；增加圆角与轻微内阴影，暗色模式同步调整透明度与内阴影；保持字符块尺寸与布局不变。
原因：满足“纯灰填充、适中透明度、边缘过渡自然、不同尺寸适配”的视觉规范，提升与页面其它元素的协调性。
测试状态：[已测试]

时间：2025-11-06 16:40
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/styles/animations.css

变更摘要：胜利后播放 1.5 秒成功动画，随后自动灰框揭示未猜出的字符；渲染逻辑区分玩家揭示与自动揭示。
原因：增强胜利反馈与答案可读性，减少认知负担并提升完成后的理解效率。
测试状态：[已测试]

时间：2025-11-06 16:42
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/components/Graveyard/Graveyard.tsx
- src/components/GameStart/GameStart.tsx
- src/styles/animations.css

变更摘要：统一主卡片与相关卡片内边距（p-6）；新增自动揭示灰框字符样式（auto-revealed-char）与成功横幅样式（success-banner）。
原因：统一视觉留白与信息密度，改善移动端阅读体验与整体协调性。
测试状态：[已测试]

时间：2025-11-06 17:12
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/components/GameStart/GameStart.tsx
- src/App.tsx

变更摘要：删除 GameBoard 底部进度组件；将猜词输入框上移至词条与百科内容上方；右侧“已猜对字符”和“坟场”整体下移；开始页移除“随机选择”按钮，改为底部全宽“随机”选项；开始游戏按钮图标与文字置于同一行。
原因：优化交互流程与视觉层级，减少视线往返与操作负担；随机选项统一入口，避免选择后暴露具体领域。
测试状态：[已测试]

时间：2025-11-06 17:26
操作类型：[修改]
影响文件：
- src/App.tsx

变更摘要：移除右侧面板容器顶部间距，使“已猜对字符”面板顶边与上方对齐。
原因：用户反馈右侧面板与上方存在不必要的间距影响对齐。
测试状态：[已测试]

时间：2025-11-06 17:45
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/components/Graveyard/Graveyard.tsx
- src/components/CorrectPanel/CorrectPanel.tsx
变更摘要：
- 统一“已猜对字符”和“坟场”字块尺寸为 1.5rem × 1.5rem（移动端 1.25rem）；
- 坟场区域按首字母分组显示：英文按 A-Z，中文按拼音首字母，数字与特殊符号归类到“#”分区；
- 添加分组样式：分割线 1px、分组标签小字号 0.4rem、分组内字块间距 0.3rem、标签与内容间距 0.5rem；分组标签采用 sticky 固定显示；
- 保留字块的现有交互行为（点击样式与 hover 动效）。
原因：提升视觉一致性与可读性，满足用户关于尺寸统一与坟场分组的规范化展示需求。
测试状态：[已测试]

时间：2025-11-06 15:37
操作类型：[新增]
影响文件：
- cloudflare/.dev.vars
- .gitignore

变更摘要：新增 Cloudflare 本地密钥模板，并在 .gitignore 中忽略，避免密钥泄露。
原因：本地联调需要加载 DEEPSEEK_API_KEY，采用 .dev.vars 便于开发与安全管理。
测试状态：[已测试]

时间：2025-11-06 15:45
操作类型：[修改]
影响文件：
- src/services/deepseek.ts
- src/hooks/useGameState.ts

变更摘要：增加开发模式调试日志，打印 API 请求体与原始响应，定位无效响应问题。
原因：预览报错 `API返回数据格式无效`，需输出真实返回以比对预期 Schema。
测试状态：[已测试]

时间：2025-11-06 15:52
操作类型：[修改]
影响文件：
- cloudflare/src/index.js

变更摘要：统一 Worker 响应为 `{ success, data, timestamp }`，并将 `content` 映射到 `data.encyclopedia`；KV 缓存读写同步新结构并兼容旧结构。
原因：Worker 原始返回 `{ entry, content, category }` 与前端期望不一致，造成 `INVALID_RESPONSE`。
测试状态：[已测试]

时间：2025-11-06 15:02
操作类型：[修改]
影响文件：
- .env

变更摘要：将 `VITE_API_BASE_URL` 从占位域名改为本地 Worker 开发地址 `http://127.0.0.1:8787`，以消除浏览器 `net::ERR_FAILED`。
原因：占位域名无法解析导致网络请求在浏览器层失败；需使用本地或已部署的 Worker 域名。
测试状态：[已测试]
时间：2025-11-06 10:00
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/hooks/useGameState.ts
变更摘要：修复输入框在拼音输入超过两字母被清空的问题；修复正确猜测未取消遮盖显示的问题。
原因：前端输入交互限制导致 IME 组合被截断；状态更新未同步到 revealed 集合导致 UI 未揭示。
测试状态：[已测试]

时间：2025-11-06 15:22
操作类型：[新增|修改]
影响文件：
- src/components/CorrectPanel/CorrectPanel.tsx
- src/components/GameBoard/GameBoard.tsx
- src/styles/animations.css
- src/App.tsx
变更摘要：新增“已猜对字符”绿色面板；修复遮罩揭示动画重复播放，仅首次触发；百科区域改为自适应高度；坟场字符保持红色样式。
原因：提升可读性与浏览体验，满足对正确/错误字符的明确分区与配色需求。
测试状态：[已测试]

时间：2025-11-06 15:30
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/components/GameBoard/GameBoard.tsx
变更摘要：统一字符块尺寸（新增 .char-block，revealed/masked 共用）；标点符号默认不遮罩但占位一个块，避免排版错位。
原因：取消遮罩后文字比遮罩面积小导致不对齐，美观性下降；用户要求标点不遮罩。
测试状态：[已测试]

时间：2025-11-06 16:05
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/App.tsx
- src/services/deepseek.ts
- cloudflare/src/index.js
变更摘要：
- 将遮罩与揭示字符字体统一为 `0.75rem` 并居中显示，移除取消遮罩动画的蓝光效果；
- 进度计算排除标点符号，仅统计非标点字符的揭示进度；
- 前端为生成词条请求添加 `fresh=1` 参数，Worker 在 `fresh=1` 时绕过 KV 缓存读写，防止同类词条重复返回旧数据。
原因：提升显示一致性与排版美观；确保进度与视觉一致；解决同类别重复返回旧词条的问题。
测试状态：[已测试]
## 2025-11-07 14:34
- 操作类型：修改
- 影响文件：`src/components/GameStart/GameStart.tsx`

时间：2025-11-10 16:30
操作类型：[重构]
影响文件：
- `src/components/TopBar.tsx`
- `src/components/GameInfoBar/GameInfoBar.tsx`
- `src/components/SearchInput/SearchInput.tsx`
- `src/components/BottomToolbar/BottomToolbar.tsx`
- `src/components/TextDisplayArea/TextDisplayArea.tsx`
- `src/index.css`
变更摘要：移动端布局与滚动行为重构：顶部导航、信息栏、搜索栏改为固定定位；底部工具栏改为 position: fixed 并适配安全区域；仅文本区域可滚动并设置固定高度，使用 100dvh 与 iOS 惯性滚动，消除元素跳动和闪烁。
原因：满足移动端吸顶/吸底与滚动区域限定的需求，提升不同屏幕与键盘弹出场景下的可用性与可见性。
测试状态：[待测试]
- 变更摘要：将“随机”选项按钮改为独占一行，宽度与其他按钮一致，并在行内垂直居中。
- 原因：提高随机选项的布局一致性与可读性，满足“独占一行且垂直居中”的交互要求。
- 测试状态：已测试（本地预览无错误）

时间：2025-11-07 13:20
操作类型：[重构]
影响文件：
- src/components/TopBar.tsx
- src/App.tsx
- src/components/GameStart/GameStart.tsx

变更摘要：重构主页为 header-contents 结构，新增吸顶顶部栏（居中标题、左侧信息按钮弹窗显示规则、右侧主题切换），移除开始页的标题与规则卡片；在游戏进行页注入顶部栏并将页头统计与重置按钮右对齐，整体内容下移以避让顶部栏。
原因：按用户要求调整首页与游戏页的 UI 布局与交互，提升一致性与可发现性。
测试状态：[已测试]
时间：2025-11-07 15:10
操作类型：[重构]
影响文件：
- src/index.css
- src/components/TopBar.tsx
- src/components/GameStart/GameStart.tsx
- src/components/GameBoard/GameBoard.tsx
- src/components/Graveyard/Graveyard.tsx
- src/App.tsx
- src/utils/errorHandler.ts
- README.md

变更摘要：统一主题变量与无闪烁切换；将暗色变量改为 `html.dark`；替换组件中的 `text-gray-*` 为主题变量；增强 TopBar ARIA 与进度条主题；更新 README 主题使用指南。
原因：确保主题切换一致可控、减少 FOUC、提升无障碍与一致性。
测试状态：[已测试]
时间：2025-11-07 11:25
操作类型：[重构]
影响文件：
- src/components/Graveyard/Graveyard.tsx
- src/styles/animations.css
- src/App.tsx
变更摘要：将坟场“清空”功能重构为“首字母标签显示”功能；新增图标按钮（字母“A”）控制标签显隐，标签默认隐藏；标签采用半透明背景与小字号（约80%），加入淡入过渡动画；优化按钮 hover/active 态反馈。
原因：满足需求“按需显示首字母标签、默认不影响布局”，提升可读性与交互一致性，同时避免不必要的 DOM 操作。
测试状态：[已测试]
## 2025-11-07 16:44
- 时间：2025-11-07 16:44
- 操作类型：新增
- 影响文件：
  - src/components/CorrectPanel/CorrectPanel.tsx
- 变更摘要：为“已猜对字符”区域新增首字母分组与标签显隐功能，交互与坟场区域保持一致；复用 `.graveyard-group-chip` 与 `.graveyard-icon-btn` 样式。
- 原因：提升信息可读性与界面一致性，便于按首字母定位已猜对字符。
- 测试状态：已测试（本地预览 http://localhost:5174/，浏览器无错误提示）
时间：2025-11-07 16:59

时间：2025-11-10 17:35
操作类型：[修改]
影响文件：
- `src/components/TextDisplayArea/TextDisplayArea.tsx`

变更摘要：将文本区域改为固定定位（position: fixed），设置顶部约束为 `TopBar + GameInfoBar + SearchInput` 的总高度（`top: calc(var(--topbar-h) + var(--infobar-h) + var(--searchbar-h))`），底部约束为底部工具栏高度（`bottom: var(--bottombar-h)`），确保文本区域仅占据两者之间的可用空间并在内容溢出时滚动。
原因：满足移动端布局规范：顶部搜索栏与底部工具栏固定，正文区域自动适配剩余空间，避免与固定栏重叠。
测试状态：[已测试]（本地预览 http://localhost:5175/，浏览器无错误，滚动不遮挡顶部/底部栏）

时间：2025-11-10 17:52
操作类型：[重构]
影响文件：
- `src/components/TextDisplayArea/TextDisplayArea.tsx`

变更摘要：仅允许百科内容块滚动：外层固定容器改为 `overflow-hidden`；卡片与内部容器设为 `h-full` 并使用 `flex` 列布局；词条标题为非滚动块（`flex-none`）；百科内容为唯一滚动块（`flex-1 min-h-0 overflow-y-auto custom-scrollbar`）。
原因：满足“只有文本区特定层级可滚动，其余层级不滚动”的需求，避免外层滚动造成与固定工具栏的视觉/交互冲突。
测试状态：[已测试]（本地预览 http://localhost:5175/，滚动仅发生在百科内容块，标题与外层不滚动）

时间：2025-11-10 18:05
操作类型：[修改]
影响文件：
- `src/components/TextDisplayArea/TextDisplayArea.tsx`

变更摘要：根据最新需求，将滚动职责提升到内部列容器（`flex flex-col`），使“词条标题+百科内容”作为单一滚动区域；移除百科内容块的独立滚动样式，保持外层固定容器不滚动。
原因：满足“L137-147 整体可滚动，其余层级不滚动”的需求，统一滚动体验并避免双滚动条。
测试状态：[已测试]（本地预览 http://localhost:5175/，标题与百科内容整体滚动，未与固定栏重叠）
操作类型：[修改]
影响文件：
- src/index.css
- src/styles/animations.css
- theme.config.js

变更摘要：新增主题变量 `--color-border-success-accent` 与 `--color-border-danger-accent`；将“末项高亮”边框与成功横幅的硬编码颜色替换为上述变量。暗色模式通过 `html.dark` 覆盖变量自动生效。
原因：边框颜色统一用主题变量管理，提升明暗主题一致性与后续维护可控性。
测试状态：[已测试]（本地预览 http://localhost:5174/，浏览器无错误）
## 2025-11-07 16:52
- 时间：2025-11-07 16:52
- 操作类型：修改
- 影响文件：
  - src/styles/animations.css
  - src/components/Graveyard/Graveyard.tsx
  - src/components/CorrectPanel/CorrectPanel.tsx
- 变更摘要：
  - 将首字母标签 `.graveyard-group-chip` 的宽高统一为 1.5rem，与字块一致；通过保留占位（visibility 控制）确保显隐不影响整体对齐。
  - 为最新进入的字块添加主题色边框高亮（坟场红、已猜对绿），新字块加入时自动清除上一项高亮。
- 原因：保证显隐切换不影响布局整齐度，提升交互反馈的可感知性。
- 测试状态：已测试（本地预览 http://localhost:5174/，浏览器无错误提示）
## 2025-11-07 17:09
- 操作类型：修改
- 影响文件：
  - src/components/CorrectPanel/CorrectPanel.tsx
- 变更摘要：将“已猜对字符”区域的空态渲染调整为与“坟场”一致的卡片样式（居中图标、标题与提示文案，统一采用 `text-[var(--color-text-muted)]` 配色），以保持初始视觉一致性。
- 原因：统一两面板的初始状态视觉与信息层级，提升一致性与体验。
- 测试状态：已测试（本地预览，未发现浏览器错误）
时间：2025-11-07 14:00
操作类型：[修改]
影响文件：
- src/App.tsx
- src/components/GameBoard/GameBoard.tsx
变更摘要：修复胜利后白屏；取消胜利动画；胜利时将输入框替换为庆祝语和“再来一局”按钮；立即以灰色边框显示未猜出的字符供阅读。
原因：提升胜利结算的可读性与交互效率，避免白屏。
测试状态：[已测试] 本地预览运行正常，无浏览器报错，胜利后正常展示与重置。
时间：2025-11-07 14:20
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/styles/animations.css
变更摘要：移除所有 toast 弹窗；将胜利后自动揭示的未猜出字块边框由虚线改为实线灰色边框。
原因：按需关闭弹窗提示，提升胜利结算的阅读体验与风格统一。
测试状态：[已测试] 本地预览胜利结算无弹窗；未猜出字块显示为实线灰色边框，暗/亮主题一致。
时间：2025-11-07 14:35
操作类型：[修改]
影响文件：
- src/App.tsx
变更摘要：修复胜利后计时未停止问题：在胜利态记录最终秒数并停止计时器，界面显示冻结的最终用时；新局与“再来一局”时清空冻结用时。
原因：确保胜利结算的时间展示准确且不继续累加。
测试状态：[已测试] 本地预览胜利后时间停止并保持最终值；重开后正常重新计时。
时间：2025-11-07 14:58
操作类型：[修改]
影响文件：
- src/App.tsx
变更摘要：修复胜利后时间被重置为 0 的问题：仅在首次进入胜利态时冻结最终秒数并停止计时，避免后续 time 变化覆盖冻结值。
原因：effect 依赖包含 `time` 导致在 stop 后 `time=0` 再次写入冻结值。
测试状态：[已测试] 胜利后显示为最终用时且不为 0；重开后重新计时正常。
时间：2025-11-07 15:09
操作类型：[修改]
影响文件：
- src/App.tsx
变更摘要：胜利结算组件用时显示为 0 的问题修复：向 GameBoard 传递冻结秒数（finalSeconds），而非停止后的实时秒数（0）。
原因：停止计时器后 `useTimestampTimer.totalSeconds` 为 0，导致结算显示 00:00。
测试状态：[已测试] 顶部栏与胜利结算组件均显示相同的冻结用时，非 0。
时间：2025-11-07 15:22
操作类型：[新增]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/services/hints.ts
变更摘要：在输入框前新增“灯泡”提示按钮；创建 hints 服务与接口（Hint/HintContext/HintService）并提供占位实现 requestHint。
原因：为后续实现提示功能预留 UI 入口与服务契约，遵循最小可用实现。
测试状态：[已测试] 本地预览按钮正常显示与点击，无错误日志；暂不展示提示内容。

时间：2025-11-10 10:25
操作类型：[重构]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/components/QuickRefDrawer.tsx
- src/App.tsx
变更摘要：将提示按钮移至文本区下方；新增“速查表”按钮并通过底部抽屉显隐坟场与已猜对字符；移除右侧静态面板，统一由抽屉展示。
原因：遵循界面美观与交互需求：“提示按钮在文本区下面、速查表以抽屉方式显隐”。
测试状态：[待测试] 构建存在 TypeScript 检查问题（useKeyboard.ts 的 @ts-expect-error），预览服务暂未启动；建议本地运行 dev 进行验证。

时间：2025-11-10 10:45
操作类型：[修改]
影响文件：
- src/hooks/useKeyboard.ts
- src/components/QuickRefDrawer.tsx
- src/components/GameBoard/GameBoard.tsx
变更摘要：修复构建错误（移除未用 @ts-expect-error 并改用 event.isComposing）；提高 PC 端抽屉高度（md+ 设为 75vh）；将提示与速查表改为纯图标按钮并置于文本区外部下方居中。
原因：满足构建与 UI 规范，提升 PC 端可视面积与按钮一致性。
测试状态：[已测试] 构建通过（npm run build），预览已打开并未见浏览器错误。
时间：2025-11-11 11:20
操作类型：[重构]
影响文件：
- `src/hooks/useDeviceProfile.ts`
- `src/components/GameLayout/MobileLayout.tsx`
- `src/components/GameLayout/DesktopLayout.tsx`
- `src/components/GameLayout/GameLayout.tsx`
变更摘要：引入“双布局 + 设备画像 Hook”方案。新增移动/桌面布局包装组件并在 `GameLayout` 内根据 `useDeviceProfile().isMobile` 路由到对应布局；当前桌面布局与移动布局一致，后续可独立调整。保留“标题+百科内容”统一滚动容器行为。
原因：更稳健地区分移动端与PC端布局职责，便于后续在桌面端进行更丰富的排版与交互改造，同时保持现有移动端体验。
测试状态：[已测试]（本地预览 http://localhost:5174/，服务正常启动；窗口宽度缩放未出现报错，布局切换不影响现有滚动行为）

时间：2025-11-11 11:28
操作类型：[修改]
影响文件：
- `src/components/GameLayout/DesktopLayout.tsx`
- `src/index.css`
变更摘要：PC端搜索栏高度提升至 64px：在桌面布局容器类 `.desktop-layout` 上覆盖 `--searchbar-h: 64px`，保持顶部栏与游戏信息栏高度不变，移动端不受影响。
原因：按需求提升桌面端 SearchInput 高度，避免影响移动端并保持固定布局计算链路不变。
测试状态：[已测试]（本地预览 http://localhost:5174/，浏览器无错误；桌面布局下搜索栏高度按 64px 生效）
2025-11-11 10:45
[修改]
影响文件：
- src/hooks/useDeviceProfile.ts
- src/index.css
变更摘要：统一断点方案，修复 iPad mini 上搜索栏高度与输入框内边距不同步问题。
原因：边界 768px 同时命中不同规则导致视觉不一致；引入输入框内边距变量并覆盖 desktop。
测试状态：[已测试]
2025-11-11 11:05
[修改]
影响文件：
- src/index.css
变更摘要：为 btn-primary 与 form-textarea 引入内边距变量，并在桌面布局覆盖，统一移动/桌面断点下的视觉一致性。
原因：在 iPad mini 等边界设备上需要保证按钮与文本域的内边距与输入框一致地响应断点。
测试状态：[已测试]
## 2025-11-11  

- 时间：2025-11-11  
- 操作类型：[修改]  
- 影响文件：
  - `src/components/BottomToolbar/BottomToolbar.tsx`
  - `src/components/TextDisplayArea/TextDisplayArea.tsx`
  - `src/components/GameLayout/GameLayout.tsx`
- 变更摘要：桌面端取消底部工具栏固定，改为紧贴文本区的自然流布局；移动端保持吸底。  
- 原因：优化 PC 端用户体验，避免固定栏遮挡并使其随文本区高度变化。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证桌面与移动布局切换正常）
## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[新增]  
- 影响文件：
  - `src/components/TopBar.tsx`
- 变更摘要：在顶部栏右侧主题按钮旁新增“设置”图标按钮，样式与现有图标按钮一致。  
- 原因：提升可发现性与操作入口，便于后续打开设置面板。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 检查按钮布局与样式）
## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[修改]  
- 影响文件：
  - `src/components/TopBar.tsx`
  - `src/App.tsx`
- 变更摘要：设置按钮仅在游戏界面显示，初始页面隐藏（通过条件传递回调实现）。  
- 原因：避免初始页出现与游戏无关的操作入口，提升信息清晰度。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证状态切换显示逻辑）

- 时间：2025-11-11  
- 操作类型：[修改]  
- 影响文件：
  - `src/App.tsx`
- 变更摘要：初始页内容容器添加 `mt-[var(--topbar-h)]`，避免被固定 TopBar 遮挡。  
- 原因：修复初始界面布局重叠问题，保证首屏内容正常可见。  
- 测试状态：[已测试]（本地预览 http://localhost:5173/ 验证初始页正常显示）
时间：2025-11-11 11:25
操作类型：[修改]
影响文件：
- `src/App.tsx`
变更摘要：初始页容器改为 `min-h-[calc(100vh-var(--topbar-h))]`，避免额外外边距导致整体高度超过 100vh 引发滚动。
原因：修复初始界面在内容较少时仍触发滚动的问题，保证视口内铺满但不溢出。
测试状态：[已测试]（本地预览 `http://localhost:5173/` 验证初始页无多余滚动）
时间：2025-11-11 11:40
操作类型：[修改]
影响文件：
- `src/components/GameStart/GameStart.tsx`
变更摘要：将“选择领域”容器宽度由 `max-w-3xl` 扩为 `max-w-4xl`，提高选择区域可用宽度。
原因：初始页选择区域过窄，影响可读性与点击舒适度。
测试状态：[已测试]（本地预览 `http://localhost:5173/` 验证宽度生效）