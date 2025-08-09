import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';

const NotesSection = ({ section, selectedSnippet, onSnippetSelect, onCharacterCountChange }) => {
  const [snippets, setSnippets] = useState([]);

  // Fetch snippets for the selected section and ensure at least one exists
  useEffect(() => {
    const fetchSnippets = async () => {
      if (section) {
        const { data, error } = await supabase
          .from('source_snippets')
          .select('*')
          .eq('section_id', section.id)
          .order('created_at', { ascending: true });

        if (data) {
          // If no snippets exist, create one empty snippet
          if (data.length === 0) {
            const { data: newSnippet, error: createError } = await supabase
              .from('source_snippets')
              .insert({
                section_id: section.id,
                content: '',
                order: 0
              })
              .select()
              .single();

            if (!createError && newSnippet) {
              setSnippets([newSnippet]);
              onSnippetSelect(newSnippet);
              return;
            } else {
              console.error('Error creating snippet:', createError);
            }
          } else {
            setSnippets(data);
          }
        }
      }
    };
    fetchSnippets();
  }, [section?.id]); // Only depend on section ID to prevent double snippet creation

  // Update local snippets state when selectedSnippet changes (e.g., when TextEditor saves content)
  useEffect(() => {
    if (selectedSnippet && snippets.length > 0) {
      const updatedSnippets = snippets.map(snippet => 
        snippet.id === selectedSnippet.id ? selectedSnippet : snippet
      );
      setSnippets(updatedSnippets);
      
      // Calculate and pass up new character count
      const totalChars = updatedSnippets.reduce((sum, s) => sum + (s.content?.length || 0), 0);
      onCharacterCountChange?.(totalChars);
    }
  }, [selectedSnippet, onCharacterCountChange]);

  // Auto-select first snippet when selectedSnippet is null but snippets exist
  useEffect(() => {
    if (snippets.length > 0 && !selectedSnippet && section) {
      onSnippetSelect(snippets[0]);
    }
  }, [section, snippets]);

  // Calculate character count whenever snippets change
  useEffect(() => {
    const totalChars = snippets.reduce((sum, s) => sum + (s.content?.length || 0), 0);
    onCharacterCountChange?.(totalChars);
  }, [snippets, onCharacterCountChange]);

  const handleSnippetSelect = (snippet) => {
    onSnippetSelect(snippet);
  };

  const handleCreateSnippet = async () => {
    if (!section) return;

    try {
      const { data: newSnippet, error } = await supabase
        .from('source_snippets')
        .insert({
          section_id: section.id,
          content: '',
          order: snippets.length
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating snippet:', error);
        return;
      }

      // Refresh snippets and select the new one
      const { data: updatedSnippets } = await supabase
        .from('source_snippets')
        .select('*')
        .eq('section_id', section.id)
        .order('created_at', { ascending: true });

      if (updatedSnippets) {
        setSnippets(updatedSnippets);
        onSnippetSelect(newSnippet);
      }
    } catch (error) {
      console.error('Error creating snippet:', error);
    }
  };

  const handleDeleteSnippet = async (snippetId, e) => {
    e.stopPropagation();
    
    // Prevent deleting the last snippet
    if (snippets.length <= 1) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('source_snippets')
        .delete()
        .eq('id', snippetId);

      if (error) {
        console.error('Error deleting snippet:', error);
        return;
      }

      // Refresh snippets
      const { data: updatedSnippets } = await supabase
        .from('source_snippets')
        .select('*')
        .eq('section_id', section.id)
        .order('created_at', { ascending: true });

      if (updatedSnippets) {
        setSnippets(updatedSnippets);
        
        // If we deleted the currently selected snippet, select the first available one
        if (selectedSnippet?.id === snippetId) {
          if (updatedSnippets.length > 0) {
            onSnippetSelect(updatedSnippets[0]);
          } else {
            onSnippetSelect(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
    }
  };

  const isDone = section?.sources_done || false;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
      {snippets.map((snippet) => (
        <div
          key={snippet.id}
          onClick={() => handleSnippetSelect(snippet)}
          className={`p-3 rounded-lg cursor-pointer transition-colors group ${
            selectedSnippet?.id === snippet.id
              ? 'bg-blue-100 border border-blue-300'
              : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800 flex-1 min-w-0">
              {snippet.content ? 
                (snippet.content.length > 50 ? 
                  `${snippet.content.substring(0, 50)}...` : 
                  snippet.content
                ) : 
                'Empty snippet'
              }
            </span>
            
            {/* Delete Button - Only show on hover and when there's more than one snippet */}
            {snippets.length > 1 && (
              <button
                onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                className="w-5 h-5 flex items-center justify-center hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100 ml-2"
                title="Delete snippet"
              >
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add New Snippet Button - hidden when section is marked done */}
      {!isDone && (
        <button 
          onClick={handleCreateSnippet}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-gray-600 text-sm font-medium">Add another body of text</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default NotesSection; 