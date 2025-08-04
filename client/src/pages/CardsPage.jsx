import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ReadOnlySectionBrowser from '../components/cards_page/ReadOnlySectionBrowser';  
import CardDrawer from '../components/cards_page/CardDrawer';
import { useBook } from '../context/BookContext';
import { useUrlState } from '../hooks/useUrlState';
import { useSections } from '../hooks/useSections';

const CardsPage = () => {
  const { currentBook } = useBook();
  const { sectionId, selectSection } = useUrlState();
  const [selectedSection, setSelectedSection] = useState(null);
  const { sections } = useSections(currentBook);

  // Fetch selected section data when sectionId changes
  useEffect(() => {
    const fetchSection = async () => {
      if (sectionId) {
        const { data, error } = await supabase
          .from('source_sections')
          .select('*')
          .eq('id', sectionId)
          .single();
        
        if (data) {
          setSelectedSection(data);
        } else {
          setSelectedSection(null);
        }
      } else {
        setSelectedSection(null);
      }
    };

    fetchSection();
  }, [sectionId]);

  // Auto-select first section when no section is in URL and sections are loaded
  useEffect(() => {
    if (!sectionId && sections.length > 0) {
      const firstSection = sections[0];
      handleSectionSelect(firstSection);
    }
  }, [sections]);

  const handleSectionSelect = (section) => {
    selectSection(section.id);
  };

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      const { data: updatedSection, error } = await supabase
        .from('source_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating section:', error);
        return;
      }

      // Update the selected section state
      setSelectedSection(updatedSection);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Section Browser - Takes half the space */}
      <div className="w-1/2">
        <ReadOnlySectionBrowser 
          onSectionSelect={handleSectionSelect}
          selectedSection={selectedSection}
          book={currentBook}
          sections={sections}
        />
      </div>

      {/* Card Area - Takes half the space */}
      <div className="w-1/2 border-l border-gray-200">
        {selectedSection ? (
          <CardDrawer
            selectedSection={selectedSection}
            onUpdateSection={handleUpdateSection}
            book={currentBook}
          />
        ) : (
          <div className="h-full bg-white flex items-center justify-center">
            <div className="text-gray-500">Select a section to view its cards</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardsPage; 