import React, { useState } from 'react';

const ThemeInjectionsLibrary = ({ 
  themeInjectionsData
}) => {
  // Local state for expanded scenarios
  const [expandedScenarios, setExpandedScenarios] = useState(new Set());
  
  // Extract scenarios from themeInjectionsData
  const scenarios = themeInjectionsData?.theme_injections || [];
  
  // Handle toggling scenario expansion
  const handleToggleScenario = (scenarioId) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(scenarioId)) {
      newExpanded.delete(scenarioId);
    } else {
      newExpanded.add(scenarioId);
    }
    setExpandedScenarios(newExpanded);
  };
  
  return (
      <div className="space-y-3">
        {/* Root Scenarios - Scrollable Container */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg">
                {/* Main Scenario */}
                <div className={`p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg ${!expandedScenarios.has(scenario.id) || !scenario.children ? 'rounded-b-lg' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 mb-2">{scenario.content}</div>
                      {scenario.text && (
                        <div className="text-sm text-gray-700 mb-2">{scenario.text}</div>
                      )}
                      {scenario.tags && scenario.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scenario.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {scenario.children && scenario.children.length > 0 && (
                      <button
                        onClick={() => handleToggleScenario(scenario.id)}
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
                    )}
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
                                    onClick={() => handleToggleScenario(child.id)}
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
                              {child.text && (
                                <div className="text-sm text-gray-600 mb-2">{child.text}</div>
                              )}
                              {child.tags && child.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {child.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Sub-children (4th level) */}
                            {expandedScenarios.has(child.id) && child.children && (
                              <div className="border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                <div className="p-3">
                                  <div className="space-y-2">
                                    {child.children.map((subChild) => (
                                      <div key={subChild.id} className="border border-gray-200 rounded-lg bg-white p-3">
                                        <div className="text-sm text-gray-700 mb-2">{subChild.content}</div>
                                        {subChild.text && (
                                          <div className="text-sm text-gray-500 mb-2">{subChild.text}</div>
                                        )}
                                        {subChild.tags && subChild.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {subChild.tags.map(tag => (
                                              <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                {tag}
                                              </span>
                                            ))}
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default ThemeInjectionsLibrary;
