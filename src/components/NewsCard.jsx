import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewsCard.css';

function getFallbackImage(title) {
  const hash = title.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const seed = Math.abs(hash) % 1000;
  return `https://picsum.photos/seed/${seed}/400/300`;
}

const FALLBACK_SEED = 'global-news-fallback';

function NewsCard({ article }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  
  const fallbackSrc = useMemo(() => {
    return getFallbackImage(article.title || article.url || FALLBACK_SEED);
  }, [article.title, article.url]);
  
  const imgSrc = article.urlToImage || (imgError ? fallbackSrc : null);
  
  const handleClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImgError = () => {
    if (!imgError) {
      setImgError(true);
    }
  };

  return (
    <div className="news-card" onClick={handleClick}>
      <div className="news-card-image">
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={article.title}
            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            onError={handleImgError}
          />
        ) : (
          <div className="news-card-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        )}
      </div>
      <div className="news-card-content">
        <div className="news-card-meta">
          <span className="news-card-source">{article.source_name || article.source?.name || '未知来源'}</span>
          {article.countryFlag && (
            <span className="news-card-country">
              {article.countryFlag} {article.countryName}
            </span>
          )}
        </div>
        <h3 className="news-card-title">{article.title}</h3>
        <p className="news-card-description">{article.description}</p>
        <div className="news-card-footer">
          <span className="news-card-time">{formatTime(article.publishedAt)}</span>
          {article.author && <span className="news-card-author">{article.author}</span>}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default NewsCard;
