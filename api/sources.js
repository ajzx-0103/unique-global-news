const NEWS_SOURCES = {
  cn: [
    { name: 'BBC中文', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', lang: 'zh' },
    { name: '德国之声中文', url: 'https://rss.dw.com/rdf/rss-zh-all', lang: 'zh' },
    { name: '联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/china', lang: 'zh' }
  ],
  us: [
    { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', lang: 'en' },
    { name: 'Yahoo News', url: 'https://news.yahoo.com/rss/', lang: 'en' },
    { name: 'Google News', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', lang: 'en' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', lang: 'en' }
  ],
  gb: [
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', lang: 'en' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', lang: 'en' },
    { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/home-page.xml', lang: 'en' }
  ],
  jp: [
    { name: 'NHK World', url: 'https://www3.nhk.or.jp/rss/news/cat1.xml', lang: 'ja' },
    { name: 'Yahoo Japan', url: 'https://news.yahoo.co.jp/rss/politics.xml', lang: 'ja' },
    { name: 'BBC Japan', url: 'https://www.bbc.com/japanese/rss.xml', lang: 'ja' }
  ],
  kr: [
    { name: '联合新闻', url: 'https://www.yna.co.kr/rss/news.xml', lang: 'ko' },
    { name: 'Korean Herald', url: 'http://www.koreaherald.com/rss.xml', lang: 'ko' }
  ],
  de: [
    { name: 'Der Spiegel', url: 'https://www.spiegel.de/schlagzeilen/index.rss', lang: 'de' },
    { name: 'Die Zeit', url: 'https://www.zeit.de/rss_feeds/aktuells', lang: 'de' },
    { name: 'DW Germany', url: 'https://rss.dw.com/rdf/rss-de-all', lang: 'de' }
  ],
  fr: [
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', lang: 'fr' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', lang: 'fr' },
    { name: 'France24', url: 'https://www.france24.com/fr/rss', lang: 'fr' }
  ],
  ru: [
    { name: 'RT Russian', url: 'https://russian.rt.com/rss', lang: 'ru' },
    { name: 'TASS', url: 'https://tass.ru/rss/v2.xml', lang: 'ru' },
    { name: 'Lenta.ru', url: 'https://lenta.ru/rss', lang: 'ru' }
  ],
  in: [
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', lang: 'en' },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/rss/news/rssfeed.xml', lang: 'en' },
    { name: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', lang: 'en' }
  ],
  br: [
    { name: 'Folha', url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', lang: 'pt' },
    { name: 'G1', url: 'https://g1.globo.com/rss/g1/', lang: 'pt' },
    { name: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml', lang: 'pt' }
  ],
  au: [
    { name: 'ABC News Australia', url: 'https://www.abc.net.au/news/feed/51120/rss.xml', lang: 'en' },
    { name: 'BBC Australia', url: 'https://feeds.bbci.co.uk/news/world/australia/rss.xml', lang: 'en' }
  ],
  ca: [
    { name: 'CBC News', url: 'https://rss.cbc.ca/lineup/topstories.rss', lang: 'en' },
    { name: 'Globe and Mail', url: 'https://www.theglobeandmail.com/rss/topstories/', lang: 'en' }
  ],
  es: [
    { name: 'El Pais', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/portada/portada', lang: 'es' },
    { name: 'Marca', url: 'https://e00-marca.uecdn.es/rss/portada.xml', lang: 'es' }
  ],
  it: [
    { name: 'La Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', lang: 'it' },
    { name: 'ANSA', url: 'https://www.ansa.it/sito/ansait_rss.xml', lang: 'it' }
  ],
  global: [
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en' },
    { name: 'France24 English', url: 'https://www.france24.com/en/rss', lang: 'en' },
    { name: 'Deutsche Welle English', url: 'https://rss.dw.com/rdf/rss-en-all', lang: 'en' },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' },
    { name: 'CNN International', url: 'http://rss.cnn.com/rss/edition_world.rss', lang: 'en' }
  ]
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { country } = req.query || {};

  if (country && NEWS_SOURCES[country]) {
    return res.status(200).json(NEWS_SOURCES[country]);
  }

  return res.status(200).json(NEWS_SOURCES);
}
