import axios, { AxiosError } from 'axios';
import { ApiResponse, EntryData } from '../types/game.types';
import { getExcludedEntries, shouldAllowApiCall } from '../utils/stateManager';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';

/**
 * DeepSeek API服务
 * 通过Cloudflare Worker代理调用DeepSeek API生成词条
 * 
 * 主要功能：
 * - 词条生成：根据选择的领域生成词条和百科内容
 * - 错误处理：网络错误重试和降级方案
 * - API状态检测：连接测试和状态监控
 * 
 * 错误处理策略：
 * - 网络错误：自动重试3次，失败后使用本地降级数据
 * - API错误：返回预设的降级词条数据
 * - 数据验证：严格验证API响应格式
 */

// API配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://your-worker.your-subdomain.workers.dev',
  timeout: 30000, // 30秒超时
  retries: 3, // 重试次数
  retryDelay: 1000 // 重试延迟（毫秒）
};

/**
 * 创建API客户端实例
 * 配置基础URL、超时时间和请求头
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 调试日志输出（仅开发环境）
 * 在开发模式或显式开启 `VITE_DEBUG_API=1` 时打印 API 请求与返回
 *
 * @param label - 日志标签，用于标识输出来源
 * @param payload - 任意可序列化的调试数据
 */
function debugApiLog(label: string, payload: unknown): void {
  const enable = (import.meta.env.MODE === 'development') || (import.meta.env.VITE_DEBUG_API === '1');
  if (!enable) return;
  try {
    // 直接输出对象，开发者工具可展开查看结构
    console.debug(`[API/DEBUG] ${label}`, payload);
  } catch (_) {
    // 兜底：序列化失败时尽可能输出文本信息
    console.debug(`[API/DEBUG] ${label} (stringified)`, String(payload));
  }
}

/**
 * 请求重试逻辑
 * 在网络错误时自动重试，支持指数退避
 * 
 * @param request - 需要重试的请求函数
 * @param retries - 剩余重试次数
 * @returns 请求结果
 * @throws 最后一次请求的错误
 */
const retryRequest = async (request: () => Promise<any>, retries = API_CONFIG.retries): Promise<any> => {
  try {
    return await request();
  } catch (error) {
    if (retries > 0 && ErrorHandler.handleError(error).type === 'NETWORK_ERROR') {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return retryRequest(request, retries - 1);
    }
    throw error;
  }
};

/**
 * 生成词条
 * 根据选择的领域生成词条和百科内容
 * 
 * @param category - 领域分类（如：nature, astronomy, geography等）
 * @returns API响应，包含词条数据
 * @throws AppError - 网络错误或API错误时会使用降级方案
 * 
 * 使用示例：
 * ```typescript
 * try {
 *   const response = await generateEntry('nature');
 *   console.log(response.data.entry); // "光合作用"
 * } catch (error) {
 *   console.error('词条生成失败:', error);
 * }
 * ```
 */
export async function generateEntry(category: string): Promise<ApiResponse<EntryData>> {
  try {
    const allowed = await shouldAllowApiCall('generateEntry', 5, 60_000, import.meta.env.VITE_ANTI_ABUSE !== '0');
    if (!allowed) {
      throw new AppError('API调用频率超限', ErrorType.API_ERROR, 'RATE_LIMIT');
    }
    const excludeEntries = await getExcludedEntries();
    const requestBody = {
      category: category.toLowerCase(),
      language: 'chinese',
      includeEncyclopedia: true,
      excludeEntries
    };
    debugApiLog('POST /api/generate-entry:request', {
      baseURL: API_CONFIG.baseURL,
      body: requestBody
    });

    const response = await retryRequest(async () => {
      // 通过 fresh=1 显式关闭服务端缓存，确保每次生成新的词条
      return await apiClient.post('/api/generate-entry?fresh=1', requestBody);
    });

    debugApiLog('POST /api/generate-entry:response', {
      status: response?.status,
      data: response?.data
    });

    if (!isValidApiResponse(response.data)) {
      // 打印响应关键结构，辅助定位字段缺失或类型不匹配问题
      debugApiLog('POST /api/generate-entry:invalid-shape', {
        keys: response?.data ? Object.keys(response.data) : null,
        sample: response?.data
      });
      throw new AppError('API返回数据格式无效', ErrorType.API_ERROR, 'INVALID_RESPONSE');
    }

    return response.data;
  } catch (error) {
    if (error instanceof AppError) {
      debugApiLog('POST /api/generate-entry:app-error', ErrorHandler.getErrorLog(error));
      throw error;
    }
    
    const appError = ErrorHandler.handleError(error);
    debugApiLog('POST /api/generate-entry:handled-error', ErrorHandler.getErrorLog(appError));
    
    // 如果是网络错误或API错误，使用降级方案
    if (appError.type === 'NETWORK_ERROR' || appError.type === 'API_ERROR') {
      debugApiLog('POST /api/generate-entry:fallback', { category });
      return getFallbackEntry(category);
    }
    
    throw appError;
  }
}

