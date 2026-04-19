import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'news.json');

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

function loadNewsData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading news data:', e.message);
  }
  return { articles: [], stats: { fetchedAt: null } };
}

function filterByCountry(articles, country) {
  if (!country || country === 'all') return articles;
  
  const filtered = articles.filter(a => a.country === country);
  if (filtered.length > 0) return filtered;
  
  const fallbackOrder = ['world', 'us', 'mx', 'jp'];
  
  for (const fallback of fallbackOrder) {
    const fallbackArticles = articles.filter(a => a.country === fallback);
    if (fallbackArticles.length > 0) return fallbackArticles;
  }
  
  return articles.slice(0, 20);
}

function searchArticles(articles, query) {
  if (!query) return articles;
  const q = query.toLowerCase();
  return articles.filter(a => 
    a.title?.toLowerCase().includes(q) ||
    a.description?.toLowerCase().includes(q) ||
    a.source?.toLowerCase().includes(q)
  );
}

app.get('/api/news', (req, res) => {
  try {
    const { country, q, max = 100 } = req.query;
    const data = loadNewsData();
    
    let articles = [...data.articles];
    
    if (country && country !== 'world') {
      articles = filterByCountry(articles, country);
    }
    
    if (q) {
      articles = searchArticles(articles, q);
    }
    
    articles = articles.slice(0, parseInt(max));
    
    res.json({
      articles,
      meta: {
        total: data.articles.length,
        filtered: articles.length,
        lastUpdated: data.stats?.fetchedAt,
        source: 'local'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  const data = loadNewsData();
  res.json(data.stats);
});

app.get('/api/countries', (req, res) => {
  const data = loadNewsData();
  const countryCounts = {};
  
  data.articles.forEach(a => {
    const c = a.country || 'world';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  
  res.json({
    counts: countryCounts,
    lastUpdated: data.stats?.fetchedAt
  });
});

app.post('/api/crawl', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    console.log('Starting crawler...');
    execSync('node crawler.js', { cwd: __dirname, stdio: 'inherit' });
    res.json({ success: true, message: 'Crawl completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
  
  const data = loadNewsData();
  if (data.articles.length > 0) {
    console.log(`Loaded ${data.articles.length} articles (last updated: ${data.stats?.fetchedAt})`);
  } else {
    console.log('No data found. Run "node crawler.js" to fetch news.');
  }
});
