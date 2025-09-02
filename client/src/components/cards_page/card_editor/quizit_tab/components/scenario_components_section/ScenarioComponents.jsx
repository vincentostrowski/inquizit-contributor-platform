const ScenarioComponents = ({ components, onComponentStructureChange }) => {

    const handleComponentEdit = (id, newText) => {
      onComponentStructureChange(prev => ({
        ...prev,
        components: prev.components.map(comp => 
          comp.id === id ? { ...comp, text: newText } : comp
        )
      }));
    };

    const remapComponentIds = (components) => {
      // Create a mapping from old IDs to new IDs
      const idMapping = {};
      components.forEach((comp, index) => {
        const newId = String.fromCharCode(65 + index); // A = 65, B = 66, etc
        idMapping[comp.id] = newId;
      });
      
      // Remap components with new IDs and updated prerequisite references
      return components.map((comp, index) => ({
        ...comp,
        id: String.fromCharCode(65 + index), // A = 65, B = 66, etc
        prerequisites: comp.prerequisites ? comp.prerequisites.map(prereqId => idMapping[prereqId]).filter(Boolean) : []
      }));
    };

    const handleComponentDelete = (id) => {
      onComponentStructureChange(prev => {
        // First, remove the deleted component
        let updatedComponents = prev.components.filter(comp => comp.id !== id);
        
        // Then, clean up dependencies by removing references to the deleted component
        updatedComponents = updatedComponents.map(comp => ({
          ...comp,
          prerequisites: comp.prerequisites ? comp.prerequisites.filter(prereqId => prereqId !== id) : []
        }));
        
        // Finally, remap the IDs to maintain sequential order
        return {
          ...prev,
          components: remapComponentIds(updatedComponents)
        };
      });
    };

    const handleComponentTypeToggle = (id) => {
      onComponentStructureChange(prev => ({
        ...prev,
        components: prev.components.map(comp => comp.id === id ? { ...comp, type: comp.type === 'scenario' ? 'reasoning' : 'scenario' } : comp)
      }));
    };

    return (
        <div>
            <div className="text-xs text-gray-600 font-medium mb-2">Scenario Components</div>
            <div className="space-y-2">
              {components.map((component) => (
                <div key={component.id} className="flex items-center space-x-3">
                  <div className="flex-1 bg-white rounded border border-gray-200 p-3">
                    <div className="text-sm text-gray-900">
                      <div className="flex">
                        <span className="font-bold text-gray-700 flex-shrink-0 mr-3">{component.id})</span>
                        <textarea
                          className="flex-1 text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden"
                          placeholder="Enter component text..."
                          rows={1}
                          style={{ minHeight: '1.5rem' }}
                          value={component.text}
                          onChange={(e) => handleComponentEdit(component.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Button */}
                  <button
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Move to Reasoning Components"
                    onClick={() => handleComponentTypeToggle(component.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete component"
                    onClick={() => handleComponentDelete(component.id)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
    )
}

export default ScenarioComponents;