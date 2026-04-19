const BASE_URL = '/api';

export async function fetchTopNews(max = 50, date = null) {
  let url = `${BASE_URL}/news?limit=${max}`;
  if (date) url += `&date=${encodeURIComponent(date)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
}

export async function searchNews(query, max = 50, date = null) {
  let url = `${BASE_URL}/news?q=${encodeURIComponent(query)}&limit=${max}`;
  if (date) url += `&date=${encodeURIComponent(date)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
}

export async function searchGlobalNews(query, max = 50, date = null) {
  return searchNews(query, max, date);
}

export async function fetchCountryNews(country, lang, max = 50) {
  let url = `${BASE_URL}/news?country=${encodeURIComponent(country)}&limit=${max}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
}

export async function searchCountryNews(query, country, lang, max = 50, date = null) {
  let url = `${BASE_URL}/news/search?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}&limit=${max}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
}

export async function fetchCountries() {
  const response = await fetch(`${BASE_URL}/countries`);
  if (!response.ok) throw new Error(`API错误: ${response.status}`);
  return response.json();
}

export async function triggerCrawl(country = null) {
  return { success: true };
}

export async function getStats() {
  return { totalArticles: 0, countriesCount: 0 };
}
