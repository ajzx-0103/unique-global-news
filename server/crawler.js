import fetch from 'node-fetch';
import { insertMany, saveDatabase } from './database.js';
import { downloadImage } from './downloader.js';

const API_KEY = process.env.GNEWS_API_KEY || '';
const BASE_URL = 'https://gnews.io/api/v4';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
];

const sourceHealth = new Map();

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomDelay(min = 1500, max = 4000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateSourceHealth(sourceKey, success, articleCount = 0) {
  if (!sourceHealth.has(sourceKey)) {
    sourceHealth.set(sourceKey, {
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccess: 0,
      avgArticles: 0,
      lastSuccess: null,
      lastAttempt: null,
      isBanned: false
    });
  }
  
  const health = sourceHealth.get(sourceKey);
  health.lastAttempt = Date.now();
  
  if (success) {
    health.consecutiveFailures = 0;
    health.totalSuccess++;
    health.lastSuccess = Date.now();
    health.avgArticles = (health.avgArticles * (health.totalSuccess - 1) + articleCount) / health.totalSuccess;
    if (health.isBanned && health.consecutiveFailures === 0) {
      health.isBanned = false;
      console.log(`  [康复] ${sourceKey} 已恢复`);
    }
  } else {
    health.consecutiveFailures++;
    health.totalFailures++;
    if (health.consecutiveFailures >= 5) {
      health.isBanned = true;
      console.log(`  [禁用] ${sourceKey} 连续失败${health.consecutiveFailures}次，暂停使用`);
    }
  }
}

function isSourceHealthy(sourceKey) {
  const health = sourceHealth.get(sourceKey);
  if (!health) return true;
  if (health.isBanned) return false;
  if (health.consecutiveFailures >= 3) return false;
  return true;
}

const NEWS_SOURCES = {
  cn: [
    { name: 'BBC中文', url: 'https://www.bbc.com/zhongwen/simp/rss.xml', type: 'rss', lang: 'zh' },
    { name: '德国之声中文', url: 'https://rss.dw.com/rdf/rss-zh-all', type: 'rss', lang: 'zh' },
    { name: '美国之音中文', url: 'https://www.voachinese.com/api/zgotvzh', type: 'rss', lang: 'zh' },
    { name: '法国国际广播中文', url: 'https://www.rfi.fr/cn/rss', type: 'rss', lang: 'zh' },
    { name: '联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/china', type: 'rss', lang: 'zh' }
  ],
  us: [
    { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', type: 'rss', lang: 'en' },
    { name: 'US News', url: 'https://www.usnews.com/rss/news', type: 'rss', lang: 'en' },
    { name: 'Google News', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', type: 'rss', lang: 'en' },
    { name: 'Newsweek', url: 'https://www.newsweek.com/rss', type: 'rss', lang: 'en' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', type: 'rss', lang: 'en' }
  ],
  gb: [
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', type: 'rss', lang: 'en' },
    { name: 'The Independent', url: 'https://www.independent.co.uk/rss', type: 'rss', lang: 'en' },
    { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/home-page.xml', type: 'rss', lang: 'en' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', type: 'rss', lang: 'en' },
    { name: 'The Telegraph', url: 'https://www.telegraph.co.uk/rss.xml', type: 'rss', lang: 'en' }
  ],
  jp: [
    { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat1.xml', type: 'rss', lang: 'ja' },
    { name: 'Yahoo Japan', url: 'https://news.yahoo.co.jp/rss/politics.xml', type: 'rss', lang: 'ja' },
    { name: 'Sankei', url: 'https://sankei.com/rss/news.xml', type: 'rss', lang: 'ja' }
  ],
  kr: [
    { name: '联合新闻', url: 'https://www.yna.co.kr/rss/news.xml', type: 'rss', lang: 'ko' },
    { name: 'Korean Herald', url: 'http://www.koreaherald.com/rss.xml', type: 'rss', lang: 'ko' }
  ],
  de: [
    { name: 'Der Spiegel', url: 'https://www.spiegel.de/schlagzeilen/index.rss', type: 'rss', lang: 'de' },
    { name: 'Die Zeit', url: 'https://www.zeit.de/rss_feeds/aktuells', type: 'rss', lang: 'de' },
    { name: 'FAZ', url: 'https://www.faz.net/rss/aktuelles/', type: 'rss', lang: 'de' },
    { name: 'DW Germany', url: 'https://rss.dw.com/rdf/rss-de-all', type: 'rss', lang: 'de' },
    { name: 'Tagesschau', url: 'https://www.tagesschau.de/xml/rss2atom/', type: 'rss', lang: 'de' }
  ],
  fr: [
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', type: 'rss', lang: 'fr' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', type: 'rss', lang: 'fr' },
    { name: 'France24', url: 'https://www.france24.com/fr/rss', type: 'rss', lang: 'fr' },
    { name: 'DW France', url: 'https://rss.dw.com/rdf/rss-fr-all', type: 'rss', lang: 'fr' }
  ],
  ru: [
    { name: 'RT Russian', url: 'https://russian.rt.com/rss', type: 'rss', lang: 'ru' },
    { name: 'TASS', url: 'https://tass.ru/rss/v2.xml', type: 'rss', lang: 'ru' },
    { name: 'RIA Novosti', url: 'https://ria.ru/rss/', type: 'rss', lang: 'ru' }
  ],
  in: [
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', type: 'rss', lang: 'en' },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/rss/news/rssfeed.xml', type: 'rss', lang: 'en' },
    { name: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', type: 'rss', lang: 'en' }
  ],
  br: [
    { name: 'Folha', url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', type: 'rss', lang: 'pt' },
    { name: 'G1', url: 'https://g1.globo.com/rss/g1/', type: 'rss', lang: 'pt' },
    { name: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml', type: 'rss', lang: 'pt' }
  ],
  au: [
    { name: 'ABC News Australia', url: 'https://www.abc.net.au/news/feed/51120/rss.xml', type: 'rss', lang: 'en' },
    { name: 'CBC News', url: 'https://rss.cbc.ca/lineup/topstories.rss', type: 'rss', lang: 'en' }
  ],
  ca: [
    { name: 'CBC News', url: 'https://rss.cbc.ca/lineup/topstories.rss', type: 'rss', lang: 'en' },
    { name: 'Globe and Mail', url: 'https://www.theglobeandmail.com/rss/topstories/', type: 'rss', lang: 'en' }
  ],
  es: [
    { name: 'El Pais', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/portada/portada', type: 'rss', lang: 'es' },
    { name: 'ABC Spain', url: 'https://www.abc.es/rss/feeds/abcPortada.xml', type: 'rss', lang: 'es' },
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', type: 'rss', lang: 'es' }
  ],
  it: [
    { name: 'La Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', type: 'rss', lang: 'it' },
    { name: 'Corriere della Sera', url: 'https://xml2.corriereobjects.it/rss/primopiano.xml', type: 'rss', lang: 'it' },
    { name: 'ANSA', url: 'https://www.ansa.it/sito/ansait_rss.xml', type: 'rss', lang: 'it' }
  ],
  global: [
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'rss', lang: 'en' },
    { name: 'France24 English', url: 'https://www.france24.com/en/rss', type: 'rss', lang: 'en' },
    { name: 'Deutsche Welle English', url: 'https://rss.dw.com/rdf/rss-en-all', type: 'rss', lang: 'en' },
    { name: 'Euronews', url: 'https://feeds.euronews.com/rss', type: 'rss', lang: 'en' },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', type: 'rss', lang: 'en' },
    { name: 'CNN International', url: 'http://rss.cnn.com/rss/edition_world.rss', type: 'rss', lang: 'en' }
  ],
  sg: [
    { name: 'Channel News Asia', url: 'https://www.channelnewsasia.com/rssfeeds/8395882', type: 'rss', lang: 'en' },
    { name: 'The Straits Times', url: 'https://www.straitstimes.com/rssfeed', type: 'rss', lang: 'en' }
  ],
  za: [
    { name: 'Mail & Guardian', url: 'https://mg.co.za/feed/', type: 'rss', lang: 'en' },
    { name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', type: 'rss', lang: 'en' }
  ]
};

const COUNTRIES = [
  { code: 'cn', name: '中国', lang: 'zh', flag: '🇨🇳' },
  { code: 'us', name: '美国', lang: 'en', flag: '🇺🇸' },
  { code: 'gb', name: '英国', lang: 'en', flag: '🇬🇧' },
  { code: 'jp', name: '日本', lang: 'ja', flag: '🇯🇵' },
  { code: 'kr', name: '韩国', lang: 'ko', flag: '🇰🇷' },
  { code: 'de', name: '德国', lang: 'de', flag: '🇩🇪' },
  { code: 'fr', name: '法国', lang: 'fr', flag: '🇫🇷' },
  { code: 'ru', name: '俄罗斯', lang: 'ru', flag: '🇷🇺' },
  { code: 'in', name: '印度', lang: 'en', flag: '🇮🇳' },
  { code: 'br', name: '巴西', lang: 'pt', flag: '🇧🇷' },
  { code: 'au', name: '澳大利亚', lang: 'en', flag: '🇦🇺' },
  { code: 'ca', name: '加拿大', lang: 'en', flag: '🇨🇦' },
  { code: 'es', name: '西班牙', lang: 'es', flag: '🇪🇸' },
  { code: 'it', name: '意大利', lang: 'it', flag: '🇮🇹' },
  { code: 'global', name: '全球', lang: 'en', flag: '🌍' },
  { code: 'sg', name: '新加坡', lang: 'en', flag: '🇸🇬' },
  { code: 'za', name: '南非', lang: 'en', flag: '🇿🇦' }
];

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  const userAgent = getRandomUserAgent();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': userAgent,
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 20000,
        signal: AbortSignal.timeout(20000)
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || backoff * (attempt + 1);
        console.log(`  [限流] 等待 ${retryAfter}ms`);
        await sleep(parseInt(retryAfter));
        continue;
      }

      if (response.status === 403 || response.status === 451) {
        console.log(`  [禁止] 状态码 ${response.status}`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = backoff * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`  [重试] ${attempt + 1}/${retries} 等待 ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

async function fetchFromGNews(country, lang, max = 30) {
  if (!API_KEY) return [];
  
  const url = `${BASE_URL}/top-headlines?country=${country}&lang=${lang}&token=${API_KEY}&max=${max}`;
  console.log(`Fetching from GNews: ${country}...`);
  
  try {
    const response = await fetchWithRetry(url, {}, 2, 1500);
    if (!response) return [];
    
    const data = await response.json();
    if (data.errors) return [];
    
    return (data.articles || []).map(article => ({
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      url: article.url || '',
      image_url: article.image || '',
      published_at: article.publishedAt || '',
      source_name: article.source?.name || '',
      source_url: article.source?.url || '',
      country: country,
      category: '',
      language: lang
    }));
  } catch (error) {
    console.log(`GNews error: ${error.message}`);
    return [];
  }
}

function extractImageFromDescription(description) {
  if (!description) return '';
  
  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  const ogMatch = description.match(/og:image["']\s*content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1];
  }
  
  return '';
}

function extractImageFromItem(item) {
  const patterns = [
    /<media:content[^>]*url=["']([^"']+)["']/i,
    /<media:thumbnail[^>]*url=["']([^"']+)["']/i,
    /<enclosure[^>]*url=["']([^"']+\.(?:jpg|jpeg|png|gif|webp|svg)[^"']*)["'][^>]*type=["']image\//i,
    /<enclosure[^>]*type=["']image\/[^"']*["'][^>]*url=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i
  ];
  
  for (const pattern of patterns) {
    const match = item.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      if (url.startsWith('http')) {
        return url;
      }
    }
  }
  
  return '';
}

function parseRSS(xmlString, sourceName, country, lang) {
  const articles = [];
  
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlString)) !== null) {
    const item = match[1];
    
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>|<link>([\s\S]*?)<\/link>/i);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
    const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
    const published_at = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
    
    let image_url = extractImageFromItem(item);
    
    if (!image_url && description) {
      image_url = extractImageFromDescription(description);
    }
    
    if (title && link) {
      articles.push({
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        content: '',
        url: link,
        image_url,
        published_at,
        source_name: sourceName,
        source_url: '',
        country: country,
        category: '',
        language: lang
      });
    }
  }

  return articles;
}

export async function fetchRSSLive(url, sourceName, country, lang) {
  const sourceKey = `${sourceName}:${url}`;
  
  if (!isSourceHealthy(sourceKey)) {
    console.log(`  [跳过] ${sourceName} 健康检查未通过`);
    return [];
  }
  
  console.log(`  Fetching: ${sourceName}...`);
  
  try {
    const response = await fetchWithRetry(url, {}, 2, 2000);
    
    if (!response) {
      updateSourceHealth(sourceKey, false);
      return [];
    }
    
    const xml = await response.text();
    
    if (!xml || xml.length < 100 || xml.includes('<title>Access Denied</title>')) {
      updateSourceHealth(sourceKey, false);
      return [];
    }
    
    const articles = parseRSS(xml, sourceName, country, lang);
    updateSourceHealth(sourceKey, true, articles.length);
    
    console.log(`    -> ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.log(`    -> Error: ${error.message}`);
    updateSourceHealth(sourceKey, false);
    return [];
  }
}

async function crawlRSS(source, country) {
  const delay = getRandomDelay(800, 2000);
  await sleep(delay);
  return fetchRSSLive(source.url, source.name, country, source.lang || 'en');
}

export async function crawlCountry(country, lang, incremental = true) {
  console.log(`\n=== Crawling ${country} ===`);
  
  const articles = [];
  
  if (API_KEY) {
    const gnewsArticles = await fetchFromGNews(country, lang, 30);
    articles.push(...gnewsArticles);
    await sleep(getRandomDelay(1500, 3000));
  }
  
  const sources = NEWS_SOURCES[country] || [];
  if (sources.length === 0 && NEWS_SOURCES.global) {
    sources.push(...NEWS_SOURCES.global.slice(0, 5));
  }
  
  const shuffledSources = [...sources].sort(() => Math.random() - 0.5);
  
  for (const source of shuffledSources) {
    const sourceArticles = await crawlRSS(source, country);
    articles.push(...sourceArticles);
  }
  
  const uniqueArticles = articles.filter((article, index, self) => 
    index === self.findIndex(a => 
      a.url && a.url === a.url
    )
  );
  
  if (uniqueArticles.length > 0) {
    const added = insertMany(uniqueArticles);
    console.log(`Saved ${added} new articles for ${country}`);
  }
  
  return uniqueArticles.length;
}

export async function crawlAll(incremental = true) {
  console.log('=== Starting Global News Crawl ===\n');
  
  for (const { code, lang } of COUNTRIES) {
    await crawlCountry(code, lang, incremental);
    await sleep(getRandomDelay(2000, 4000));
  }
  
  console.log('\n=== Crawl Complete ===');
}

export function getSourceHealth() {
  return Object.fromEntries(sourceHealth);
}

export { NEWS_SOURCES, COUNTRIES };
