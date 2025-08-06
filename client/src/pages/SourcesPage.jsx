import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import SectionBrowser from '../components/sources/SectionBrowser';  
import ContentDrawer from '../components/sources/ContentDrawer';
import { useBook } from '../context/BookContext';
import { useUrlState } from '../hooks/useUrlState';
import { useSections } from '../hooks/useSections';
import { findNodeById } from '../utils/treeUtils';

const Sources = () => {
  const { currentBook } = useBook();
  const { sectionId, selectSection } = useUrlState();
  const [selectedSection, setSelectedSection] = useState(null);
  const refreshSectionsRef = useRef(null);
  const { sections, updateSection: updateSectionFromHook, createSection, deleteSection } = useSections(currentBook);

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

  const handleSectionsRefresh = (refreshSections) => {
    refreshSectionsRef.current = refreshSections;
  };

  const handleCreateSection = async (parentSection = null) => {
    const newSection = await createSection(parentSection);
    if (newSection) {
      onSectionSelect(newSection);
    }
  };

  const handleDeleteSection = async (section) => {
    const success = await deleteSection(section.id);
    if (success && selectedSection?.id === section.id) {
      setSelectedSection(null);
    }
  };

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      // Use the useSections hook's updateSection function to ensure consistency
      const updatedSection = await updateSectionFromHook(sectionId, updates);
      
      if (updatedSection) {
        // Update the selected section state
        setSelectedSection(updatedSection);
      }

      // If a section is being changed from done to not done, update ancestors
      if (updates.sources_done === false) {
        await updateAncestorsIfDone(sectionId);
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const updateAncestorsIfDone = async (sectionId) => {
    try {
      // Find the section in the tree to get its ancestors
      const section = findNodeById(sections, sectionId);
      if (!section) return;

      // Get all ancestor IDs (parent, grandparent, etc.)
      const ancestorIds = getAncestorIds(sections, sectionId);
      
      // Update each ancestor that is currently done
      for (const ancestorId of ancestorIds) {
        const ancestor = findNodeById(sections, ancestorId);
        if (ancestor && ancestor.sources_done) {
          await updateSectionFromHook(ancestorId, { sources_done: false });
        }
      }
    } catch (error) {
      console.error('Error updating ancestors:', error);
    }
  };

  const getAncestorIds = (tree, targetId, parentId = null, path = []) => {
    for (const node of tree) {
      if (node.id === targetId) {
        return path;
      }
      
      if (node.children && node.children.length > 0) {
        const found = getAncestorIds(node.children, targetId, node.id, [...path, node.id]);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="flex h-full">
      {/* Section Browser - Takes half the space */}
      <div className="w-1/2">
        <SectionBrowser 
          onSectionSelect={handleSectionSelect}
          selectedSection={selectedSection}
          book={currentBook}
          sections={sections}
          onSectionsRefresh={handleSectionsRefresh}
          onCreateSection={handleCreateSection}
          onDeleteSection={handleDeleteSection}
          onUpdateSection={handleUpdateSection}
        />
      </div>

      {/* Content Area - Takes half the space */}
      <div className="w-1/2 border-l border-gray-200">
        {selectedSection ? (
          <ContentDrawer
            selectedSection={selectedSection}
            onUpdateSection={handleUpdateSection}
            sections={sections}
          />
        ) : (
          <div className="h-full bg-white flex items-center justify-center">
            <div className="text-gray-500">Select a section to view its content</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sources;
