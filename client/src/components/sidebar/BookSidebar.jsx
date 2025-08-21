import React, { useState, useEffect, forwardRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useBook } from '../../context/BookContext';
import { useUrlState } from '../../hooks/useUrlState';

const BookSidebar = forwardRef(({ isOpen, onToggle }, ref) => {
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ collections: [], books: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [viewingFavorites, setViewingFavorites] = useState(false);
  const { currentBook } = useBook();
  const { selectBook } = useUrlState();

  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem('bookSidebarState');
      if (savedState) {
        const { searchResults: savedSearchResults } = JSON.parse(savedState);
        // Don't restore search query - only restore search results if needed
        setSearchResults(savedSearchResults || { collections: [], books: [] });
        return true;
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
    return false;
  };

  // Load favorites from database
  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    }
  };

  // Toggle favorite for an item
  const toggleFavorite = async (item, type) => {
    try {
      const existingFavorite = favorites.find(f => f.item_id === item.id);
      
      if (existingFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id);
        
        if (error) throw error;
        setFavorites(favorites.filter(f => f.id !== existingFavorite.id));
      } else {
        // Add to favorites
        const newFavorite = {
          item_id: item.id,
          item_type: type,
          title: item.title,
          collection_id: type === 'book' ? item.collection : item.parent,
          breadcrumb_path: breadcrumbPath
        };
        
        const { data, error } = await supabase
          .from('favorites')
          .insert(newFavorite)
          .select()
          .single();
        
        if (error) throw error;
        setFavorites([data, ...favorites]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Remove favorite
  const removeFavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) throw error;
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Navigate to favorite item
  const navigateToFavorite = async (favorite) => {
    try {
      setLoading(true);
      
      if (favorite.item_type === 'collection') {
        // Navigate to collection
        const path = await buildPathToCollection(favorite.item_id);
        setBreadcrumbPath(path);
        await fetchCollections(favorite.item_id);
        await fetchBooks(favorite.item_id);
      } else {
        // If we're currently viewing favorites, just select the book without changing path
        if (viewingFavorites) {
          selectBook(favorite.item_id);
        } else {
          // Navigate to book's collection and select book
          const path = await buildPathToCollection(favorite.collection_id);
          setBreadcrumbPath(path);
          await fetchCollections(favorite.collection_id);
          await fetchBooks(favorite.collection_id);
          selectBook(favorite.item_id);
        }
      }
      
      // Clear search if active
      if (searchQuery) {
        setSearchQuery('');
        setSearchResults({ collections: [], books: [] });
        // Clear localStorage state when clearing search
        localStorage.removeItem('bookSidebarState');
      }
    } catch (error) {
      console.error('Error navigating to favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if an item is favorited
  const isFavorite = (id) => {
    return favorites.some(f => f.item_id === id);
  };

  // Save current state to localStorage
  const saveCurrentState = () => {
    try {
      const stateToSave = {
        // Don't save search query - only save search results if needed
        searchResults
      };
      localStorage.setItem('bookSidebarState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  };

  // Filter collections and books based on search query
  const filteredCollections = currentLevel.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if we have any search results
  const hasSearchResults = searchQuery === '' || filteredCollections.length > 0 || filteredBooks.length > 0;

  // Global search across entire system
  const globalSearch = async (query) => {
    if (!query.trim()) return { collections: [], books: [] };
    
    setIsSearching(true);
    
    try {
      // Search collections
      const { data: collections } = await supabase
        .from('collections')
        .select('id, title, parent')
        .ilike('title', `%${query}%`);
        
      // Search books  
      const { data: books } = await supabase
        .from('books')
        .select('id, title, collection')
        .ilike('title', `%${query}%`);
        
      return { 
        collections: collections || [], 
        books: books || [] 
      };
    } catch (error) {
      console.error('Global search error:', error);
      return { collections: [], books: [] };
    } finally {
      setIsSearching(false);
    }
  };

  // Build full path to a collection by recursively fetching parents
  const buildPathToCollection = async (collectionId) => {
    const path = [];
    let currentId = collectionId;
    
    while (currentId) {
      const { data: collection } = await supabase
        .from('collections')
        .select('id, title, parent')
        .eq('id', currentId)
        .single();
        
      if (collection) {
        path.unshift(collection);
        currentId = collection.parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  // Handle search input changes
  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = await globalSearch(query);
      setSearchResults(results);
    } else {
      setSearchResults({ collections: [], books: [] });
    }
  };

  // Debounced search to avoid excessive API calls
  const debouncedSearch = React.useCallback(
    React.useMemo(
      () => {
        let timeoutId;
        return (query) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => handleSearchChange(query), 300);
        };
      },
      []
    ),
    []
  );

  // Handle search input with debouncing
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Navigate to search result naturally through hierarchy
  const navigateToSearchResult = async (item, type) => {
    setLoading(true);
    setViewingFavorites(false); // Reset favorites view
    
    if (type === 'collection') {
      // Build path to collection and navigate there
      const path = await buildPathToCollection(item.id);
      setBreadcrumbPath(path);
      await fetchCollections(item.id);
      await fetchBooks(item.id);
    } else if (type === 'book') {
      // Build path to book's collection and navigate there
      const path = await buildPathToCollection(item.collection);
      setBreadcrumbPath(path);
      await fetchCollections(item.collection);
      await fetchBooks(item.collection);
      // Select the book
      selectBook(item.id);
    }
    
    // Clear search and results
    setSearchQuery('');
    setSearchResults({ collections: [], books: [] });
    setLoading(false);
    
    // Clear localStorage state when clearing search
    localStorage.removeItem('bookSidebarState');
  };

  // Fetch collections for a specific parent
  const fetchCollections = async (parentId = null) => {
    let query = supabase.from('collections').select('*');
    
    if (parentId === null) {
      query = query.is('parent', null);
    } else {
      query = query.eq('parent', parentId);
    }
    
    const { data, error } = await query;
    
    if (data) {
      setCurrentLevel(data);
    } else {
      setCurrentLevel([]);
    }
  };

  const fetchBooks = async (collectionId) => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, collection')
      .eq('collection', collectionId);
    if (data) {
      setBooks(data);
    } else {
      setBooks([]);
    }
  };

  // Navigate to a specific collection
  const navigateToCollection = async (collection) => {
    setLoading(true);
    setViewingFavorites(false); // Reset favorites view
    const newPath = [...breadcrumbPath, collection];
    setBreadcrumbPath(newPath);
    
    // Clear search when navigating to new collection
    setSearchQuery('');
    setSearchResults({ collections: [], books: [] });
    // Clear localStorage state when navigating
    localStorage.removeItem('bookSidebarState');
    
    await fetchCollections(collection.id);
    await fetchBooks(collection.id);
    setLoading(false);
  };

  // Navigate back to a specific level
  const navigateBack = async (levelIndex) => {
    setLoading(true);
    const newPath = breadcrumbPath.slice(0, levelIndex + 1);
    setBreadcrumbPath(newPath);
    
    // Clear search when navigating back
    setSearchQuery('');
    setSearchResults({ collections: [], books: [] });
    // Clear localStorage state when navigating
    localStorage.removeItem('bookSidebarState');
    
    const targetCollection = newPath[newPath.length - 1];
    if (targetCollection) {
      if (targetCollection.id === 'favorites') {
        setViewingFavorites(true);
        setCurrentLevel([]);
        setBooks([]);
      } else {
        setViewingFavorites(false);
        await fetchCollections(targetCollection.id);
        await fetchBooks(targetCollection.id);
      }
    } else {
      setViewingFavorites(false);
      await fetchCollections();
      setBooks([]);
    }
    setLoading(false);
  };

  // Handle book selection
  const handleBookClick = async (book) => {
    // Don't re-select if already selected
    if (currentBook?.id === book.id) return;
    selectBook(book.id);
  };

  // Navigate to the favorites folder
  const navigateToFavoritesFolder = async () => {
    setViewingFavorites(true);
    setBreadcrumbPath([{ id: 'favorites', title: 'Favorites', parent: null }]);
    setCurrentLevel([]);
    setBooks([]);
  };

  // Initialize with saved state or root collections
  useEffect(() => {
    setLoading(true);
    
    // Always start at root level
    fetchCollections(null);
    
    // Load saved search state
    loadSavedState();
    
    // Load favorites from database
    loadFavorites();
    
    setLoading(false);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <div 
        ref={ref}
        className={`
          fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full'}
          w-80
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <h2 className={`text-lg font-semibold text-gray-800 ${!isOpen && 'lg:hidden'}`}>
                  Books
                </h2>
              </div>
              <button
                onClick={onToggle}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Hidden when closed */}
          {isOpen && (
            <div className="flex flex-col h-full">
              {/* Search Bar - Moved to top */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search collections and books..."
                    value={searchQuery}
                    onChange={handleSearchInput}
                    autoComplete="off"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {/* Search Icon */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults({ collections: [], books: [] });
                        // Clear localStorage state when clearing search
                        localStorage.removeItem('bookSidebarState');
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              {breadcrumbPath.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center space-x-2 text-sm">
                    <button
                      onClick={() => navigateBack(-1)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ...
                    </button>
                    {breadcrumbPath.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <span className="text-gray-400">/</span>
                        <button
                          onClick={() => navigateBack(index)}
                          className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-20"
                        >
                          {item.title}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Collections and Books List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : searchQuery ? (
                  // Search Results View
                  <div className="space-y-2">
                    {/* Search Results Header */}
                    <div className="text-sm text-gray-500 mb-3">
                      {isSearching ? 'Searching...' : `Found ${searchResults.collections.length + searchResults.books.length} results`}
                    </div>
                    
                    {/* Collections in Search Results */}
                    {searchResults.collections.map((collection) => (
                      <div 
                        key={collection.id} 
                        className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                        onClick={() => navigateToSearchResult(collection, 'collection')}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📁</span>
                          <div>
                            <div className="font-medium">{collection.title}</div>
                            <div className="text-xs text-gray-500">Collection</div>
                          </div>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(collection, 'collection');
                            }}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            {isFavorite(collection.id) ? '⭐' : '☆'}
                          </button>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}

                    {/* Books in Search Results */}
                    {searchResults.books.map((book) => (
                      <div 
                        key={book.id} 
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group ${
                          currentBook?.id === book.id 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => navigateToSearchResult(book, 'book')}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📖</span>
                          <div>
                            <div className="font-medium">{book.title}</div>
                            <div className="text-xs text-gray-500">Book</div>
                          </div>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(book, 'book');
                          }}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          {isFavorite(book.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                    ))}

                    {/* No Search Results */}
                    {!isSearching && searchResults.collections.length === 0 && searchResults.books.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">🔍</div>
                        <div>No results found for "{searchQuery}"</div>
                        <div className="text-sm mt-1">Try a different search term</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Normal View (Current Level)
                  <div className="space-y-2">
                    {/* Favorites Folder - Only show at root level */}
                    {breadcrumbPath.length === 0 && favorites.length > 0 && (
                      <>
                        {/* Favorites Folder */}
                        <div 
                          className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                          onClick={() => navigateToFavoritesFolder()}
                        >
                          <span className="flex items-center">
                            <span className="mr-2">⭐</span>
                            <span>Favorites</span>
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        
                        {/* Break line */}
                        <div className="border-t border-gray-200 my-3"></div>
                      </>
                    )}

                    {/* Show favorites when viewing favorites folder */}
                    {viewingFavorites && (
                      <>
                        {favorites.map((favorite) => (
                          <div 
                            key={favorite.id} 
                            className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                            onClick={() => navigateToFavorite(favorite)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">📖</span>
                              <div>
                                <div className="font-medium">{favorite.title}</div>
                                <div className="text-xs text-gray-500">Book</div>
                              </div>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFavorite(favorite.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Collections - Only show when not viewing favorites */}
                    {!viewingFavorites && currentLevel.map((collection) => (
                      <div 
                        key={collection.id} 
                        className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                        onClick={() => navigateToCollection(collection)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📁</span>
                          {collection.title}
                        </span>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}

                    {/* Books - Only show when not viewing favorites */}
                    {!viewingFavorites && books.map((book) => (
                      <div 
                        key={book.id} 
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group ${
                          currentBook?.id === book.id 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleBookClick(book)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📖</span>
                          {book.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(book, 'book');
                          }}
                          className="text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          {isFavorite(book.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                    ))}

                    {!viewingFavorites && currentLevel.length === 0 && books.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        No collections or books found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default BookSidebar;
