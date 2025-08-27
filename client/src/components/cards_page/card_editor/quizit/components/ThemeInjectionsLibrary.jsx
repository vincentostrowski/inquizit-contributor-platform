import React from 'react';

const ThemeInjectionsLibrary = ({ 
  showTags, 
  selectedTag, 
  tagSearchQuery, 
  availableTags, 
  filteredTags, 
  filteredScenarios, 
  expandedScenarios, 
  onToggleTags, 
  onTagSelect, 
  onTagSearchChange, 
  onToggleScenario, 
  onViewSwaps, 
  onReset,
  showHeader = true,
  noBackground = false
}) => {
  return (
    <div className={`${noBackground ? 'p-0' : 'bg-white rounded-lg p-4'}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="font-medium">Theme Injections</label>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredScenarios.length + filteredScenarios.reduce((total, scenario) => total + (scenario.children?.length || 0), 0)} items
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewSwaps}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              View Swaps
            </button>
            <button
              onClick={onToggleTags}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              {showTags ? 'Hide Filter' : 'Filter By Tags'}
            </button>
            <button
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              title="Reset theme injections"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      
      {/* Tag Filter - Only visible when tags are shown */}
      {showTags && (
        <div className="mb-4">
          {/* Tag Count */}
          <div className="mb-3">
            <span className="text-xs text-gray-500">
              {filteredTags.length} of {availableTags.length} tags
            </span>
          </div>
          
          {/* Tag Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearchQuery}
                onChange={(e) => onTagSearchChange(e.target.value)}
                className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Tag Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTagSelect('all')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedTag === 'all' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {filteredTags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedTag === tag 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchical Scenarios */}
      <div className="space-y-3">
        {/* Root Scenarios - Scrollable Container */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-3 pr-2">
            {filteredScenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg">
                {/* Main Scenario */}
                <div className={`p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg ${!expandedScenarios.has(scenario.id) || !scenario.children ? 'rounded-b-lg' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 mb-2">{scenario.content}</div>
                      <div className="flex flex-wrap gap-1">
                        {scenario.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleScenario(scenario.id)}
                      className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                      title="Toggle children"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedScenarios.has(scenario.id) ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Children Scenarios - Scrollable Container */}
                {expandedScenarios.has(scenario.id) && scenario.children && (
                  <div className="p-3 bg-white rounded-b-lg">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2 pr-2">
                        {scenario.children.map((child) => (
                          <div key={child.id} className="border border-gray-200 rounded-lg bg-white">
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-800">{child.content}</div>
                                {child.children && (
                                  <button
                                    onClick={() => onToggleScenario(child.id)}
                                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                    title="Toggle sub-children"
                                  >
                                    <svg 
                                      className={`w-3 h-3 transition-transform ${expandedScenarios.has(child.id) ? 'rotate-180' : ''}`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {child.tags.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Sub-children (4th level) */}
                            {expandedScenarios.has(child.id) && child.children && (
                              <div className="border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                <div className="p-3">
                                  <div className="space-y-2">
                                    {child.children.map((subChild) => (
                                      <div key={subChild.id} className="border border-gray-200 rounded-lg bg-white p-3">
                                        <div className="text-sm text-gray-700 mb-2">{subChild.content}</div>
                                        <div className="flex flex-wrap gap-1">
                                          {subChild.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeInjectionsLibrary;
