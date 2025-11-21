import { GameState, GameCategory } from '../types/game.types';
import { AppError, ErrorType } from '../utils/errorHandler';

const USER_STATE_KEY = 'guess_the_entry_user_state_v1';
const SECRET_STORAGE_KEY = 'guess_the_entry_state_secret';
const EXCLUDED_ENTRIES_KEY = 'guess_the_entry_excluded_entries';

export interface PersistedStatsItem {
  gameId: string;
  timeSpent?: number;
  attempts?: number;
  percent?: number;
  hintCount?: number;
  perfect?: boolean;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  quickRefPosition?: 'bottom' | 'left' | 'right';
  hintsEnabled?: boolean;
}

export interface PersistedState {
  version: string;
  timestamp: number;
  settings: UserSettings;
  excludedByCategory?: Record<string, string[]>;
  stats: {
    totalSuccess: number;
    totalGames: number;
    gameTime: PersistedStatsItem[];
    attempts: PersistedStatsItem[];
    completionPercent: PersistedStatsItem[];
  };
  integrity: {
    checksum: string;
    signature?: string;
    changeCount: number;
  };
  apiUsage?: Record<string, number[]>; // 每次调用的时间戳列表
  lastGame?: SerializedGameState | null;
  ui?: { quickRefOpen?: boolean; settingsOpen?: boolean; scoreboardOpen?: boolean; gameInfoOpen?: boolean; graveyardShowLabels?: boolean; correctShowLabels?: boolean };
}

interface SaveOptions {
  encrypt?: boolean;
  compress?: boolean;
}

const DEFAULT_STATE: PersistedState = {
  version: '1.0.0',
  timestamp: Date.now(),
  settings: { theme: 'system', quickRefPosition: 'bottom', hintsEnabled: true },
  excludedByCategory: {},
  stats: {
    totalSuccess: 0,
    totalGames: 0,
    gameTime: [],
    attempts: [],
    completionPercent: []
  },
  integrity: { checksum: '', signature: undefined, changeCount: 0 },
  apiUsage: {},
  lastGame: null
};

async function sha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

type PersistedContent = Omit<PersistedState, 'integrity'>;

function buildContent(state: PersistedState): PersistedContent {
  return {
    version: state.version,
    timestamp: state.timestamp,
    settings: state.settings,
    excludedByCategory: state.excludedByCategory,
    stats: state.stats,
    apiUsage: state.apiUsage,
    lastGame: state.lastGame ?? null,
    ui: state.ui
  };
}

async function getSecret(): Promise<Uint8Array> {
  const envSecret = (import.meta as any).env?.VITE_APP_STATE_SECRET as string | undefined;
  if (envSecret && envSecret.length >= 16) {
    return new TextEncoder().encode(envSecret);
  }
  try {
    const existing = localStorage.getItem(SECRET_STORAGE_KEY);
    if (existing) return new Uint8Array(existing.split(',').map(n => Number(n)));
  } catch {}
  const key = crypto.getRandomValues(new Uint8Array(32));
  try {
    localStorage.setItem(SECRET_STORAGE_KEY, Array.from(key).join(','));
  } catch {}
  return key;
}

async function hmacSign(data: string): Promise<string> {
  const keyBytes = await getSecret();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data).buffer as ArrayBuffer);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));
}

async function aesEncrypt(plain: string): Promise<string> {
  const keyBytes = await getSecret();
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(plain).buffer as ArrayBuffer
  );
  const ivB64 = btoa(String.fromCharCode(...Array.from(iv)));
  const dataB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(cipher))));
  return JSON.stringify({ iv: ivB64, data: dataB64 });
}

async function aesDecrypt(payload: string): Promise<string> {
  const parsed = JSON.parse(payload);
  const iv = new Uint8Array(atob(parsed.iv).split('').map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(parsed.data).split('').map(c => c.charCodeAt(0)));
  const keyBytes = await getSecret();
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, data.buffer as ArrayBuffer);
  return new TextDecoder().decode(plainBuf);
}

