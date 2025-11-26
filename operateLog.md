时间：2025-11-06 14:21
操作类型：[修改]
影响文件：
- src/constants/game.constants.ts

时间：2025-11-07 10:40
操作类型：[重构]
影响文件：
- `src/components/Graveyard/Graveyard.tsx`
- `src/styles/animations.css`

变更摘要：将坟场组件由底部独立区域改为抽屉式（Drawer）交互；新增右下角 FAB 按钮（骨头图标）用于触发抽屉；抽屉自底部向上弹出，支持点击遮罩关闭。
原因：优化移动端空间利用率，避免底部区域过于拥挤。
测试状态：[已测试]

时间：2025-11-07 11:10
操作类型：[修改]
影响文件：
- `src/components/Graveyard/Graveyard.tsx`
- `src/components/GameLayout/GameLayout.tsx`

变更摘要：调整坟场抽屉高度为屏幕 40%；FAB 按钮增加未命中计数角标（红色圆形）；抽屉头部添加标题与关闭按钮。
原因：提升坟场抽屉的信息密度与易用性，角标提供直观的状态反馈。
测试状态：[已测试]

时间：2025-11-07 11:30
操作类型：[修改]
影响文件：
- `src/components/GameLayout/GameLayout.tsx`
- `src/styles/animations.css`

变更摘要：增加胜利/失败结算动画；胜利时显示全屏烟花效果（CSS实现）；失败时显示灰度滤镜与震动效果。
原因：增强游戏结束时的视觉反馈与情感化设计。
测试状态：[已测试]

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

变更摘要：引入中性色主题CSS变量；统一三大区域容器为 `card-flat section`，移除阴影改为1px浅色边框；按钮统一为 `btn-flat` 扁平化样式；顶层与开始页背景替换为中性变量；进度条采用变量强调色；保留图标与功能性标识并简化样式。
原因：落实UI极简改造需求，统一间距与对齐，提升浅/暗色模式下的一致性与可读性。
测试状态：[待测试]

时间：2025-11-07 13:00
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx
- src/components/GameLayout/GameLayout.tsx

变更摘要：重构游戏主界面布局，将“已猜对字符”与“坟场”分列左右两侧（桌面端），移动端保持上下堆叠；优化字符块展示样式，增加选中状态反馈。
原因：优化宽屏下的空间利用，提升信息展示效率。
测试状态：[已测试]

时间：2025-11-07 13:30
操作类型：[修改]
影响文件：
- src/components/TextDisplayArea/TextDisplayArea.tsx

变更摘要：新增“已猜对字符”绿色面板；修复遮罩揭示动画重复播放，仅首次触发；百科区域改为自适应高度；坟场字符保持红色样式。
原因：提升可读性与浏览体验，满足对正确/错误字符的明确分区与配色需求。
测试状态：[已测试]

时间：2025-11-07 13:45
操作类型：[修改]
影响文件：
- src/components/GameBoard/GameBoard.tsx

变更摘要：将“已猜对字符”面板移至输入框上方；“坟场”面板移至输入框下方；两者均改为卡片式容器，增加标题栏。
原因：调整视觉流，使正确/错误反馈更紧贴输入操作区。
测试状态：[已测试]

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
原因：确保胜利后时间定格，准确反映用户成绩。
测试状态：[已测试] 本地预览胜利后时间正确停止，重新开始后归零重计。

时间：2025-11-07 14:50
操作类型：[修改]
影响文件：
- src/components/GameStart/GameStart.tsx
- src/components/GameLayout/GameLayout.tsx

变更摘要：统一“开始游戏”与“再来一局”按钮为主要操作样式（Primary Button）；增加键盘回车键触发开始/重玩的支持。
原因：提升核心操作的可发现性与便捷性。
测试状态：[已测试]

时间：2025-11-07 15:10
操作类型：[修改]
影响文件：
- src/components/TextDisplayArea/TextDisplayArea.tsx

变更摘要：优化长文本遮罩性能，使用虚拟列表（Virtualize）渲染大规模字符块；修复快速滚动时的白屏闪烁。
原因：解决在生成长百科词条时的渲染卡顿问题。
测试状态：[已测试]

时间：2025-11-07 15:30
操作类型：[修改]
影响文件：
- src/hooks/useGameState.ts
- src/services/deepseek.ts

