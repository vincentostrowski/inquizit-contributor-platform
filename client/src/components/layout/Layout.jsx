import React, { useState, useRef, useEffect } from 'react';
import BookSidebar from '../sidebar/BookSidebar';
import MainContent from './MainContent';
import { useBook } from '../../context/BookContext';

const Layout = () => {
  const [isBookSidebarOpen, setIsBookSidebarOpen] = useState(true);
  const { currentBook } = useBook();
  const sidebarRef = useRef(null);

  const toggleBookSidebar = () => {
    setIsBookSidebarOpen(!isBookSidebarOpen);
  };

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isBookSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsBookSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBookSidebarOpen]);

  return (
    <div className="h-screen bg-gray-50 w-full">
      {/* Floating Sidebar */}
      <BookSidebar ref={sidebarRef} isOpen={isBookSidebarOpen} onToggle={toggleBookSidebar} />
      
      {/* Pull-out tab when sidebar is closed */}
      {!isBookSidebarOpen && (
        <div className="fixed top-1/2 left-0 transform -translate-y-1/2 z-50">
          <button
            onClick={toggleBookSidebar}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-lg shadow-lg transition-colors duration-200 flex items-center justify-center"
            title="Open Book Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Main Content Area - Full width, no flex layout */}
      <div className="h-full w-full flex flex-col">
        <MainContent currentBook={currentBook} />
      </div>
    </div>
  );
};

export default Layout; 