# 零成本部署指南 (Cloudflare Workers + Vercel)

## 架构概览

```
用户浏览器 → Vercel CDN (前端) → Cloudflare Workers (API)
                                    ↓
                              KV Storage (数据库)
```

## 费用

- Cloudflare Workers: 免费 (10万次/天)
- Cloudflare KV: 免费 (1GB 存储)
- Vercel: 免费 (100GB 带宽/月)

---

## 部署步骤

### 第一步：创建 Cloudflare 账号

1. 访问 https://dash.cloudflare.com 注册账号
2. 完成邮箱验证

### 第二步：创建 KV 命名空间

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
cd server
wrangler kv:namespace create "NEWS_DB"
```

会输出类似：
```
{ binding = "NEWS_DB", id = "xxxxxxxxxxxxxxxxxxxx" }
```

### 第三步：更新配置文件

编辑 `server/wrangler.toml`，将 `your-kv-namespace-id` 替换为上一步得到的 ID：

```toml
[[kv_namespaces]]
binding = "NEWS_DB"
id = "xxxxxxxxxxxxxxxxxxxx"  # 替换这里
```

### 第四步：部署 API 服务

```bash
cd server
wrangler deploy
```

部署成功后你会得到一个 URL：
```
https://global-news-api.xxxxx.workers.dev
```

### 第五步：更新前端配置

编辑项目根目录 `vite.config.js`，将 `your-subdomain` 替换为你的 workers 子域名：

```javascript
proxy: {
  '/api': {
    target: 'https://global-news-api.你的子域名.workers.dev',
    changeOrigin: true
  }
}
```

### 第六步：部署前端到 Vercel

```bash
# 构建前端
npm run build

# 使用 Vercel CLI 部署
npx vercel --prod
```

或直接在 Vercel 控制台上传 `dist` 目录。

---

## 手动触发新闻爬取

部署后，Cloudflare Workers 会每 6 小时自动爬取一次新闻。

也可以手动触发：

```bash
curl -X POST https://global-news-api.xxxxx.workers.dev/api/crawl
```

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/news` | GET | 获取新闻列表 |
| `/api/countries` | GET | 获取国家列表 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/crawl` | POST | 触发爬虫 |

---

## 注意事项

1. **首次部署后**：需要手动调用 `/api/crawl` 填充新闻数据
2. **免费额度**：Cloudflare Workers 每天 10 万次请求，足够个人使用
3. **国内访问**：Cloudflare 在国内有节点，访问速度较快
4. **数据持久化**：新闻数据存储在 KV 中，重启不丢失

---

## 本地开发

后端无法本地运行 Cloudflare Workers API，但可以：

1. 部署后使用生产 API 开发前端
2. 或临时切换回本地后端：
   ```bash
   # 修改 vite.config.js 代理指向 localhost:3000
   # 运行本地后端
   npm run dev:server
   ```