变更摘要：优化 API 请求重试机制，增加指数退避策略；在网络错误时自动重试 3 次。
原因：提升弱网环境下的游戏稳定性。
测试状态：[已测试]

时间：2025-11-07 16:00
操作类型：[修改]
影响文件：
- src/components/SettingsDrawer.tsx
- src/theme/ThemeContext.tsx

变更摘要：新增深色模式切换开关；优化深色模式下的配色方案（降低对比度，使用舒适的深灰背景）。
原因：满足用户对夜间模式的需求，提升夜间使用体验。
测试状态：[已测试]

## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[重构]  
- 影响文件：
  - `src/App.tsx`
  - `src/components/GameLayout/GameLayout.tsx`
  - `src/components/GameLayout/DesktopLayout.tsx` (New)
  - `src/components/GameLayout/MobileLayout.tsx` (New)
  - `src/components/BottomToolbar/BottomToolbar.tsx` (New)
  - `src/components/TextDisplayArea/TextDisplayArea.tsx`
- 变更摘要：
  1. 拆分 `GameLayout` 为 `DesktopLayout` 和 `MobileLayout`，实现真正的响应式布局差异化。
  2. 桌面端：左侧固定文本区，右侧固定面板（包含猜测历史、输入框等），采用自然流布局，移除底部工具栏。
  3. 移动端：保持原有布局，文本区自适应，底部固定工具栏（包含输入框、操作按钮）。
  4. 新增 `BottomToolbar` 组件用于移动端底部操作区。
- 原因：彻底解决桌面端与移动端布局需求差异，提升桌面端空间利用率与操作体验。
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证桌面与移动布局切换正常）

## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[修改]  
- 影响文件：
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
- 原因：修复初始页内容被顶部栏遮挡的布局问题。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证初始页布局）

## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[新增]  
- 影响文件：
  - `src/components/SettingsDrawer.tsx`
- 变更摘要：新增设置抽屉组件 `SettingsDrawer`，支持从 TopBar 右侧滑出（或 Modal 形式），包含 API Key 配置与重置游戏数据功能。
- 原因：提供必要的配置入口与数据管理功能。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证抽屉开关与功能）

## 2025-11-11 

- 时间：2025-11-11  
- 操作类型：[修改]  
- 影响文件：
  - `src/App.tsx`
  - `src/components/SettingsDrawer.tsx`
- 变更摘要：
  1. 完善设置抽屉的全局状态管理，确保与游戏信息抽屉互斥。
  2. 在设置抽屉中集成“速查表位置”设置（Bottom/Left/Right）。
  3. 实现“重置游戏数据”功能，清除本地存储并刷新页面。
- 原因：完善设置功能闭环，提升用户对界面与数据的掌控力。  
- 测试状态：[已测试]（本地预览 http://localhost:5174/ 验证互斥逻辑与设置生效）

## 2025-11-18 

- 时间：2025-11-18 09:15
- 操作类型：[重构]
- 影响文件：
  - `src/components/GameInfoDrawer.tsx`
  - `src/components/SettingsDrawer.tsx`
  - `src/components/ScoreboardDrawer.tsx`
- 变更摘要：统一三大抽屉（信息、设置、计分板）的交互与样式：
  - 均为 TopBar 下方滑出/覆盖。
  - 统一使用 `fixed inset-0 z-50` 遮罩与 `absolute top-[var(--topbar-h)]` 内容定位。
  - 统一关闭按钮位置与样式。
- 原因：解决抽屉样式与交互不一致问题，提升整体 UI 协调性。
- 测试状态：[已测试]

时间：2025-11-18 09:30
操作类型：[重构]
影响文件：
- src/utils/stateManager.ts
- src/App.tsx

变更摘要：引入原子化面板持久化写入 `setUIPanels`，修复设置与计分板抽屉互斥状态在刷新后同时打开的问题。
原因：分散持久化导致刷新后状态不同步，引发互斥抽屉同时打开的逻辑错误。
测试状态：[已测试]

时间：2025-11-18 09:45
操作类型：[新增]
影响文件：
- src/types/game.types.ts
- src/hooks/useGameState.ts
- src/components/TextDisplayArea/TextDisplayArea.tsx
- src/components/GameLayout/GameLayout.tsx
- src/components/BottomToolbar/BottomToolbar.tsx
- src/components/ScoreboardDrawer.tsx
- src/utils/stateManager.ts

