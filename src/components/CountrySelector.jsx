import { useState, useCallback, useEffect } from 'react';
import { getAllRegionsWithCountries, countries } from '../data/countries';
import NewsCard from './NewsCard';
import SearchBar from './SearchBar';
import Loading from './Loading';
import EmptyState from './EmptyState';
import { fetchCountryNews, searchGlobalNews, fetchTopNews } from '../services/newsApi';
import './CountrySelector.css';

function CountrySelector() {
  const regionsWithCountries = getAllRegionsWithCountries();
  
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchCountry, setSearchCountry] = useState(null);

  const loadGlobalNews = useCallback(async (date = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const news = await fetchTopNews(50, date);
      setArticles(news.map(article => ({
        ...article,
        countryFlag: '🌍',
        countryName: '全球'
      })));
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCountryNews = useCallback(async (country) => {
    setIsLoading(true);
    setError(null);
    try {
      const news = await fetchCountryNews(country.code, country.lang);
      setArticles(news.map(article => ({ ...article, countryFlag: country.flag, countryName: country.name })));
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGlobalNews();
    
    const interval = setInterval(() => {
      if (!selectedCountry && !searchQuery) {
        loadGlobalNews();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadGlobalNews, selectedCountry, searchQuery]);

  const findCountryByName = useCallback((query) => {
    const lowerQuery = query.toLowerCase().trim();
    return countries.find(c => c.name.toLowerCase() === lowerQuery || c.name.toLowerCase().includes(lowerQuery));
  }, []);

  const handleSearch = useCallback(async (query, date) => {
    setSearchQuery(query);
    setSearchDate(date || '');
    
    if (!query.trim() && !date) {
      setSelectedCountry(null);
      setSearchCountry(null);
      setIsLoading(true);
      try {
        const news = await fetchTopNews(50, null);
        setArticles(news.map(article => ({
          ...article,
          countryFlag: '🌍',
          countryName: '全球'
        })));
      } catch (err) {
        setError(err.message);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!query.trim() && date) {
      setSelectedCountry(null);
      setSearchCountry(null);
      setIsLoading(true);
      try {
        const news = await fetchTopNews(100, date);
        setArticles(news.map(article => ({
          ...article,
          countryFlag: '🌍',
          countryName: '全球'
        })));
      } catch (err) {
        setError(err.message);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedCountry(null);

    const matchedCountry = query ? findCountryByName(query) : null;
    setSearchCountry(matchedCountry);

    try {
      let newsResults = [];
      
      if (matchedCountry && query) {
        const [countryNews, globalNews] = await Promise.all([
          fetchCountryNews(matchedCountry.code, matchedCountry.lang, 30, date),
          searchGlobalNews(query, 50, date)
        ]);
        
        const seen = new Set();
        const uniqueCountry = [];
        for (const art of countryNews) {
          const key = (art.title || '').toLowerCase().substring(0, 50);
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCountry.push(art);
          }
        }
        
        const uniqueGlobal = [];
        seen.clear();
        for (const art of globalNews) {
          const key = (art.title || '').toLowerCase().substring(0, 50);
          if (!seen.has(key)) {
            seen.add(key);
            uniqueGlobal.push(art);
          }
        }
        
        const countryNewsWithMeta = uniqueCountry.map(article => ({
          ...article,
          countryFlag: matchedCountry.flag,
          countryName: matchedCountry.name
        }));
        
        const globalNewsWithMeta = uniqueGlobal.map(article => ({
          ...article,
          countryFlag: '🌍',
          countryName: '全球'
        }));
        
        newsResults = [...countryNewsWithMeta, ...globalNewsWithMeta];
      } else {
        const globalNews = await searchGlobalNews(query || 'news', 50, date);
        const seen = new Set();
        const unique = [];
        for (const art of globalNews) {
          const key = (art.title || '').toLowerCase().substring(0, 50);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(art);
          }
        }
        newsResults = unique.map(article => ({
          ...article,
          countryFlag: '🌍',
          countryName: '全球'
        }));
      }
      
      setArticles(newsResults);
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [findCountryByName]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSearchQuery('');
    setSearchDate('');
    setSearchCountry(null);
    loadCountryNews(country);
  };

  const getContentTitle = () => {
    if (searchQuery || searchDate) {
      if (searchCountry) {
        return `${searchCountry.flag} ${searchCountry.name} 关于"${searchQuery || '新闻'}"的新闻`;
      }
      const parts = [];
      if (searchQuery) parts.push(`"${searchQuery}"`);
      if (searchDate) parts.push(`${searchDate}日`);
      return `搜索: ${parts.join(' + ')}`;
    }
    if (selectedCountry) {
      return `${selectedCountry.flag} ${selectedCountry.name}新闻`;
    }
    return '🌍 全球热点新闻';
  };

  return (
    <div className="country-selector">
      <div className="layout-container">
        <aside className="sidebar">
          <h3 className="sidebar-title">选择国家</h3>
          {regionsWithCountries.map(region => (
            <div key={region.id} className="sidebar-region">
              <h4 className="sidebar-region-title">
                <span className="region-icon">{region.icon}</span>
                {region.name}
              </h4>
              <div className="country-list">
                {region.countries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={`country-item ${selectedCountry?.code === country.code ? 'active' : ''}`}
                  >
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="main-area">
          <div className="search-section">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>

          <div className="content-area">
            {isLoading && articles.length === 0 ? (
              <Loading />
            ) : error ? (
              <EmptyState type="error" error={error} />
            ) : articles.length === 0 ? (
              <EmptyState type="empty" />
            ) : (
              <>
                <h2 className="content-title">{getContentTitle()}</h2>
                <div className="news-grid">
                  {articles.map((article, index) => (
                    <NewsCard key={`${article.url}-${index}`} article={article} />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CountrySelector;
