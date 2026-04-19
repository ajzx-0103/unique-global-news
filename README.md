# Global News - 全球新闻聚合应用

一个实时聚合全球主流媒体新闻的 Web 应用，支持多国家、多语言新闻浏览与搜索。

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Express](https://img.shields.io/badge/Express-green)

## 功能特性

- 🌍 **多国家新闻聚合**: 支持中国、美国、英国、日本、德国、法国、俄罗斯等主流新闻媒体
- 🔍 **新闻搜索**: 支持关键词搜索新闻内容
- 🌐 **多语言支持**: 支持中文、英文、日文、德文、法文、俄文等
- 📱 **响应式设计**: 支持桌面端和移动端浏览
- ⚡ **实时更新**: 自动定时爬取最新新闻
- 🔒 **反爬机制**: 智能请求间隔，随机 User-Agent，断路器保护

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 |
| 构建工具 | Vite 8 |
| 路由 | React Router 7 |
| 后端 | Express.js |
| 爬虫 | RSS Parser |
| 代码检查 | ESLint 9 |
| 部署 | Vercel |

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 启动开发服务器

**方式一：分别启动**

```bash
# 终端1：启动后端服务器
npm run dev:server

# 终端2：启动前端开发服务器
npm run dev
```

**方式二：同时启动**

```bash
npm run dev:all
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
global-news/
├── src/                    # 前端源代码
│   ├── components/         # 通用组件（Header、NewsCard、Loading 等）
│   ├── pages/             # 页面组件（新闻列表、详情）
│   ├── services/         # API 服务
│   ├── data/             # 静态数据（国家列表）
│   ├── App.jsx           # 应用入口
│   └── main.jsx          # React 入口
├── server/                # 后端服务器
│   ├── server.js         # API 服务器
│   ├── crawler.js        # 新闻爬虫
│   ├── database.js        # JSON 数据存储
│   ├── downloader.js     # 图片下载器
│   ├── gnews.js         # GNews API 集成
│   ├── translator.js     # 翻译服务
│   ├── worker.js        # 定时任务
│   └── data/            # 新闻数据库
├── api/                  # Vercel API 路由
├── public/               # 静态资源
└── package.json          # 前端依赖
```

## API 接口

| 端点 | 方法 | 说明 | 参数 |
|------|------|------|------|
| `/api/news` | GET | 获取新闻列表 | `country`, `lang`, `limit`, `offset` |
| `/api/news/search` | GET | 搜索新闻 | `q` (关键词) |
| `/api/countries` | GET | 获取国家列表 | - |
| `/api/stats` | GET | 获取统计数据 | - |
| `/api/sources` | GET | 获取新闻源 | - |
| `/api/crawl` | POST | 手动触发爬虫 | `country` (可选), `full` (可选) |

## 支持的新闻源

### 中国
新浪新闻、腾讯新闻、网易新闻、凤凰网、人民网、新华网

### 美国
CNN、纽约时报、华盛顿邮报、路透社、AP News

### 英国
The Guardian、BBC News、The Telegraph

### 日本
NHK、読売新聞、朝日新聞、毎日新聞

### 德国
Der Spiegel、Die Zeit、FAZ

### 法国
Le Monde、Le Figaro、Libération

### 俄罗斯
RT、TASS、РИА Новости

### 全球
Al Jazeera、France 24、Deutsche Welle、Euronews

## 环境变量

在 `server/` 目录创��� `.env` 文件：

```env
GNEWS_API_KEY=your_gnews_api_key
PORT=3000
```

> 注意：GNews API Key 为可选项，不填写也能通过 RSS 源爬取新闻。

## 部署

### Vercel 部署（推荐）

```bash
npm i -g vercel
vercel deploy
```

### Vercel + Cloudflare Workers

后端支持部署到 Cloudflare Workers：

```bash
cd server
wrangler deploy
```

## 许可证

MIT