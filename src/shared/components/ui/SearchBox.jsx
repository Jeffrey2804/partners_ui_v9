// ========================================
// 🎯 ENHANCED SEARCH BOX COMPONENT
// ========================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiCommand } from 'react-icons/fi';

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);

  // Mock search results
  const mockResults = [
    { id: 1, type: 'lead', title: 'John Smith', subtitle: 'Lead - $250,000', icon: '👤' },
    { id: 2, type: 'task', title: 'Document Review', subtitle: 'Task - Due Today', icon: '📋' },
    { id: 3, type: 'pipeline', title: 'Pipeline Update', subtitle: 'Status Changed', icon: '📊' },
    { id: 4, type: 'contact', title: 'Sarah Johnson', subtitle: 'Contact - Active', icon: '📞' },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search
  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      const filtered = mockResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleResultClick = (result) => {
    console.log('Selected result:', result);
    setQuery('');
    setShowResults(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <form
        className="relative animate-fade-in w-full max-w-xs sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (searchResults.length > 0) {
            handleResultClick(searchResults[0]);
          }
        }}
      >
        <label htmlFor="search" className="sr-only">
          Search
        </label>

        <div className={`
          relative flex items-center w-full
          ${isFocused ? 'ring-2 ring-teal-500 ring-opacity-50' : ''}
          transition-all duration-200
        `}>
          <input
            ref={inputRef}
            id="search"
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              // Delay hiding results to allow clicking
              setTimeout(() => setShowResults(false), 200);
            }}
            placeholder="Search leads, tasks, contacts..."
            className="w-full pr-20 pl-10 py-2.5 rounded-full shadow-inner
                       bg-white/90 backdrop-blur-sm text-gray-700 placeholder-gray-400
                       dark:bg-gray-700/90 dark:text-gray-100 dark:placeholder-gray-400
                       focus:outline-none focus:bg-white dark:focus:bg-gray-700
                       transition-all duration-300 text-sm"
          />

          {/* Search Icon */}
          <div className="absolute left-3 text-gray-400 dark:text-gray-500">
            <FiSearch className="w-4 h-4" />
          </div>

          {/* Keyboard Shortcut */}
          <div className="absolute right-3 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600
                           text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                           transition-colors duration-200"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md
                            bg-gray-100 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-400">
              <FiCommand className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800
                       rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
                       z-50 overflow-hidden max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50
                             dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                >
                  <div className="text-lg">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBox;
