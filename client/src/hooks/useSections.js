import { useState, useEffect } from 'react';
import { sectionService } from '../services/sectionService';
import { buildTreeFromFlat, addCompletionDataToTree } from '../utils/treeUtils';

export const useSections = (book) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sections when book changes
  useEffect(() => {
    if (book) {
      fetchSections();
    } else {
      setSections([]);
    }
  }, [book?.id]); // Use book.id instead of book object

  const fetchSections = async () => {
    if (!book) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await sectionService.fetchSections(book.id);
      const tree = buildTreeFromFlat(data);
      const treeWithCompletion = addCompletionDataToTree(tree);
      setSections(treeWithCompletion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSection = async (parentSection = null) => {
    if (!book) return null;

    try {
      // Create new section using service
      const newSection = await sectionService.createSection({
        title: parentSection ? 'New Subsection' : 'New Section',
        book_id: book.id,
        parent_id: parentSection ? parentSection.id : null
      });

      // Refresh sections to get updated tree
      await fetchSections();
      return newSection;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const updateSection = async (sectionId, updates) => {
    try {
      const updatedSection = await sectionService.updateSection(sectionId, updates);
      await fetchSections();
      return updatedSection;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      await sectionService.deleteSection(sectionId);
      await fetchSections();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    refreshSections: fetchSections
  };
}; 