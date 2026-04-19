export const config = {
  runtime: 'nodejs'
};

import Parser from 'rss-parser';
import { translateQuery, detectLanguage } from '../../api/translator.js';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Global-News/1.0 (Vercel Serverless)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
      ['media:group', 'media:group']
    ]
  }
});

const COUNTRY_FEEDS = {
  cn: [
    { url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', sourceName: 'BBC中文' },
    { url: 'https://rss.dw.com/rdf/rss-zh-all', sourceName: '德国之声' },
    { url: 'https://www.zaobao.com.sg/rss/realtime/china', sourceName: '联合早报' }
  ],
  us: [
    { url: 'https://feeds.npr.org/1001/rss.xml', sourceName: 'NPR News' },
    { url: 'https://news.yahoo.com/rss/', sourceName: 'Yahoo News' },
    { url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', sourceName: 'Google News' },
    
  ],
  gb: [
    { url: 'https://www.theguardian.com/world/rss', sourceName: 'The Guardian' },
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', sourceName: 'BBC News' },
    { url: 'https://feeds.skynews.com/feeds/rss/home-page.xml', sourceName: 'Sky News' }
  ],
  jp: [
    { url: 'https://www3.nhk.or.jp/rss/news/cat1.xml', sourceName: 'NHK World' },
    { url: 'https://news.yahoo.co.jp/rss/politics.xml', sourceName: 'Yahoo Japan' },
    { url: 'https://www.bbc.com/japanese/rss.xml', sourceName: 'BBC Japan' }
  ],
  kr: [
    { url: 'https://www.yna.co.kr/rss/news.xml', sourceName: '联合新闻' },
    { url: 'http://www.koreaherald.com/rss.xml', sourceName: 'Korean Herald' }
  ],
  de: [
    { url: 'https://www.spiegel.de/schlagzeilen/index.rss', sourceName: 'Der Spiegel' },
    { url: 'https://www.zeit.de/rss_feeds/aktuells', sourceName: 'Die Zeit' },
    { url: 'https://rss.dw.com/rdf/rss-de-all', sourceName: 'DW Germany' }
  ],
  fr: [
    { url: 'https://www.lemonde.fr/rss/une.xml', sourceName: 'Le Monde' },
    { url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', sourceName: 'Le Figaro' },
    { url: 'https://www.france24.com/fr/rss', sourceName: 'France24' }
  ],
  ru: [
    { url: 'https://russian.rt.com/rss', sourceName: 'RT Russian' },
    { url: 'https://tass.ru/rss/v2.xml', sourceName: 'TASS' },
    { url: 'https://lenta.ru/rss', sourceName: 'Lenta.ru' }
  ],
  in: [
    { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', sourceName: 'Times of India' },
    { url: 'https://www.hindustantimes.com/rss/news/rssfeed.xml', sourceName: 'Hindustan Times' },
    { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', sourceName: 'NDTV' }
  ],
  br: [
    { url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', sourceName: 'Folha' },
    { url: 'https://g1.globo.com/rss/g1/', sourceName: 'G1' },
    { url: 'https://rss.uol.com.br/feed/noticias.xml', sourceName: 'UOL' }
  ],
  au: [
    { url: 'https://www.abc.net.au/news/feed/51120/rss.xml', sourceName: 'ABC News Australia' },
    { url: 'https://feeds.bbci.co.uk/news/world/australia/rss.xml', sourceName: 'BBC Australia' }
  ],
  ca: [
    { url: 'https://rss.cbc.ca/lineup/topstories.rss', sourceName: 'CBC News' },
    { url: 'https://www.theglobeandmail.com/rss/topstories/', sourceName: 'Globe and Mail' }
  ],
  es: [
    { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/portada/portada', sourceName: 'El Pais' },
    { url: 'https://e00-marca.uecdn.es/rss/portada.xml', sourceName: 'Marca' }
  ],
  it: [
    { url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', sourceName: 'La Repubblica' },
    { url: 'https://www.ansa.it/sito/ansait_rss.xml', sourceName: 'ANSA' }
  ],
  global: [
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', sourceName: 'Al Jazeera' },
    { url: 'https://www.france24.com/en/rss', sourceName: 'France24' },
    { url: 'https://rss.dw.com/rdf/rss-en-all', sourceName: 'Deutsche Welle' },
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceName: 'BBC World' },
    { url: 'http://rss.cnn.com/rss/edition_world.rss', sourceName: 'CNN International' }
  ]
};

const COUNTRY_KEYWORDS = {
  cn: ['China', 'Chinese', 'Beijing', 'Shanghai'],
  us: ['United States', 'America', 'Washington', 'Biden', 'Trump'],
  gb: ['United Kingdom', 'Britain', 'London', 'British', 'UK'],
  jp: ['Japan', 'Tokyo', 'Japanese'],
  kr: ['South Korea', 'Korea', 'Seoul', 'Korean', 'Pyongyang', 'North Korea'],
  de: ['Germany', 'Berlin', 'German', 'Merkel', 'Scholz'],
  fr: ['France', 'Paris', 'French', 'Macron'],
  ru: ['Russia', 'Moscow', 'Russian', 'Putin', 'Kremlin'],
  in: ['India', 'New Delhi', 'Indian', 'Modi', 'Delhi'],
  br: ['Brazil', 'Brasilia', 'Brazilian', 'Bolsonaro', 'Lula'],
  au: ['Australia', 'Sydney', 'Melbourne', 'Australian'],
  ca: ['Canada', 'Ottawa', 'Toronto', 'Canadian', 'Trudeau'],
  es: ['Spain', 'Madrid', 'Spanish', 'Barcelona'],
  it: ['Italy', 'Rome', 'Italian', 'Rome', 'Milan'],
  nl: ['Netherlands', 'Amsterdam', 'Dutch', 'Holland'],
  pl: ['Poland', 'Warsaw', 'Polish', 'Poland'],
  se: ['Sweden', 'Stockholm', 'Swedish', 'Sweden'],
  no: ['Norway', 'Oslo', 'Norwegian', 'Norway'],
  ch: ['Switzerland', 'Swiss', 'Zurich', 'Geneva'],
  at: ['Austria', 'Vienna', 'Austrian'],
  be: ['Belgium', 'Brussels', 'Belgian'],
  ie: ['Ireland', 'Dublin', 'Irish'],
  pt: ['Portugal', 'Lisbon', 'Portuguese'],
  gr: ['Greece', 'Athens', 'Greek'],
  tr: ['Turkey', 'Ankara', 'Istanbul', 'Turkish', 'Erdogan'],
  sa: ['Saudi Arabia', 'Riyadh', 'Saudi', 'Arabian'],
  ae: ['UAE', 'Dubai', 'Abu Dhabi', 'Emirates'],
  il: ['Israel', 'Jerusalem', 'Tel Aviv', 'Israeli', 'Netanyahu'],
  eg: ['Egypt', 'Cairo', 'Egyptian'],
  za: ['South Africa', 'Johannesburg', 'South African', 'Pretoria'],
  ng: ['Nigeria', 'Lagos', 'Nigerian', 'Abuja'],
  mx: ['Mexico', 'Mexico City', 'Mexican'],
  ar: ['Argentina', 'Buenos Aires', 'Argentine', 'Messi'],
  co: ['Colombia', 'Bogota', 'Colombian'],
  cl: ['Chile', 'Santiago', 'Chilean'],
  pe: ['Peru', 'Lima', 'Peruvian'],
  th: ['Thailand', 'Bangkok', 'Thai'],
  vn: ['Vietnam', 'Hanoi', 'Vietnamese', 'Saigon'],
  id: ['Indonesia', 'Jakarta', 'Indonesian'],
  my: ['Malaysia', 'Kuala Lumpur', 'Malaysian'],
  ph: ['Philippines', 'Manila', 'Filipino', 'Philippine'],
  sg: ['Singapore', 'Singaporean'],
  nz: ['New Zealand', 'Wellington', 'Auckland', 'Zealand'],
  pk: ['Pakistan', 'Islamabad', 'Pakistani', 'Karachi'],
  bd: ['Bangladesh', 'Dhaka', 'Bangladeshi']
};

const COUNTRY_CODE_MAP = {
  china: 'cn', chinese: 'cn',
  japan: 'jp', japanese: 'jp',
  korea: 'kr', korean: 'kr', southkorea: 'kr',
  usa: 'us', america: 'us', american: 'us', unitedstates: 'us',
  uk: 'gb', britain: 'gb', british: 'gb', unitedkingdom: 'gb',
  germany: 'de', german: 'de',
  france: 'fr', french: 'fr',
  russia: 'ru', russian: 'ru',
  india: 'in', indian: 'in',
  brazil: 'br', brazilian: 'br',
  australia: 'au', australian: 'au',
  canada: 'ca', canadian: 'ca',
  spain: 'es', spanish: 'es',
  italy: 'it', italian: 'it',
  netherlands: 'nl', dutch: 'nl', holland: 'nl',
  poland: 'pl', polish: 'pl',
  sweden: 'se', swedish: 'se',
  norway: 'no', norwegian: 'no',
  switzerland: 'ch', swiss: 'ch',
  austria: 'at', austrian: 'at',
  belgium: 'be', belgian: 'be',
  turkey: 'tr', turkish: 'tr',
  saudiarabia: 'sa', saudi: 'sa', arabian: 'sa',
  uae: 'ae', emirates: 'ae',
  israel: 'il', israeli: 'il',
  egypt: 'eg', egyptian: 'eg',
  southafrica: 'za', african: 'za',
  nigeria: 'ng', nigerian: 'ng',
  mexico: 'mx', mexican: 'mx',
  argentina: 'ar', argentine: 'ar',
  thailand: 'th', thai: 'th',
  vietnam: 'vn', vietnamese: 'vn',
  indonesia: 'id', indonesian: 'id',
  malaysia: 'my', malaysian: 'my',
  philippines: 'ph', filipino: 'ph',
  singapore: 'sg', singaporean: 'sg',
  newzealand: 'nz', zealand: 'nz',
  pakistan: 'pk', pakistani: 'pk',
  bangladesh: 'bd', bangladeshi: 'bd',
  colombia: 'co', colombian: 'co',
  chile: 'cl', chilean: 'cl',
  peru: 'pe', peruvian: 'pe',
  ireland: 'ie', irish: 'ie',
  portugal: 'pt', portuguese: 'pt',
  greece: 'gr', greek: 'gr'
};

const DEFAULT_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', sourceName: 'BBC World' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', sourceName: 'Al Jazeera' },
  
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function matchesCountryKeywords(title, description, keywords) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function extractImage(item) {
  let image = null;
  
  try {
    if (item.enclosure && item.enclosure.url) {
      const url = item.enclosure.url;
      if (url.startsWith('http') && (url.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) || !url.includes('video'))) {
        image = url;
      }
    }
    
    if (!image && item['media:content']) {
      const mc = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
      if (mc && mc.$ && mc.$.url) {
        image = mc.$.url;
      }
    }
    
    if (!image && item['media:thumbnail']) {
      const mt = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
      if (mt && mt.$ && mt.$.url) {
        image = mt.$.url;
      }
    }
    
    if (!image && item.content) {
      const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
      if (match) image = match[1];
    }
    
    if (!image && item['content:encoded']) {
      const match = item['content:encoded'].match(/<img[^>]+src=["']([^"']+)["']/);
      if (match) image = match[1];
    }
    
    if (!image && item.description) {
      const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
      if (match) image = match[1];
    }
    
    if (image) {
      if (image.startsWith('//')) image = 'https:' + image;
      if (image.startsWith('/') || image.includes('logo') || image.includes('icon/')) {
        image = null;
      }
    }
  } catch (_error) {
    void _error;
    image = null;
  }
  
  return image;
}

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return feed.items.slice(0, 20).map((item, idx) => {
      const extractedImage = extractImage(item);
      const link = item.link || item.guid || '';
      const id = hashCode(link || item.title || String(idx));
      const image = extractedImage || `https://picsum.photos/seed/${id}/400/300`;
      
      let pubDate = null;
      if (item.pubDate) {
        pubDate = new Date(item.pubDate).toISOString();
      } else if (item.isoDate) {
        pubDate = new Date(item.isoDate).toISOString();
      }

      return {
        id,
        title: item.title || '',
        description: (item.contentSnippet || item.content || item.summary || '').substring(0, 500),
        url: link,
        image_url: image,
        published_at: pubDate || new Date().toISOString(),
        source_name: feedConfig.sourceName,
        source_url: '',
        country: '',
        language: '',
        category: '',
        urlToImage: image,
        local_image_path: null
      };
    });
  } catch (error) {
    console.log(`Error fetching ${feedConfig.sourceName}: ${error.message}`);
    return [];
  }
}

function getFeedsForCountry(countryCode) {
  const code = countryCode ? countryCode.toLowerCase().trim() : '';
  if (!code || code === 'all' || code === 'global') return DEFAULT_FEEDS;
  
  if (COUNTRY_FEEDS[code]) {
    return COUNTRY_FEEDS[code];
  }
  
  return DEFAULT_FEEDS;
}

function filterByCountryKeywords(articles, countryCode) {
  const keywords = COUNTRY_KEYWORDS[countryCode] || [];
  if (keywords.length === 0) return articles;
  
  return articles.filter(article => matchesCountryKeywords(article.title, article.description, keywords));
}

function filterBySearchQuery(articles, queries) {
  if (!queries || queries.length === 0) return articles;
  
  return articles.filter(a => {
    const title = (a.title || '').toLowerCase();
    const description = (a.description || '').toLowerCase();
    const sourceName = (a.source_name || '').toLowerCase();
    
    return queries.some(q => 
      title.includes(q) ||
      description.includes(q) ||
      sourceName.includes(q)
    );
  });
}

function detectCountryFromQuery(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  if (COUNTRY_FEEDS[lowerQuery]) {
    return lowerQuery;
  }
  
  return COUNTRY_CODE_MAP[lowerQuery] || null;
}

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let { q = '', limit = 50 } = req.query;
    const searchQuery = q.toLowerCase().trim();
    
    if (!searchQuery) {
      return res.status(400).json({ 
        error: 'Query parameter "q" is required',
        articles: []
      });
    }
    
    const sourceLang = detectLanguage(searchQuery);
    const searchQueries = await translateQuery(searchQuery, sourceLang);
    
    const detectedCountry = detectCountryFromQuery(searchQuery);
    
    if (detectedCountry) {
      let localNews = [];
      let mentionedNews = [];
      
      const localFeeds = getFeedsForCountry(detectedCountry);
      const localPromises = localFeeds.map(feed => fetchFeed(feed));
      const localResults = await Promise.all(localPromises);
      localNews = localResults.flat();
      localNews = deduplicateArticles(localNews);
      
      const globalFeeds = DEFAULT_FEEDS;
      const globalPromises = globalFeeds.map(feed => fetchFeed(feed));
      const globalResults = await Promise.all(globalPromises);
      let globalNews = globalResults.flat();
      
      if (COUNTRY_KEYWORDS[detectedCountry]) {
        mentionedNews = filterByCountryKeywords(globalNews, detectedCountry);
      } else {
        mentionedNews = filterBySearchQuery(globalNews, searchQueries);
      }
      mentionedNews = deduplicateArticles(mentionedNews);
      
      mentionedNews = mentionedNews.filter(article => {
        const localKey = article.title.toLowerCase().substring(0, 50);
        return !localNews.some(local => local.title.toLowerCase().substring(0, 50) === localKey);
      });
      
      const combinedNews = [...localNews, ...mentionedNews];
      
      combinedNews.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
        const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
        return dateB - dateA;
      });
      
      const result = combinedNews.slice(0, parseInt(limit));
      
      return res.status(200).json({
        articles: result,
        total: combinedNews.length,
        hasMore: combinedNews.length > parseInt(limit),
        searchQuery: searchQuery,
        detectedCountry: detectedCountry,
        localCount: localNews.length,
        mentionedCount: mentionedNews.length,
        mode: 'country',
        searchMeta: {
          sourceLang,
          translations: searchQueries.slice(1)
        }
      });
    } else {
      let allNews = [];
      
      const globalFeeds = DEFAULT_FEEDS;
      const feedPromises = globalFeeds.map(feed => fetchFeed(feed));
      const results = await Promise.all(feedPromises);
      allNews = results.flat();
      
      allNews = filterBySearchQuery(allNews, searchQueries);
      allNews = deduplicateArticles(allNews);
      
      allNews.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
        const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
        return dateB - dateA;
      });
      
      const result = allNews.slice(0, parseInt(limit));
      
      return res.status(200).json({
        articles: result,
        total: allNews.length,
        hasMore: allNews.length > parseInt(limit),
        searchQuery: searchQuery,
        mode: 'keyword',
        searchMeta: {
          sourceLang,
          translations: searchQueries.slice(1)
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message,
      articles: []
    });
  }
}
