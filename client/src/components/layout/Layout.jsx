import React, { useState } from 'react';
import BookSidebar from '../sidebar/BookSidebar';
import MainContent from './MainContent';
import { useBook } from '../../context/BookContext';

const Layout = () => {
  const [isBookSidebarOpen, setIsBookSidebarOpen] = useState(true);
  const { currentBook } = useBook();

  const toggleBookSidebar = () => {
    setIsBookSidebarOpen(!isBookSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <BookSidebar isOpen={isBookSidebarOpen} onToggle={toggleBookSidebar} />
      
      {/* Main Content Area */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out
      `}>
        <MainContent currentBook={currentBook} />
      </div>
    </div>
  );
};

export default Layout; 