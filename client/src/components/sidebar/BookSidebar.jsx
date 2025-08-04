import React, { useState, useEffect, forwardRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useBook } from '../../context/BookContext';
import { useUrlState } from '../../hooks/useUrlState';

const BookSidebar = forwardRef(({ isOpen, onToggle }, ref) => {
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const { currentBook } = useBook();
  const { selectBook } = useUrlState();

  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem('bookSidebarState');
      if (savedState) {
        const { breadcrumbPath: savedPath, currentLevel: savedLevel, books: savedBooks } = JSON.parse(savedState);
        setBreadcrumbPath(savedPath || []);
        setCurrentLevel(savedLevel || []);
        setBooks(savedBooks || []);
        return true;
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    }
    return false;
  };

  // Save current state to localStorage
  const saveCurrentState = () => {
    try {
      const stateToSave = {
        breadcrumbPath,
        currentLevel,
        books
      };
      localStorage.setItem('bookSidebarState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
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
    
    // Save state after fetching collections
    setTimeout(() => saveCurrentState(), 100);
  };

  const fetchBooks = async (collectionId) => {
    const { data, error } = await supabase
      .from('books')
      .select('id, title')
      .eq('collection', collectionId);
    if (data) {
      setBooks(data);
    } else {
      setBooks([]);
    }
    
    // Save state after fetching books
    setTimeout(() => saveCurrentState(), 100);
  };

  // Navigate to a specific collection
  const navigateToCollection = async (collection) => {
    setLoading(true);
    const newPath = [...breadcrumbPath, collection];
    setBreadcrumbPath(newPath);
    
    await fetchCollections(collection.id);
    await fetchBooks(collection.id);
    setLoading(false);
    
    // Save state after navigation
    setTimeout(() => saveCurrentState(), 100);
  };

  // Navigate back to a specific level
  const navigateBack = async (levelIndex) => {
    setLoading(true);
    const newPath = breadcrumbPath.slice(0, levelIndex + 1);
    setBreadcrumbPath(newPath);
    
    if (levelIndex === -1) {
      // Go back to root
      await fetchCollections(null);
      setBooks([]); // Clear books when going to root
    } else {
      // Go back to specific level
      const targetCollection = newPath[newPath.length - 1];
      await fetchCollections(targetCollection.id);
      await fetchBooks(targetCollection.id);
    }
    setLoading(false);
    
    // Save state after navigation
    setTimeout(() => saveCurrentState(), 100);
  };

  // Handle book selection
  const handleBookClick = async (book) => {
    // Don't re-select if already selected
    if (currentBook?.id === book.id) return;
    selectBook(book.id);
  };

  // Initialize with saved state or root collections
  useEffect(() => {
    setLoading(true);
    
    // Try to load saved state first
    const hasSavedState = loadSavedState();
    
    if (!hasSavedState) {
      // If no saved state, start with root collections
      fetchCollections(null);
    }
    
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
                ) : (
                  <div className="space-y-2">
                    {/* Collections */}
                    {currentLevel.map((collection) => (
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

                    {/* Books */}
                    {books.map((book) => (
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
                      </div>
                    ))}

                    {currentLevel.length === 0 && books.length === 0 && !loading && (
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
