import fetch from 'node-fetch';
import { insertMany, getStats } from './database.js';
import { downloadImage } from './downloader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const API_KEY = process.env.GNEWS_API_KEY;

if (!API_KEY) {
  console.error('请设置 GNEWS_API_KEY 环境变量');
  console.error('获取免费API Key: https://gnews.io');
  process.exit(1);
}

const BASE_URL = 'https://gnews.io/api/v4';

const COUNTRIES = [
  { code: 'cn', name: '中国', lang: 'zh' },
  { code: 'us', name: '美国', lang: 'en' },
  { code: 'gb', name: '英国', lang: 'en' },
  { code: 'jp', name: '日本', lang: 'ja' },
  { code: 'kr', name: '韩国', lang: 'ko' },
  { code: 'de', name: '德国', lang: 'de' },
  { code: 'fr', name: '法国', lang: 'fr' },
  { code: 'ru', name: '俄罗斯', lang: 'ru' },
  { code: 'in', name: '印度', lang: 'en' },
  { code: 'br', name: '巴西', lang: 'pt' },
  { code: 'au', name: '澳大利亚', lang: 'en' },
  { code: 'ca', name: '加拿大', lang: 'en' },
  { code: 'es', name: '西班牙', lang: 'es' },
  { code: 'it', name: '意大利', lang: 'it' },
  { code: 'mx', name: '墨西哥', lang: 'es' },
  { code: 'id', name: '印度尼西亚', lang: 'id' },
  { code: 'tr', name: '土耳其', lang: 'tr' },
  { code: 'sa', name: '沙特阿拉伯', lang: 'ar' },
  { code: 'th', name: '泰国', lang: 'th' },
  { code: 'vn', name: '越南', lang: 'vi' },
  { code: 'ph', name: '菲律宾', lang: 'en' },
  { code: 'my', name: '马来西亚', lang: 'en' },
  { code: 'sg', name: '新加坡', lang: 'en' },
  { code: 'ae', name: '阿联酋', lang: 'ar' },
  { code: 'eg', name: '埃及', lang: 'ar' },
  { code: 'za', name: '南非', lang: 'en' },
  { code: 'ng', name: '尼日利亚', lang: 'en' },
  { code: 'ar', name: '阿根廷', lang: 'es' },
  { code: 'co', name: '哥伦比亚', lang: 'es' },
  { code: 'nl', name: '荷兰', lang: 'nl' },
  { code: 'be', name: '比利时', lang: 'nl' },
  { code: 'ch', name: '瑞士', lang: 'de' },
  { code: 'at', name: '奥地利', lang: 'de' },
  { code: 'pl', name: '波兰', lang: 'pl' },
  { code: 'se', name: '瑞典', lang: 'sv' },
  { code: 'no', name: '挪威', lang: 'no' },
  { code: 'dk', name: '丹麦', lang: 'da' },
  { code: 'fi', name: '芬兰', lang: 'fi' },
  { code: 'gr', name: '希腊', lang: 'el' },
  { code: 'pt', name: '葡萄牙', lang: 'pt' },
  { code: 'il', name: '以色列', lang: 'he' },
  { code: 'pk', name: '巴基斯坦', lang: 'en' },
  { code: 'bd', name: '孟加拉', lang: 'bn' }
];

const CATEGORIES = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

async function fetchTopHeadlines(country, lang, max = 50) {
  const url = `${BASE_URL}/top-headlines?country=${country}&lang=${lang}&token=${API_KEY}&max=${max}`;
  console.log(`Fetching ${country} headlines...`);
  
  try {
    const response = await fetch(url, { timeout: 15000 });
    const data = await response.json();
    
    if (data.errors) {
      console.log(`  Error: ${data.errors[0]}`);
      return [];
    }
    
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
    console.log(`  Failed: ${error.message}`);
    return [];
  }
}

async function fetchSearchResults(query, lang, country, max = 50) {
  let url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&lang=${lang}&token=${API_KEY}&max=${max}`;
  if (country) url += `&country=${country}`;
  
  console.log(`Searching "${query}" for ${country || 'global'}...`);
  
  try {
    const response = await fetch(url, { timeout: 15000 });
    const data = await response.json();
    
    if (data.errors) {
      console.log(`  Error: ${data.errors[0]}`);
      return [];
    }
    
    return (data.articles || []).map(article => ({
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      url: article.url || '',
      image_url: article.image || '',
      published_at: article.publishedAt || '',
      source_name: article.source?.name || '',
      source_url: article.source?.url || '',
      country: country || 'global',
      category: '',
      language: lang
    }));
  } catch (error) {
    console.log(`  Failed: ${error.message}`);
    return [];
  }
}

async function crawlCountry(country, lang) {
  console.log(`\n=== Crawling ${country} (${lang}) ===`);
  
  let articles = await fetchTopHeadlines(country, lang, 50);
  
  if (articles.length < 20) {
    const searchTerms = ['world news', 'breaking news', 'latest news'];
    for (const term of searchTerms) {
      const results = await fetchSearchResults(term, lang, country, 30);
      articles.push(...results);
      await sleep(500);
    }
  }
  
  const uniqueArticles = articles.filter((a, i, arr) => 
    arr.findIndex(x => x.url === a.url) === i
  );
  
  if (uniqueArticles.length > 0) {
    const added = insertMany(uniqueArticles);
    console.log(`Added ${added} new articles`);
    
    const withImages = uniqueArticles.filter(a => a.image_url).slice(0, 10);
    for (const article of withImages) {
      await downloadImage(article.image_url, article.title);
      await sleep(300);
    }
  }
  
  return uniqueArticles.length;
}

async function crawlAll() {
  console.log('=== Starting Global News Crawl with GNews API ===\n');
  
  let total = 0;
  
  for (const country of COUNTRIES) {
    const count = await crawlCountry(country.code, country.lang);
    total += count;
    await sleep(1000);
  }
  
  console.log(`\n=== Complete! Total: ${total} articles ===`);
  console.log(getStats());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (process.argv[1]?.includes('gnews')) {
  crawlAll().catch(console.error);
}

export { crawlAll, crawlCountry, fetchTopHeadlines, fetchSearchResults };
