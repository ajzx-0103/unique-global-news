import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import './NewsDetailPage.css';

function NewsDetailPage() {
  const article = useMemo(() => {
    try {
      const newsData = sessionStorage.getItem('currentArticle');
      return newsData ? JSON.parse(newsData) : null;
    } catch {
      return null;
    }
  }, []);

  if (!article) {
    return (
      <div className="detail-error">
        <h2>无法加载新闻详情</h2>
        <Link to="/" className="back-link">返回首页</Link>
      </div>
    );
  }

  const openExternal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="news-detail-page">
      <div className="detail-header">
        <Link to={-1} className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </Link>
      </div>

      <article className="detail-content">
        {article.urlToImage && (
          <div className="detail-image">
            <img src={article.urlToImage} alt={article.title} />
          </div>
        )}

        <header className="detail-header-info">
          <div className="detail-meta">
            <span className="detail-source">{article.source?.name || '未知来源'}</span>
            {article.countryFlag && (
              <span className="detail-country">
                {article.countryFlag} {article.countryName}
              </span>
            )}
          </div>
          <h1 className="detail-title">{article.title}</h1>
          <div className="detail-info">
            {article.author && <span className="detail-author">作者: {article.author}</span>}
            {article.publishedAt && (
              <span className="detail-time">
                {new Date(article.publishedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </header>

        <div className="detail-body">
          {article.description && (
            <p className="detail-description">{article.description}</p>
          )}
          {article.content && (
            <div className="detail-text">{article.content}</div>
          )}
        </div>

        <div className="detail-actions">
          <button className="detail-button primary" onClick={openExternal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            在浏览器中打开原文
          </button>
        </div>
      </article>
    </div>
  );
}

export default NewsDetailPage;
