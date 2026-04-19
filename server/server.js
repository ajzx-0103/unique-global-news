import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getNews, searchNews, getNewsCount, getCountries, getStats, insertMany, newsData } from './database.js';
import { NEWS_SOURCES, COUNTRIES, fetchRSSLive, crawlCountry, getSourceHealth } from './crawler.js';
import { searchWithTranslation, detectLanguage } from './translator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const cache = {
  news: null,
  timestamp: 0,
  countryCache: {},
  lastCrawlTime: null,
  isRefreshing: false,
  refreshQueue: []
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureNewsInCache() {
  const now = Date.now();
  const CACHE_DURATION = 3 * 60 * 1000;
  
  if (!cache.news || now - cache.timestamp > CACHE_DURATION) {
    await refreshAllNews();
  }
}

async function ensureCountryNews(country) {
  const now = Date.now();
  const CACHE_DURATION = 2 * 60 * 1000;
  const countryCache = cache.countryCache[country];
  
  if (!countryCache || now - countryCache.timestamp > CACHE_DURATION) {
    await refreshCountryNews(country);
  }
}

async function refreshCountryNews(country, priority = false) {
  if (cache.isRefreshing && !priority) {
    cache.refreshQueue.push(country);
    return;
  }
  
  console.log(`[${new Date().toLocaleTimeString()}] Refreshing news for ${country}...`);
  const articles = [];
  
  let sources = NEWS_SOURCES[country] || [];
  if (sources.length === 0 && NEWS_SOURCES.global) {
    sources = NEWS_SOURCES.global.slice(0, 6);
  }
  
  const shuffledSources = [...sources].sort(() => Math.random() - 0.5);
  
  for (const source of shuffledSources) {
    try {
      const sourceArticles = await fetchRSSLive(source.url, source.name, country, source.lang || 'en');
      articles.push(...sourceArticles);
      await sleep(800 + Math.random() * 1500);
    } catch (error) {
      console.log(`Error fetching ${source.name}: ${error.message}`);
    }
  }
  
  if (articles.length > 0) {
    const added = insertMany(articles);
    console.log(`Added ${added} new articles for ${country}`);
  }
  
  cache.countryCache[country] = {
    timestamp: Date.now(),
    count: articles.length
  };
}

async function refreshAllNews() {
  if (cache.isRefreshing) {
    console.log('Already refreshing, skipping...');
    return;
  }
  
  cache.isRefreshing = true;
  console.log(`\n[${new Date().toLocaleTimeString()}] === Starting Incremental Refresh ===`);
  
  try {
    const totalCountries = COUNTRIES.length;
    let processed = 0;
    
    for (const { code } of COUNTRIES) {
      processed++;
      console.log(`[Progress: ${processed}/${totalCountries}]`);
      await refreshCountryNews(code);
      await sleep(1500 + Math.random() * 2000);
    }
    
    cache.timestamp = Date.now();
    cache.lastCrawlTime = new Date().toISOString();
    console.log(`\n=== Refresh Complete ===\n`);
  } catch (error) {
    console.error('Error refreshing news:', error);
  } finally {
    cache.isRefreshing = false;
    
    if (cache.refreshQueue.length > 0) {
      const nextCountry = cache.refreshQueue.shift();
      await refreshCountryNews(nextCountry);
    }
  }
}

