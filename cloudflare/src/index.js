/**
 * Cloudflare Worker - 猜词游戏API代理
 *
 * 功能：
 * - 代理DeepSeek API调用
 * - 实现请求缓存
 * - 处理错误和限流
 * - 保护API密钥
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 设置CORS头
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 处理OPTIONS请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由处理
      if (url.pathname === "/api/generate-entry" && request.method === "POST") {
        return await handleGenerateEntry(request, env, corsHeaders);
      }

      if (url.pathname === "/api/health" && request.method === "GET") {
        return await handleHealthCheck(env, corsHeaders);
      }

      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Worker错误:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};

/**
 * 处理词条生成请求
 */
async function handleGenerateEntry(request, env, corsHeaders) {
  const { category } = await request.json();
  const url = new URL(request.url);
  const fresh = url.searchParams.get('fresh') === '1';

  if (!category) {
    return new Response(JSON.stringify({ error: "Category is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // 检查缓存（fresh=1 时跳过缓存）
  const cacheKey = `entry:${category}`;
  if (!fresh) {
    const cached = await getCache(cacheKey, env);
    if (cached) {
      const normalized = normalizeLegacyShape(cached, category);
      return new Response(JSON.stringify(normalized), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
          ...corsHeaders,
        },
      });
    }
  }

  // 调用DeepSeek API
  const result = await callDeepSeekAPI(category, env);

  // 统一响应为前端期望的 Schema
  const payload = toApiResponse(result, category);

  // 缓存结果（1小时），fresh=1不写入缓存
  if (!fresh) {
    await setCache(cacheKey, payload, 3600, env);
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "X-Cache": fresh ? "BYPASS" : "MISS",
      ...corsHeaders,
    },
  });
}

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(category, env) {
  const apiKey = env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  const prompt = `请生成一个${category}领域的词条名称和对应的百科内容。
要求：
1. 词条名称简洁准确，2-6个汉字
2. 百科内容400-500字，内容真实可靠，避免出现英文字符和阿拉伯数字等特殊字符
3. 返回JSON格式：{"entry": "词条名称", "content": "百科内容", "category": "${category}"}
4. 确保内容适合文字猜词游戏使用`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `DeepSeek API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析JSON响应
  let result;
  try {
    result = JSON.parse(content);
  } catch (error) {
    console.error("解析API响应失败:", content);
    throw new Error("Invalid API response format");
  }

  // 验证响应格式
  if (!result.entry || !result.content || !result.category) {
    throw new Error("Invalid response structure");
  }

  // 确保category字段正确
  result.category = category;

  return result;
}

/**
 * 将旧版/原始 DeepSeek 返回转换为统一的前端响应结构
 * 目标结构：{ success: true, data: { entry, encyclopedia, category }, timestamp }
 *
 * @param raw  - 原始结果，格式为 { entry, content, category }
 * @param category - 请求的分类（中文），用于覆盖或校准返回的分类
 * @returns 统一的响应负载
 */
function toApiResponse(raw, category) {
  const entryData = {
    entry: raw.entry,
    encyclopedia: raw.content,
    category: category || raw.category,
    metadata: {
      category: String(category || raw.category),
      source: "deepseek",
      difficulty: "medium",
    },
  };

  return {
    success: true,
    data: entryData,
    timestamp: Date.now(),
  };
}

/**
 * 规范化缓存的旧结构（兼容此前直接存储的 {entry, content, category}）
 * 若已为新结构则原样返回
 *
 * @param cached - KV中读取的对象
 * @param category - 当前请求的分类
 * @returns 统一结构的对象
 */
function normalizeLegacyShape(cached, category) {
  if (cached && cached.success && cached.data) {
    return cached;
  }
  if (cached && cached.entry && cached.content) {
    return toApiResponse(cached, category);
  }
  return cached;
}

/**
 * 健康检查
 */
async function handleHealthCheck(env, corsHeaders) {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    deepseek: await checkDeepSeekConnection(env),
  };

  return new Response(JSON.stringify(health), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * 检查DeepSeek连接
 */
async function checkDeepSeekConnection(env) {
  try {
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { connected: false, error: "API key not configured" };
    }

    const response = await fetch("https://api.deepseek.com/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return {
      connected: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * 获取缓存
 */
async function getCache(key, env) {
  if (!env.CACHE) return null;

  try {
    const value = await env.CACHE.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("缓存获取失败:", error);
    return null;
  }
}

/**
 * 设置缓存
 */
async function setCache(key, value, ttl, env) {
  if (!env.CACHE) return;

  try {
    await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (error) {
    console.error("缓存设置失败:", error);
  }
}
