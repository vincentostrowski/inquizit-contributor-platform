import { useState, useMemo } from 'react';

export const useThemeInjections = (themeInjectionsData = null) => {
  const [selectedTag, setSelectedTag] = useState('all');
  const [expandedScenarios, setExpandedScenarios] = useState(new Set());
  const [showTags, setShowTags] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Parse theme injections data
  const scenarios = useMemo(() => {
    if (!themeInjectionsData) return [];
    
    try {
      const parsed = JSON.parse(themeInjectionsData);
      if (parsed.theme_injections && Array.isArray(parsed.theme_injections)) {
        // Direct use of hierarchical structure - no transformation needed
        return parsed.theme_injections.map(scenario => ({
          id: `scenario-${scenario.id}`,
          content: scenario.text,
          tags: scenario.tags || [],
          children: (scenario.children || []).map(child => ({
            id: `scenario-${scenario.id}-${child.id}`,
            content: child.text,
            tags: child.tags || []
          }))
        }));
      }
    } catch (error) {
      console.error('Error parsing theme injections data:', error);
    }
    
    return [];
  }, [themeInjectionsData]);

  // Helper functions for theme injections library
  const availableTags = useMemo(() => {
    const allTags = new Set();
    scenarios.forEach(scenario => {
      scenario.tags.forEach(tag => allTags.add(tag));
      scenario.children?.forEach(child => {
        child.tags.forEach(tag => allTags.add(tag));
      });
    });
    return Array.from(allTags).sort();
  }, [scenarios]);

  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return availableTags;
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [availableTags, tagSearchQuery]);

  const filteredScenarios = useMemo(() => {
    if (selectedTag === 'all') return scenarios;
    return scenarios.filter(scenario => 
      scenario.tags.includes(selectedTag) || 
      scenario.children?.some(child => child.tags.includes(selectedTag))
    );
  }, [scenarios, selectedTag]);

  const toggleScenario = (scenarioId) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  const resetTagSearch = () => {
    setTagSearchQuery('');
  };

  const resetTagSelection = () => {
    setSelectedTag('all');
  };

  return {
    selectedTag,
    expandedScenarios,
    showTags,
    tagSearchQuery,
    availableTags,
    filteredTags,
    filteredScenarios,
    setSelectedTag,
    setTagSearchQuery,
    setShowTags,
    toggleScenario,
    resetTagSearch,
    resetTagSelection
  };
};
