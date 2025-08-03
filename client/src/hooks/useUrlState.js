import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export const useUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current state from URL
  const bookId = searchParams.get('book');
  const sectionId = searchParams.get('section');
  const currentPath = location.pathname;

  // Update book selection
  const selectBook = useCallback((bookId) => {
    if (bookId) {
      navigate(`/sources?book=${bookId}`);
    } else {
      navigate('/sources');
    }
  }, [navigate]);

  // Update section selection
  const selectSection = useCallback((sectionId) => {
    const newParams = new URLSearchParams(searchParams);
    if (sectionId) {
      newParams.set('section', sectionId);
      
    } else {
      newParams.delete('section');
    }
    const newUrl = `${location.pathname}?${newParams.toString()}`;
    navigate(newUrl);
  }, [searchParams, location.pathname, navigate]);

  // Navigate to a different page while preserving book/section
  const navigateToPage = useCallback((path) => {
    const newParams = new URLSearchParams(searchParams);
    const newUrl = `${path}?${newParams.toString()}`;
    navigate(newUrl);
  }, [navigate, searchParams]);

  // Clear all state
  const clearState = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return {
    bookId,
    sectionId,
    currentPath,
    selectBook,
    selectSection,
    navigateToPage,
    clearState
  };
}; 