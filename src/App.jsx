import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import CountrySelector from './components/CountrySelector';
import CountryNewsPage from './pages/CountryNewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<CountrySelector />} />
              <Route path="/country/:code" element={<CountryNewsPage />} />
              <Route path="/news" element={<NewsDetailPage />} />
            </Routes>
          </div>
        </main>
        <footer className="footer">
          <p>全球新闻 · 数据来源 BBC/Reuters</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
