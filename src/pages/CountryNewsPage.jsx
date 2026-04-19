import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import SearchBar from '../components/SearchBar';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { fetchCountryNews, searchCountryNews } from '../services/newsApi';
import { getCountryByCode } from '../data/countries';
import './CountryNewsPage.css';

function CountryNewsPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const country = getCountryByCode(code);
  
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!country) {
      navigate('/');
      return;
    }
    
    console.log('=== COUNTRY PAGE ===');
    console.log('URL code:', code);
    console.log('Country name:', country.name);
    
    async function loadNews(showLoading = true) {
      if (showLoading) setIsLoading(true);
      setError(null);
      try {
        console.log('Calling API with country:', code);
        const news = await fetchCountryNews(code, country.lang);
        console.log('Got news:', news.length);
        setArticles(news);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error loading news:', err);
        setError(err.message);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    }
    
    loadNews(true);
    
    const interval = setInterval(() => loadNews(false), 60000);
    return () => clearInterval(interval);
  }, [country, code, navigate]);

  useEffect(() => {
    async function search() {
      if (!searchQuery) return;
      setIsLoading(true);
      try {
        const news = await searchCountryNews(searchQuery, code, country.lang);
        setArticles(news);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    search();
  }, [searchQuery, code, country?.lang]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const news = searchQuery 
        ? await searchCountryNews(searchQuery, code, country.lang)
        : await fetchCountryNews(code, country.lang);
      setArticles(news);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!country) {
    return null;
  }

  return (
    <div className="country-news-page">
      <div className="country-news-header">
        <Link to="/" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回国家列表
        </Link>
        <div className="country-title">
          <span className="country-flag">{country.flag}</span>
          <h1>{country.name}新闻</h1>
        </div>
        <button 
          className="refresh-button" 
          onClick={handleRefresh}
          disabled={isLoading}
          title="刷新新闻"
        >
          <svg className={isLoading ? 'spinning' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/>
            <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14"/>
          </svg>
        </button>
      </div>

      <div className="country-news-content">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        {lastUpdate && (
          <p className="last-update-text">
            更新于 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        {isLoading && articles.length === 0 ? (
          <Loading />
        ) : error ? (
          <EmptyState type="error" />
        ) : articles.length === 0 ? (
          <EmptyState type={searchQuery ? 'search' : 'empty'} searchQuery={searchQuery} />
        ) : (
          <div className="news-grid">
            {articles.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CountryNewsPage;