async function incrementalRefresh() {
  console.log(`\n[${new Date().toLocaleTimeString()}] === Quick Refresh ===`);
  
  const popularCountries = ['global', 'us', 'gb', 'cn', 'de', 'fr', 'jp'];
  
  for (const code of popularCountries) {
    await refreshCountryNews(code, true);
    await sleep(1000);
  }
  
  cache.timestamp = Date.now();
  console.log(`=== Quick Refresh Complete ===\n`);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function processImageUrl(article) {
  let imageUrl = article.local_image_path || article.image_url;
  
  if (!imageUrl) {
    const id = article.id || hashCode(article.url || article.title);
    imageUrl = `https://picsum.photos/seed/${id}/400/300`;
  }
  
  return imageUrl;
}

app.get('/api/news', async (req, res) => {
  try {
    const { country, lang, limit = 50, offset = 0 } = req.query;
    
    await ensureNewsInCache();
    
    if (country) {
      await ensureCountryNews(country);
    }
    
    let news = getNews({ country, language: lang, limit: parseInt(limit), offset: parseInt(offset) });
    let total = getNewsCount({ country, language: lang });
    
    if (country && news.length === 0) {
      news = getNews({ language: lang, limit: parseInt(limit), offset: parseInt(offset) });
      total = getNewsCount({ language: lang });
    }
    
    const articles = news.map(article => ({
      ...article,
      urlToImage: processImageUrl(article)
    }));
    
    res.json({
      articles,
      total,
      hasMore: parseInt(offset) + articles.length < total,
      lastUpdated: cache.lastCrawlTime
    });
  } catch (error) {
    console.error('Error in /api/news:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/news/search', async (req, res) => {
  try {
    const { q, country, limit = 50, offset = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const sourceLang = detectLanguage(q);
    const { original, translations, queries } = await searchWithTranslation(q, sourceLang);
    
    const news = searchNews({ 
      query: original, 
      country, 
      limit: parseInt(limit), 
      offset: parseInt(offset),
      translations: translations
    });
    
    const articles = news.map(article => ({
      ...article,
      urlToImage: processImageUrl(article)
    }));
    
    res.json({
      articles,
      total: articles.length,
      searchMeta: {
        original: q,
        sourceLang,
        translations
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/countries', (req, res) => {
  try {
    const dbCountries = getCountries();
    const allCountries = COUNTRIES.map(c => ({
      code: c.code,
      name: c.name,
      lang: c.lang,
      flag: c.flag || '',
      count: dbCountries.find(x => x.country === c.code)?.count || 0
    }));
    res.json(allCountries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sources', (req, res) => {
  try {
    const { country } = req.query;
    if (country && NEWS_SOURCES[country]) {
      res.json(NEWS_SOURCES[country]);
    } else {
      res.json(NEWS_SOURCES);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/source-health', (req, res) => {
  try {
    const health = getSourceHealth();
    const stats = getStats();
    res.json({
      sources: health,
      database: stats,
      cache: {
        lastCrawlTime: cache.lastCrawlTime,
        isRefreshing: cache.isRefreshing,
        queueLength: cache.refreshQueue.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crawl', async (req, res) => {
  try {
    const { country, full = false } = req.body;
    
    if (country) {
      await refreshCountryNews(country, true);
    } else if (full) {
      await refreshAllNews();
    } else {
      await incrementalRefresh();
    }
    
    res.json({ success: true, message: 'Crawl completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/download-images', async (req, res) => {
  try {
    res.json({ success: true, message: 'Images served via picsum.photos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    const countries = getCountries();
    res.json({
      ...stats,
      topCountries: countries.slice(0, 10),
      cacheAge: cache.timestamp ? Date.now() - cache.timestamp : null,
      lastCrawlTime: cache.lastCrawlTime,
      isRefreshing: cache.isRefreshing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function startAutoRefresh() {
  console.log('\n=== 启动实时新闻自动更新 ===');
  console.log('快速刷新: 每 2 分钟 (热门国家)');
  console.log('完整刷新: 每 10 分钟 (所有国家)');
  
  setInterval(async () => {
    if (!cache.isRefreshing) {
      await incrementalRefresh();
    }
  }, 2 * 60 * 1000);
  
  setInterval(async () => {
    if (!cache.isRefreshing) {
      await refreshAllNews();
    }
  }, 10 * 60 * 1000);
}

async function start() {
  initDatabase();
  
  setTimeout(() => ensureNewsInCache(), 1000);
  
  setTimeout(() => startAutoRefresh(), 5000);
  
  app.listen(PORT, () => {
    console.log(`\n Global News Server running on http://localhost:${PORT}`);
    console.log(`\n实时新闻自动更新: 已启用`);
    console.log(`  - 快速刷新: 每 2 分钟`);
    console.log(`  - 完整刷新: 每 10 分钟`);
    console.log(`\n反爬措施:`);
    console.log(`  - 随机 User-Agent`);
    console.log(`  - 请求间隔随机化`);
    console.log(`  - 自动重试机制`);
    console.log(`  - 源健康检查`);
    console.log(`  - 断路器模式`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET  /api/news           - 获取新闻`);
    console.log(`  GET  /api/news/search    - 搜索新闻`);
    console.log(`  GET  /api/countries      - 国家列表`);
    console.log(`  GET  /api/sources        - 新闻源`);
    console.log(`  GET  /api/source-health  - 源健康状态`);
    console.log(`  GET  /api/stats          - 数据库统计`);
    console.log(`  POST /api/crawl          - 触发爬取`);
  });
}

start().catch(console.error);
