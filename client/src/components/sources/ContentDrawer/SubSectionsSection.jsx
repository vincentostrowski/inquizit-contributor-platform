import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useUrlState } from '../../../hooks/useUrlState';

const SubSectionsSection = ({ section, sections }) => {
  const { selectSection } = useUrlState();

  // Find children from the hierarchical sections data
  const findChildren = (sections, targetId) => {
    for (const s of sections) {
      if (s.id === targetId) {
        return s.children || [];
      }
      if (s.children && s.children.length > 0) {
        const found = findChildren(s.children, targetId);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  };

  const children = findChildren(sections, section?.id) || [];

  const handleSubSectionSelect = (section) => {
    selectSection(section.id);
  };

  // Only render if there are children
  if (children.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Sub Sections</h3>
      {children.map((childSection) => (
        <div
          key={childSection.id}
          onClick={() => handleSubSectionSelect(childSection)}
          className="p-3 rounded-lg cursor-pointer transition-colors bg-gray-100 hover:bg-gray-200 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">
              {childSection.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubSectionsSection; 