/**
 * 验证API响应数据
 * 严格验证API返回的数据格式是否符合预期
 * 
 * @param data - 需要验证的响应数据
 * @returns 数据是否有效
 * 
 * 验证规则：
 * - 必须有success字段且为true
 * - 必须有data字段且为对象
 * - data.entry必须是非空字符串
 * - data.encyclopedia（可选）必须是字符串
 * - data.metadata（可选）必须是对象
 */
export function isValidApiResponse(data: any): data is ApiResponse<EntryData> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!data.success || !data.data) {
    return false;
  }

  const entryData = data.data;
  
  // 验证词条数据
  if (!entryData.entry || typeof entryData.entry !== 'string' || entryData.entry.length === 0) {
    return false;
  }

  // 验证百科内容（可选）
  if (entryData.encyclopedia && typeof entryData.encyclopedia !== 'string') {
    return false;
  }

  // 验证元数据（可选）
  if (entryData.metadata && typeof entryData.metadata !== 'object') {
    return false;
  }

  return true;
}

/**
 * 获取降级词条
 * 当API不可用时返回预设的词条数据
 * 
 * @param category - 领域分类
 * @returns 包含预设词条数据的API响应
 * 
 * 降级词条覆盖了所有主要领域，确保游戏在离线状态下也能正常运行
 */