async function compressString(input: string): Promise<string> {
  try {
    // CompressionStream 仅在部分浏览器提供；不支持时直接返回原文
    // @ts-ignore
    if (typeof CompressionStream === 'undefined') return input;
    // @ts-ignore
    const cs = new CompressionStream('gzip');
    const writer = new Blob([input]).stream().pipeThrough(cs).getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await writer.read();
      if (done) break;
      chunks.push(value);
    }
    const blob = new Blob(chunks.map(c => c.buffer as ArrayBuffer));
    const buf = new Uint8Array(await blob.arrayBuffer());
    return btoa(String.fromCharCode(...Array.from(buf)));
  } catch {
    return input;
  }
}

async function decompressString(b64: string): Promise<string> {
  try {
    // @ts-ignore
    if (typeof DecompressionStream === 'undefined') return b64;
    const bytes = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
    // @ts-ignore
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(ds);
    const blob = await new Response(stream).blob();
    const buf = await blob.arrayBuffer();
    return new TextDecoder().decode(buf);
  } catch {
    return b64;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    throw new AppError('保存失败', ErrorType.STORAGE_ERROR, 'SAVE_FAILED', error);
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    throw new AppError('加载失败', ErrorType.STORAGE_ERROR, 'LOAD_FAILED', error);
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    throw new AppError('清除失败', ErrorType.STORAGE_ERROR, 'CLEAR_FAILED', error);
  }
}

/**
 * 初始化用户持久化状态
 * 若不存在则创建默认结构，并写入校验信息。
 */
export async function initState(options?: SaveOptions): Promise<PersistedState> {
  const raw = safeGetItem(USER_STATE_KEY);
  if (!raw) {
    const sanitized: PersistedState = { ...DEFAULT_STATE, timestamp: Date.now() };
    const content = buildContent(sanitized);
    const contentStr = JSON.stringify(content);
    const checksum = await sha256(contentStr);
    const signature = await hmacSign(contentStr);
    sanitized.integrity = { checksum, signature, changeCount: 0 };
    const persisted = { ...content, integrity: sanitized.integrity };
    let toSave = JSON.stringify(persisted);
    if (options?.compress) toSave = await compressString(toSave);
    if (options?.encrypt) toSave = await aesEncrypt(toSave);
    safeSetItem(USER_STATE_KEY, toSave);
    return sanitized;
  }
  try {
    let plain = raw;
    // 尝试解密
    try { plain = await aesDecrypt(plain); } catch {}
    // 尝试解压
    try { plain = await decompressString(plain); } catch {}
    const parsed: any = JSON.parse(plain);
    const needsMigration = typeof parsed === 'object' && parsed !== null && ('excludedEntries' in parsed);
    if (needsMigration) {
      try { localStorage.removeItem(EXCLUDED_ENTRIES_KEY); } catch {}
      delete parsed.excludedEntries;
      parsed.excludedByCategory = parsed.excludedByCategory || {};
      parsed.timestamp = Date.now();
      const contentStr = JSON.stringify(buildContent(parsed as PersistedState));
      parsed.integrity = {
        checksum: await sha256(contentStr),
        signature: await hmacSign(contentStr),
        changeCount: (parsed.integrity?.changeCount || 0) + 1
      };
      let toSave = JSON.stringify({ ...buildContent(parsed as PersistedState), integrity: parsed.integrity });
      if (options?.compress) toSave = await compressString(toSave);
      if (options?.encrypt) toSave = await aesEncrypt(toSave);
      safeSetItem(USER_STATE_KEY, toSave);
      return parsed as PersistedState;
    }
    const parsedState: PersistedState = parsed as PersistedState;
    await verifyIntegrity(parsedState);
    return parsedState;
  } catch (error) {
    // 数据损坏：回滚到默认结构
    const fallback: PersistedState = { ...DEFAULT_STATE, timestamp: Date.now() };
    const content = buildContent(fallback);
    const contentStr = JSON.stringify(content);
    const checksum = await sha256(contentStr);
    const signature = await hmacSign(contentStr);
    fallback.integrity = { checksum, signature, changeCount: 0 };
    const persisted = { ...content, integrity: fallback.integrity };
    let toSave = JSON.stringify(persisted);
    if (options?.compress) toSave = await compressString(toSave);
    if (options?.encrypt) toSave = await aesEncrypt(toSave);
    safeSetItem(USER_STATE_KEY, toSave);
    return fallback;
  }
}

