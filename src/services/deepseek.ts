import axios, { AxiosError } from 'axios';
import { ApiResponse, EntryData } from '../types/game.types';
import { getExcludedEntries, shouldAllowApiCall } from '../utils/stateManager';
import { toEnglishKey, selectRandomCategory } from '../utils/categoryMapper';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { getDeepSeekApiKey } from '../utils/storage';

/**
 * DeepSeek API服务
 * 前端直接调用DeepSeek API生成词条（通过Vercel Rewrite解决CORS）
 */

// API配置
const API_CONFIG = {
  // 使用Vercel Rewrite的代理路径，或在本地开发时通过Vite proxy转发
  baseURL: '/api/deepseek-proxy', 
  timeout: 60000, // 60秒超时（生成可能较慢）
  model: 'deepseek-chat',
};

/**
 * 获取API Key
 * 优先级：本地存储 > 环境变量
 * 如果两者都没有，返回空字符串，由后端代理注入内置 Key
 */
async function getApiKey(): Promise<string | null> {
  const localKey = await getDeepSeekApiKey();
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  
  // 移除直接从前端环境变量读取 Key 的逻辑，避免 Key 被打包进前端代码
  // const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  // if (envKey && envKey.trim()) {
  //   return envKey.trim();
  // }

  // 检查是否通过了网站验证（邀请码）
  const verified = localStorage.getItem('site_verification_passed') === 'true';
  if (verified) {
    // 返回空字符串，表示需要后端代理注入（本地Vite Proxy 或 Vercel Function）
    return '';
  }

  // 未配置Key且未验证，返回null
  return null;
}

/**
 * 调试日志输出
 */
function debugApiLog(label: string, payload: unknown): void {
  const enable = (import.meta.env.MODE === 'development') || (import.meta.env.VITE_DEBUG_API === '1');
  if (!enable) return;
  try {
    console.debug(`[API/DEBUG] ${label}`, payload);
  } catch (_) {
    console.debug(`[API/DEBUG] ${label} (stringified)`, String(payload));
  }
}

/**
 * 生成词条
 */
export async function generateEntry(category: string): Promise<ApiResponse<EntryData>> {
  const actualCategory = (category === '随机') ? selectRandomCategory() : category;
  
  try {
    const allowed = await shouldAllowApiCall('generateEntry', 10, 60_000, false); // 放宽限制
    if (!allowed) {
      throw new AppError('API调用频率超限', ErrorType.API_ERROR, 'RATE_LIMIT');
    }

    const apiKey = await getApiKey();
    
    // 如果没有获取到有效Key（包括内置Key的权限），抛出错误
    if (apiKey === null) {
      throw new AppError(
        '请在设置中配置API Key，或在游戏规则中输入邀请码以启用内置模型', 
        ErrorType.CONFIG_ERROR, 
        'MISSING_API_KEY'
      );
    }

    const excludeEntries = await getExcludedEntries(actualCategory);
    
    const systemPrompt = `你是一个中文猜词游戏的出题官。请根据用户指定的“领域”生成一个词条（Entry）和一段百科解释（Encyclopedia）。
    要求：
    1. 返回格式必须为标准 JSON，不要包含 Markdown 代码块标记。
    2. JSON 结构：
    {
      "entry": "词条名（不含标点）",
      "encyclopedia": "百科解释",
      "metadata": {
        "category": "领域英文名",
        "difficulty": "easy/medium/hard"
      }
    }
    3. 词条名称简洁准确，2-6个汉字
    4. 百科内容400-500字，内容真实可靠，避免出现英文字符和阿拉伯数字等特殊字符
    4. 确保内容适合文字猜词游戏使用
    5. 尽量兼顾词条的时效性，最好选取近年间流传度较高的热点词条
    6. 避免抽象的概念或过于专业的术语
    7. 词条应当是该领域内广为人知的概念或事物。
    8. 排除列表中的词条不要再次生成。
    9. 必须严格遵守用户指定的领域，生成的词条和百科内容必须属于该领域，否则视为无效输出。`;

    const userPrompt = `领域：${actualCategory}
    注意：生成的词条必须严格属于“${actualCategory}”领域。
    排除词条：${excludeEntries.join(', ')}
    请生成一个新的词条。`;

    const requestBody = {
      model: API_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 1.2, // 增加随机性
      stream: false
    };

    debugApiLog('POST /chat/completions:request', { 
      category: actualCategory,
      excludeEntries 
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.post(`${API_CONFIG.baseURL}`, requestBody, {
      headers,
      timeout: API_CONFIG.timeout
    });

    debugApiLog('POST /chat/completions:response', response.data);

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError('API返回内容为空', ErrorType.API_ERROR, 'EMPTY_RESPONSE');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      throw new AppError('API返回JSON格式错误', ErrorType.API_ERROR, 'INVALID_JSON');
    }

    // 转换格式以适配 ApiResponse<EntryData>
    const entryData: EntryData = {
      entry: parsedData.entry,
      encyclopedia: parsedData.encyclopedia,
      category: parsedData.metadata?.category || toEnglishKey(actualCategory),
      metadata: {
        ...parsedData.metadata,
        category: toEnglishKey(actualCategory)
      }
    };

    if (!isValidEntryData(entryData)) {
       throw new AppError('生成的数据结构无效', ErrorType.API_ERROR, 'INVALID_STRUCTURE');
    }

    return {
      success: true,
      data: entryData,
      timestamp: Date.now()
    };

  } catch (error) {
    if (error instanceof AppError) {
      // 如果是缺少Key，直接抛出，不走降级
      if (error.code === 'MISSING_API_KEY') {
        throw error;
      }
      debugApiLog('generateEntry:app-error', ErrorHandler.getErrorLog(error));
    } else {
      const appError = ErrorHandler.handleError(error);
      debugApiLog('generateEntry:error', ErrorHandler.getErrorLog(appError));
    }
    
    // 降级处理
    console.warn('API调用失败，使用本地降级数据');
    return getFallbackEntry(toEnglishKey(actualCategory));
  }
}

function isValidEntryData(data: any): data is EntryData {
  return data && 
    typeof data.entry === 'string' && 
    data.entry.length > 0 &&
    typeof data.encyclopedia === 'string';
}

/**
 * 获取降级词条
 */
function getFallbackEntry(category: string): ApiResponse<EntryData> {
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
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    // 简单的模型列表请求来测试 Key 是否有效
    const apiKey = await getApiKey();
    await axios.get(`${API_CONFIG.baseURL}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取API状态
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
      error: online ? undefined : 'API不可用或Key无效'
    };
  } catch (error) {
    return {
      online: false,
      error: ErrorHandler.handleError(error).message
    };
  }
}