function getFallbackEntry(category: string): ApiResponse {
  const fallbackEntries: Record<string, EntryData> = {
    'nature': {
      entry: '光合作用',
      encyclopedia: '光合作用是植物、藻类和某些细菌利用光能将二氧化碳和水转化为有机物并释放氧气的过程。这个过程是地球生态系统中最重要的生化反应之一，为几乎所有生命提供能量来源。',
      category: '自然',
      metadata: { category: 'nature', difficulty: 'medium', source: 'fallback' }
    },
    'astronomy': {
      entry: '银河系',
      encyclopedia: '银河系是包含我们太阳系的棒旋星系，直径约10万光年，包含1000-4000亿颗恒星。银河系是宇宙中数千亿个星系中的一个，属于本星系群。',
      category: '天文',
      metadata: { category: 'astronomy', difficulty: 'easy', source: 'fallback' }
    },
    'geography': {
      entry: '喜马拉雅山脉',
      encyclopedia: '喜马拉雅山脉是世界海拔最高的山脉，位于青藏高原南缘，分布在中国西藏、巴基斯坦、印度、尼泊尔和不丹等国境内。主峰珠穆朗玛峰海拔8848.86米，是世界最高峰。',
      category: '地理',
      metadata: { category: 'geography', difficulty: 'medium', source: 'fallback' }
    },
    'anime': {
      entry: '千与千寻',
      encyclopedia: '《千与千寻》是宫崎骏执导的动画电影，2001年上映。讲述了少女千寻在神灵世界中的冒险故事。该片获得第75届奥斯卡金像奖最佳动画长片奖，是首部获此殊荣的手绘动画电影。',
      category: '动漫',
      metadata: { category: 'anime', difficulty: 'easy', source: 'fallback' }
    },
    'movie': {
      entry: '阿凡达',
      encyclopedia: '《阿凡达》是詹姆斯·卡梅隆执导的科幻电影，2009年上映。影片设定在2154年，人类在潘多拉星球上开采资源的故事。该片在视觉效果和3D技术方面具有革命性意义。',
      category: '影视',
      metadata: { category: 'movie', difficulty: 'easy', source: 'fallback' }
    },
    'game': {
      entry: '塞尔达传说',
      encyclopedia: '《塞尔达传说》是任天堂开发的冒险游戏系列，首部作品1986年发行。玩家扮演林克，在海拉鲁王国中冒险，拯救塞尔达公主。系列以开放世界探索和解谜元素著称。',
      category: '游戏',
      metadata: { category: 'game', difficulty: 'medium', source: 'fallback' }
    },
    'sports': {
      entry: '世界杯',
      encyclopedia: '国际足联世界杯是世界上最高荣誉、最高规格、最高竞技水平、最高知名度的足球比赛，与奥运会并称为全球体育两大最顶级赛事。每四年举办一次，由国际足联成员国轮流主办。',
      category: '体育',
      metadata: { category: 'sports', difficulty: 'easy', source: 'fallback' }
    },
    'history': {
      entry: '文艺复兴',
      encyclopedia: '文艺复兴是14-17世纪在欧洲兴起的思想文化运动，标志着中世纪向近代的过渡。以人文主义为核心，在文学、艺术、科学等领域取得巨大成就，代表人物有达·芬奇、米开朗基罗等。',
      category: '历史',
      metadata: { category: 'history', difficulty: 'hard', source: 'fallback' }
    },
    'acgn': {
      entry: '初音未来',
      encyclopedia: '初音未来是Crypton Future Media开发的虚拟歌手软件，2007年发布。基于雅马哈的VOCALOID语音合成技术，音源由声优藤田咲提供。初音未来已成为全球知名的虚拟偶像。',
      category: 'ACGN',
      metadata: { category: 'acgn', difficulty: 'easy', source: 'fallback' }
    },
    'random': {
      entry: '量子力学',
      encyclopedia: '量子力学是描述微观物质行为的物理学理论，与相对论一起构成现代物理学的理论基础。量子力学在原子、分子、固体物理、核物理等领域有重要应用。',
      category: '自然',
      metadata: { category: 'science', difficulty: 'hard', source: 'fallback' }
    }
  };

  const normalizedCategory = category.toLowerCase();
  const entryData = fallbackEntries[normalizedCategory] || fallbackEntries['random'];

  return {
    success: true,
    data: entryData,
    timestamp: Date.now()
  };
}

/**
 * 测试API连接
 * 检测后端服务是否可用
 * 
 * @returns 连接是否成功
 * @example
 * ```typescript
 * const isOnline = await testApiConnection();
 * console.log(isOnline ? 'API服务正常' : 'API服务不可用');
 * ```
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await apiClient.get('/api/health');
    return response.data?.status === 'ok';
  } catch (error) {
    console.warn('API连接测试失败:', ErrorHandler.getErrorLog(ErrorHandler.handleError(error)));
    return false;
  }
}

/**
 * 获取API状态
 * 获取详细的API连接状态信息
 * 
 * @returns 包含在线状态、响应时间和错误信息的详细状态
 * 
 * 返回格式：
 * ```typescript
 * {
 *   online: boolean,      // API是否在线
 *   responseTime?: number, // 响应时间（毫秒）
 *   error?: string        // 错误信息（如果失败）
 * }
 * ```
 */
export async function getApiStatus(): Promise<{
  online: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const online = await testApiConnection();
    const responseTime = Date.now() - startTime;
    
    return {
      online,
      responseTime: online ? responseTime : undefined,
      error: online ? undefined : 'API服务不可用'
    };
  } catch (error) {
    return {
      online: false,
      error: ErrorHandler.handleError(error).message
    };
  }
}