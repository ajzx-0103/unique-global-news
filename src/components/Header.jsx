import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-title">
          <h1>🌍 全球新闻</h1>
          <p className="header-subtitle">实时更新 · 搜索全球资讯</p>
        </Link>
      </div>
    </header>
  );
}

export default Header;