/**
 * 验证数据完整性（checksum + HMAC 签名）
 */
export async function verifyIntegrity(state: PersistedState): Promise<boolean> {
  const contentStr = JSON.stringify(buildContent(state));
  const checksum = await sha256(contentStr);
  const signature = await hmacSign(contentStr);
  const ok = (checksum === state.integrity.checksum) && (!state.integrity.signature || state.integrity.signature === signature);
  if (!ok) {
    throw new AppError('数据校验失败', ErrorType.STORAGE_ERROR, 'CHECKSUM_INVALID');
  }
  return true;
}

/**
 * 手动保存当前状态（不变更字段，仅刷新时间戳与校验）
 */
export async function manualSave(options?: SaveOptions): Promise<void> {
  const state = await initState(options);
  const next = { ...state, timestamp: Date.now() };
  const contentStr = JSON.stringify(buildContent(next));
  next.integrity.checksum = await sha256(contentStr);
  next.integrity.signature = await hmacSign(contentStr);
  next.integrity.changeCount += 1;
  let toSave = JSON.stringify({ ...buildContent(next), integrity: next.integrity });
  if (options?.compress) toSave = await compressString(toSave);
  if (options?.encrypt) toSave = await aesEncrypt(toSave);
  safeSetItem(USER_STATE_KEY, toSave);
}

/**
 * 保存游戏状态（快照）并刷新校验
 */
export async function saveGameState(gameState: GameState, options?: SaveOptions): Promise<void> {
  const state = await initState(options);
  const next: PersistedState = {
    ...state,
    timestamp: Date.now(),
    lastGame: serializeGameState(gameState)
  };
  // 记录进行中的游戏尝试计数（方便恢复场景显示）
  const item: PersistedStatsItem = { gameId: gameState.gameId, attempts: gameState.attempts };
  // 将 attempts 追加或更新最后一条
  const idx = next.stats.attempts.findIndex(s => s.gameId === gameState.gameId);
  if (idx >= 0) next.stats.attempts[idx] = { ...next.stats.attempts[idx], attempts: gameState.attempts };
  else next.stats.attempts.push(item);
  const contentStr = JSON.stringify(buildContent(next));
  next.integrity.checksum = await sha256(contentStr);
  next.integrity.signature = await hmacSign(contentStr);
  next.integrity.changeCount += 1;
  let toSave = JSON.stringify({ ...buildContent(next), integrity: next.integrity });
  if (options?.compress) toSave = await compressString(toSave);
  if (options?.encrypt) toSave = await aesEncrypt(toSave);
  safeSetItem(USER_STATE_KEY, toSave);
}

/**
 * 加载保存的游戏状态快照（返回 GameState 或 null）
 */
export async function loadGameState(): Promise<GameState | null> {
  const raw = safeGetItem(USER_STATE_KEY);
  if (!raw) return null;
  try {
    // 尝试解密；若失败则按明文处理
    let plain = raw;
    try { plain = await aesDecrypt(raw); } catch {}
    try { plain = await decompressString(plain); } catch {}
    const persisted: PersistedState = JSON.parse(plain);
    await verifyIntegrity(persisted);
    if (!persisted.lastGame) return null;
    return deserializeGameState(persisted.lastGame);
  } catch (error) {
    return null;
  }
}

interface SerializedGameState {
  gameId: string;
  gameStatus: GameState['gameStatus'];
  category: GameCategory;
  currentEntry: GameState['currentEntry'];
  revealedChars: string[];
  guessedChars: string[];
  graveyard: string[];
  attempts: number;
  hintCount: number;
  hintUsed: boolean;
  startTime: number;
  isLoading: boolean;
  error: string | null;
}

