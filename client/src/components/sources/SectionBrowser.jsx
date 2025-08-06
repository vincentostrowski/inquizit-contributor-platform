import React, { useState, useEffect } from 'react';
import Section from './Section';
import CreateSectionButton from './CreateSectionButton';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useSections } from '../../hooks/useSections';

const SectionBrowser = ({ onSectionSelect, selectedSection, book, sections, onSectionsRefresh, onCreateSection, onDeleteSection, onUpdateSection }) => {
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, section: null });
  
  const { 
    loading, 
    error, 
    updateSection,
    refreshSections
  } = useSections(book);

  // Expose refresh function to parent
  useEffect(() => {
    if (onSectionsRefresh) {
      onSectionsRefresh(refreshSections);
    }
  }, [onSectionsRefresh, refreshSections]);

  const handleCreateSection = async () => {
    const newSection = await onCreateSection();
    if (newSection) {
      onSectionSelect(newSection);
    }
  };

  const handleCreateSubsection = async (parentSection) => {
    const newSubsection = await onCreateSection(parentSection);
    if (newSubsection) {
      onSectionSelect(newSubsection);
    }
  };

  const handleUpdateSection = async (sectionId, updates) => {
    // Use parent's update function if provided, otherwise use local hook
    if (onUpdateSection) {
      const updatedSection = await onUpdateSection(sectionId, updates);
      if (updatedSection && selectedSection?.id === sectionId) {
        onSectionSelect(updatedSection);
      }
    } else {
      const updatedSection = await updateSection(sectionId, updates);
      if (updatedSection && selectedSection?.id === sectionId) {
        onSectionSelect(updatedSection);
      }
    }
  };

  const handleDeleteSection = (section) => {
    setDeleteDialog({ isOpen: true, section });
  };

  const confirmDelete = async () => {
    if (deleteDialog.section) {
      await onDeleteSection(deleteDialog.section);
    }
    setDeleteDialog({ isOpen: false, section: null });
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, section: null });
  };

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {sections.map((section) => (
            <Section
              key={section.id}
              section={section}
              selectedSectionId={selectedSection?.id}
              onSelect={onSectionSelect}
              onCreateSubsection={handleCreateSubsection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
            />
          ))}
        </div>

        {/* Create Section Button */}
        <CreateSectionButton onClick={handleCreateSection} />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteDialog.section?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SectionBrowser; 