import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
});

const FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC News' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
  
  { url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', name: 'BBC中文' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' },
  { url: 'https://www.france24.com/en/rss', name: 'France 24' },
  { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR' },
  { url: 'https://www.reutersagency.com/feed/', name: 'Reuters' }
];

const TRANSLATION_API = 'https://api.mymemory.translated.net/get';

function detectLanguage(text) {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  return 'en';
}

async function translateText(text, fromLang, toLang) {
  if (!text || text.length > 80) return text;
  try {
    const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
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

function extractImage(item) {
  try {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.$) return item['media:content'].$.url;
    if (item['media:thumbnail']?.$) return item['media:thumbnail'].$.url;
    const match = (item.content || item.description || '').match(/<img[^>]+src=["']([^"']+)["']/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return (feed.items || []).slice(0, 30).map((item, idx) => {
      const image = extractImage(item) || `https://picsum.photos/seed/${hashCode(item.link || String(idx))}/400/300`;
      let pubDate = new Date().toISOString();
      if (item.pubDate) pubDate = new Date(item.pubDate).toISOString();
      else if (item.isoDate) pubDate = new Date(item.isoDate).toISOString();
      
      return {
        id: hashCode(item.link || item.title || String(idx)),
        title: item.title || '',
        description: (item.contentSnippet || item.content || '').substring(0, 200),
        url: item.link || '',
        image_url: image,
        published_at: pubDate,
        source_name: feedConfig.name,
        urlToImage: image
      };
    });
  } catch {
    return [];
  }
}

async function fetchAllFeeds() {
  const articles = [];
  const promises = FEEDS.map(feed => fetchFeed(feed));
  const results = await Promise.allSettled(promises);
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      articles.push(...result.value);
    }
  }
  
  articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  return articles;
}

async function searchArticles(articles, query) {
  const lang = detectLanguage(query);
  const terms = [query.toLowerCase()];
  
  if (lang !== 'en') {
    const en = await translateText(query, lang, 'en');
    if (en && en !== query) terms.push(en.toLowerCase());
  }
  
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scored = articles.map(article => {
    const title = (article.title || '').toLowerCase();
    const desc = (article.description || '').toLowerCase();
    let score = 0;
    
    for (const term of terms) {
      if (title.includes(term)) {
        score += 10;
        if (title.startsWith(term)) score += 5;
      }
      if (desc.includes(term)) score += 3;
    }
    
    for (const word of words) {
      if (title.includes(word)) score += 2;
      if (desc.includes(word)) score += 1;
    }
    
    return { article, score };
  });
  
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.article.published_at) - new Date(a.article.published_at);
  });
  
  const matched = scored.filter(s => s.score > 0).map(s => s.article);
  
  if (matched.length > 0) {
    return matched;
  }
  
  return articles.slice(0, 50);
}

function filterByDate(articles, dateStr) {
  if (!dateStr) return articles;
  
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const next = new Date(target);
  next.setDate(next.getDate() + 1);
  
  const filtered = articles.filter(a => {
    const d = new Date(a.published_at);
    return d >= target && d < next;
  });
  
  return filtered.length > 0 ? filtered : articles.slice(0, 100);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q = '', limit = 50, date = '' } = req.query;
    
    let articles = await fetchAllFeeds();
    
    if (q && q.trim()) {
      articles = await searchArticles(articles, q.trim());
    }
    
    if (date) {
      articles = filterByDate(articles, date);
    }
    
    const result = articles.slice(0, parseInt(limit));
    
    return res.json({
      articles: result,
      total: articles.length,
      hasMore: articles.length > parseInt(limit),
      mode: q ? 'search' : date ? 'date' : 'default'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message, articles: [] });
  }
}
