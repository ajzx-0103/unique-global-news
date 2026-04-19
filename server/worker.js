const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_DURATION = 5 * 60 * 1000;

const NEWS_SOURCES = {
  cn: [
    { name: 'BBC中文', url: 'https://www.bbc.com/zhongwen/simp/rss.xml', lang: 'zh' },
    { name: '德国之声中文', url: 'https://rss.dw.com/rdf/rss-zh-all', lang: 'zh' },
    { name: '联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/china', lang: 'zh' }
  ],
  us: [
    { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', lang: 'en' },
    { name: 'Yahoo News', url: 'https://news.yahoo.com/rss/', lang: 'en' },
    
  ],
  gb: [
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', lang: 'en' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', lang: 'en' }
  ],
  jp: [
    { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat1.xml', lang: 'ja' },
    { name: 'Yahoo Japan', url: 'https://news.yahoo.co.jp/rss/politics.xml', lang: 'ja' }
  ],
  de: [
    { name: 'Der Spiegel', url: 'https://www.spiegel.de/schlagzeilen/index.rss', lang: 'de' },
    { name: 'Die Zeit', url: 'https://www.zeit.de/rss_feeds/aktuells', lang: 'de' }
  ],
  fr: [
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', lang: 'fr' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', lang: 'fr' }
  ],
  global: [
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en' },
    { name: 'France24 English', url: 'https://www.france24.com/en/rss', lang: 'en' },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' }
  ]
};

const COUNTRIES = [
  { code: 'cn', name: '中国', lang: 'zh', flag: '🇨🇳' },
  { code: 'us', name: '美国', lang: 'en', flag: '🇺🇸' },
  { code: 'gb', name: '英国', lang: 'en', flag: '🇬🇧' },
  { code: 'jp', name: '日本', lang: 'ja', flag: '🇯🇵' },
  { code: 'de', name: '德国', lang: 'de', flag: '🇩🇪' },
  { code: 'fr', name: '法国', lang: 'fr', flag: '🇫🇷' },
  { code: 'global', name: '全球', lang: 'en', flag: '🌍' }
];

let newsCache = null;
let cacheTimestamp = 0;

async function getNewsFromKV() {
  if (newsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return newsCache;
  }
  
  try {
    const data = await NEWS_DB.get('news', 'json');
    newsCache = data || { articles: [], lastUpdated: null };
    cacheTimestamp = Date.now();
    return newsCache;
  } catch (e) {
    return { articles: [], lastUpdated: null };
  }
}

async function saveNewsToKV(data) {
  try {
    await NEWS_DB.put('news', JSON.stringify(data));
    newsCache = data;
    cacheTimestamp = Date.now();
  } catch (e) {
    console.error('Failed to save to KV:', e);
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function parseRSS(xml, sourceName, country, lang) {
  const articles = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
    const link = linkMatch ? (linkMatch[1] || '').trim() : '';
    let description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
    const published_at = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
    
    const imgMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                     item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                     item.match(/<enclosure[^>]*url=["']([^"']+\.(?:jpg|jpeg|png)[^"']*)["']/i);
    const image_url = imgMatch ? imgMatch[1] : '';
    
    if (title && link) {
      articles.push({
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        url: link,
        image_url,
        published_at,
        source_name: sourceName,
        country,
        language: lang,
        id: hashCode(link || title)
      });
    }
  }
  
  return articles;
}

async function fetchRSS(url, sourceName, country, lang) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-Workers)',
        'Accept': 'application/rss+xml, application/xml, */*'
      }
    });
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    return parseRSS(xml, sourceName, country, lang);
  } catch (e) {
    return [];
  }
}

async function crawlNews(country = null) {
  const countries = country ? [{ code: country }] : Object.keys(NEWS_SOURCES).map(code => ({ code }));
  const allArticles = [];
  
  for (const { code } of countries) {
    const sources = NEWS_SOURCES[code] || NEWS_SOURCES.global || [];
    for (const source of sources) {
      const articles = await fetchRSS(source.url, source.name, code, source.lang);
      allArticles.push(...articles);
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  const uniqueArticles = [];
  const seen = new Set();
  for (const article of allArticles) {
    const key = article.url || article.title;
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueArticles.push(article);
    }
  }
  
  uniqueArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  
  const existing = await getNewsFromKV();
  const existingUrls = new Set(existing.articles.map(a => a.url));
  
  const newArticles = uniqueArticles.filter(a => !existingUrls.has(a.url));
  
  return {
    articles: [...newArticles, ...existing.articles].slice(0, 1000),
    lastUpdated: new Date().toISOString()
  };
}

async function handleAPI(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === '/api/news' && request.method === 'GET') {
    const { country, lang, limit = 50, offset = 0 } = Object.fromEntries(url.searchParams);
    const data = await getNewsFromKV();
    
    let articles = data.articles;
    if (country) articles = articles.filter(a => a.country === country);
    if (lang) articles = articles.filter(a => a.language === lang);
    
    articles = articles.slice(Number(offset), Number(offset) + Number(limit));
    
    const result = articles.map(article => ({
      ...article,
      urlToImage: article.image_url || `https://picsum.photos/seed/${article.id}/400/300`
    }));
    
    return new Response(JSON.stringify({ articles: result, total: data.articles.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  if (path === '/api/countries' && request.method === 'GET') {
    const data = await getNewsFromKV();
    const counts = {};
    
    for (const article of data.articles) {
      counts[article.country] = (counts[article.country] || 0) + 1;
    }
    
    const result = COUNTRIES.map(c => ({
      ...c,
      count: counts[c.code] || 0
    }));
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  if (path === '/api/stats' && request.method === 'GET') {
    const data = await getNewsFromKV();
    const counts = {};
    
    for (const article of data.articles) {
      counts[article.country] = (counts[article.country] || 0) + 1;
    }
    
    return new Response(JSON.stringify({
      totalArticles: data.articles.length,
      countriesCount: Object.keys(counts).length,
      lastUpdated: data.lastUpdated
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  if (path === '/api/crawl' && (request.method === 'POST' || request.method === 'GET')) {
    const body = await request.json().catch(() => ({}));
    const newData = await crawlNews(body.country);
    await saveNewsToKV(newData);
    
    return new Response(JSON.stringify({ success: true, articlesAdded: newData.articles.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (request.url.includes('/api/')) {
      return handleAPI(request);
    }
    
    return new Response('Global News API - POST /api/crawl to refresh news', {
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
  },
  
  async scheduled(event, env, ctx) {
    const newData = await crawlNews();
    await saveNewsToKV(newData);
    console.log(`Crawl complete: ${newData.articles.length} articles`);
  }
};
