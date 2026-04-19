import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  }
});

const NEWS_SOURCES = [
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', country: 'us' },
  { name: 'France24', url: 'https://www.france24.com/fr/rss', country: 'fr' },
  { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', country: 'jp' },
  { name: 'Mexico News Daily', url: 'https://mexiconewsdaily.com/feed/', country: 'mx' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', country: 'world' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', country: 'world' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', country: 'us' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', country: 'us' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', country: 'us' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', country: 'world' },
  { name: 'BBC News Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', country: 'world' },
  { name: 'BBC News Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', country: 'world' },
  { name: 'BBC News Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', country: 'world' },
  { name: 'Reddit WorldNews', url: 'https://www.reddit.com/r/worldnews/.rss', country: 'world' },
  { name: 'Reddit News', url: 'https://www.reddit.com/r/news/.rss', country: 'us' },
  { name: 'Reddit Technology', url: 'https://www.reddit.com/r/technology/.rss', country: 'world' },
  { name: 'Reddit Science', url: 'https://www.reddit.com/r/science/.rss', country: 'world' },
  { name: 'Vice News', url: 'https://www.vice.com/rss', country: 'world' },
  { name: 'Buzzfeed News', url: 'https://www.buzzfeednews.com/feed', country: 'us' },
  { name: 'Vox', url: 'https://www.vox.com/rss/index.xml', country: 'us' },
  { name: 'Axios', url: 'https://api.axios.com/feed', country: 'us' },
  { name: ' Politico', url: 'https://www.politico.com/rss.xml', country: 'us' },
  { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories/rss', country: 'us' },
  { name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/main', country: 'us' },
  { name: 'NBC News', url: 'https://feeds.nbcnews.com/feeds/topnews', country: 'us' },
  { name: 'Fox News', url: 'https://moxie.foxnews.com/google-publisher/latest.xml', country: 'us' },
  { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', country: 'us' },
  { name: 'Forbes', url: 'https://www.forbes.com/news/feed/', country: 'us' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', country: 'us' },
  { name: 'Time', url: 'https://time.com/feed/', country: 'us' },
  { name: 'Scientific American', url: 'https://www.scientificamerican.com/feed/', country: 'us' },
  { name: 'Nature News', url: 'https://www.nature.com/nature.rss', country: 'world' },
  { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home/', country: 'world' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', country: 'us' },
  { name: 'PC Magazine', url: 'https://feeds.pcmag.com/', country: 'us' },
  { name: 'Wired Science', url: 'https://www.wired.com/feed/category/science/latest/rss', country: 'world' },
  { name: 'InfoWorld', url: 'https://www.infoworld.com/news/feed', country: 'world' },
  { name: 'InfoQ', url: 'https://feed.infoq.com/', country: 'world' },
  { name: 'DevOps', url: 'https://devops.com/feed/', country: 'world' },
];

function extractImage(item) {
  let image = null;
  
  try {
    if (item.enclosure && item.enclosure.url) {
      const url = item.enclosure.url;
      if (url && url.startsWith('http')) {
        if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) || !url.includes('video')) {
          image = url;
        }
      }
    }
    
    if (!image && item['media:content']) {
      const mc = item['media:content'];
      if (Array.isArray(mc)) {
        for (const m of mc) {
          if (m.$ && m.$.url && m.$.medium === 'image') {
            image = m.$.url;
            break;
          }
        }
      } else if (mc.$ && mc.$.url) {
        image = mc.$.url;
      }
    }
    
    if (!image && item['media:thumbnail']) {
      const mt = item['media:thumbnail'];
      if (Array.isArray(mt)) {
        for (const t of mt) {
          if (t.$ && t.$.url) { image = t.$.url; break; }
        }
      } else if (mt.$ && mt.$.url) {
        image = mt.$.url;
      }
    }
    
    if (!image && item['content:encoded']) {
      const ce = item['content:encoded'];
      if (typeof ce === 'string') {
        const match = ce.match(/<img[^>]+src=["']([^"']+)["']/);
        if (match) image = match[1];
      }
    }
    
    if (!image) {
      for (const field of [item.content, item.description]) {
        if (field && typeof field === 'string') {
          const match = field.match(/<img[^>]+src=["']([^"']+)["']/);
          if (match) { image = match[1]; break; }
        }
      }
    }
    
    if (image) {
      if (typeof image === 'string') {
        if (image.startsWith('//')) image = 'https:' + image;
        if (image.includes('logo') || image.includes('icon') || image.includes('1x1')) {
          image = null;
        }
      } else {
        image = null;
      }
    }
  } catch (_err) { void _err; }
  
  return image;
}

function generatePlaceholderImage(title, source) {
  const seed = (title + source).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `https://picsum.photos/seed/${Math.abs(seed) % 1000}/600/400`;
}

async function fetchSource(source) {
  try {
    console.log(`Fetching: ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    return feed.items.map((item, idx) => {
      const image = extractImage(item) || generatePlaceholderImage(item.title || '', source.name);
      
      let pubDate = null;
      if (item.pubDate) pubDate = new Date(item.pubDate).toISOString();
      else if (item.isoDate) pubDate = new Date(item.isoDate).toISOString();
      
      return {
        id: `${source.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${idx}`,
        title: item.title?.replace(/<[^>]*>/g, '').trim() || '',
        description: item.contentSnippet?.slice(0, 500) || '',
        content: item.content || item['content:encoded'] || '',
        url: item.link || '',
        publishedAt: pubDate,
        source: source.name,
        country: source.country,
        image: image,
        fetchedAt: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error(`Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

async function crawlAllNews() {
  console.log('=== Global News Crawler ===');
  console.log(`Sources: ${NEWS_SOURCES.length}`);
  
  const allArticles = [];
  const errors = [];
  
  for (const source of NEWS_SOURCES) {
    const articles = await fetchSource(source);
    if (articles.length > 0) {
      allArticles.push(...articles);
      console.log(`  OK ${source.name}: ${articles.length} articles`);
    } else {
      errors.push(source.name);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  allArticles.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  
  const stats = {
    total: allArticles.length,
    sources: NEWS_SOURCES.length,
    successCount: NEWS_SOURCES.length - errors.length,
    failedSources: errors,
    fetchedAt: new Date().toISOString()
  };
  
  const data = { articles: allArticles, stats };
  
  const filePath = path.join(DATA_DIR, 'news.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`\n=== Done ===`);
  console.log(`Articles: ${allArticles.length}`);
  console.log(`Success: ${NEWS_SOURCES.length - errors.length}/${NEWS_SOURCES.length}`);
  console.log(`Saved: ${filePath}`);
  
  return data;
}

crawlAllNews().catch(console.error);

export { crawlAllNews, NEWS_SOURCES };
