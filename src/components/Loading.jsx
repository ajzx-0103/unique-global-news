import './Loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p className="loading-text">正在加载全球新闻...</p>
    </div>
  );
}

export default Loading;
