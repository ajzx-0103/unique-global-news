# AGENTS.md

本文件为 AI 代理提供代码库的开发规范和指南。

## 项目概述

- **项目名称**: global-news
- **技术栈**: React 19 + Vite 8 + ESLint 9 + React Router 7 + Express.js
- **项目类型**: 全球新闻聚合 Web 应用

## 项目结构

```
global-news/
├── src/                    # 前端代码
│   ├── components/        # 通用组件
│   ├── pages/              # 页面组件
│   ├── services/          # API 服务
│   ├── data/               # 静态数据
│   ├── App.jsx             # 应用入口
│   └── main.jsx            # React 入口
├── server/                 # 后端服务器
│   ├── server.js           # Express API 服务器
│   ├── crawler.js           # 新闻爬虫
│   ├── database.js         # JSON 数据存储
│   ├── downloader.js       # 图片下载器
│   ├── public/images/      # 下载的新闻图片
│   └── data/               # JSON 数据库文件
└── package.json            # 前端依赖
```

## 开发命令

### 前端

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

### 后端

```bash
cd server
npm install

# 启动服务器
npm start

# 爬取全球新闻
npm run crawl

# 爬取单个国家新闻
node crawler.js  # 然后调用 crawlCountry('cn', 'zh')
```

### 环境变量

在 `server/` 目录创建 `.env` 文件：
```
GNEWS_API_KEY=your_gnews_api_key
PORT=3000
```

## 后端 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/news` | GET | 获取新闻 (?country=&lang=&limit=&offset=) |
| `/api/news/search` | GET | 搜索新闻 (?q=query) |
| `/api/countries` | GET | 获取国家列表及新闻数量 |
| `/api/sources` | GET | 获取新闻源列表 |
| `/api/stats` | GET | 获取数据库统计 |
| `/api/source-health` | GET | 获取 RSS 源健康状态 |
| `/api/crawl` | POST | 触发爬虫 ({country?, full?}) |
| `/api/download-images` | POST | 下载图片 |

## 支持的新闻源

### 中国
- 新浪新闻、腾讯新闻、网易新闻、凤凰网、人民网、新华网

### 美国
- CNN、BBC News、纽约时报、华盛顿邮报、路透社、AP News

### 英国
- The Guardian、BBC News、The Telegraph、The Independent

### 日本
- NHK、読売新聞、朝日新闻、毎日新聞、日本経済新聞

### 德国
- Der Spiegel、Die Zeit、FAZ

### 法国
- Le Monde、Le Figaro、Libération

### 俄罗斯
- RT、TASS、РИА Новости、Коммерсантъ

### 全球
- Al Jazeera、France 24、Deutsche Welle、Euronews

## 数据存储

- **数据库**: JSON 文件存储 (`server/data/news.json`)
- **图片**: 本地存储 (`server/public/images/`)
- **数据持久化**: 所有数据保存在本地，可永久查看

## 反爬机制

### 请求头伪装
- 随机 User-Agent（支持 Chrome、Firefox、Safari、Edge）
- 完整的 Accept/Accept-Language/Accept-Encoding 头
- Connection: keep-alive
- Cache-Control: no-cache

### 速率限制
- 请求间隔随机化（800ms-2000ms）
- 指数退避重试（最多3次）
- 429状态码自动识别并等待

### 源健康检查
- 连续失败计数器
- 断路器模式（连续5次失败后禁用源）
- 成功率统计和平均文章数

### 状态码处理
- 429 (Too Many Requests): 读取 Retry-After 头
- 403/451 (Forbidden): 禁用源
- 超时: 自动重试

## 实时更新策略

### 自动刷新
- 快速刷新: 每 2 分钟（热门国家）
- 完整刷新: 每 10 分钟（所有国家）

### 缓存策略
- 新闻缓存: 3 分钟有效期
- 国家缓存: 2 分钟有效期
- 刷新队列: 防止并发刷新

### 增量更新
- 启动时只爬取缺失的国家
- 热门国家优先（global, us, gb, cn, de, fr, jp）
- 新闻去重（按 URL）

## 代码规范

### React 组件

```jsx
// 使用函数式组件 + 命名导出
function NewsCard({ article }) {
  return <div className="news-card">{/* ... */}</div>;
}
export default NewsCard;
```

### 导入顺序

1. React hooks
2. 第三方库
3. 本地组件
4. 本地服务/工具
5. 数据文件
6. CSS 样式

### API 服务

- API 地址: `/api/*`（由 Vite 代理到 localhost:3000）
- 始终使用 `encodeURIComponent()` 处理用户输入

## ESLint 配置

项目使用 ESLint 9 (Flat Config)，特殊规则：
- `no-unused-vars` 忽略大写下划线开头的变量

## Git 规范

- 忽略 `node_modules/`、`dist/`、`server/node_modules/`、`server/data/` 目录
- API 密钥不应提交到版本控制
