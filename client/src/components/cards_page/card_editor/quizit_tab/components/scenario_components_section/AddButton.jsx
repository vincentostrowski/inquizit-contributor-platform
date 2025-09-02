const AddButton = ({ onComponentStructureChange }) => {
    const handleAddComponent = () => {
      onComponentStructureChange(prev => ({
        ...prev,
        components: [...prev.components, { 
          id: String.fromCharCode(65 + Math.max(...prev.components.map(c => c.id.charCodeAt(0) - 65), -1) + 1), 
          text: '', 
          type: 'scenario' 
        }]
      }));
    };

    return (
        <div className="flex items-center space-x-3">
            <button
              className="flex-1 p-3 border-1 border-dashed border-gray-300 rounded text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              onClick={handleAddComponent}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">Add Component</span>
            </button>
            <div className="flex-shrink-0 w-18"></div>
        </div>
    )
}

export default AddButton;