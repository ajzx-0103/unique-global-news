const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

const langPairs = {
  en: ['zh', 'ja', 'de', 'fr', 'es', 'ru', 'ko'],
  zh: ['en'],
  ja: ['en'],
  de: ['en'],
  fr: ['en'],
  es: ['en'],
  ru: ['en'],
  ko: ['en']
};

const translationCache = new Map();

async function translate(text, targetLang) {
  if (!text || text.length > 500) return text;

  const cacheKey = `${text}|${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const langpair = `en|${targetLang}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) return text;

    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      if (translationCache.size > 500) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
      }
      translationCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.log('Translation error:', error.message);
  }
  return text;
}

export async function translateQuery(query, sourceLang = 'zh') {
  if (!query) return [query];

  const queries = [query.toLowerCase()];
  const targets = langPairs[sourceLang] || ['en'];

  for (const targetLang of targets) {
    if (query.length <= 100) {
      const translated = await translate(query, targetLang);
      if (translated && translated.toLowerCase() !== query.toLowerCase()) {
        queries.push(translated.toLowerCase());
      }
    }
  }

  return [...new Set(queries)];
}

export function detectLanguage(text) {
  if (!text) return 'en';
  
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  return 'en';
}
