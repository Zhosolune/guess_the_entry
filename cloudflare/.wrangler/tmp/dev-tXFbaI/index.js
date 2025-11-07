var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-xdPMKQ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (url.pathname === "/api/generate-entry" && request.method === "POST") {
        return await handleGenerateEntry(request, env, corsHeaders);
      }
      if (url.pathname === "/api/health" && request.method === "GET") {
        return await handleHealthCheck(env, corsHeaders);
      }
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("Worker\u9519\u8BEF:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
  }
};
async function handleGenerateEntry(request, env, corsHeaders) {
  const { category } = await request.json();
  const url = new URL(request.url);
  const fresh = url.searchParams.get("fresh") === "1";
  if (!category) {
    return new Response(JSON.stringify({ error: "Category is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  const cacheKey = `entry:${category}`;
  if (!fresh) {
    const cached = await getCache(cacheKey, env);
    if (cached) {
      const normalized = normalizeLegacyShape(cached, category);
      return new Response(JSON.stringify(normalized), {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
          ...corsHeaders
        }
      });
    }
  }
  const result = await callDeepSeekAPI(category, env);
  const payload = toApiResponse(result, category);
  if (!fresh) {
    await setCache(cacheKey, payload, 3600, env);
  }
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "X-Cache": fresh ? "BYPASS" : "MISS",
      ...corsHeaders
    }
  });
}
__name(handleGenerateEntry, "handleGenerateEntry");
async function callDeepSeekAPI(category, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured");
  }
  const prompt = `\u8BF7\u751F\u6210\u4E00\u4E2A${category}\u9886\u57DF\u7684\u8BCD\u6761\u540D\u79F0\u548C\u5BF9\u5E94\u7684\u767E\u79D1\u5185\u5BB9\u3002
\u8981\u6C42\uFF1A
1. \u8BCD\u6761\u540D\u79F0\u7B80\u6D01\u51C6\u786E\uFF0C2-6\u4E2A\u6C49\u5B57
2. \u767E\u79D1\u5185\u5BB9400-500\u5B57\uFF0C\u5185\u5BB9\u771F\u5B9E\u53EF\u9760\uFF0C\u907F\u514D\u51FA\u73B0\u82F1\u6587\u5B57\u7B26\u548C\u963F\u62C9\u4F2F\u6570\u5B57\u7B49\u7279\u6B8A\u5B57\u7B26
3. \u8FD4\u56DEJSON\u683C\u5F0F\uFF1A{"entry": "\u8BCD\u6761\u540D\u79F0", "content": "\u767E\u79D1\u5185\u5BB9", "category": "${category}"}
4. \u786E\u4FDD\u5185\u5BB9\u9002\u5408\u6587\u5B57\u731C\u8BCD\u6E38\u620F\u4F7F\u7528`;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500
    })
  });
  if (!response.ok) {
    throw new Error(
      `DeepSeek API error: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  const content = data.choices[0].message.content;
  let result;
  try {
    result = JSON.parse(content);
  } catch (error) {
    console.error("\u89E3\u6790API\u54CD\u5E94\u5931\u8D25:", content);
    throw new Error("Invalid API response format");
  }
  if (!result.entry || !result.content || !result.category) {
    throw new Error("Invalid response structure");
  }
  result.category = category;
  return result;
}
__name(callDeepSeekAPI, "callDeepSeekAPI");
function toApiResponse(raw, category) {
  const entryData = {
    entry: raw.entry,
    encyclopedia: raw.content,
    category: category || raw.category,
    metadata: {
      category: String(category || raw.category),
      source: "deepseek",
      difficulty: "medium"
    }
  };
  return {
    success: true,
    data: entryData,
    timestamp: Date.now()
  };
}
__name(toApiResponse, "toApiResponse");
function normalizeLegacyShape(cached, category) {
  if (cached && cached.success && cached.data) {
    return cached;
  }
  if (cached && cached.entry && cached.content) {
    return toApiResponse(cached, category);
  }
  return cached;
}
__name(normalizeLegacyShape, "normalizeLegacyShape");
async function handleHealthCheck(env, corsHeaders) {
  const health = {
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    deepseek: await checkDeepSeekConnection(env)
  };
  return new Response(JSON.stringify(health), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(handleHealthCheck, "handleHealthCheck");
async function checkDeepSeekConnection(env) {
  try {
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { connected: false, error: "API key not configured" };
    }
    const response = await fetch("https://api.deepseek.com/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    return {
      connected: response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}
__name(checkDeepSeekConnection, "checkDeepSeekConnection");
async function getCache(key, env) {
  if (!env.CACHE) return null;
  try {
    const value = await env.CACHE.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("\u7F13\u5B58\u83B7\u53D6\u5931\u8D25:", error);
    return null;
  }
}
__name(getCache, "getCache");
async function setCache(key, value, ttl, env) {
  if (!env.CACHE) return;
  try {
    await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (error) {
    console.error("\u7F13\u5B58\u8BBE\u7F6E\u5931\u8D25:", error);
  }
}
__name(setCache, "setCache");

// C:/Users/lenovo/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/lenovo/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-xdPMKQ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/lenovo/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-xdPMKQ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
