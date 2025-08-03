import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import SectionBrowser from '../components/sources/SectionBrowser';  
import ContentDrawer from '../components/sources/ContentDrawer';
import { useBook } from '../context/BookContext';
import { useUrlState } from '../hooks/useUrlState';

const Sources = () => {
  const { currentBook } = useBook();
  const { sectionId, selectSection } = useUrlState();
  const [selectedSection, setSelectedSection] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const refreshSectionsRef = useRef(null);

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
          setDrawerOpen(true);
        } else {
          setSelectedSection(null);
          setDrawerOpen(false);
        }
      } else {
        setSelectedSection(null);
        setDrawerOpen(false);
      }
    };

    fetchSection();
  }, [sectionId]);

  const handleSectionSelect = (section) => {
    selectSection(section.id);
  };

  const handleSectionsRefresh = (refreshSections) => {
    refreshSectionsRef.current = refreshSections;
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

      // Refresh the SectionBrowser to reflect the changes
      if (refreshSectionsRef.current) {
        await refreshSectionsRef.current();
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  return (
    <div className="flex h-full">
            {/* Section Browser - Takes remaining space */}
            <div className={`
              ${drawerOpen ? 'w-1/2' : 'w-full'}
            `}>
              <SectionBrowser 
                onSectionSelect={handleSectionSelect}
                selectedSection={selectedSection}
                book={currentBook}
                onSectionsRefresh={handleSectionsRefresh}
              />
            </div>

            {/* Content Drawer - Slides in from right */}
            {drawerOpen && selectedSection && (
              <div className="w-1/2 border-l border-gray-200">
                <ContentDrawer
                  selectedSection={selectedSection}
                  onUpdateSection={handleUpdateSection}
                />
              </div>
            )}
          </div>
  );
};

export default Sources;