变更摘要：完成“提示”功能：激活提示后可点击未揭示字块揭示对应字符的全部出现；记录每局提示次数；使用提示获胜不计为完美胜利；计分板展示本局提示次数与是否完美胜利。
原因：满足用户关于提示交互与计分规则的需求，完善核心玩法。
测试状态：[已测试]
时间：2025-11-18 10:05
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/components/TextDisplayArea/TextDisplayArea.tsx

变更摘要：提示激活时为未揭示字块添加呼吸式放大动画。移动端仅呼吸动画；桌面端呼吸动画 + hover 高亮（主题色，适配明暗主题）。
原因：提升提示模式下的可发现性与交互反馈，符合移动/桌面差异化交互标准。
测试状态：[已测试]
时间：2025-11-18 10:20
操作类型：[修改]
影响文件：
- src/styles/animations.css

变更摘要：调整提示激活动画为仅闪烁呼吸光效，不再放大；桌面端 hover 增加放大效果，点击时背景颜色以主题色变化。
原因：根据交互规范优化提示模式：移动端保持低干扰提示，PC端增强悬停与点击反馈。
测试状态：[已测试]
时间：2025-11-18 10:32
操作类型：[修改]
影响文件：
- src/styles/animations.css
- src/components/GameLayout/GameLayout.tsx

变更摘要：取消提示模式阴影光效，改为字块背景色呼吸式深浅变化；PC端 hover 增加悬浮位移；提示按钮改为点击切换开启/关闭。
原因：降低视觉干扰，强化桌面端交互反馈，并提供便捷的模式开关。
测试状态：[已测试]
时间：2025-11-18 10:45
操作类型：[修改]
影响文件：
- src/components/ScoreboardDrawer.tsx

变更摘要：调整计分板项目为：总局数、成功局数、完美成功局数、平均耗时、仅使用提示局的平均提示次数、平均尝试次数、平均进度；新增“不同领域能力评分”横向柱状图占位。
原因：满足新的统计与展示需求，后续可接入领域评分计算公式。
测试状态：[已测试]
时间：2025-11-18 11:00
操作类型：[修改]
影响文件：
- src/components/ScoreboardDrawer.tsx

变更摘要：计分板增加“胜率”指标；指标样式改为大数字+小文字，一行6列流式布局；领域能力评分增加背景填充占位并保持数值填充待计算。
原因：增强统计可读性与视觉一致性，预留评分公式接入空间。
测试状态：[已测试]

时间：2025-11-26 10:00
操作类型：[重构|删除|新增]
影响文件：
- src/services/deepseek.ts
- src/components/SettingsDrawer.tsx
- src/utils/storage.ts
- vercel.json
- vite.config.ts
- README.md
- docs/CLOUDFLARE_DEPLOYMENT.md (已删除)
- docs/DEPLOYMENT_QUICK_START.md (已删除)

变更摘要：移除Cloudflare Worker代理，重构为前端直连DeepSeek API；新增Vercel Rewrite解决跨域；添加用户自定义API Key设置功能。
原因：简化架构，去除对Cloudflare Worker的依赖，支持用户自定义Key。
测试状态：[已测试]

时间：2025-11-26 10:30
操作类型：[新增]
影响文件：
- src/App.tsx
- src/components/GameStart/GameStart.tsx
变更摘要：在用户未配置API Key或验证码点击开始游戏时，弹出对话框提示并提供设置入口，替代原有的控制台报错。
原因：提升用户体验，确保用户能直观看到配置缺失提示并快速跳转设置。
测试状态：[已测试]

时间：2025-11-26 10:45
操作类型：[优化]
影响文件：
- src/App.tsx
- src/components/GameStart/GameStart.tsx
变更摘要：优化配置提示弹窗：调整位置至屏幕上三分之一处；新增“去填写（邀请码）”按钮，支持跳转至游戏规则抽屉；调整按钮布局为两行，强化引导。
原因：提供更清晰的配置路径引导，区分API Key设置与邀请码填写入口，优化视觉体验。
测试状态：[已测试]

时间：2025-11-26 11:00
操作类型：[新增]
影响文件：
- src/components/GameInfoDrawer.tsx
变更摘要：在邀请码输入框内右侧新增粘贴按钮，支持一键读取剪贴板内容并填入输入框。
原因：提升移动端及桌面端输入邀请码的便捷性。
测试状态：[已测试]