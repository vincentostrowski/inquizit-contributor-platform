import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabaseClient';

const TextEditor = ({ section, selectedSnippet, onSnippetSelect }) => {
  // Check if section is marked as done
  const isReadOnly = section?.sources_done || false;
  const [content, setContent] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving'
  const [lastSavedContent, setLastSavedContent] = useState('');
  const maxCharacters = 10000;

  // Update content when selected snippet changes
  useEffect(() => {
    if (selectedSnippet) {
      const snippetContent = selectedSnippet.content || '';
      setContent(snippetContent);
      setLastSavedContent(snippetContent);
      setSaveStatus('saved');
    } else {
      setContent('');
      setLastSavedContent('');
      setSaveStatus('saved');
    }
  }, [selectedSnippet]);

  // Update character count when content changes
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  // Check if content has changed
  const hasChanges = content !== lastSavedContent;

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!selectedSnippet || !hasChanges) return;

    setSaveStatus('saving');
    
    try {
      const { data, error } = await supabase
        .from('source_snippets')
        .update({ content: content })
        .eq('id', selectedSnippet.id)
        .select();
      
      if (!error) {
        setLastSavedContent(content);
        setSaveStatus('saved');
        // Update the snippet in local state
        onSnippetSelect({ ...selectedSnippet, content: content });
      } else {
        setSaveStatus('unsaved');
      }
    } catch (error) {
      setSaveStatus('unsaved');
    }
  }, [selectedSnippet, content, hasChanges, lastSavedContent, onSnippetSelect]);

  // Manual save function
  const handleManualSave = async () => {
    await performSave();
  };

  // Auto-save effect
  useEffect(() => {
    if (hasChanges && selectedSnippet) {
      setSaveStatus('unsaved');
      console.log('Auto-saving...');
      const timer = setTimeout(() => {
        performSave();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [content, selectedSnippet, hasChanges, performSave]);

  const handleContentChange = (e) => {
    // Don't allow changes if section is marked as done
    if (isReadOnly) return;

    const newContent = e.target.value;
    if (newContent.length <= maxCharacters) {
      setContent(newContent);
    }
  };

  // Get save button text and styling
  const getSaveButtonProps = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          text: 'Saving...',
          className: 'px-3 py-1 text-gray-500 rounded text-sm transition-colors cursor-not-allowed'
        };
      case 'saved':
        return {
          text: 'Saved',
          className: 'px-3 py-1 text-green-600 rounded text-sm transition-colors'
        };
      case 'unsaved':
        return {
          text: 'Unsaved',
          className: 'px-3 py-1 text-orange-600 rounded text-sm hover:text-orange-700 transition-colors cursor-pointer'
        };
      default:
        return {
          text: 'Save',
          className: 'px-3 py-1 text-gray-500 rounded text-sm hover:text-blue-700 transition-colors'
        };
    }
  };

  const saveButtonProps = getSaveButtonProps();

  return (
    <div className="h-full flex flex-col">
      {/* Text Editor */}
      <div className="flex-1 mb-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          readOnly={isReadOnly}
          placeholder={isReadOnly ? "This section is marked as done. Press 'Edit' above to make changes." : "Enter your content here. It will be used to generate the idea cards for this section."}
          className={`w-full h-full p-3 border border-gray-300 rounded-lg resize-none text-sm ${
            isReadOnly 
              ? 'bg-gray-50 text-gray-600 cursor-default' 
              : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
        />
      </div>

      {/* Character Counter and Save */}
      <div className="flex justify-between items-center h-8">
        <span className={`text-xs ${
          characterCount > maxCharacters * 0.9 
            ? 'text-red-600' 
            : 'text-gray-500'
        }`}>
          {characterCount} / {maxCharacters}
        </span>
        <div className="h-6">
          {!isReadOnly && content.trim() && (
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving' || !hasChanges}
              className={saveButtonProps.className}
            >
              {saveButtonProps.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextEditor; 