function serializeGameState(s: GameState): SerializedGameState {
  return {
    gameId: s.gameId,
    gameStatus: s.gameStatus,
    category: s.category,
    currentEntry: s.currentEntry,
    revealedChars: Array.from(s.revealedChars),
    guessedChars: Array.from(s.guessedChars),
    graveyard: [...s.graveyard],
    attempts: s.attempts,
    hintCount: s.hintCount,
    hintUsed: s.hintUsed,
    startTime: s.startTime,
    isLoading: s.isLoading,
    error: s.error
  };
}

function deserializeGameState(s: SerializedGameState): GameState {
  return {
    gameId: s.gameId,
    gameStatus: s.gameStatus,
    category: s.category,
    currentEntry: s.currentEntry,
    revealedChars: new Set(s.revealedChars ?? []),
    guessedChars: new Set(s.guessedChars ?? []),
    graveyard: Array.isArray(s.graveyard) ? s.graveyard : [],
    attempts: s.attempts ?? 0,
    hintCount: s.hintCount ?? 0,
    hintUsed: !!s.hintUsed,
    startTime: s.startTime ?? Date.now(),
    isLoading: !!s.isLoading,
    error: s.error ?? null
  };
}

/**
 * 清除持久化的用户状态（不影响主题独立存储）
 */
