import { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query.trim(), date);
  };

  const handleClear = () => {
    setQuery('');
    setDate('');
    onSearch('', '');
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜索全球新闻..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        {query && (
          <button type="button" className="search-clear" onClick={handleClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
      <input
        type="date"
        className="search-date"
        value={date}
        onChange={handleDateChange}
        disabled={isLoading}
      />
      <button type="submit" className="search-button" disabled={isLoading || (!query.trim() && !date)}>
        {isLoading ? '搜索中...' : '搜索'}
      </button>
    </form>
  );
}

export default SearchBar;
