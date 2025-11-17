# 状态管理模块（stateManager）使用说明

## 模块概述

提供用户状态持久化、加密校验、自动/手动保存、状态恢复、排除词条管理与 API 调用频率限制等功能。默认使用 `localStorage`，支持校验（SHA-256 + HMAC）与可选加密（AES-GCM）。

## 持久化结构

键：`guess_the_entry_user_state_v1`

```json
{
  "version": "1.0.0",
  "timestamp": 1731859200000,
  "settings": { "theme": "system", "quickRefPosition": "bottom", "hintsEnabled": true },
  "excludedEntries": ["光合作用"],
  "stats": {
    "totalSuccess": 1,
    "totalGames": 2,
    "gameTime": [{ "gameId": "123", "timeSpent": 42 }],
    "attempts": [{ "gameId": "123", "attempts": 8 }],
    "completionPercent": [{ "gameId": "123", "percent": 100 }]
  },
  "integrity": { "checksum": "...", "signature": "...", "changeCount": 3 },
  "apiUsage": { "generateEntry": [1731859200000] },
  "lastGame": { "gameId": "123", "gameStatus": "playing", "category": "自然", "currentEntry": { "entry": "光合作用", "encyclopedia": "...", "category": "自然" }, "revealedChars": ["光"], "guessedChars": ["光"], "graveyard": ["水"], "attempts": 8, "startTime": 1731859158000, "isLoading": false, "error": null }
}
```

## 环境变量

- `VITE_APP_STATE_SECRET`：可选，启用加密/签名使用的密钥（建议设置）。
- `VITE_ANTI_ABUSE`：`'0'` 关闭防滥用限流；其他值或缺省为开启。

## API 列表

- `initState(options?)`：初始化持久化结构。
- `saveGameState(gameState, options?)`：保存游戏快照（含 `lastGame`）。
- `loadGameState()`：加载并反序列化为 `GameState`，无数据返回 `null`。
- `clearGameState()`：清空持久化状态。
- `manualSave(options?)`：刷新时间戳与校验信息。
- `updateUserSettings(patch, options?)`：更新主题、速查表位置、提示开关。
- `addExcludedEntry(entry)` / `getExcludedEntries()`：管理排除词条列表。
- `updateGameStats({ gameId, timeSpent, attempts, percent })`：胜利后更新统计。
- `shouldAllowApiCall(key, limit, windowMs, enabled?)`：滑动时间窗限流。

## 使用示例

```ts
import { initState, saveGameState, loadGameState, updateGameStats, updateUserSettings, addExcludedEntry, getExcludedEntries, shouldAllowApiCall } from '@/utils/stateManager';

// 初始化（可选加密）
await initState({ encrypt: true });

// 保存快照
await saveGameState(gameState);

// 恢复快照
const restored = await loadGameState();
if (restored) {
  // 将 restored 合并到 UI 状态
}

// 更新统计（胜利后）
await updateGameStats({ gameId, timeSpent: 37, attempts: 9, percent: 100 });

// 更新设置
await updateUserSettings({ quickRefPosition: 'left', hintsEnabled: false });

// 排除词条
await addExcludedEntry('光合作用');
const excludes = await getExcludedEntries();

// 限流示例
const ok = await shouldAllowApiCall('generateEntry', 5, 60_000);
if (!ok) {
  // 提示用户稍后重试
}
```

## 测试建议

- 断电/刷新中断后再次打开页面，验证 `loadGameState` 能恢复到中断位置。
- 大词条与高频尝试下，检查 localStorage 空间占用并观察异常日志。
- 在 Chrome/Firefox/Edge 下使用，验证 Web Crypto、localStorage 与 `CompressionStream` 兼容性（若启用）。

## 注意事项

- 未设置 `VITE_APP_STATE_SECRET` 时，会在本地生成密钥并存储于 `localStorage`，安全性较弱但满足校验需求。
- 压缩为可选功能，默认不开启以简化兼容性；如需启用请评估浏览器支持。