export async function clearGameState(): Promise<void> {
  const state = await initState();
  state.lastGame = null;
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

/**
 * 更新用户设置（主题/速查表位置/提示开关）
 */
export async function updateUserSettings(patch: Partial<UserSettings>, options?: SaveOptions): Promise<UserSettings> {
  const state = await initState(options);
  const next: PersistedState = {
    ...state,
    settings: { ...state.settings, ...patch },
    timestamp: Date.now()
  };
  const contentStr = JSON.stringify(buildContent(next));
  next.integrity.checksum = await sha256(contentStr);
  next.integrity.signature = await hmacSign(contentStr);
  next.integrity.changeCount += 1;
  let toSave = JSON.stringify({ ...buildContent(next), integrity: next.integrity });
  if (options?.compress) toSave = await compressString(toSave);
  if (options?.encrypt) toSave = await aesEncrypt(toSave);
  safeSetItem(USER_STATE_KEY, toSave);
  // 同步主题模式到 ThemeContext 使用的键（保持兼容）
  if (patch.theme) {
    try { localStorage.setItem('theme_mode', patch.theme); } catch {}
  }
  return next.settings;
}

/**
 * 追加排除词条（按领域分类）
 *
 * 功能描述：
 * - 将指定词条加入到当前领域的排除列表中，并刷新持久化校验。
 * - 同步追加到旧本地键 `guess_the_entry_excluded_entries` 以兼容历史逻辑（不分领域）。
 *
 * 参数说明：
 * - entry: 待排除的词条名称，类型为 `string`，自动去除首尾空白；为空时忽略。
 * - category: 当前游戏选择的领域，类型为 `GameCategory`，用于按领域归类保存排除词。
 *
 * 返回值说明：
 * - Promise<void> 无返回内容；持久化成功或忽略异常。
 *
 * 异常说明：
 * - 持久化写入失败时会抛出 `AppError`（SAVE_FAILED）；旧键写入异常被吞掉以避免影响流程。
 */
export async function addExcludedEntry(entry: string, category: GameCategory): Promise<void> {
  const name = (entry || '').trim();
  if (!name) return;
  const state = await initState();
  const categoryKey = normalizeCategoryKey(category);
  const bucket = state.excludedByCategory?.[categoryKey] ?? [];
  const set = new Set<string>(bucket);
  set.add(name);
  state.excludedByCategory = { ...(state.excludedByCategory ?? {}), [categoryKey]: Array.from(set) };
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
  try { localStorage.removeItem(EXCLUDED_ENTRIES_KEY); } catch {}
}

/**
 * 获取指定领域的排除词条列表
 *
 * 功能描述：
 * - 返回当前领域下的排除词，合并历史的全局排除字段 `excludedEntries` 和旧本地键 `guess_the_entry_excluded_entries` 并去重。
 *
 * 参数说明：
 * - category: 领域标识，类型为 `GameCategory | string`，用于选择对应的分类桶。
 *
 * 返回值说明：
 * - Promise<string[]> 归并去重后的排除词数组。
 *
 * 异常说明：
 * - 读取旧本地键异常将被忽略并返回当前可用集合。
 */
export async function getExcludedEntries(category: GameCategory | string): Promise<string[]> {
  const state = await initState();
  const key = normalizeCategoryKey(category);
  const bucket = state.excludedByCategory?.[key] ?? [];
  try { localStorage.removeItem(EXCLUDED_ENTRIES_KEY); } catch {}
  return bucket;
}

/**
 * 在胜利后更新统计信息
 */
export async function updateGameStats(input: { gameId: string; timeSpent: number; attempts: number; percent?: number; hintCount?: number; perfect?: boolean }): Promise<void> {
  const state = await initState();
  state.stats.totalGames += 1;
  state.stats.totalSuccess += 1;
  state.stats.gameTime.push({ gameId: input.gameId, timeSpent: input.timeSpent });
  state.stats.attempts.push({ gameId: input.gameId, attempts: input.attempts });
  state.stats.completionPercent.push({ gameId: input.gameId, percent: input.percent ?? 100, hintCount: input.hintCount, perfect: input.perfect });
  state.timestamp = Date.now();
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

/**
 * API 调用频率限制（滑动时间窗）
 */
export async function shouldAllowApiCall(key: string, limit: number, windowMs: number, enabled = true): Promise<boolean> {
  if (!enabled) return true;
  const state = await initState();
  const now = Date.now();
  const list = state.apiUsage?.[key] ?? [];
  const cutoff = now - windowMs;
  const recent = list.filter(ts => ts >= cutoff);
  const allowed = recent.length < limit;
  if (allowed) {
    recent.push(now);
    state.apiUsage![key] = recent;
    const contentStr = JSON.stringify(buildContent(state));
    state.integrity.checksum = await sha256(contentStr);
    state.integrity.signature = await hmacSign(contentStr);
    state.integrity.changeCount += 1;
    safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
  }
  return allowed;
}
export async function setQuickRefOpen(open: boolean): Promise<void> {
  const state = await initState();
  state.ui = state.ui || {};
  state.ui.quickRefOpen = open;
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

export async function setSettingsOpen(open: boolean): Promise<void> {
  const state = await initState();
  state.ui = state.ui || {};
  state.ui.settingsOpen = open;
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

export async function setScoreboardOpen(open: boolean): Promise<void> {
  const state = await initState();
  state.ui = state.ui || {};
  state.ui.scoreboardOpen = open;
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

export async function setGameInfoOpen(open: boolean): Promise<void> {
  const state = await initState();
  state.ui = state.ui || {};
  state.ui.gameInfoOpen = open;
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}

export async function setUIPanels(patch: { quickRefOpen?: boolean; settingsOpen?: boolean; scoreboardOpen?: boolean; gameInfoOpen?: boolean; graveyardShowLabels?: boolean; correctShowLabels?: boolean }): Promise<void> {
  const state = await initState();
  state.ui = { ...(state.ui || {}), ...patch };
  const contentStr = JSON.stringify(buildContent(state));
  state.integrity.checksum = await sha256(contentStr);
  state.integrity.signature = await hmacSign(contentStr);
  state.integrity.changeCount += 1;
  safeSetItem(USER_STATE_KEY, JSON.stringify({ ...buildContent(state), integrity: state.integrity }));
}
function normalizeCategoryKey(category: GameCategory | string): string {
  const s = String(category).toLowerCase();
  switch (s) {
    case '自然': return 'nature';
    case '天文': return 'astronomy';
    case '地理': return 'geography';
    case '动漫': return 'anime';
    case '影视': return 'movie';
    case '游戏': return 'game';
    case '体育': return 'sports';
    case '历史': return 'history';
    case 'acgn': return 'acgn';
    case '随机': return 'random';
    default: return s;
  }
}