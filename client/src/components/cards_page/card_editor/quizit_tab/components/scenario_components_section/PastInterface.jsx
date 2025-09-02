import { useState } from 'react';

const PastInterface = ({ onComponentStructureChange }) => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validate component structure
  const validateComponentStructure = (data) => {
    if (!data || typeof data !== 'object') {
      return 'Invalid JSON: Root must be an object';
    }

    if (!data.components || !Array.isArray(data.components)) {
      return 'Invalid JSON: Must have a "components" array';
    }

    if (data.components.length === 0) {
      return 'Invalid JSON: Components array cannot be empty';
    }

    // Validate each component
    for (let i = 0; i < data.components.length; i++) {
      const component = data.components[i];
      
      if (!component.id || typeof component.id !== 'string') {
        return `Invalid JSON: Component ${i + 1} must have a valid "id" string`;
      }
      
      if (!component.text || typeof component.text !== 'string') {
        return `Invalid JSON: Component ${i + 1} must have a valid "text" string`;
      }
      
      if (!component.type || !['scenario', 'reasoning'].includes(component.type)) {
        return `Invalid JSON: Component ${i + 1} must have "type" of "scenario" or "reasoning"`;
      }
      
      if (typeof component.isPrerequisite !== 'boolean') {
        return `Invalid JSON: Component ${i + 1} must have a boolean "isPrerequisite"`;
      }
      
      if (!Array.isArray(component.prerequisites)) {
        return `Invalid JSON: Component ${i + 1} must have a "prerequisites" array`;
      }
    }

    return null; // No errors
  };

  // Handle paste functionality
  const handlePaste = async (pastedText) => {
    setError(null);
    setSuccess(false);

    try {
      // Parse JSON
      const parsedData = JSON.parse(pastedText);
      
      // Validate structure
      const validationError = validateComponentStructure(parsedData);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Apply the component structure
      onComponentStructureChange(parsedData);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (parseError) {
      setError('Invalid JSON: ' + parseError.message);
    }
  };

  return (
    <div 
      onPaste={(e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        handlePaste(pastedText);
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          navigator.clipboard.readText().then(text => {
            handlePaste(text);
          });
        }
      }}
      tabIndex={0}
      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <div className="text-center">
        {error ? (
          <div className="text-red-500 text-sm mb-1">{error}</div>
        ) : success ? (
          <div className="text-green-500 text-sm mb-1">✓ Components loaded successfully!</div>
        ) : (
          <>
            <div className="text-gray-500 text-sm mb-1">Paste JSON configuration here</div>
            <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
          </>
        )}
      </div>
    </div>
  );
};

export default PastInterface;