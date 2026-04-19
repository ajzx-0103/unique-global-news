import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const newsFile = path.join(dataDir, 'news.json');
const imagesDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

let newsData = {
  articles: [],
  lastUpdated: null
};

export function initDatabase() {
  if (fs.existsSync(newsFile)) {
    try {
      newsData = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    } catch (e) {
      newsData = { articles: [], lastUpdated: null };
    }
  }
  console.log(`Loaded ${newsData.articles.length} articles from database`);
  return newsData;
}

export function saveDatabase() {
  newsData.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(newsFile, JSON.stringify(newsData, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

export function insertNews(article) {
  const exists = newsData.articles.find(a => a.url === article.url);
  if (exists) {
    Object.assign(exists, article, { updated_at: new Date().toISOString() });
  } else {
    newsData.articles.unshift({
      ...article,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  saveDatabase();
}

export function insertMany(articles) {
  let added = 0;
  for (const article of articles) {
    if (!article.url && !article.title) continue;
    
    const exists = newsData.articles.find(a => 
      (a.url && a.url === article.url) || 
      (a.title && a.title === article.title)
    );
    if (!exists) {
      const id = generateId(article);
      newsData.articles.unshift({
        ...article,
        id: id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      added++;
    }
  }
  if (added > 0) {
    saveDatabase();
  }
  return added;
}

function generateId(article) {
  const str = (article.url || article.title || '') + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getNews({ country, language, limit = 50, offset = 0 }) {
  let filtered = newsData.articles;
  
  if (country) {
    filtered = filtered.filter(a => a.country === country);
  }
  
  if (language) {
    filtered = filtered.filter(a => a.language === language);
  }
  
  filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  
  return filtered.slice(offset, offset + limit);
}

export function searchNews({ query, country, limit = 50, offset = 0, translations = [] }) {
  const allQueries = [query.toLowerCase(), ...translations.map(t => t.toLowerCase())];
  
  let filtered = newsData.articles.filter(a => {
    const title = a.title?.toLowerCase() || '';
    const description = a.description?.toLowerCase() || '';
    const content = a.content?.toLowerCase() || '';
    
    return allQueries.some(q => 
      title.includes(q) || description.includes(q) || content.includes(q)
    );
  });
  
  if (country) {
    filtered = filtered.filter(a => a.country === country);
  }
  
  filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  
  return filtered.slice(offset, offset + limit);
}

export function getNewsCount({ country, language }) {
  let filtered = newsData.articles;
  
  if (country) {
    filtered = filtered.filter(a => a.country === country);
  }
  
  if (language) {
    filtered = filtered.filter(a => a.language === language);
  }
  
  return filtered.length;
}

export function getCountries() {
  const counts = {};
  for (const article of newsData.articles) {
    counts[article.country] = (counts[article.country] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

export function updateLocalImagePath(url, localPath) {
  for (const article of newsData.articles) {
    if (article.image_url === url) {
      article.local_image_path = localPath;
    }
  }
  saveDatabase();
}

export function getStats() {
  return {
    totalArticles: newsData.articles.length,
    countriesCount: getCountries().length,
    lastUpdated: newsData.lastUpdated
  };
}

export { newsData, imagesDir };
