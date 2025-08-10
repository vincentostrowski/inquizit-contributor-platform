import React, { useState, useEffect } from 'react';
import { useBook } from '../context/BookContext';
import { useSections } from '../hooks/useSections';
import { useUrlState } from '../hooks/useUrlState';
import { supabase } from '../services/supabaseClient';
import OrganizeLeftPanel from '../components/organize/OrganizeLeftPanel';

const Organize = () => {
  const { currentBook } = useBook();
  const { sections } = useSections(currentBook);
  const { bookId, selectBook } = useUrlState();
  
  // Debug logging
  useEffect(() => {
    console.log('Organize page - currentBook:', currentBook);
    console.log('Organize page - sections:', sections);
    console.log('Organize page - bookId from URL:', bookId);
  }, [currentBook, sections, bookId]);
  
  // If no book is selected, show a message
  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No book selected
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Please select a book from the sidebar to organize its cards.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full bg-white">
      {/* Left Half - Current Organization */}
      <div className="w-1/2 border-r border-gray-200 overflow-hidden">
        <OrganizeLeftPanel sections={sections} />
      </div>
      
      {/* Right Half - New Organization (placeholder for now) */}
      <div className="w-1/2 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">New Organization</h2>
        <p className="text-gray-500">Right panel coming soon...</p>
      </div>
    </div>
  );
};

export default Organize;
