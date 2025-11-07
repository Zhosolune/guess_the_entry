# 实施计划（UI 极简改造）

- [ ] 1. 注入CSS变量与新增扁平化组件类  
  - 在 `src/index.css` 添加中性色主题变量与暗色覆盖（`--color-bg-app`、`--color-border`、`--color-text`、`--color-btn-*`、`--section-padding`）。  
  - 新增 `.card-flat`、`.btn-flat`、`.section`、`.section-title`、`.section-subtitle` 组件类与过渡。  
  - _需求: 1/2/4_

- [ ] 2. 替换App顶层背景为中性变量  
  - 在 `src/App.tsx` 移除渐变背景，改用 `var(--color-bg-app)`。  
  - _需求: 2/4_

- [ ] 3. 统一三大区域容器为 `card-flat section`  
  - 在 `src/components/GameBoard/*`、`CorrectPanel/*`、`Graveyard/*` 的容器替换为 `card-flat section`，对齐内边距与布局。  
  - _需求: 1/2_

- [ ] 4. 统一按钮样式为 `btn-flat` 并简化状态  
  - 在 `GameStart`、`Home`、`App` 等按钮统一使用 `btn-flat`；保留图标与功能色。  
  - _需求: 2/3/4_

- [ ] 5. 移除重装饰类并保留功能色与图标  
  - 清理 `shadow-*`、强渐变、过度边框等；保留图标与功能标识。  
  - _需求: 2/3_

- [ ] 6. 打开预览并验证响应式与一致性  
  - 在浅/暗色、桌面/移动、Chrome/Firefox/Safari 验证三大区域间距与对齐、边框/按钮呈现、过渡动画。  
  - _需求: 4/5_

- [ ] 7. 更新操作日志与AI记录  
  - 在 `operateLog.md`、`docs/ai_message.md` 记录改造与测试结果；追加测试报告占位。  
  - _需求: 工作流与记录

