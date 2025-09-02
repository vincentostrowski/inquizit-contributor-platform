const Dependencies = ({ components, onComponentStructureChange }) => {
  // Filter to only scenario components (reasoning components shouldn't have dependencies)
  const scenarioComponents = components.filter(comp => comp.type === 'scenario');

  // Handle dependency input change
  const handleDependencyChange = (componentId, inputValue) => {
    // Parse input and auto-format with commas and spaces
    const prerequisites = inputValue
      .replace(/[,\s]+/g, '') // Remove existing commas and spaces
      .split('')
      .filter(char => char.length > 0)
      .map(char => char.toUpperCase());

    // Update the component structure
    onComponentStructureChange(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.id === componentId 
          ? { ...comp, prerequisites: prerequisites.length > 0 ? prerequisites : [] }
          : comp
      )
    }));
  };

  // If no scenario components, show message
  if (scenarioComponents.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="text-xs text-gray-600 mb-2 font-medium">Dependencies:</div>
        <div className="text-xs text-gray-500 italic">
          No scenario components found
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
      <div className="text-xs text-gray-600 mb-2 font-medium">Dependencies:</div>
      <div className="space-y-2">
        {scenarioComponents.map((component) => (
          <div key={component.id} className="flex items-center text-xs text-gray-700">
            <span className="font-mono mr-2">{component.id}</span>
            <span className="mx-2">←</span>
            <input
              type="text"
              value={component.prerequisites ? component.prerequisites.join(', ') : ''}
              onChange={(e) => handleDependencyChange(component.id, e.target.value)}
              className="flex-1 text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 font-mono"
              placeholder="_"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dependencies;