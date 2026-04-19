import fetch from 'node-fetch';

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

const SUPPORTED_LANGS = ['en', 'zh', 'ja', 'de', 'fr', 'es', 'ru', 'ko', 'ar', 'pt'];

const langPairs = {
  en: 'en|zh|en|ja|en|de|en|fr|en|es|en|ru|en|ko|en|ar|en|pt',
  zh: 'zh|en',
  ja: 'ja|en',
  de: 'de|en',
  fr: 'fr|en',
  es: 'es|en',
  ru: 'ru|en',
  ko: 'ko|en',
  ar: 'ar|en',
  pt: 'pt|en'
};

const translationCache = new Map();

async function translate(text, fromLang, toLang) {
  if (fromLang === toLang) return text;
  if (!text || text.length > 500) return text;

  const cacheKey = `${text}|${fromLang}|${toLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const langpair = `${fromLang}|${toLang}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) return text;

    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      if (translationCache.size > 1000) {
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
  if (!query) return [];
  
  const queries = [query.toLowerCase()];
  
  const pairs = langPairs[sourceLang]?.split('|') || ['en'];
  
  for (let i = 0; i < pairs.length; i += 2) {
    const from = pairs[i];
    const to = pairs[i + 1];
    if (from !== sourceLang) {
      const translated = await translate(query, sourceLang, to);
      if (translated && translated.toLowerCase() !== query.toLowerCase()) {
        queries.push(translated.toLowerCase());
      }
    }
  }

  const otherLangs = ['en', 'zh', 'ja', 'de', 'fr', 'es', 'ru', 'ko'];
  for (const lang of otherLangs) {
    if (lang !== sourceLang && !queries.some(q => q.includes(lang))) {
      const translated = await translate(query, sourceLang, lang);
      if (translated && translated.toLowerCase() !== query.toLowerCase()) {
        queries.push(translated.toLowerCase());
      }
    }
  }

  return [...new Set(queries)];
}

export async function searchWithTranslation(query, sourceLang = 'zh') {
  const allQueries = await translateQuery(query, sourceLang);
  return {
    original: query,
    translations: allQueries.slice(1),
    queries: allQueries
  };
}

export function detectLanguage(text) {
  if (!text) return 'en';
  
  const chineseRegex = /[\u4e00-\u9fff]/;
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanRegex = /[\uac00-\ud7af]/;
  const arabicRegex = /[\u0600-\u06ff]/;
  const cyrillicRegex = /[\u0400-\u04ff]/;
  
  if (chineseRegex.test(text)) return 'zh';
  if (japaneseRegex.test(text)) return 'ja';
  if (koreanRegex.test(text)) return 'ko';
  if (arabicRegex.test(text)) return 'ar';
  if (cyrillicRegex.test(text)) return 'ru';
  
  return 'en';
}
