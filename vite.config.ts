import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/api/deepseek-proxy': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => '/chat/completions',
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 如果请求头中没有 Authorization，且环境变量中有 Key，则注入
            const userKey = req.headers['authorization'];
            if (!userKey) {
              // 优先读取 DEEPSEEK_API_KEY (推荐，不带VITE_前缀，不会暴露给前端)
              // 兼容 VITE_DEEPSEEK_API_KEY (旧配置)
              const envKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
              if (envKey) {
                proxyReq.setHeader('Authorization', `Bearer ${envKey}`);
              }
            }
          });
        }
      }
    }
  }
})
