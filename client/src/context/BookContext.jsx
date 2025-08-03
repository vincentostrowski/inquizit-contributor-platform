import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUrlState } from '../hooks/useUrlState';
import { supabase } from '../services/supabaseClient';

const BookContext = createContext();

export const useBook = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};

export const BookProvider = ({ children }) => {
  const [currentBook, setCurrentBook] = useState(null);
  const { bookId } = useUrlState();

  // Sync URL to context - fetch book data when bookId changes
  useEffect(() => {
    const fetchBook = async () => {
      if (bookId && (!currentBook || currentBook.id !== bookId)) {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single();
        
        if (data) {
          setCurrentBook(data);
        } else {
          setCurrentBook(null);
        }
      } else if (!bookId) {
        setCurrentBook(null);
      }
    };

    fetchBook();
  }, [bookId]);

  const value = {
    currentBook
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
}; 