import './EmptyState.css';

function EmptyState({ type = 'empty', searchQuery, error }) {
  if (type === 'search') {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <h3>未找到相关新闻</h3>
        <p>未找到与 "{searchQuery}" 相关的新闻，请尝试其他关键词</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="empty-state error">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h3>加载失败</h3>
        <p>{error || '无法获取新闻，请检查网络连接后重试'}</p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1"/>
          <path d="M15 6a2 2 0 012 2v11a2 2 0 01-2 2h-1"/>
          <path d="M9 12h6"/>
        </svg>
      </div>
      <h3>暂无新闻</h3>
      <p>请从左侧选择一个国家查看新闻</p>
    </div>
  );
}

export default EmptyState;
